import { requireKasirOrAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  const { profile, errorResponse } = await requireKasirOrAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const {
      id_pesanan,
      metode_pembayaran,
      uang_diterima,
      jumlah_dibayar,
    } = body

    if (!id_pesanan) {
      return NextResponseError('ID pesanan wajib diisi.', 400)
    }
    if (!metode_pembayaran || !['tunai', 'qris'].includes(metode_pembayaran)) {
      return NextResponseError("Metode pembayaran harus 'tunai' atau 'qris'.", 400)
    }

    const admin = createAdminClient()

    // Ambil pesanan saat ini
    const { data: pesanan, error: pesananError } = await admin
      .from('pesanan')
      .select('id_pesanan, nomor_pesanan, status_pesanan, id_kasir, total_harga, dibuat_pada')
      .eq('id_pesanan', id_pesanan)
      .single()

    if (pesananError || !pesanan) {
      return NextResponseError('Pesanan tidak ditemukan.', 404)
    }

    // Cegah validasi ulang jika sudah dibayar, batal, atau refund
    if (pesanan.status_pesanan !== 'dibuat') {
      return NextResponseError(
        `Pesanan sudah berstatus ${pesanan.status_pesanan}, tidak dapat divalidasi ulang.`,
        400,
      )
    }

    // Validasi jumlah pembayaran
    if (!jumlah_dibayar || Number(jumlah_dibayar) <= 0) {
      return NextResponseError('Jumlah dibayar wajib lebih dari nol.', 400)
    }
    if (Number(jumlah_dibayar) < Number(pesanan.total_harga)) {
      return NextResponseError('Jumlah dibayar kurang dari total pesanan.', 400)
    }

    // Hitung kembalian
    let kembalian = 0
    let uangDiterima = null

    if (metode_pembayaran === 'tunai') {
      if (!uang_diterima || Number(uang_diterima) < Number(jumlah_dibayar)) {
        return NextResponseError('Uang diterima tidak mencukupi untuk menutup total pesanan.', 400)
      }
      uangDiterima = Number(uang_diterima)
      kembalian = Number(uang_diterima) - Number(jumlah_dibayar)
    } else if (metode_pembayaran === 'qris') {
      // QRIS: uang_diterima = NULL, kembalian = 0
      uangDiterima = null
      kembalian = 0
    }

    const now = new Date().toISOString()

    // Gunakan transaksi atomik: simpan pembayaran, update pesanan, kurangi kuota, catat riwayat
    // Mulai dengan pembayaran
    const { error: pembayaranError } = await admin
      .from('pembayaran')
      .insert({
        id_pesanan,
        metode_pembayaran,
        jumlah_dibayar: Number(jumlah_dibayar),
        uang_diterima: uangDiterima,
        kembalian,
        divalidasi_oleh: profile.id_pengguna,
        divalidasi_pada: now,
      })

    if (pembayaranError) {
      return NextResponseError('Gagal mencatat pembayaran.', 500)
    }

    // Update status pesanan menjadi 'dibayar'
    const { error: updatePesananError } = await admin
      .from('pesanan')
      .update({ status_pesanan: 'dibayar' })
      .eq('id_pesanan', id_pesanan)

    if (updatePesananError) {
      // Rollback pembayaran
      await admin.from('pembayaran').delete().eq('id_pesanan', id_pesanan)
      return NextResponseError('Gagal memperbarui status pesanan.', 500)
    }

    // Kurangi kuota_harian.sisa_porsi untuk setiap item dalam pesanan
    const { data: detailPesanan, error: detailError } = await admin
      .from('detail_pesanan')
      .select('id_menu, jumlah')
      .eq('id_pesanan', id_pesanan)

    if (!detailError && detailPesanan) {
      const today = new Date(pesanan.dibuat_pada).toISOString().split('T')[0]

      for (const item of detailPesanan) {
        const { data: kuota, error: kuotaError } = await admin
          .from('kuota_harian')
          .select('id_kuota, sisa_porsi')
          .eq('id_menu', item.id_menu)
          .eq('tanggal', today)
          .single()

        if (!kuotaError && kuota) {
          const newSisa = Math.max(0, kuota.sisa_porsi - item.jumlah)
          await admin
            .from('kuota_harian')
            .update({ sisa_porsi: newSisa })
            .eq('id_kuota', kuota.id_kuota)
        }
      }
    }

    // Catat ke riwayat_status_pesanan
    await admin.from('riwayat_status_pesanan').insert({
      id_pesanan,
      status_awal: 'dibuat',
      status_akhir: 'dibayar',
      alasan: 'Pembayaran divalidasi',
      persiapan_dimulai: false,
      kuota_dikembalikan: false,
      id_pengguna: profile.id_pengguna,
      waktu_perubahan: now,
    })

    return Response.json({
      message: 'Pembayaran berhasil divalidasi.',
      pembayaran: {
        id_pesanan,
        metode_pembayaran,
        jumlah_dibayar: Number(jumlah_dibayar),
        uang_diterima: uangDiterima,
        kembalian,
        status_pesanan: 'dibayar',
      },
    })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memvalidasi pembayaran.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
