import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const { id_kategori, nama_menu, harga, kuota_default, ambang_default, status_aktif } = body

    if (!id_kategori) {
      return NextResponseError('Kategori wajib dipilih.', 400)
    }
    if (!nama_menu || !nama_menu.trim()) {
      return NextResponseError('Nama menu wajib diisi.', 400)
    }
    if (nama_menu.trim().length > 100) {
      return NextResponseError('Nama menu maksimal 100 karakter.', 400)
    }
    if (harga === undefined || harga === null || Number(harga) < 0) {
      return NextResponseError('Harga wajib diisi dan tidak boleh negatif.', 400)
    }
    if (kuota_default === undefined || kuota_default === null || Number(kuota_default) < 0) {
      return NextResponseError('Kuota default wajib diisi dan tidak boleh negatif.', 400)
    }
    if (ambang_default === undefined || ambang_default === null || Number(ambang_default) < 0) {
      return NextResponseError('Ambang default wajib diisi dan tidak boleh negatif.', 400)
    }
    if (Number(ambang_default) > Number(kuota_default)) {
      return NextResponseError('Ambang default tidak boleh melebihi kuota default.', 400)
    }

    const admin = createAdminClient()

    const { data: createdMenu, error } = await admin
      .from('menu')
      .insert({
        id_kategori,
        nama_menu: nama_menu.trim(),
        harga: Number(harga),
        kuota_default: Number(kuota_default),
        ambang_default: Number(ambang_default),
        status_aktif: status_aktif !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponseError('Gagal menyimpan menu.', 500)
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
    const { id_menu, id_kategori, nama_menu, harga, kuota_default, ambang_default, status_aktif } = body

    if (!id_menu) {
      return NextResponseError('ID menu wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (id_kategori !== undefined) updateData.id_kategori = id_kategori
    if (nama_menu !== undefined) updateData.nama_menu = nama_menu.trim()
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

    // Validasi ambang_default <= kuota_default jika keduanya diubah atau salah satu diubah
    if (ambang_default !== undefined || kuota_default !== undefined) {
      const { data: existing } = await admin
        .from('menu')
        .select('kuota_default, ambang_default')
        .eq('id_menu', id_menu)
        .single()

      const finalKuota = kuota_default !== undefined ? Number(kuota_default) : existing?.kuota_default
      const finalAmbang = ambang_default !== undefined ? Number(ambang_default) : existing?.ambang_default

      if (finalAmbang !== undefined && finalKuota !== undefined && finalAmbang > finalKuota) {
        return NextResponseError('Ambang default tidak boleh melebihi kuota default.', 400)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponseError('Tidak ada data yang diubah.', 400)
    }

    const { error } = await admin.from('menu').update(updateData).eq('id_menu', id_menu)

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
    const id_menu = searchParams.get('id_menu')

    if (!id_menu) {
      return NextResponseError('ID menu wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const { error } = await admin.from('menu').delete().eq('id_menu', id_menu)

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json({ message: 'Menu berhasil dihapus.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat menghapus menu.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
