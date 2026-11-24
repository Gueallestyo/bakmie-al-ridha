'use client'

import Link from 'next/link'

export default function AkunPageClient() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="w-full max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-zinc-200">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Kelola Akun Pengguna</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Manajemen akun staf Admin dan Kasir Bakmie Al-Ridha.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Kembali
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-600">
            Hubungkan komponen daftar & form akun Anda (`@/features/users/...`) di area ini.
          </p>
        </div>
      </div>
    </div>
  )
}