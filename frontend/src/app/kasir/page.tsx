import { Suspense, type ComponentProps, type ReactNode } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import InputPesananView from '@/features/kasir/input-pesanan-view'

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

async function KasirPageContent() {
  await connection()

  return (
    <KasirAccessGuard role="kasir-or-admin">
      <InputPesananView />
    </KasirAccessGuard>
  )
}

export default function KasirPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <KasirPageContent />
    </Suspense>
  )
}