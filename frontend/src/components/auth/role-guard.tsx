'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { canAccessAdmin, canAccessKasir } from '@/lib/auth/role-permissions'
import AuthLoading from '@/components/auth/auth-loading'

interface RoleGuardProps {
  role: 'admin' | 'kasir'
  children: ReactNode
}

export default function RoleGuard({ role, children }: RoleGuardProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    async function verify() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        router.replace('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('pengguna')
        .select('role, status_aktif')
        .eq('id_pengguna', user.id)
        .single()

      if (!active) return

      if (!profile || profile.status_aktif === false) {
        router.replace('/auth/login')
        return
      }

      const allowed =
        role === 'admin'
          ? canAccessAdmin(profile.role)
          : canAccessKasir(profile.role)

      if (!allowed) {
        router.replace(canAccessAdmin(profile.role) ? '/admin' : '/kasir')
        return
      }

      setAuthorized(true)
      setChecking(false)
    }

    verify()

    return () => {
      active = false
    }
  }, [role, router])

  if (checking || !authorized) {
    return <AuthLoading />
  }

  return <>{children}</>
}