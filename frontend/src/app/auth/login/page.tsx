import { Suspense } from 'react'
import { connection } from 'next/server'
import SessionGuard from '@/components/auth/session-guard'
import AuthLoading from '@/components/auth/auth-loading'
import LoginForm from '@/features/auth/login-form'

async function LoginContent() {
  await connection()

  return (
    <SessionGuard redirectIfAuthenticated>
      <LoginForm />
    </SessionGuard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <LoginContent />
    </Suspense>
  )
}