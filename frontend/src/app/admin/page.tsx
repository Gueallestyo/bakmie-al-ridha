import { Suspense } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import AdminDashboardClient from '@/features/admin/admin-dashboard-client'

async function AdminContent() {
  await connection()

  return (
    <RoleGuard role="admin">
      <AdminDashboardClient />
    </RoleGuard>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AdminContent />
    </Suspense>
  )
}