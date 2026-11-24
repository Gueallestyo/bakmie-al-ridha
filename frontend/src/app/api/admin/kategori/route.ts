import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  const admin = createAdminClient()

  const { data: kategori, error } = await admin
    .from('kategori')
    .select('id_kategori, nama_kategori, status_aktif')
    .order('nama_kategori', { ascending: true })

  if (error) {
    return NextResponseError(error.message, 500)
  }

  return Response.json({
    kategori: kategori ?? [],
  })
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { nama_kategori, status_aktif } = body

    if (!nama_kategori || !nama_kategori.trim()) {
      return NextResponseError('Nama kategori wajib diisi.', 400)
    }
    if (nama_kategori.trim().length > 50) {
      return NextResponseError('Nama kategori maksimal 50 karakter.', 400)
    }

    const admin = createAdminClient()

    const { error } = await admin.from('kategori').insert({
      nama_kategori: nama_kategori.trim(),
      status_aktif: status_aktif !== false,
    })

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponseError('Nama kategori sudah digunakan.', 400)
      }
      return NextResponseError('Gagal menyimpan kategori.', 500)
    }

    return Response.json(
      { message: 'Kategori berhasil ditambahkan.' },
      { status: 201 },
    )
  } catch {
    return NextResponseError('Terjadi kesalahan saat menambahkan kategori.', 500)
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { id_kategori, nama_kategori, status_aktif } = body

    if (!id_kategori) {
      return NextResponseError('ID kategori wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (nama_kategori !== undefined) updateData.nama_kategori = nama_kategori.trim()
    if (status_aktif !== undefined) updateData.status_aktif = status_aktif

    if (Object.keys(updateData).length === 0) {
      return NextResponseError('Tidak ada data yang diubah.', 400)
    }

    const { error } = await admin
      .from('kategori')
      .update(updateData)
      .eq('id_kategori', id_kategori)

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponseError('Nama kategori sudah digunakan.', 400)
      }
      return NextResponseError('Gagal memperbarui kategori.', 500)
    }

    return Response.json({ message: 'Kategori berhasil diperbarui.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memperbarui kategori.', 500)
  }
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const { searchParams } = new URL(request.url)
    const id_kategori = searchParams.get('id_kategori')

    if (!id_kategori) {
      return NextResponseError('ID kategori wajib diisi.', 400)
    }

    const admin = createAdminClient()

    const { error } = await admin.from('kategori').delete().eq('id_kategori', id_kategori)

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json({ message: 'Kategori berhasil dihapus.' })
  } catch {
    return NextResponseError('Terjadi kesalahan saat menghapus kategori.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
