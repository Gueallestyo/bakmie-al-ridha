import { Suspense, type ComponentProps, type ReactNode } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import PembayaranView from '@/features/kasir/pembayaran-view'
import type { OrderType } from '@/features/kasir/input-pesanan-view'

type BaseRole = ComponentProps<typeof RoleGuard>['role']

function KasirAccessGuard({
  role,
  children,
}: {
  role: BaseRole | 'kasir-or-admin'
  children: ReactNode
}) {
  const mappedRole: BaseRole = role === 'kasir-or-admin' ? 'kasir' : role
  return <RoleGuard role={mappedRole}>{children}</RoleGuard>
}

interface PembayaranPageProps {
  searchParams: Promise<{
    nomor?: string
    total?: string
    jenis?: string
    meja?: string
  }>
}

async function PembayaranPageContent({ searchParams }: PembayaranPageProps) {
  await connection()
  const resolvedParams = await searchParams

  const parsedType: OrderType =
    resolvedParams.jenis === 'takeaway' ? 'takeaway' : 'dine_in'
  const rawNomor = resolvedParams.nomor?.trim()
  const formattedOrderNumber = rawNomor
    ? rawNomor.toLowerCase().startsWith('no.')
      ? rawNomor
      : `No. ${rawNomor}`
    : null
  const parsedTotal = Number(resolvedParams.total ?? 0)
  const validTotal =
    Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null

  if (!formattedOrderNumber || validTotal === null) {
    return (
      <Suspense fallback={<AuthLoading />}>
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
            <h1 className="text-xl font-bold text-zinc-900">
              Parameter Tidak Valid
            </h1>
            <p className="text-zinc-600 mt-2">
              Nomor pesanan dan total tagihan wajib diisi dengan benar.
            </p>
            <a
              href="/kasir"
              className="mt-6 inline-block px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              Kembali ke Daftar Pesanan
            </a>
          </div>
        </div>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<AuthLoading />}>
      <KasirAccessGuard role="kasir-or-admin">
        <PembayaranView
          orderNumber={formattedOrderNumber}
          totalAmount={validTotal}
          orderType={parsedType}
          tableNumber={resolvedParams.meja?.trim()}
        />
      </KasirAccessGuard>
    </Suspense>
  )
}

export default function PembayaranPage({ searchParams }: PembayaranPageProps) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <PembayaranPageContent searchParams={searchParams} />
    </Suspense>
  )
}