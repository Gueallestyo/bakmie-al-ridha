import { requireKasirOrAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getLocalDateString(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  }
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

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
      aksi, // 'batal' atau 'refund'
      alasan,
      persiapan_dimulai,
    } = body as {
      id_pesanan?: string
      nomor_pesanan?: string
      aksi?: 'batal' | 'refund'
      alasan?: string
      persiapan_dimulai?: boolean
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
    if (!aksi || !['batal', 'refund'].includes(aksi)) {
      return NextResponseError("Aksi harus 'batal' atau 'refund'.", 400)
    }
    if (!alasan || !alasan.trim()) {
      return NextResponseError('Alasan wajib diisi.', 400)
    }

    const admin = createAdminClient()

    let pesanan: {
      id_pesanan: string
      nomor_pesanan: string
      status_pesanan: string
      id_kasir: string | null
      dibuat_pada: string
    } | null = null

    if (cleanId) {
      const { data: rowsById, error: errById } = await admin
        .from('pesanan')
        .select(
          'id_pesanan, nomor_pesanan, status_pesanan, id_kasir, dibuat_pada',
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
          'id_pesanan, nomor_pesanan, status_pesanan, id_kasir, dibuat_pada',
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

    if (
      pesanan.status_pesanan === 'batal' ||
      pesanan.status_pesanan === 'refund'
    ) {
      return NextResponseError(
        `Pesanan sudah berstatus ${pesanan.status_pesanan}, tidak dapat diubah ulang.`,
        400,
      )
    }

    if (aksi === 'batal' && pesanan.status_pesanan !== 'dibuat') {
      return NextResponseError(
        'Hanya pesanan dengan status Belum Dibayar yang dapat dibatalkan.',
        400,
      )
    }
    if (aksi === 'refund' && pesanan.status_pesanan !== 'dibayar') {
      return NextResponseError(
        'Hanya pesanan dengan status Dibayar yang dapat di-refund.',
        400,
      )
    }

    const now = new Date().toISOString()
    const isPrepStarted = Boolean(persiapan_dimulai)
    const shouldRestoreQuota = aksi === 'batal' || !isPrepStarted
    let kuotaDikembalikan = false

    if (shouldRestoreQuota) {
      const { data: detailPesanan, error: detailError } = await admin
        .from('detail_pesanan')
        .select('id_menu, jumlah')
        .eq('id_pesanan', targetId)

      if (detailError) {
        return NextResponseError(
          `Gagal membaca detail pesanan: ${detailError.message}`,
          500,
        )
      }

      if (detailPesanan && detailPesanan.length > 0) {
        const tanggalPesanan = getLocalDateString(pesanan.dibuat_pada)
        const tanggalHariIni = getLocalDateString()
        const tanggalCandidates = Array.from(
          new Set([tanggalPesanan, tanggalHariIni]),
        )

        for (const item of detailPesanan) {
          const jumlahKembali = Number(item.jumlah ?? 0)
          if (!item.id_menu || jumlahKembali <= 0) continue

          for (const tgl of tanggalCandidates) {
            const { data: kuotaRows, error: kuotaError } = await admin
              .from('kuota_harian')
              .select('id_kuota, sisa_porsi')
              .eq('id_menu', item.id_menu)
              .eq('tanggal', tgl)
              .order('id_kuota', { ascending: false })
              .limit(1)

            const kuota = kuotaRows?.[0]
            if (!kuotaError && kuota) {
              const newSisa = Number(kuota.sisa_porsi ?? 0) + jumlahKembali
              const { error: updateKuotaError } = await admin
                .from('kuota_harian')
                .update({ sisa_porsi: newSisa })
                .eq('id_kuota', kuota.id_kuota)

              if (!updateKuotaError) {
                kuotaDikembalikan = true
                break
              }
            }
          }
        }
      }
    }

    const { error: updatePesananError } = await admin
      .from('pesanan')
      .update({
        status_pesanan: aksi,
      })
      .eq('id_pesanan', targetId)

    if (updatePesananError) {
      return NextResponseError(
        `Gagal memperbarui status pesanan: ${updatePesananError.message}`,
        500,
      )
    }

    const { error: riwayatError } = await admin
      .from('riwayat_status_pesanan')
      .insert({
        id_pesanan: targetId,
        status_awal: pesanan.status_pesanan,
        status_akhir: aksi,
        alasan: alasan.trim(),
        persiapan_dimulai: aksi === 'refund' ? isPrepStarted : null,
        kuota_dikembalikan: kuotaDikembalikan,
        id_pengguna: profile.id_pengguna,
        waktu_perubahan: now,
      })

    if (riwayatError) {
      console.error('Riwayat status insert error:', riwayatError)
    }

    return Response.json({
      message: `Pesanan berhasil ${aksi === 'batal' ? 'dibatalkan' : 'di-refund'}.`,
      pesanan: {
        id_pesanan: targetId,
        nomor_pesanan: pesanan.nomor_pesanan,
        status_pesanan: aksi,
        alasan: alasan.trim(),
        kuota_dikembalikan: kuotaDikembalikan,
      },
    })
  } catch (err: any) {
    return NextResponseError(
      err?.message || 'Terjadi kesalahan saat memproses pembatalan/refund.',
      500,
    )
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}