'use client'

import Link from 'next/link'

export type AdminDrawerNavKey =
  | 'dashboard'
  | 'kelola-data'
  | 'kuota-harian'
  | 'laporan-penjualan'
  | 'akun-staf'

interface MobileAdminDrawerProps {
  open: boolean
  activeKey: AdminDrawerNavKey
  signingOut: boolean
  onClose: () => void
  onLogout: () => void
  onSelectLaporan?: () => void
}

interface DrawerMenuItem {
  key: AdminDrawerNavKey
  label: string
  href: string
  icon: 'grid' | 'edit' | 'list' | 'plus'
}

const DRAWER_ITEMS: DrawerMenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', icon: 'grid' },
  {
    key: 'kelola-data',
    label: 'Kelola Data',
    href: '/admin/kelola-data',
    icon: 'edit',
  },
  {
    key: 'kuota-harian',
    label: 'Kuota Harian',
    href: '/admin/menu',
    icon: 'list',
  },
  {
    key: 'laporan-penjualan',
    label: 'Laporan Penjualan',
    href: '/admin',
    icon: 'list',
  },
  {
    key: 'akun-staf',
    label: 'Akun Staf',
    href: '/admin/akun',
    icon: 'plus',
  },
]

function DrawerItemIcon({
  icon,
  isActive,
}: {
  icon: DrawerMenuItem['icon']
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
  signingOut,
  onClose,
  onLogout,
  onSelectLaporan,
}: MobileAdminDrawerProps) {
  if (!open) return null

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
              aria-label="Menu Samping Admin"
              className="px-3.5 pt-4 space-y-1"
            >
              {DRAWER_ITEMS.map((item) => {
                const isActive = activeKey === item.key

                if (item.key === 'laporan-penjualan' && onSelectLaporan) {
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onSelectLaporan()
                        onClose()
                      }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-full text-left text-[14.5px] transition-colors ${
                        isActive
                          ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                          : 'text-[#262626] font-medium hover:bg-zinc-50'
                      }`}
                    >
                      <DrawerItemIcon icon={item.icon} isActive={isActive} />
                      <span>{item.label}</span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-full text-[14.5px] transition-colors ${
                      isActive
                        ? 'bg-[#FBE9E7] text-[#C62828] font-bold'
                        : 'text-[#262626] font-medium hover:bg-zinc-50'
                    }`}
                  >
                    <DrawerItemIcon icon={item.icon} isActive={isActive} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
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