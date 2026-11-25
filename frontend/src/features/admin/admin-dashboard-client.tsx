'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'

type PeriodKey = 'today' | '7days' | '30days'

interface SummaryData {
  label: string
  omzet: string
  transaksi: number
  porsi: number
  menuTerlaris: string
  porsiTerlaris: number
}

const SUMMARY_BY_PERIOD: Record<PeriodKey, SummaryData> = {
  today: {
    label: 'Hari ini',
    omzet: 'Rp1.250.000',
    transaksi: 52,
    porsi: 68,
    menuTerlaris: 'Bakmie Ayam',
    porsiTerlaris: 32,
  },
  '7days': {
    label: '7 hari terakhir',
    omzet: 'Rp8.940.000',
    transaksi: 364,
    porsi: 472,
    menuTerlaris: 'Bakmie Ayam',
    porsiTerlaris: 215,
  },
  '30days': {
    label: '30 hari terakhir',
    omzet: 'Rp36.450.000',
    transaksi: 1490,
    porsi: 1920,
    menuTerlaris: 'Bakmie Ayam',
    porsiTerlaris: 890,
  },
}

const WEEKLY_SALES = [
  { day: 'Sen', value: 780000 },
  { day: 'Sel', value: 940000 },
  { day: 'Rab', value: 830000 },
  { day: 'Kam', value: 1120000 },
  { day: 'Jum', value: 1030000 },
  { day: 'Sab', value: 1340000 },
  { day: 'Min', value: 1480000 },
]

