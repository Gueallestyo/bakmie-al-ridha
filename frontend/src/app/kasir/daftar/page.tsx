import { Suspense, type ComponentProps, type ReactNode } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import DaftarPesananView from '@/features/kasir/daftar-pesanan-view'

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

interface DaftarPageProps {
  searchParams: Promise<{
    nomor?: string
  }>
}

async function DaftarPageContent({ searchParams }: DaftarPageProps) {
  await connection()
  const resolvedParams = await searchParams

  return (
    <KasirAccessGuard role="kasir-or-admin">
      <DaftarPesananView
        key={resolvedParams.nomor ?? 'default'}
        highlightedOrderNumber={resolvedParams.nomor}
      />
    </KasirAccessGuard>
  )
}

export default function DaftarPage({ searchParams }: DaftarPageProps) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <DaftarPageContent searchParams={searchParams} />
    </Suspense>
  )
}