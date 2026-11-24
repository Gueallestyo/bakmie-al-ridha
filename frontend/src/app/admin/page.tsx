import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'

async function AdminContent() {
  await connection()

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="w-full max-w-xl mx-auto space-y-5">
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
            Dashboard Admin — Bakmie Al-Ridha
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola akun staf, kategori menu, dan daftar menu kasir digital.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/admin/akun"
            className="block bg-white p-4 rounded-2xl border border-zinc-200 hover:border-red-500 transition-colors"
          >
            <div className="font-semibold text-zinc-900">Kelola Akun Pengguna</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Tambah akun staf baru, atur role Admin/Kasir, dan status aktif.
            </div>
          </Link>

          <Link
            href="/admin/kategori"
            className="block bg-white p-4 rounded-2xl border border-zinc-200 hover:border-red-500 transition-colors"
          >
            <div className="font-semibold text-zinc-900">Kelola Kategori</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Tambah, ubah, dan atur status aktif/nonaktif kategori menu.
            </div>
          </Link>

          <Link
            href="/admin/menu"
            className="block bg-white p-4 rounded-2xl border border-zinc-200 hover:border-red-500 transition-colors"
          >
            <div className="font-semibold text-zinc-900">Kelola Menu</div>
            <div className="text-xs text-zinc-500 mt-0.5">
              Atur harga, kuota default, ambang peringatan, dan status menu.
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RoleGuard role="admin">
        <AdminContent />
      </RoleGuard>
    </Suspense>
  )
}