export default function AdminDashboardClient() {
  const router = useRouter()
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [periodOpen, setPeriodOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const currentSummary = SUMMARY_BY_PERIOD[period]

  const chartWidth = 310
  const chartHeight = 115
  const padX = 14
  const padTop = 14
  const padBottom = 14
  const maxVal = 1600000
  const minVal = 500000

  const points = WEEKLY_SALES.map((item, idx) => {
    const x =
      padX + (idx * (chartWidth - padX * 2)) / (WEEKLY_SALES.length - 1)
    const ratio = (item.value - minVal) / (maxVal - minVal)
    const y =
      chartHeight - padBottom - ratio * (chartHeight - padTop - padBottom)
    return { ...item, x, y }
  })

  const linePath = points
    .map(
      (pt, idx) =>
        `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    )
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${
    chartHeight - padBottom
  } L ${points[0].x.toFixed(1)} ${chartHeight - padBottom} Z`

  async function handleLogout() {
    setSigningOut(true)
    await signOut()
    router.replace('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#F9F7F6] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col relative pb-24">
        <header className="sticky top-0 z-20 bg-white px-4 h-14 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu navigasi"
              className="p-1.5 -ml-1.5 rounded-lg text-[#B82025] hover:bg-red-50 transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="font-bold text-[17px] tracking-tight text-[#B82025]">
              Bakmie Al Ridha
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Profil Admin"
            className="w-9 h-9 rounded-full bg-[#2C3E4C] flex items-center justify-center overflow-hidden ring-2 ring-red-100"
          >
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="11" r="5" fill="#F3C6A5" />
              <path
                d="M11 10.5C11 7.8 13.2 6 16 6C18.8 6 21 7.8 21 10.5C20.2 9.2 18.5 8.6 16 8.6C13.5 8.6 11.8 9.2 11 10.5Z"
                fill="#1F2933"
              />
              <path
                d="M7 27C7 22.4 10.8 19.5 16 19.5C21.2 19.5 25 22.4 25 27"
                fill="#1E293B"
              />
              <path d="M14.5 19.5L16 24L17.5 19.5H14.5Z" fill="#FFFFFF" />
            </svg>
          </button>
        </header>

        <section className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-5 pb-7 rounded-b-[28px] text-white shadow-sm">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">
            Dashboard
          </h1>
          <p className="text-[13px] text-red-100/90 mt-0.5 font-normal">
            Admin/Owner
          </p>
        </section>

        <main className="px-4 pt-5 space-y-4 flex-1">
          <div className="flex items-center justify-between relative">
            <h2 className="text-[17px] font-bold text-zinc-900">Ringkasan</h2>

            <div className="relative">
              <button
                type="button"
                onClick={() => setPeriodOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-white text-[12px] font-semibold text-[#C62828] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-red-200 transition-colors"
              >
                <span>{currentSummary.label}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  className={`transition-transform ${periodOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2.5 4.5L6 8.5L9.5 4.5H2.5Z" />
                </svg>
              </button>

              {periodOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 z-30">
                  {(Object.keys(SUMMARY_BY_PERIOD) as PeriodKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPeriod(key)
                        setPeriodOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                        period === key
                          ? 'bg-red-50 text-[#C62828] font-semibold'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {SUMMARY_BY_PERIOD[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3.5 bg-gradient-to-br from-[#D32F2F] via-[#B71C1C] to-[#8C1317] text-white shadow-sm">
              <p className="text-[11px] text-red-100 font-medium">
                Omzet {period === 'today' ? 'hari ini' : 'periode ini'}
              </p>
              <p className="text-[19px] font-extrabold tracking-tight mt-1 leading-snug">
                {currentSummary.omzet}
              </p>
              <p className="text-[10.5px] text-red-100/85 mt-1">
                Transaksi Dibayar
              </p>
            </div>

            <div className="rounded-2xl p-3.5 bg-[#FFF4D8] text-[#7C4A03]">
              <p className="text-[11px] font-medium text-[#8D5808]">
                Transaksi
              </p>
              <p className="text-[22px] font-extrabold tracking-tight mt-0.5 leading-snug">
                {currentSummary.transaksi}
              </p>
              <p className="text-[10.5px] text-[#8D5808]/90 mt-1">
                Pesanan Dibayar
              </p>
            </div>

            <div className="rounded-2xl p-3.5 bg-[#E6F1FC] text-[#1557B0]">
              <p className="text-[11px] font-medium text-[#1D63C1]">
                Porsi terjual
              </p>
              <p className="text-[22px] font-extrabold tracking-tight mt-0.5 leading-snug">
                {currentSummary.porsi}
              </p>
              <p className="text-[10.5px] text-[#1D63C1]/90 mt-1">
                Semua menu
              </p>
            </div>

            <div className="rounded-2xl p-3.5 bg-[#E6F4EA] text-[#1E6F34]">
              <p className="text-[11px] font-medium text-[#247A3C]">
                Menu terlaris
              </p>
              <p className="text-[17px] font-extrabold tracking-tight mt-1 leading-tight truncate">
                {currentSummary.menuTerlaris}
              </p>
              <p className="text-[10.5px] text-[#247A3C]/90 mt-1.5">
                {currentSummary.porsiTerlaris} porsi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-0.5">
            <Link
              href="/kasir"
              className="h-11 rounded-full bg-gradient-to-r from-[#D32F2F] to-[#9A171B] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
            >
              <span className="w-4 h-4 rounded-full bg-zinc-900/25 flex items-center justify-center text-white text-xs leading-none">
                +
              </span>
              <span>Buka Kasir</span>
            </Link>

            <button
              type="button"
              onClick={() => setPeriod('7days')}
              className="h-11 rounded-full border-[1.5px] border-[#C62828] bg-white text-[#C62828] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-red-50/60 transition-colors"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
              <span>Lihat Laporan</span>
            </button>
          </div>

          <section className="rounded-2xl border border-[#F3E2DF] bg-white p-4 shadow-[0_1px_3px_rgba(183,28,28,0.04)]">
            <h3 className="text-[15px] font-bold text-zinc-900">
              Ringkasan Penjualan
            </h3>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">
              Omzet 7 hari terakhir · hanya transaksi Dibayar
            </p>

            <div className="mt-3">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-32 overflow-visible"
                role="img"
                aria-label="Grafik omzet 7 hari terakhir"
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C62828" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#C62828" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[22, 56, 90].map((yPos) => (
                  <line
                    key={yPos}
                    x1={padX}
                    y1={yPos}
                    x2={chartWidth - padX}
                    y2={yPos}
                    stroke="#EAD7D5"
                    strokeWidth="1"
                  />
                ))}

                <path d={areaPath} fill="url(#salesFill)" />

                <path
                  d={linePath}
                  fill="none"
                  stroke="#C62828"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {points.map((pt) => (
                  <circle
                    key={pt.day}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.8"
                    fill="#FFFFFF"
                    stroke="#C62828"
                    strokeWidth="2.2"
                  />
                ))}
              </svg>

              <div className="flex items-center justify-between px-1.5 mt-1 text-[11px] text-zinc-500 font-medium">
                {WEEKLY_SALES.map((item) => (
                  <span key={item.day}>{item.day}</span>
                ))}
              </div>
            </div>
          </section>
        </main>

        <nav
          aria-label="Navigasi Utama Admin"
          className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-zinc-100 px-6 py-2 flex items-center justify-between z-20"
        >
          <Link
            href="/admin"
            className="flex flex-col items-center gap-1 text-[#C62828]"
          >
            <span className="px-4 py-1 rounded-full bg-[#FBE9E7] flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="5" rx="1.5" />
                <rect x="13" y="10" width="8" height="11" rx="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" />
              </svg>
            </span>
            <span className="text-[11px] font-bold">Dashboard</span>
          </Link>

          <Link
            href="/admin/kelola-data"
            className="flex flex-col items-center gap-1 text-zinc-600 hover:text-[#C62828] transition-colors"
          >
            <span className="px-4 py-1 rounded-full flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </span>
            <span className="text-[11px] font-medium">Kelola Data</span>
          </Link>

          <Link
            href="/admin/menu"
            className="flex flex-col items-center gap-1 text-zinc-600 hover:text-[#C62828] transition-colors"
          >
            <span className="px-4 py-1 rounded-full flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </span>
            <span className="text-[11px] font-medium">Kuota</span>
          </Link>
        </nav>

        <MobileAdminDrawer
          open={drawerOpen}
          activeKey="dashboard"
          userRole="admin"
          signingOut={signingOut}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}