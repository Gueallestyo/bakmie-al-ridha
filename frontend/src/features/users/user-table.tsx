'use client'

import { useEffect, useState } from 'react'
import { listUsers, toggleUserStatus, updateUserRole } from './user-actions'

export interface StaffUser {
  id_pengguna: string
  username: string
  nama_lengkap: string
  role: 'Admin' | 'Kasir'
  status_aktif: boolean
  dibuat_pada: string
}

interface Props {
  currentUserId: string
  onRefresh?: () => void
}

export default function UserTable({ currentUserId, onRefresh }: Props) {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadUsers()
  }, [onRefresh])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    const { users: data, error: err } = await listUsers()
    if (err) {
      setError(err)
    } else {
      setUsers(data)
    }
    setLoading(false)
  }

  async function handleToggleStatus(user: StaffUser) {
    if (saving.has(user.id_pengguna)) return
    setSaving((prev) => new Set([...prev, user.id_pengguna]))

    const { success, error: err } = await toggleUserStatus(
      user.id_pengguna,
      !user.status_aktif,
    )

    setSaving((prev) => {
      const next = new Set(prev)
      next.delete(user.id_pengguna)
      return next
    })

    if (!success) {
      setError(err ?? 'Gagal mengubah status pengguna.')
      return
    }

    onRefresh?.()
    loadUsers()
  }

  async function handleChangeRole(user: StaffUser, newRole: 'Admin' | 'Kasir') {
    if (saving.has(user.id_pengguna)) return
    setSaving((prev) => new Set([...prev, user.id_pengguna]))

    const { success, error: err } = await updateUserRole(
      user.id_pengguna,
      newRole,
    )

    setSaving((prev) => {
      const next = new Set(prev)
      next.delete(user.id_pengguna)
      return next
    })

    if (!success) {
      setError(err ?? 'Gagal mengubah role pengguna.')
      return
    }

    onRefresh?.()
    loadUsers()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-zinc-600">Memuat daftar pengguna…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-100 border-b border-zinc-200">
            <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
              Nama Lengkap
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
              Username
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
              Role
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
              Status
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((user) => (
            <tr key={user.id_pengguna}>
              <td className="px-4 py-3 text-sm text-zinc-900">
                {user.nama_lengkap}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {user.username}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'Admin'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.status_aktif
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-200 text-zinc-600'
                  }`}
                >
                  {user.status_aktif ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={saving.has(user.id_pengguna)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      user.status_aktif
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {saving.has(user.id_pengguna)
                      ? '…'
                      : user.status_aktif
                        ? 'Nonaktifkan'
                        : 'Aktifkan'}
                  </button>
                  <button
                    onClick={() =>
                      handleChangeRole(
                        user,
                        user.role === 'Admin' ? 'Kasir' : 'Admin',
                      )
                    }
                    disabled={saving.has(user.id_pengguna)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      user.role === 'Admin'
                        ? 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    {saving.has(user.id_pengguna)
                      ? '…'
                      : user.role === 'Admin'
                        ? 'Turunkan ke Kasir'
                        : 'Naikkan ke Admin'}
                  </button>
                  {user.id_pengguna === currentUserId && (
                    <span className="ml-2 px-2 py-1 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500">
                      Anda
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 text-sm">
                Tidak ada data pengguna.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
