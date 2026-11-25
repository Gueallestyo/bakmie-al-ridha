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
      aksi, // 'batal' atau 'refund'
      alasan,
      persiapan_dimulai,
    } = body

    if (!id_pesanan) {
      return NextResponseError('ID pesanan wajib diisi.', 400)
    }
    if (!aksi || !['batal', 'refund'].includes(aksi)) {
      return NextResponseError("Aksi harus 'batal' atau 'refund'.", 400)
    }
    if (!alasan || !alasan.trim()) {
      return NextResponseError('Alasan wajib diisi.', 400)
    }

    const admin = createAdminClient()

    // Ambil pesanan saat ini
    const { data: pesanan, error: pesananError } = await admin
      .from('pesanan')
      .select('id_pesanan, nomor_pesanan, status_pesanan, id_kasir, dibuat_pada')
      .eq('id_pesanan', id_pesanan)
      .single()

    if (pesananError || !pesanan) {
      return NextResponseError('Pesanan tidak ditemukan.', 404)
    }

    // Validasi transisi status
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
    if (pesanan.status_pesanan === 'batal' || pesanan.status_pesanan === 'refund') {
      return NextResponseError(
        `Pesanan sudah berstatus ${pesanan.status_pesanan}, tidak dapat diubah ulang.`,
        400,
      )
    }

    const now = new Date().toISOString()
    let kuotaDikembalikan = false

    // Jika refund dan persiapan belum dimulai, kembalikan kuota
    if (aksi === 'refund' && persiapan_dimulai === false) {
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
            const newSisa = kuota.sisa_porsi + item.jumlah
            await admin
              .from('kuota_harian')
              .update({ sisa_porsi: newSisa })
              .eq('id_kuota', kuota.id_kuota)
            kuotaDikembalikan = true
          }
        }
      }
    }

    // Update status pesanan
    const { error: updatePesananError } = await admin
      .from('pesanan')
      .update({
        status_pesanan: aksi,
      })
      .eq('id_pesanan', id_pesanan)

    if (updatePesananError) {
      return NextResponseError('Gagal memperbarui status pesanan.', 500)
    }

    // Catat ke riwayat_status_pesanan
    await admin.from('riwayat_status_pesanan').insert({
      id_pesanan,
      status_awal: pesanan.status_pesanan,
      status_akhir: aksi,
      alasan: alasan.trim(),
      persiapan_dimulai: aksi === 'refund' ? Boolean(persiapan_dimulai) : null,
      kuota_dikembalikan: kuotaDikembalikan,
      id_pengguna: profile.id_pengguna,
      waktu_perubahan: now,
    })

    return Response.json({
      message: `Pesanan berhasil ${aksi === 'batal' ? 'dibatalkan' : 'di-refund'}.`,
      pesanan: {
        id_pesanan,
        status_pesanan: aksi,
        alasan: alasan.trim(),
        kuota_dikembalikan: aksi === 'refund' ? kuotaDikembalikan : null,
      },
    })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memproses pembatalan/refund.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
