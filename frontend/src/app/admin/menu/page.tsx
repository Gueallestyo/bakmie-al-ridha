import { Suspense } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import KuotaHarianView from '@/features/admin/kuota-harian-view'

async function KuotaHarianPageContent() {
  await connection()

  return (
    <RoleGuard role="admin">
      <KuotaHarianView />
    </RoleGuard>
  )
}

export default function KuotaHarianPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <KuotaHarianPageContent />
    </Suspense>
  )
}