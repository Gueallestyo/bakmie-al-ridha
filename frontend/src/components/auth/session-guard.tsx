import { getSession, getProfile } from '@/features/auth/auth-actions'
import { redirect } from 'next/navigation'

export default async function SessionGuard({
  children,
  redirectIfAuthenticated = false,
  redirectToIfNotAuthenticated,
}: {
  children: React.ReactNode
  redirectIfAuthenticated?: boolean
  redirectToIfNotAuthenticated?: string
}) {
  const session = await getSession()

  if (session) {
    const profile = await getProfile(session.user.id)

    if (profile && profile.status_aktif && redirectIfAuthenticated) {
      if (profile.role === 'Admin') {
        redirect('/admin')
      }
      redirect('/kasir')
    }

    // Sudah terautentikasi dan aktif, render children (misal halaman yang
    // boleh diakses kedua status)
    return <>{children}</>
  }

  if (redirectToIfNotAuthenticated) {
    redirect(redirectToIfNotAuthenticated)
  }

  return <>{children}</>
}
