import { Suspense } from 'react'
import { connection } from 'next/server'
import RoleGuard from '@/components/auth/role-guard'
import AuthLoading from '@/components/auth/auth-loading'
import AdminAkunClient from '@/features/users/admin-akun-client'

async function AdminAkunContent() {
  await connection()

  return (
    <RoleGuard role="admin">
      <AdminAkunClient />
    </RoleGuard>
  )
}

export default function AdminAkunPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AdminAkunContent />
    </Suspense>
  )
}