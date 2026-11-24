'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'

export interface DailyQuotaItem {
  id: string
  nama: string
  sisa: number
  kuota: number
  ambang: number
}

const INITIAL_QUOTA_ITEMS: DailyQuotaItem[] = [
  {
    id: 'q-1',
    nama: 'Bakmie Ayam',
    sisa: 24,
    kuota: 60,
    ambang: 10,
  },
  {
    id: 'q-2',
    nama: 'Bakmie Ayam Bakso',
    sisa: 4,
    kuota: 30,
    ambang: 5,
  },
  {
    id: 'q-3',
    nama: 'Bakmie Pangsit',
    sisa: 0,
    kuota: 30,
    ambang: 5,
  },
]

function getQuotaStatus(item: DailyQuotaItem): {
  label: string
  badgeClass: string
  barClass: string
  percent: number
} {
  const safeKuota = Math.max(item.kuota, 1)
  const percent = Math.max(0, Math.min(100, (item.sisa / safeKuota) * 100))

  if (item.sisa <= 0) {
    return {
      label: 'Sold Out',
      badgeClass: 'bg-[#ECE9E8] text-[#6E6564]',
      barClass: 'bg-transparent',
      percent: 0,
    }
  }

  if (item.sisa <= item.ambang) {
    return {
      label: 'Hampir habis',
      badgeClass: 'bg-[#FDF1CE] text-[#A87212]',
      barClass: 'bg-[#F0A51E]',
      percent,
    }
  }

  return {
    label: 'Tersedia',
    badgeClass: 'bg-[#E3F5E8] text-[#1D7A36]',
    barClass: 'bg-[#1B7A2B]',
    percent,
  }
}

