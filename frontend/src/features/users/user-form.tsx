'use client'

import { useState } from 'react'

export interface UserFormData {
  nama_lengkap: string
  username: string
  email: string
  password: string
  role: 'Admin' | 'Kasir'
}

type Mode = 'create' | 'edit'

interface Props {
  mode?: Mode
  initialData?: {
    nama_lengkap: string
    username: string
    email: string
    role: 'Admin' | 'Kasir'
    status_aktif: boolean
  }
  onSuccess?: () => void
  onError?: (message: string) => void
}

export default function UserForm({
  mode = 'create',
  initialData,
  onSuccess,
  onError,
}: Props) {
  const [form, setForm] = useState<UserFormData>({
    nama_lengkap: initialData?.nama_lengkap ?? '',
    username: initialData?.username ?? '',
    email: initialData?.email ?? '',
    password: mode === 'create' ? '' : '',
    role: initialData?.role ?? 'Kasir',
  })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function validate(): string | null {
    if (!form.nama_lengkap.trim()) {
      return 'Nama lengkap wajib diisi.'
    }
    if (form.nama_lengkap.trim().length > 100) {
      return 'Nama lengkap maksimal 100 karakter.'
    }
    if (!form.username.trim()) {
      return 'Username wajib diisi.'
    }
    if (form.username.trim().length > 50) {
      return 'Username maksimal 50 karakter.'
    }
    if (!form.email.trim()) {
      return 'Email wajib diisi.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      return 'Format email tidak valid.'
    }
    if (mode === 'create' && (!form.password || form.password.length < 6)) {
      return 'Password minimal 6 karakter.'
    }
    if (form.role !== 'Admin' && form.role !== 'Kasir') {
      return "Role harus 'Admin' atau 'Kasir'."
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const validationError = validate()
    if (validationError) {
      setServerError(validationError)
      onError?.(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: form.nama_lengkap.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          ...(mode === 'create' ? { password: form.password } : {}),
          role: form.role,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        const errMsg = result.error || 'Gagal menyimpan data pengguna.'
        setServerError(errMsg)
        onError?.(errMsg)
        setLoading(false)
        return
      }

      onSuccess?.()
    } catch {
      const errMsg = 'Terjadi kesalahan jaringan. Silakan coba lagi.'
      setServerError(errMsg)
      onError?.(errMsg)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
      <h3 className="text-lg font-semibold text-zinc-900">
        {mode === 'create' ? 'Tambah Akun Staf' : 'Ubah Akun Staf'}
      </h3>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Nama Lengkap
          </label>
          <input
            value={form.nama_lengkap}
            onChange={(e) =>
              setForm({ ...form, nama_lengkap: e.target.value })
            }
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
            placeholder="Contoh: Budi Santoso"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Username
          </label>
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
            placeholder="budi.santoso"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Email
          </label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
            placeholder="budi@bakmiealridha.com"
          />
        </div>

        {mode === 'create' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Password Awal
            </label>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
              placeholder="••••••"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Minimal 6 karakter
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value as 'Admin' | 'Kasir',
              })
            }
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
          >
            <option value="Kasir">Kasir</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Menyimpan…' : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="px-4 py-3 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-300 transition-all"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
