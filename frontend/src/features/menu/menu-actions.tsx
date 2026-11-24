'use server'

import { requireAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Menu {
  id_menu: string
  id_kategori: string
  nama_menu: string
  harga: number
  kuota_default: number
  ambang_default: number
  status_aktif: boolean
  kategori?: { nama_kategori: string }
}

export async function listMenu(): Promise<{
  menu: Menu[]
  error: string | null
}> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { menu: [], error: 'Tidak berwenang mengakses data menu.' }
  }

  const admin = createAdminClient()

  const { data, error } = await admin
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
    return { menu: [], error: error.message }
  }

  return {
    menu: (data ?? []) as unknown as Menu[],
    error: null,
  }
}

export async function toggleMenuStatus(
  id_menu: string,
  status_aktif: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { success: false, error: 'Tidak berwenang mengubah status menu.' }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id_menu)) {
    return { success: false, error: 'ID menu tidak valid.' }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('menu')
    .update({ status_aktif })
    .eq('id_menu', id_menu)

  if (error) {
    return { success: false, error: 'Gagal mengubah status menu.' }
  }

  return { success: true, error: null }
}

export async function deleteMenu(
  id_menu: string,
): Promise<{ success: boolean; error: string | null }> {
  const { errorResponse } = await requireAdminApi()

  if (errorResponse) {
    return { success: false, error: 'Tidak berwenang menghapus menu.' }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id_menu)) {
    return { success: false, error: 'ID menu tidak valid.' }
  }

  const admin = createAdminClient()

  const { error } = await admin.from('menu').delete().eq('id_menu', id_menu)

  if (error) {
    return { success: false, error: 'Gagal menghapus menu.' }
  }

  return { success: true, error: null }
}
