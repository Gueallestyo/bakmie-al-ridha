import 'server-only'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export interface StaffProfile {
  id_pengguna: string
  username: string
  nama_lengkap: string
  role: 'Admin' | 'Kasir'
  status_aktif: boolean
}

/**
 * Ambil profil pengguna aktif dari public.pengguna.
 * Mengembalikan null jika tidak ditemukan atau tidak aktif.
 */
export async function getActiveProfile(): Promise<StaffProfile | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('pengguna')
    .select('id_pengguna, username, nama_lengkap, role, status_aktif')
    .eq('id_pengguna', user.id)
    .single<StaffProfile>()

  if (!profile || !profile.status_aktif) {
    return null
  }

  return profile
}

/**
 * Verifikasi user aktif. Jika tidak login atau tidak aktif,
 * signOut dan redirect ke /auth/login.
 * Digunakan dalam Server Component / Layout.
 */
export async function requireActiveUser(): Promise<StaffProfile> {
  const profile = await getActiveProfile()

  if (!profile) {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    redirect('/auth/login')
  }

  return profile
}

/**
 * Verifikasi user adalah Admin dan aktif.
 * Jika bukan Admin (misal Kasir), redirect ke /kasir.
 * Jika tidak login / tidak aktif, redirect ke /auth/login.
 */
export async function requireAdmin(): Promise<StaffProfile> {
  const profile = await requireActiveUser()

  if (profile.role !== 'Admin') {
    redirect('/kasir')
  }

  return profile
}

/**
 * Verifikasi user adalah Kasir atau Admin dan aktif.
 * Jika tidak login / tidak aktif, redirect ke /auth/login.
 */
export async function requireKasirOrAdmin(): Promise<StaffProfile> {
  return requireActiveUser()
}

/**
 * Verifikasi user adalah Admin dan aktif untuk Route Handler / API.
 * Mengembalikan NextResponse error 401/403 jika tidak berwenang.
 * Jika berwenang, mengembalikan profil pengguna.
 */
export async function requireAdminApi(): Promise<
  | {
      profile: StaffProfile
      errorResponse: null
    }
  | {
      profile: null
      errorResponse: NextResponse
    }
> {
  const profile = await getActiveProfile()

  if (!profile) {
    return {
      profile: null,
      errorResponse: NextResponse.json(
        { error: 'Tidak terautentikasi atau session telah berakhir.' },
        { status: 401 },
      ),
    }
  }

  if (profile.role !== 'Admin') {
    return {
      profile: null,
      errorResponse: NextResponse.json(
        { error: 'Akses ditolak. Hanya Admin yang dapat mengakses endpoint ini.' },
        { status: 403 },
      ),
    }
  }

  return { profile, errorResponse: null }
}

/**
 * Verifikasi user adalah Kasir atau Admin dan aktif untuk Route Handler / API.
 * Mengembalikan NextResponse error 401 jika tidak terautentikasi.
 */
export async function requireKasirOrAdminApi(): Promise<
  | {
      profile: StaffProfile
      errorResponse: null
    }
  | {
      profile: null
      errorResponse: NextResponse
    }
> {
  const profile = await getActiveProfile()

  if (!profile) {
    return {
      profile: null,
      errorResponse: NextResponse.json(
        { error: 'Tidak terautentikasi atau session telah berakhir.' },
        { status: 401 },
      ),
    }
  }

  return { profile, errorResponse: null }
}

/**
 * Predikat: apakah user adalah Admin (untuk pengecekan sisi server tanpa redirect).
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getActiveProfile()
  return profile !== null && profile.role === 'Admin'
}

/**
 * Predikat: apakah user adalah Kasir (untuk pengecekan sisi server tanpa redirect).
 */
export async function isKasir(): Promise<boolean> {
  const profile = await getActiveProfile()
  return profile !== null && profile.role === 'Kasir'
}

/**
 * Predikat: apakah user aktif (untuk pengecekan sisi server tanpa redirect).
 */
export async function isActiveStaff(): Promise<boolean> {
  const profile = await getActiveProfile()
  return profile !== null
}