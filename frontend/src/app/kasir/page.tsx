import { Suspense } from 'react'
import RoleGuard from '@/components/auth/role-guard'
import { signOut } from '@/features/auth/auth-actions'
import AuthLoading from '@/components/auth/auth-loading'

export default function KasirPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RoleGuard role="kasir-or-admin">
        <div className="min-h-screen bg-zinc-50 p-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-zinc-900">Dashboard Kasir</h1>
                <p className="text-zinc-600">
                  Selamat datang di area kasir Bakmie Al-Ridha.
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
              >
                Keluar
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
              <p className="text-zinc-600">
                Halaman kasir (pesanan, pembayaran, laporan) akan
                diimplementasikan pada tahap berikutnya.
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>
    </Suspense>
  )
}
