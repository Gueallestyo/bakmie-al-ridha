import { Suspense, type ComponentProps, type ReactNode } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import RingkasanPesananView from '@/features/kasir/ringkasan-pesanan-view'
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

interface RingkasanPageProps {
  searchParams: Promise<{
    nomor?: string
    jenis?: string
    meja?: string
    items?: string
  }>
}

async function RingkasanPageContent({ searchParams }: RingkasanPageProps) {
  await connection()
  const resolvedParams = await searchParams

  const parsedType: OrderType =
    resolvedParams.jenis === 'takeaway' ? 'takeaway' : 'dine_in'
  const rawNomor = resolvedParams.nomor?.trim()
  const formattedOrderNumber = rawNomor
    ? rawNomor.toLowerCase().startsWith('no.')
      ? rawNomor
      : `No. ${rawNomor}`
    : undefined
  const tableNumber =
    parsedType === 'dine_in' && resolvedParams.meja?.trim()
      ? resolvedParams.meja.trim()
      : undefined

  return (
    <KasirAccessGuard role="kasir-or-admin">
      <RingkasanPesananView
        orderNumber={formattedOrderNumber}
        orderType={parsedType}
        tableNumber={tableNumber}
        rawItemsParam={resolvedParams.items}
      />
    </KasirAccessGuard>
  )
}

export default function RingkasanPage({ searchParams }: RingkasanPageProps) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RingkasanPageContent searchParams={searchParams} />
    </Suspense>
  )
}