import { Suspense } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import KelolaDataMasterView from '@/features/admin/kelola-data-master-view'

async function KelolaDataMasterPageContent() {
  await connection()

  return (
    <RoleGuard role="admin">
      <KelolaDataMasterView />
    </RoleGuard>
  )
}

export default function KelolaDataMasterPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <KelolaDataMasterPageContent />
    </Suspense>
  )
}