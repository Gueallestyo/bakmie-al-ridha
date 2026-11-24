'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  // Validasi sederhana di server
  if (email.length > 255) {
    return { error: 'Email terlalu panjang.' }
  }
  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Format email tidak valid.' }
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: mapAuthError(error) }
  }

  if (!data.user) {
    return { error: 'Gagal masuk. Silakan coba lagi.' }
  }

  // Ambil profil dari public.pengguna
  const { data: profile, error: profileError } = await supabase
    .from('pengguna')
    .select('role, status_aktif')
    .eq('id_pengguna', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return {
      error:
        'Akun tidak memiliki profil staf yang valid. Silakan hubungi Admin atau Owner.',
    }
  }

  if (!profile.status_aktif) {
    await supabase.auth.signOut()
    return {
      error:
        'Akun tidak aktif. Silakan hubungi Admin atau Owner untuk mengaktifkan akun Anda.',
    }
  }

  // Redirect sesuai role
  if (profile.role === 'Admin') {
    redirect('/admin')
  }
  redirect('/kasir')
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getSession() {
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('pengguna')
    .select('role, status_aktif, nama_lengkap, username')
    .eq('id_pengguna', userId)
    .single()
  return data
}

function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()
  if (
    lower.includes('invalid login') ||
    lower.includes('user not found') ||
    lower.includes('email not confirmed')
  ) {
    return 'Email atau password salah. Silakan coba lagi.'
  }
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('connection')
  ) {
    return 'Gagal terhubung ke server. Silakan periksa koneksi internet Anda.'
  }
  return 'Terjadi kesalahan saat masuk. Silakan coba lagi.'
}
