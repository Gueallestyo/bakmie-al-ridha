'use client'

import { useState } from 'react'
import Link from 'next/link'

export type AdminDrawerNavKey =
  | 'dashboard'
  | 'dashboard-admin'
  | 'dashboard-kasir'
  | 'kelola-data'
  | 'kuota-harian'
  | 'akun-staf'
  | 'daftar-pesanan'

interface MobileAdminDrawerProps {
  open: boolean
  activeKey: AdminDrawerNavKey
  userRole?: 'admin' | 'kasir'
  signingOut: boolean
  onClose: () => void
  onLogout: () => void
}

function DrawerItemIcon({
  icon,
  isActive,
}: {
  icon: 'grid' | 'edit' | 'list' | 'plus'
  isActive: boolean
}) {
  const colorClass = isActive ? 'text-[#C62828]' : 'text-[#262626]'

  if (icon === 'grid') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`shrink-0 ${colorClass}`}
      >
        <rect x="3" y="3" width="8" height="8" rx="1.2" />
        <rect x="13" y="3" width="8" height="5" rx="1.2" />
        <rect x="13" y="10" width="8" height="11" rx="1.2" />
        <rect x="3" y="13" width="8" height="8" rx="1.2" />
      </svg>
    )
  }

  if (icon === 'edit') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 ${colorClass}`}
      >
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    )
  }

  if (icon === 'list') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className={`shrink-0 ${colorClass}`}
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="4" cy="6" r="1.2" fill="currentColor" />
        <circle cx="4" cy="12" r="1.2" fill="currentColor" />
        <circle cx="4" cy="18" r="1.2" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      className={`shrink-0 ${colorClass}`}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function MobileAdminDrawer({
  open,
  activeKey,
  userRole = 'admin',
  signingOut,
  onClose,
  onLogout,
}: MobileAdminDrawerProps) {
  const isDashboardGroupActive =
    activeKey === 'dashboard' ||
    activeKey === 'dashboard-admin' ||
    activeKey === 'dashboard-kasir'

  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState<boolean>(
    isDashboardGroupActive,
  )

  if (!open) return null

  const isAdmin = userRole === 'admin'

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black/50">
      <div className="w-full max-w-[430px] flex h-full">
        <aside className="w-[74%] max-w-[300px] bg-white h-full flex flex-col justify-between shadow-2xl rounded-none overflow-hidden">
          <div>
            {/* Header Merah Tanpa Rounded Edge dengan Emoji 🍜 */}
            <div className="bg-gradient-to-br from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-7 pb-6 rounded-none text-white">
              <span
                role="img"
                aria-label="Mangkuk Bakmie"
                className="inline-block text-[36px] leading-none select-none"
              >
                🍜
              </span>
              <p className="font-bold text-[19px] tracking-tight mt-3 leading-snug">
                Bakmie Al-Ridha
              </p>
            </div>

            {/* Daftar Menu Navigasi */}
            <nav
              aria-label="Menu Samping Aplikasi"
              className="px-3.5 pt-4 space-y-1"
            >
              {isAdmin ? (
                <>
                  {/* Item Dashboard dengan Dropdown khusus Role Admin */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setDashboardDropdownOpen((prev) => !prev)
                      }
                      aria-expanded={dashboardDropdownOpen}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-full text-left text-[14.5px] transition-colors ${
                        isDashboardGroupActive
                          ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                          : 'text-[#262626] font-medium hover:bg-zinc-50'
                      }`}
                    >
                      <span className="flex items-center gap-3.5">
                        <DrawerItemIcon
                          icon="grid"
                          isActive={isDashboardGroupActive}
                        />
                        <span>Dashboard</span>
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`shrink-0 transition-transform duration-200 ${
                          dashboardDropdownOpen ? 'rotate-180' : ''
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {dashboardDropdownOpen && (
                      <div className="mt-1 ml-7 pl-3 border-l border-[#F3D8D5] space-y-1">
                        <Link
                          href="/admin"
                          onClick={onClose}
                          className={`block px-3.5 py-2 rounded-full text-[13.5px] transition-colors ${
                            activeKey === 'dashboard' ||
                            activeKey === 'dashboard-admin'
                              ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                              : 'text-[#4A4443] font-medium hover:bg-zinc-50'
                          }`}
                        >
                          Dashboard Admin
                        </Link>

                        <Link
                          href="/kasir"
                          onClick={onClose}
                          className={`block px-3.5 py-2 rounded-full text-[13.5px] transition-colors ${
                            activeKey === 'dashboard-kasir'
                              ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                              : 'text-[#4A4443] font-medium hover:bg-zinc-50'
                          }`}
                        >
                          Dashboard Kasir
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Kelola Data */}
                  <Link
                    href="/admin/kelola-data"
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-full text-[14.5px] transition-colors ${
                      activeKey === 'kelola-data'
                        ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                        : 'text-[#262626] font-medium hover:bg-zinc-50'
                    }`}
                  >
                    <DrawerItemIcon
                      icon="edit"
                      isActive={activeKey === 'kelola-data'}
                    />
                    <span>Kelola Data</span>
                  </Link>

                  {/* Kuota Harian */}
                  <Link
                    href="/admin/menu"
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-full text-[14.5px] transition-colors ${
                      activeKey === 'kuota-harian'
                        ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                        : 'text-[#262626] font-medium hover:bg-zinc-50'
                    }`}
                  >
                    <DrawerItemIcon
                      icon="list"
                      isActive={activeKey === 'kuota-harian'}
                    />
                    <span>Kuota Harian</span>
                  </Link>

                  {/* Akun Staf */}
                  <Link
                    href="/admin/akun"
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-full text-[14.5px] transition-colors ${
                      activeKey === 'akun-staf'
                        ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                        : 'text-[#262626] font-medium hover:bg-zinc-50'
                    }`}
                  >
                    <DrawerItemIcon
                      icon="plus"
                      isActive={activeKey === 'akun-staf'}
                    />
                    <span>Akun Staf</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Menu Khusus Role Kasir (Tanpa Dropdown & Tanpa Akses Admin) */}
                  <Link
                    href="/kasir"
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-full text-[14.5px] transition-colors ${
                      activeKey === 'dashboard' ||
                      activeKey === 'dashboard-kasir'
                        ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                        : 'text-[#262626] font-medium hover:bg-zinc-50'
                    }`}
                  >
                    <DrawerItemIcon
                      icon="grid"
                      isActive={
                        activeKey === 'dashboard' ||
                        activeKey === 'dashboard-kasir'
                      }
                    />
                    <span>Dashboard Kasir</span>
                  </Link>

                  <Link
                    href="/kasir/daftar"
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-full text-[14.5px] transition-colors ${
                      activeKey === 'daftar-pesanan'
                        ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                        : 'text-[#262626] font-medium hover:bg-zinc-50'
                    }`}
                  >
                    <DrawerItemIcon
                      icon="list"
                      isActive={activeKey === 'daftar-pesanan'}
                    />
                    <span>Daftar Pesanan</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Tombol Keluar di Kiri Bawah */}
          <div className="px-7 pb-7 pt-3">
            <button
              type="button"
              onClick={onLogout}
              disabled={signingOut}
              className="text-[14.5px] font-bold text-[#C62828] hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {signingOut ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </aside>

        {/* Area Backdrop untuk Menutup Drawer */}
        <button
          type="button"
          aria-label="Tutup menu samping"
          onClick={onClose}
          className="flex-1 h-full"
        />
      </div>
    </div>
  )
}