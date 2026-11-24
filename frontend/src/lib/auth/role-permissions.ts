export type StaffRole = 'Admin' | 'Kasir'

export function normalizeStaffRole(role?: string | null): StaffRole | null {
  if (!role) return null
  const normalized = role.trim().toLowerCase()
  if (normalized === 'admin') return 'Admin'
  if (normalized === 'kasir') return 'Kasir'
  return null
}

export function canAccessAdmin(role?: string | null): boolean {
  return normalizeStaffRole(role) === 'Admin'
}

export function canAccessKasir(role?: string | null): boolean {
  const normalized = normalizeStaffRole(role)
  return normalized === 'Admin' || normalized === 'Kasir'
}