import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  const admin = createAdminClient()

  const { data: topping, error } = await admin
    .from('topping')
    .select('id_topping, nama_topping, harga_topping, status_aktif')
    .order('nama_topping', { ascending: true })

  if (error) {
    return NextResponseError(error.message, 500)
  }

  return Response.json({
    topping: topping ?? [],
  })
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { nama_topping, harga_topping, status_aktif } = body

    if (!nama_topping || !nama_topping.trim()) {
      return NextResponseError('Nama topping wajib diisi.', 400)
    }
    if (nama_topping.trim().length > 50) {
      return NextResponseError('Nama topping maksimal 50 karakter.', 400)
    }
    if (harga_topping === undefined || harga_topping === null || Number(harga_topping) < 0) {
      return NextResponseError('Harga topping wajib diisi dan tidak boleh negatif.', 400)
    }

    const admin = createAdminClient()

    const { error } = await admin.from('topping').insert({
      nama_topping: nama_topping.trim(),
      harga_topping: Number(harga_topping),
      status_aktif: status_aktif !== false,
    })

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponseError('Nama topping sudah digunakan.', 400)
      }
      return NextResponseError('Gagal menyimpan topping.', 500)
    }

    return Response.json(
      { message: 'Topping berhasil ditambahkan.' },
      { status: 201 },
    )
  } catch {
    return NextResponseError('Terjadi kesalahan saat menambahkan topping.', 500)
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { id_topping, nama_topping, harga_topping, status_aktif } = body

    if (!id_topping) {
      return NextResponseError('ID topping wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (nama_topping !== undefined) updateData.nama_topping = nama_topping.trim()
    if (harga_topping !== undefined) {
      if (Number(harga_topping) < 0) {
        return NextResponseError('Harga topping tidak boleh negatif.', 400)
      }
      updateData.harga_topping = Number(harga_topping)
    }
    if (status_aktif !== undefined) updateData.status_aktif = status_aktif

    if (Object.keys(updateData).length === 0) {
      return NextResponseError('Tidak ada data yang diubah.', 400)
    }

    const { error } = await admin.from('topping').update(updateData).eq('id_topping', id_topping)

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponseError('Nama topping sudah digunakan.', 400)
      }
      return NextResponseError('Gagal memperbarui topping.', 500)
    }

    return Response.json({ message: 'Topping berhasil diperbarui.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memperbarui topping.', 500)
  }
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const { searchParams } = new URL(request.url)
    const id_topping = searchParams.get('id_topping')

    if (!id_topping) {
      return NextResponseError('ID topping wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const { error } = await admin.from('topping').delete().eq('id_topping', id_topping)

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json({ message: 'Topping berhasil dihapus.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat menghapus topping.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
