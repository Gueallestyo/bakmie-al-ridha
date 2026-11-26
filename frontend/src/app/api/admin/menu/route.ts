import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

function getJakartaToday(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  })
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function GET() {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  const admin = createAdminClient()

  const { data: menu, error } = await admin
    .from('menu')
    .select(`
      id_menu,
      id_kategori,
      nama_menu,
      harga,
      kuota_default,
      ambang_default,
      status_aktif,
      kategori:kategori(nama_kategori)
    `)
    .order('nama_menu', { ascending: true })

  if (error) {
    return NextResponseError(error.message, 500)
  }

  return Response.json({
    menu: menu ?? [],
  })
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const {
      id_kategori,
      nama_menu,
      harga,
      kuota_default,
      ambang_default,
      status_aktif,
    } = body

    if (!id_kategori) {
      return NextResponseError('Kategori wajib dipilih.', 400)
    }
    if (!nama_menu || !String(nama_menu).trim()) {
      return NextResponseError('Nama menu wajib diisi.', 400)
    }
    if (String(nama_menu).trim().length > 100) {
      return NextResponseError('Nama menu maksimal 100 karakter.', 400)
    }
    if (harga === undefined || harga === null || Number(harga) < 0) {
      return NextResponseError(
        'Harga wajib diisi dan tidak boleh negatif.',
        400,
      )
    }
    if (
      kuota_default === undefined ||
      kuota_default === null ||
      Number(kuota_default) < 0
    ) {
      return NextResponseError(
        'Kuota default wajib diisi dan tidak boleh negatif.',
        400,
      )
    }
    if (
      ambang_default === undefined ||
      ambang_default === null ||
      Number(ambang_default) < 0
    ) {
      return NextResponseError(
        'Ambang default wajib diisi dan tidak boleh negatif.',
        400,
      )
    }
    if (Number(ambang_default) > Number(kuota_default)) {
      return NextResponseError(
        'Ambang default tidak boleh melebihi kuota default.',
        400,
      )
    }

    const admin = createAdminClient()
    const isActive = status_aktif !== false
    const parsedKuota = Number(kuota_default)
    const parsedAmbang = Number(ambang_default)

    const { data: createdMenu, error } = await admin
      .from('menu')
      .insert({
        id_kategori,
        nama_menu: String(nama_menu).trim(),
        harga: Number(harga),
        kuota_default: parsedKuota,
        ambang_default: parsedAmbang,
        status_aktif: isActive,
      })
      .select()
      .single()

    if (error || !createdMenu) {
      return NextResponseError('Gagal menyimpan menu.', 500)
    }

    if (isActive) {
      const today = getJakartaToday()
      const { data: existingKuota } = await admin
        .from('kuota_harian')
        .select('id_kuota')
        .eq('id_menu', createdMenu.id_menu)
        .eq('tanggal', today)
        .maybeSingle()

      if (!existingKuota) {
        await admin.from('kuota_harian').insert({
          id_menu: createdMenu.id_menu,
          tanggal: today,
          kuota_awal: parsedKuota,
          sisa_porsi: parsedKuota,
          ambang_peringatan: parsedAmbang,
        })
      }
    }

    return Response.json(
      { message: 'Menu berhasil ditambahkan.', menu: createdMenu },
      { status: 201 },
    )
  } catch {
    return NextResponseError('Terjadi kesalahan saat menambahkan menu.', 500)
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const {
      id_menu,
      id_kategori,
      nama_menu,
      harga,
      kuota_default,
      ambang_default,
      status_aktif,
    } = body

    if (!id_menu) {
      return NextResponseError('ID menu wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (id_kategori !== undefined) updateData.id_kategori = id_kategori
    if (nama_menu !== undefined) updateData.nama_menu = String(nama_menu).trim()
    if (harga !== undefined) {
      if (Number(harga) < 0) {
        return NextResponseError('Harga tidak boleh negatif.', 400)
      }
      updateData.harga = Number(harga)
    }
    if (kuota_default !== undefined) {
      if (Number(kuota_default) < 0) {
        return NextResponseError('Kuota default tidak boleh negatif.', 400)
      }
      updateData.kuota_default = Number(kuota_default)
    }
    if (ambang_default !== undefined) {
      if (Number(ambang_default) < 0) {
        return NextResponseError('Ambang default tidak boleh negatif.', 400)
      }
      updateData.ambang_default = Number(ambang_default)
    }
    if (status_aktif !== undefined) updateData.status_aktif = status_aktif

    if (ambang_default !== undefined || kuota_default !== undefined) {
      const { data: existing } = await admin
        .from('menu')
        .select('kuota_default, ambang_default')
        .eq('id_menu', id_menu)
        .single()

      const finalKuota =
        kuota_default !== undefined
          ? Number(kuota_default)
          : existing?.kuota_default
      const finalAmbang =
        ambang_default !== undefined
          ? Number(ambang_default)
          : existing?.ambang_default

      if (
        finalAmbang !== undefined &&
        finalKuota !== undefined &&
        finalAmbang > finalKuota
      ) {
        return NextResponseError(
          'Ambang default tidak boleh melebihi kuota default.',
          400,
        )
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponseError('Tidak ada data yang diubah.', 400)
    }

    const { error } = await admin
      .from('menu')
      .update(updateData)
      .eq('id_menu', id_menu)

    if (error) {
      return NextResponseError('Gagal memperbarui menu.', 500)
    }

    return Response.json({ message: 'Menu berhasil diperbarui.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memperbarui menu.', 500)
  }
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const { searchParams } = new URL(request.url)
    const id_menu = searchParams.get('id_menu')?.trim()

    if (!id_menu) {
      return NextResponseError('ID menu wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const { data: dipakaiPesanan, error: cekPesananError } = await admin
      .from('detail_pesanan')
      .select('id_detail')
      .eq('id_menu', id_menu)
      .limit(1)

    if (cekPesananError) {
      return NextResponseError(
        `Gagal memeriksa riwayat pesanan menu: ${cekPesananError.message}`,
        500,
      )
    }

    if (dipakaiPesanan && dipakaiPesanan.length > 0) {
      return NextResponseError(
        'Menu sudah pernah tercatat di pesanan. Nonaktifkan menu saja agar riwayat transaksi tetap aman.',
        400,
      )
    }

    const { error: hapusKuotaError } = await admin
      .from('kuota_harian')
      .delete()
      .eq('id_menu', id_menu)

    if (hapusKuotaError) {
      return NextResponseError(
        `Gagal menghapus kuota harian menu: ${hapusKuotaError.message}`,
        500,
      )
    }

    const { error } = await admin.from('menu').delete().eq('id_menu', id_menu)

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json({ message: 'Menu berhasil dihapus.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat menghapus menu.', 500)
  }
}