export default function KuotaHarianView() {
  const router = useRouter()
  const [items, setItems] = useState<DailyQuotaItem[]>(INITIAL_QUOTA_ITEMS)
  const [selectedId, setSelectedId] = useState<string>(INITIAL_QUOTA_ITEMS[0].id)

  const activeItem =
    items.find((item) => item.id === selectedId) ?? items[0]

  const [kuotaInput, setKuotaInput] = useState<string>(
    String(INITIAL_QUOTA_ITEMS[0].kuota),
  )
  const [ambangInput, setAmbangInput] = useState<string>(
    String(INITIAL_QUOTA_ITEMS[0].ambang),
  )
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  function handleSelectItem(item: DailyQuotaItem) {
    setSelectedId(item.id)
    setKuotaInput(String(item.kuota))
    setAmbangInput(String(item.ambang))
    setSavedNotice(null)
  }

  function handleSaveQuota(e: React.FormEvent) {
    e.preventDefault()
    if (!activeItem) return

    const nextKuota = Math.max(0, Number(kuotaInput) || 0)
    const nextAmbang = Math.max(0, Number(ambangInput) || 0)
    const selisihKuota = nextKuota - activeItem.kuota
    const nextSisa = Math.max(0, Math.min(nextKuota, activeItem.sisa + selisihKuota))

    setItems((prev) =>
      prev.map((row) =>
        row.id === activeItem.id
          ? {
              ...row,
              kuota: nextKuota,
              sisa: nextSisa,
              ambang: nextAmbang,
            }
          : row,
      ),
    )

    setKuotaInput(String(nextKuota))
    setAmbangInput(String(nextAmbang))
    setSavedNotice(`Kuota ${activeItem.nama} diperbarui (${nextSisa}/${nextKuota}).`)
  }

  async function handleLogout() {
    setSigningOut(true)
    await signOut()
    router.replace('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#F9F7F6] flex justify-center">
      {/* Container Mobile-First (360px - 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col relative pb-36">
        {/* Top App Bar */}
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

        {/* Hero Banner Merah Gradasi */}
        <section className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-5 pb-7 rounded-b-[28px] text-white shadow-sm">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">
            Kuota Harian
          </h1>
          <p className="text-[13px] text-red-100/90 mt-0.5 font-normal">
            Admin/Owner
          </p>
        </section>

        {/* Form Konten Utama */}
        <form
          id="form-kuota-harian"
          onSubmit={handleSaveQuota}
          className="px-4 pt-5 space-y-3.5 flex-1"
        >
          {/* Kartu Informasi Tanggal */}
          <div className="rounded-2xl border border-[#F3E2DF] bg-white px-4 py-3.5 flex items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div>
              <p className="text-[14.5px] font-bold text-zinc-900">
                Hari ini
              </p>
              <p className="text-[12px] text-[#7A6A68] mt-0.5">
                Kamis, 12 November 2026
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-[#EFECEB] text-[#6E6564] text-[11px] font-bold shrink-0">
              Berlaku per tanggal
            </span>
          </div>

          {/* Daftar Kartu Kuota Menu */}
          {items.map((item) => {
            const status = getQuotaStatus(item)
            const isSelected = item.id === activeItem?.id

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectItem(item)
                  }
                }}
                className={`rounded-2xl bg-white px-4 py-3.5 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                  isSelected
                    ? 'border-[1.5px] border-[#E7C6C2] ring-1 ring-[#F9E6E4]'
                    : 'border border-[#F3E2DF] hover:border-[#E7C6C2]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14.5px] font-bold text-zinc-900">
                    {item.nama}
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${status.badgeClass}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Progress Bar Kuota */}
                <div className="w-full h-1.5 rounded-full bg-[#F1ECEB] overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${status.barClass}`}
                    style={{ width: `${status.percent}%` }}
                  />
                </div>

                {/* Info Sisa & Ambang Peringatan */}
                <div className="flex items-center justify-between gap-2 text-[11.5px] text-[#7A6A68] mt-2">
                  <span>
                    Sisa {item.sisa} dari {item.kuota}
                  </span>
                  <span>Ambang Peringatan {item.ambang}</span>
                </div>
              </div>
            )
          })}

          {/* Kartu Editor Kuota & Ambang */}
          {activeItem && (
            <div className="rounded-2xl border border-[#F3E2DF] bg-white p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold text-zinc-900">
                  Ubah kuota · {activeItem.nama}
                </p>
                {savedNotice && (
                  <span className="text-[11px] font-semibold text-[#1D7A36]">
                    Tersimpan
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="input-kuota"
                    className="block text-[11.5px] font-medium text-[#7A6A68] mb-1.5"
                  >
                    Kuota
                  </label>
                  <input
                    id="input-kuota"
                    type="number"
                    min={0}
                    value={kuotaInput}
                    onChange={(e) => {
                      setKuotaInput(e.target.value)
                      setSavedNotice(null)
                    }}
                    className="w-full h-12 px-3.5 rounded-2xl border border-[#EAD7D5] bg-white text-[15px] font-medium text-zinc-900 focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-ambang"
                    className="block text-[11.5px] font-medium text-[#7A6A68] mb-1.5"
                  >
                    Ambang
                  </label>
                  <input
                    id="input-ambang"
                    type="number"
                    min={0}
                    value={ambangInput}
                    onChange={(e) => {
                      setAmbangInput(e.target.value)
                      setSavedNotice(null)
                    }}
                    className="w-full h-12 px-3.5 rounded-2xl border border-[#EAD7D5] bg-white text-[15px] font-medium text-zinc-900 focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              {savedNotice && (
                <p className="text-[11.5px] text-[#1D7A36] font-medium">
                  {savedNotice}
                </p>
              )}
            </div>
          )}
        </form>

        {/* Tombol CTA Simpan Kuota di Atas Bottom Bar */}
        <div className="fixed bottom-16 w-full max-w-[430px] px-4 pb-3 pt-2 bg-gradient-to-t from-white via-white to-white/80 z-20">
          <button
            type="submit"
            form="form-kuota-harian"
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] text-white text-[14.5px] font-bold shadow-md hover:opacity-95 transition-opacity flex items-center justify-center"
          >
            Simpan Kuota
          </button>
        </div>

        {/* Bottom Navigation Bar */}
        <nav
          aria-label="Navigasi Utama Admin"
          className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-zinc-100 px-6 py-2 flex items-center justify-between z-20"
        >
          {/* Tab 1: Dashboard */}
          <Link
            href="/admin"
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
              >
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="5" rx="1.5" />
                <rect x="13" y="10" width="8" height="11" rx="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" />
              </svg>
            </span>
            <span className="text-[11px] font-medium">Dashboard</span>
          </Link>

          {/* Tab 2: Kelola Data */}
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

          {/* Tab 3: Kuota (Aktif) */}
          <Link
            href="/admin/menu"
            className="flex flex-col items-center gap-1 text-[#C62828]"
          >
            <span className="px-4 py-1 rounded-full bg-[#FBE9E7] flex items-center justify-center">
              <svg
                width="18"
                height="18"
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
            </span>
            <span className="text-[11px] font-bold">Kuota</span>
          </Link>
        </nav>

        {/* Drawer Navigasi Samping */}
        <MobileAdminDrawer
          open={drawerOpen}
          activeKey="kuota-harian"
          signingOut={signingOut}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}