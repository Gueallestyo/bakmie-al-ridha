'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/auth/rbac'

export interface StaffUser {
  id_pengguna: string
  username: string
  nama_lengkap: string
  role: 'Admin' | 'Kasir'
  status_aktif: boolean
  dibuat_pada: string
}

/** Ambil daftar seluruh pengguna staf (hanya Admin). */
export async function listUsers(): Promise<{
  users: StaffUser[]
  error: string | null
}> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { users: [], error: 'Tidak berwenang mengakses daftar pengguna.' }
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('pengguna')
    .select(
      'id_pengguna, username, nama_lengkap, role, status_aktif, dibuat_pada',
    )
    .order('nama_lengkap', { ascending: true })

  if (error) {
    return { users: [], error: error.message }
  }

  return { users: (data ?? []) as StaffUser[], error: null }
}

/** Nonaktifkan atau aktifkan kembali pengguna (hanya Admin, tidak bisa sendiri). */
export async function toggleUserStatus(
  id_pengguna: string,
  status_aktif: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const { profile, errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { success: false, error: 'Tidak berwenang mengubah status pengguna.' }
  }

  if (id_pengguna === profile.id_pengguna) {
    return {
      success: false,
      error: 'Anda tidak dapat mengubah status akun Anda sendiri.',
    }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('pengguna')
    .update({ status_aktif })
    .eq('id_pengguna', id_pengguna)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

/** Ubah role pengguna (hanya Admin, tidak bisa menurunkan role sendiri). */
export async function updateUserRole(
  id_pengguna: string,
  role: 'Admin' | 'Kasir',
): Promise<{ success: boolean; error: string | null }> {
  const { profile, errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { success: false, error: 'Tidak berwenang mengubah role pengguna.' }
  }

  if (id_pengguna === profile.id_pengguna && role !== profile.role) {
    return {
      success: false,
      error: 'Anda tidak dapat mengubah role akun Anda sendiri.',
    }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('pengguna')
    .update({ role })
    .eq('id_pengguna', id_pengguna)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
