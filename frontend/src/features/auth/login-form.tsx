'use client'

import { useState } from 'react'
import { signIn } from '@/features/auth/auth-actions'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)

    const emailInput = formData.get('email')
    const passwordInput = formData.get('password')
    const trimmedEmail = emailInput ? String(emailInput).trim() : ''
    const trimmedPassword = passwordInput ? String(passwordInput) : ''

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email dan password wajib diisi.')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid.')
      setLoading(false)
      return
    }

    const formDataTrimmed = new FormData()
    formDataTrimmed.set('email', trimmedEmail)
    formDataTrimmed.set('password', trimmedPassword)

    const result = await signIn(formDataTrimmed)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 px-4 py-8">
      {/* Mobile-first card: max width 430px, centered */}
      <div className="w-full max-w-[430px] rounded-[28px] overflow-hidden shadow-lg border border-zinc-200 bg-white">
        {/* Blok Header Merah Branding */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#8F1D18] via-[#B91C1C] to-[#DC2626] rounded-b-[28px]">
          {/* Dekorasi lingkaran merah transparan halus */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-red-500/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center pt-10 pb-8 px-6 text-center">
            <div
              aria-hidden="true"
              className="w-12 h-12 mb-2.5 rounded-2xl bg-black/20 flex items-center justify-center text-2xl select-none"
            >
              🍜
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bakmie Al-Ridha
            </h1>
            <p className="text-[#FECACA] text-sm mt-1">Aplikasi Kasir Digital</p>
          </div>
        </div>

        {/* Form Area */}
        <div className="bg-white px-6 pt-8 pb-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-1.5">Login</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Silakan login dengan akun staf Anda
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-zinc-800 mb-2"
              >
                Email Staf
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  backgroundColor: '#ffffff',
                }}
                className="w-full h-12 px-4 border border-zinc-300 rounded-full bg-white text-black placeholder:text-zinc-400 focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none transition-all"
                placeholder="nama@bakmiealridha.com"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5 px-1">
                Masuk menggunakan email terdaftar akun staf
              </p>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-zinc-800 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  spellCheck={false}
                  required
                  style={{
                    color: '#000000',
                    WebkitTextFillColor: '#000000',
                    backgroundColor: '#ffffff',
                  }}
                  className="w-full h-12 pl-4 pr-12 border border-zinc-300 rounded-full bg-white text-black placeholder:text-zinc-400 focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  aria-label={passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {passwordVisible ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10.58 10.58A2 2 0 0 0 13.41 13.41" />
                      <path d="M9.88 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12 9.88 9.88" />
                      <path d="M1 1l22 22" />
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1.5 px-1">
                <a
                  href="#"
                  className="text-[11px] text-zinc-500 hover:text-red-600 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Lupa password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gradient-to-r from-[#B91C1C] to-[#DC2626] hover:from-[#8F1D18] hover:to-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses…</span>
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500">
            Lupa password? Hubungi Admin/Owner
          </p>
        </div>
      </div>
    </div>
  )
}