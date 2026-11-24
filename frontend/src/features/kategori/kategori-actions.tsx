'use server'

import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Kategori {
  id_kategori: string
  nama_kategori: string
  status_aktif: boolean
}

export async function listKategori(): Promise<{
  kategori: Kategori[]
  error: string | null
}> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { kategori: [], error: 'Tidak berwenang mengakses data kategori.' }
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('kategori')
    .select('id_kategori, nama_kategori, status_aktif')
    .order('nama_kategori', { ascending: true })

  if (error) {
    return { kategori: [], error: error.message }
  }

  return { kategori: (data ?? []) as Kategori[], error: null }
}

export async function toggleKategoriStatus(
  id_kategori: string,
  status_aktif: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { success: false, error: 'Tidak berwenang mengubah status kategori.' }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id_kategori)) {
    return { success: false, error: 'ID kategori tidak valid.' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('kategori')
    .update({ status_aktif })
    .eq('id_kategori', id_kategori)

  if (error) {
    return { success: false, error: 'Gagal mengubah status kategori.' }
  }

  return { success: true, error: null }
}

export async function deleteKategori(
  id_kategori: string,
): Promise<{ success: boolean; error: string | null }> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { success: false, error: 'Tidak berwenang menghapus kategori.' }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id_kategori)) {
    return { success: false, error: 'ID kategori tidak valid.' }
  }

  const admin = createAdminClient()

  const { error } = await admin.from('kategori').delete().eq('id_kategori', id_kategori)

  if (error) {
    return { success: false, error: 'Gagal menghapus kategori.' }
  }

  return { success: true, error: null }
}
