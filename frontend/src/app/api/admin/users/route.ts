import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { profile, errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  const admin = createAdminClient()

  const { data: users, error } = await admin
    .from('pengguna')
    .select('id_pengguna, username, nama_lengkap, role, status_aktif, dibuat_pada')
    .order('nama_lengkap', { ascending: true })

  if (error) {
    return NextResponseError(error.message, 500)
  }

  return Response.json({
    users: users ?? [],
    accessedBy: {
      id_pengguna: profile.id_pengguna,
      username: profile.username,
      role: profile.role,
    },
  })
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  let authUserId: string | null = null

  try {
    const body = await request.json()
    const { nama_lengkap, username, email, password, role } = body

    // Validasi input
    if (!nama_lengkap || !nama_lengkap.trim()) {
      return NextResponseError('Nama lengkap wajib diisi.', 400)
    }
    if (!username || !username.trim()) {
      return NextResponseError('Username wajib diisi.', 400)
    }
    if (!email || !email.trim()) {
      return NextResponseError('Email wajib diisi.', 400)
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponseError('Format email tidak valid.', 400)
    }
    if (nama_lengkap.trim().length > 100) {
      return NextResponseError('Nama lengkap maksimal 100 karakter.', 400)
    }
    if (username.trim().length > 50) {
      return NextResponseError('Username maksimal 50 karakter.', 400)
    }
    if (!password || password.length < 6) {
      return NextResponseError('Password minimal 6 karakter.', 400)
    }
    if (role !== 'Admin' && role !== 'Kasir') {
      return NextResponseError("Role harus 'Admin' atau 'Kasir'.", 400)
    }

    const admin = createAdminClient()

    // Buat user di Supabase Auth
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nama_lengkap: nama_lengkap.trim(),
          username: username.trim(),
        },
      })

    if (authError || !authData.user) {
      return NextResponseError('Gagal membuat akun Auth.', 400)
    }

    authUserId = authData.user.id

    // Insert ke public.pengguna
    const { error: insertError } = await admin
      .from('pengguna')
      .insert({
        id_pengguna: authUserId,
        username: username.trim(),
        nama_lengkap: nama_lengkap.trim(),
        role,
        status_aktif: true,
      })

    if (insertError) {
      // ROLLBACK: hapus user Auth yang baru dibuat karena insert profil gagal
      await admin.auth.admin.deleteUser(authUserId)

      if (insertError.message.includes('duplicate')) {
        return NextResponseError(
          'Username sudah digunakan oleh akun lain.',
          400,
        )
      }
      return NextResponseError(
        'Gagal menyimpan profil staf. Akun Auth telah dihapus kembali.',
        500,
      )
    }

    return Response.json(
      {
        message: 'Akun staf berhasil dibuat.',
        user: {
          id_pengguna: authUserId,
          username: username.trim(),
          nama_lengkap: nama_lengkap.trim(),
          role,
          status_aktif: true,
        },
      },
      { status: 201 },
    )
  } catch {
    // ROLLBACK: jika terjadi exception, hapus user Auth yang telah dibuat
    if (authUserId) {
      const admin = createAdminClient()
      await admin.auth.admin.deleteUser(authUserId)
    }
    return NextResponseError('Terjadi kesalahan saat membuat akun.', 500)
  }
}

export async function PATCH(request: Request) {
  const { profile, errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const { id_pengguna, nama_lengkap, role, status_aktif } = body

    if (!id_pengguna) {
      return NextResponseError('ID pengguna wajib diisi.', 400)
    }

    // Cegah Admin menonaktifkan atau menurunkan role akunnya sendiri
    if (id_pengguna === profile.id_pengguna) {
      if (role !== undefined && role !== profile.role) {
        return NextResponseError(
          'Anda tidak dapat mengubah role akun Anda sendiri.',
          403,
        )
      }
      if (status_aktif === false) {
        return NextResponseError(
          'Anda tidak dapat menonaktifkan akun Anda sendiri.',
          403,
        )
      }
    }

    const admin = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (nama_lengkap !== undefined) updateData.nama_lengkap = nama_lengkap
    if (role !== undefined) updateData.role = role
    if (status_aktif !== undefined) updateData.status_aktif = status_aktif

    if (Object.keys(updateData).length === 0) {
      return NextResponseError('Tidak ada data yang diubah.', 400)
    }

    const { error } = await admin
      .from('pengguna')
      .update(updateData)
      .eq('id_pengguna', id_pengguna)

    if (error) {
      return NextResponseError(error.message, 500)
    }

    return Response.json({
      message: 'Data pengguna berhasil diperbarui.',
    })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memperbarui pengguna.', 500)
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
