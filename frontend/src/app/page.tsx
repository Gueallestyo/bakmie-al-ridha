import { Suspense } from 'react'
import SessionGuard from '@/components/auth/session-guard'
import AuthLoading from '@/components/auth/auth-loading'

export default function Home() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <SessionGuard
        redirectIfAuthenticated
        redirectToIfNotAuthenticated="/auth/login"
      >
        <p className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          Mengalihkan ke halaman masuk…
        </p>
      </SessionGuard>
    </Suspense>
  )
}
