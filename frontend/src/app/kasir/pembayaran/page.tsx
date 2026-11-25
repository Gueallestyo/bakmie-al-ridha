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
  const rawNomor = resolvedParams.nomor?.trim() || 'A-0012'
  const formattedOrderNumber = rawNomor.toLowerCase().startsWith('no.')
    ? rawNomor
    : `No. ${rawNomor}`
  const parsedTotal = Number(resolvedParams.total ?? 46000)
  const validTotal =
    Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 46000

  return (
    <KasirAccessGuard role="kasir-or-admin">
      <PembayaranView
        orderNumber={formattedOrderNumber}
        totalAmount={validTotal}
        orderType={parsedType}
        tableNumber={resolvedParams.meja?.trim() || '5'}
      />
    </KasirAccessGuard>
  )
}

export default function PembayaranPage({ searchParams }: PembayaranPageProps) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <PembayaranPageContent searchParams={searchParams} />
    </Suspense>
  )
}