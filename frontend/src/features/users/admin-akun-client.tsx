'use client'

import { useState } from 'react'
import { signOut } from '@/features/auth/auth-actions'
import UserForm from '@/features/users/user-form'
import UserTable from '@/features/users/user-table'

export default function AdminAkunClient() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Kelola Akun Pengguna
            </h1>
            <p className="text-zinc-600">
              Daftar, ubah role, dan nonaktifkan akun staf Bakmie Al-Ridha.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 font-medium transition-colors"
            >
              {showForm ? 'Tutup Form' : '+ Tambah Akun'}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <UserForm
              mode="create"
              onSuccess={() => {
                setShowForm(false)
                setRefreshKey((prev) => prev + 1)
              }}
              onError={(message) => {
                alert(message)
              }}
            />
          </div>
        )}

        <UserTable key={refreshKey} currentUserId="" />
      </div>
    </div>
  )
}