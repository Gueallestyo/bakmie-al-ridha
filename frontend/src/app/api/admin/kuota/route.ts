import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  const admin = createAdminClient()

  const { data: kuota, error } = await admin
    .from('kuota_harian')
    .select(`
      id_kuota,
      id_menu,
      tanggal,
      kuota_awal,
      sisa_porsi,
      ambang_peringatan,
      diatur_oleh,
      menu:menu(nama_menu, id_kategori)
    `)
    .order('tanggal', { ascending: true })
    .order('menu(nama_menu)', { ascending: true })

  if (error) {
    return NextResponseError(error.message, 500)
  }

  return Response.json({
    kuota: kuota ?? [],
  })
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { id_menu, tanggal, kuota_awal, ambang_peringatan, diatur_oleh } = body

    if (!id_menu) {
      return NextResponseError('Menu wajib dipilih.', 400)
    }
    if (!tanggal) {
      return NextResponseError('Tanggal wajib diisi.', 400)
    }
    if (kuota_awal === undefined || kuota_awal === null || Number(kuota_awal) < 0) {
      return NextResponseError('Kuota awal wajib diisi dan tidak boleh negatif.', 400)
    }
    if (ambang_peringatan === undefined || ambang_peringatan === null || Number(ambang_peringatan) < 0) {
      return NextResponseError('Ambang peringatan wajib diisi dan tidak boleh negatif.', 400)
    }
    if (Number(ambang_peringatan) > Number(kuota_awal)) {
      return NextResponseError('Ambang peringatan tidak boleh melebihi kuota awal.', 400)
    }

    const admin = createAdminClient()

    // Cek apakah sudah ada kuota untuk menu + tanggal ini
    const { data: existing } = await admin
      .from('kuota_harian')
      .select('id_kuota')
      .eq('id_menu', id_menu)
      .eq('tanggal', tanggal)
      .single()

    if (existing) {
      return NextResponseError('Kuota harian untuk menu dan tanggal ini sudah ada.', 400)
    }

    const { error } = await admin.from('kuota_harian').insert({
      id_menu,
      tanggal,
      kuota_awal: Number(kuota_awal),
      sisa_porsi: Number(kuota_awal),
      ambang_peringatan: Number(ambang_peringatan),
      diatur_oleh: diatur_oleh || null,
    })

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json(
      { message: 'Kuota harian berhasil ditambahkan.' },
      { status: 201 },
    )
  } catch {
    return NextResponseError('Terjadi kesalahan saat menambahkan kuota harian.', 500)
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { id_kuota, kuota_awal, ambang_peringatan, sisa_porsi, diatur_oleh } = body

    if (!id_kuota) {
      return NextResponseError('ID kuota wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (kuota_awal !== undefined) {
      if (Number(kuota_awal) < 0) {
        return NextResponseError('Kuota awal tidak boleh negatif.', 400)
      }
      updateData.kuota_awal = Number(kuota_awal)
    }
    if (ambang_peringatan !== undefined) {
      if (Number(ambang_peringatan) < 0) {
        return NextResponseError('Ambang peringatan tidak boleh negatif.', 400)
      }
      updateData.ambang_peringatan = Number(ambang_peringatan)
    }
    if (sisa_porsi !== undefined) {
      if (Number(sisa_porsi) < 0) {
        return NextResponseError('Sisa porsi tidak boleh negatif.', 400)
      }
      updateData.sisa_porsi = Number(sisa_porsi)
    }
    if (diatur_oleh !== undefined) updateData.diatur_oleh = diatur_oleh

    // Validasi ambang_peringatan <= kuota_awal jika salah satu diubah
    if (kuota_awal !== undefined || ambang_peringatan !== undefined) {
      const { data: existing } = await admin
        .from('kuota_harian')
        .select('kuota_awal, ambang_peringatan')
        .eq('id_kuota', id_kuota)
        .single()

      const finalKuotaAwal = kuota_awal !== undefined ? Number(kuota_awal) : existing?.kuota_awal
      const finalAmbang = ambang_peringatan !== undefined ? Number(ambang_peringatan) : existing?.ambang_peringatan

      if (finalAmbang !== undefined && finalKuotaAwal !== undefined && finalAmbang > finalKuotaAwal) {
        return NextResponseError('Ambang peringatan tidak boleh melebihi kuota awal.', 400)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponseError('Tidak ada data yang diubah.', 400)
    }

    const { error } = await admin.from('kuota_harian').update(updateData).eq('id_kuota', id_kuota)

    if (error) {
      return NextResponseError('Gagal memperbarui kuota harian.', 500)
    }

    return Response.json({ message: 'Kuota harian berhasil diperbarui.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memperbarui kuota harian.', 500)
  }
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const { searchParams } = new URL(request.url)
    const id_kuota = searchParams.get('id_kuota')

    if (!id_kuota) {
      return NextResponseError('ID kuota wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const { error } = await admin.from('kuota_harian').delete().eq('id_kuota', id_kuota)

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json({ message: 'Kuota harian berhasil dihapus.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat menghapus kuota harian.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
