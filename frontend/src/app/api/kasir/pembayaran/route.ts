import { requireKasirOrAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: Request) {
  const { profile, errorResponse } = await requireKasirOrAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const {
      id_pesanan,
      nomor_pesanan,
      metode_pembayaran,
      uang_diterima,
      jumlah_dibayar,
    } = body as {
      id_pesanan?: string
      nomor_pesanan?: string
      metode_pembayaran?: 'tunai' | 'qris'
      uang_diterima?: number | null
      jumlah_dibayar?: number
    }

    const rawId = typeof id_pesanan === 'string' ? id_pesanan.trim() : ''
    const cleanNomor =
      typeof nomor_pesanan === 'string'
        ? nomor_pesanan.replace(/^No\.\s*/i, '').trim()
        : ''

    const cleanId = UUID_REGEX.test(rawId) ? rawId : ''
    const fallbackNomor =
      cleanNomor ||
      (!UUID_REGEX.test(rawId) ? rawId.replace(/^No\.\s*/i, '').trim() : '')

    if (!cleanId && !fallbackNomor) {
      return NextResponseError('ID atau nomor pesanan wajib diisi.', 400)
    }
    if (!metode_pembayaran || !['tunai', 'qris'].includes(metode_pembayaran)) {
      return NextResponseError(
        "Metode pembayaran harus 'tunai' atau 'qris'.",
        400,
      )
    }

    const admin = createAdminClient()

    let pesanan: {
      id_pesanan: string
      nomor_pesanan: string
      status_pesanan: string
      id_kasir: string | null
      total_harga: number | string
      dibuat_pada: string
    } | null = null

    if (cleanId) {
      const { data: rowsById, error: errById } = await admin
        .from('pesanan')
        .select(
          'id_pesanan, nomor_pesanan, status_pesanan, id_kasir, total_harga, dibuat_pada',
        )
        .eq('id_pesanan', cleanId)
        .limit(1)

      if (errById) {
        return NextResponseError(
          `Gagal mencari pesanan: ${errById.message}`,
          500,
        )
      }
      pesanan = rowsById?.[0] ?? null
    }

    if (!pesanan && fallbackNomor) {
      const { data: rowsByNomor, error: errByNomor } = await admin
        .from('pesanan')
        .select(
          'id_pesanan, nomor_pesanan, status_pesanan, id_kasir, total_harga, dibuat_pada',
        )
        .ilike('nomor_pesanan', fallbackNomor)
        .limit(1)

      if (errByNomor) {
        return NextResponseError(
          `Gagal mencari pesanan: ${errByNomor.message}`,
          500,
        )
      }
      pesanan = rowsByNomor?.[0] ?? null
    }

    if (!pesanan) {
      return NextResponseError('Pesanan tidak ditemukan.', 404)
    }

    const targetId = pesanan.id_pesanan

    if (pesanan.status_pesanan !== 'dibuat') {
      return NextResponseError(
        `Pesanan sudah berstatus ${pesanan.status_pesanan}, tidak dapat divalidasi ulang.`,
        400,
      )
    }

    if (!jumlah_dibayar || Number(jumlah_dibayar) <= 0) {
      return NextResponseError('Jumlah dibayar wajib lebih dari nol.', 400)
    }
    if (Number(jumlah_dibayar) < Number(pesanan.total_harga)) {
      return NextResponseError(
        'Jumlah dibayar kurang dari total pesanan.',
        400,
      )
    }

    let kembalian = 0
    let uangDiterima: number | null = null

    if (metode_pembayaran === 'tunai') {
      if (
        uang_diterima === null ||
        uang_diterima === undefined ||
        Number(uang_diterima) < Number(jumlah_dibayar)
      ) {
        return NextResponseError(
          'Uang diterima tidak mencukupi untuk menutup total pesanan.',
          400,
        )
      }
      uangDiterima = Number(uang_diterima)
      kembalian = Number(uang_diterima) - Number(jumlah_dibayar)
    } else if (metode_pembayaran === 'qris') {
      uangDiterima = null
      kembalian = 0
    }

    const now = new Date().toISOString()

    const { error: pembayaranError } = await admin.from('pembayaran').insert({
      id_pesanan: targetId,
      metode_pembayaran,
      jumlah_dibayar: Number(jumlah_dibayar),
      uang_diterima: uangDiterima,
      kembalian,
      divalidasi_oleh: profile.id_pengguna,
      divalidasi_pada: now,
    })

    if (pembayaranError) {
      return NextResponseError(
        `Gagal mencatat pembayaran: ${pembayaranError.message}`,
        500,
      )
    }

    const { error: updatePesananError } = await admin
      .from('pesanan')
      .update({ status_pesanan: 'dibayar' })
      .eq('id_pesanan', targetId)

    if (updatePesananError) {
      await admin.from('pembayaran').delete().eq('id_pesanan', targetId)
      return NextResponseError(
        `Gagal memperbarui status pesanan: ${updatePesananError.message}`,
        500,
      )
    }

    const { error: riwayatError } = await admin
      .from('riwayat_status_pesanan')
      .insert({
        id_pesanan: targetId,
        status_awal: 'dibuat',
        status_akhir: 'dibayar',
        alasan: 'Pembayaran divalidasi',
        persiapan_dimulai: false,
        kuota_dikembalikan: false,
        id_pengguna: profile.id_pengguna,
        waktu_perubahan: now,
      })

    if (riwayatError) {
      await admin
        .from('pesanan')
        .update({ status_pesanan: 'dibuat' })
        .eq('id_pesanan', targetId)
      await admin.from('pembayaran').delete().eq('id_pesanan', targetId)
      return NextResponseError(
        `Gagal mencatat riwayat status pembayaran: ${riwayatError.message}`,
        500,
      )
    }

    return Response.json({
      message: 'Pembayaran berhasil divalidasi.',
      pembayaran: {
        id_pesanan: targetId,
        nomor_pesanan: pesanan.nomor_pesanan,
        metode_pembayaran,
        jumlah_dibayar: Number(jumlah_dibayar),
        uang_diterima: uangDiterima,
        kembalian,
        status_pesanan: 'dibayar',
      },
    })
  } catch (err: any) {
    return NextResponseError(
      err?.message || 'Terjadi kesalahan saat memvalidasi pembayaran.',
      500,
    )
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}