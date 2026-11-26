'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import { daftarMenu } from '@/lib/api/admin'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'

export type OrderType = 'dine_in' | 'takeaway'

export interface KasirMenuItem {
  id: string
  nama: string
  harga: number
  kategori: string
  sisaKuota: number
  ambangPeringatan: number
  iconKind: 'noodle' | 'drink'
}

function getLocalDateString(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  })
}

function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`
}

function getStockBadge(item: KasirMenuItem): {
  label: string
  className: string
  isSoldOut: boolean
} {
  if (item.sisaKuota <= 0) {
    return {
      label: 'Sold Out',
      className: 'bg-[#F0ECEB] text-[#9E9594]',
      isSoldOut: true,
    }
  }
  if (item.sisaKuota <= item.ambangPeringatan) {
    return {
      label: `Hampir habis · ${item.sisaKuota}`,
      className: 'bg-[#FDF1CE] text-[#A87212]',
      isSoldOut: false,
    }
  }
  return {
    label: `Sisa ${item.sisaKuota}`,
    className: 'bg-[#E3F5E8] text-[#1D7A36]',
    isSoldOut: false,
  }
}

function MenuArtwork({
  kind,
  disabled,
}: {
  kind: KasirMenuItem['iconKind']
  disabled: boolean
}) {
  if (kind === 'drink') {
    return (
      <div
        className={`w-full h-28 rounded-2xl bg-[#E4F0F7] flex items-center justify-center ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="21" y="18" width="22" height="32" rx="4" fill="#F5A623" />
          <rect x="21" y="18" width="22" height="6" rx="2" fill="#F9C766" />
          <rect x="25" y="27" width="6" height="6" rx="1.2" fill="#FFF4D8" />
          <rect x="33" y="36" width="6" height="6" rx="1.2" fill="#FFF4D8" />
          <path
            d="M38 11L42 36"
            stroke="#C62828"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`w-full h-28 rounded-2xl flex items-center justify-center ${
        disabled ? 'bg-[#F7ECEA] opacity-55' : 'bg-[#FDECE4]'
      }`}
    >
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
        <circle
          cx="34"
          cy="34"
          r="22"
          fill="#FFF8E7"
          stroke={disabled ? '#D6B7B5' : '#C62828'}
          strokeWidth="3.5"
        />
        <path
          d="M19 32C24 28 30 36 36 32C42 28 46 34 50 32"
          stroke={disabled ? '#D7C49E' : '#E6A100'}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M21 40C27 38 32 44 39 40C43 38 46 41 49 40"
          stroke={disabled ? '#D7C49E' : '#E6A100'}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="27.5"
          cy="31"
          r="4.5"
          fill={disabled ? '#B8A8A2' : '#795548'}
        />
        <circle
          cx="40.5"
          cy="35"
          r="4.2"
          fill={disabled ? '#B8A8A2' : '#6D4C41'}
        />
        <circle
          cx="35"
          cy="26"
          r="2.4"
          fill={disabled ? '#A7BEB0' : '#2E7D32'}
        />
        <circle
          cx="30"
          cy="39.5"
          r="2.2"
          fill={disabled ? '#A7BEB0' : '#2E7D32'}
        />
      </svg>
    </div>
  )
}

export default function InputPesananView({
  userRole = 'admin',
}: {
  userRole?: 'admin' | 'kasir'
}) {
  const router = useRouter()
  const tableInputRef = useRef<HTMLInputElement | null>(null)

  const [menus, setMenus] = useState<KasirMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableWarning, setTableWarning] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [tableNumber, setTableNumber] = useState<string>('')
  const [editingOrderContext, setEditingOrderContext] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<
    'Semua' | 'Mie' | 'Minuman' | 'Dine-in'
  >('Semua')

  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const fetchMenusAndQuota = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) {
      setLoading(true)
    }
    setError(null)
    try {
      const menuRows = await daftarMenu()
      const today = getLocalDateString()

      const kuotaRes = await fetch('/api/admin/kuota', {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })
      const kuotaJson = await kuotaRes.json()
      const kuotaList = kuotaJson.kuota ?? []

      const mapped: KasirMenuItem[] = menuRows.map((row: any) => {
        const kuotaHariIni = kuotaList.find(
          (k: any) => k.id_menu === row.id_menu && k.tanggal === today,
        )
        const sisaKuota = kuotaHariIni
          ? Number(kuotaHariIni.sisa_porsi)
          : Number(row.kuota_default)
        const ambang = kuotaHariIni
          ? Number(kuotaHariIni.ambang_peringatan)
          : Number(row.ambang_default)

        return {
          id: row.id_menu,
          nama: row.nama_menu,
          harga: Number(row.harga),
          kategori: row.kategori?.nama_kategori ?? 'Lainnya',
          sisaKuota,
          ambangPeringatan: ambang,
          iconKind:
            row.kategori?.nama_kategori?.toLowerCase() === 'minuman'
              ? 'drink'
              : 'noodle',
        }
      })

      setMenus(mapped)
      setQuantities((prev) => {
        const next: Record<string, number> = {}
        for (const m of mapped) {
          const currentQty = prev[m.id] ?? 0
          if (currentQty > 0 && m.sisaKuota > 0) {
            next[m.id] = Math.min(currentQty, m.sisaKuota)
          }
        }
        return next
      })
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar menu.')
    } finally {
      if (showSpinner) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    setSubmitting(false)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('bakmie_ringkasan_pesanan')
    }
    void fetchMenusAndQuota(true)
  }, [fetchMenusAndQuota])

  useEffect(() => {
    const handlePageShow = () => {
      setSubmitting(false)
      void fetchMenusAndQuota(false)
    }
    const handleFocus = () => {
      void fetchMenusAndQuota(false)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchMenusAndQuota(false)
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchMenusAndQuota])

  useEffect(() => {
    if (editingOrderContext && orderType === 'dine_in' && tableWarning) {
      tableInputRef.current?.focus()
    }
  }, [editingOrderContext, orderType, tableWarning])

  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return menus.filter((item) => {
      if (activeFilter === 'Mie' && item.kategori.toLowerCase() !== 'mie') {
        return false
      }
      if (
        activeFilter === 'Minuman' &&
        item.kategori.toLowerCase() !== 'minuman'
      ) {
        return false
      }
      if (activeFilter === 'Dine-in' && orderType !== 'dine_in') {
        return false
      }
      if (!q) return true
      return (
        item.nama.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q)
      )
    })
  }, [menus, searchQuery, activeFilter, orderType])

  const cartSummary = useMemo(() => {
    let totalPortions = 0
    let totalAmount = 0

    for (const item of menus) {
      const qty = quantities[item.id] ?? 0
      if (qty > 0) {
        totalPortions += qty
        totalAmount += qty * item.harga
      }
    }

    return { totalPortions, totalAmount }
  }, [menus, quantities])

  function handleChangeQty(item: KasirMenuItem, delta: number) {
    if (item.sisaKuota <= 0) return
    setQuantities((prev) => {
      const current = prev[item.id] ?? 0
      const next = Math.max(0, Math.min(item.sisaKuota, current + delta))
      return { ...prev, [item.id]: next }
    })
  }

  const handleLanjutRingkasan = useCallback(() => {
    if (submitting || cartSummary.totalPortions <= 0) return

    const trimmedTable = tableNumber.trim()
    if (orderType === 'dine_in' && !trimmedTable) {
      setTableWarning(
        'Nomor meja wajib diisi untuk pesanan Dine-in sebelum melihat pesanan.',
      )
      setEditingOrderContext(true)
      setTimeout(() => {
        tableInputRef.current?.focus()
      }, 0)
      return
    }

    const selectedEntries = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([menuId, qty]) => {
        const item = menus.find((m) => m.id === menuId)
        if (!item) return null
        return { item, qty }
      })
      .filter(
        (entry): entry is { item: KasirMenuItem; qty: number } => Boolean(entry),
      )

    if (selectedEntries.length === 0) return

    setSubmitting(true)
    setError(null)
    setTableWarning(null)

    const cleanTableNumber = orderType === 'dine_in' ? trimmedTable : null

    const ringkasanItems = selectedEntries.map(({ item, qty }) => ({
      menuId: item.id,
      nama: item.nama,
      hargaSatuan: item.harga,
      jumlah: qty,
      iconKind: item.iconKind,
    }))

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'bakmie_ringkasan_pesanan',
          JSON.stringify({
            orderType,
            tableNumber: cleanTableNumber,
            items: ringkasanItems,
          }),
        )
      }

      const params = new URLSearchParams({
        total: String(cartSummary.totalAmount),
        jenis: orderType,
        ...(cleanTableNumber ? { meja: cleanTableNumber } : {}),
        items: JSON.stringify(ringkasanItems),
      })

      router.push(`/kasir/ringkasan?${params.toString()}`)
    } catch (err: any) {
      setError(err.message || 'Gagal membuka ringkasan pesanan.')
      setSubmitting(false)
    }
  }, [
    submitting,
    cartSummary,
    orderType,
    tableNumber,
    menus,
    quantities,
    router,
  ])

  async function handleLogout() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/auth/login')
    } finally {
      setSigningOut(false)
    }
  }

  const orderSubtitle =
    orderType === 'dine_in'
      ? `Kasir · Dine In · Meja ${tableNumber.trim() || '-'}`
      : 'Kasir · Takeaway'

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
        <p className="text-zinc-600">Memuat menu…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F6] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col relative pb-36">
        <header className="sticky top-0 z-20 bg-white px-4 h-14 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu navigasi kasir"
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
            aria-label="Profil Kasir"
            className="w-9 h-9 rounded-full bg-[#2C3E4C] flex items-center justify-center overflow-hidden ring-2 ring-red-100"
          >
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="11" r="5" fill="#F3C6A5" />
              <path
                d="M11 10.5C11 7.8 13.2 6 16 6C18.8 6 21 10.5C20.2 9.2 18.5 8.6 16 8.6C13.5 8.6 11.8 9.2 11 10.5Z"
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

        {error && (
          <div className="mx-4 mt-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        <section className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-5 pb-7 rounded-b-[28px] text-white shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-[24px] font-bold leading-tight tracking-tight">
                Pesanan Baru
              </h1>
              <p className="text-[12.5px] text-red-100/90 mt-0.5 font-normal">
                {orderSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingOrderContext((prev) => !prev)}
              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-semibold text-white transition-colors"
            >
              {editingOrderContext ? 'Selesai' : 'Ubah Meja'}
            </button>
          </div>

          {editingOrderContext && (
            <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOrderType('dine_in')
                  if (tableNumber.trim()) {
                    setTableWarning(null)
                  }
                }}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  orderType === 'dine_in'
                    ? 'bg-white text-[#B71C1C]'
                    : 'bg-white/15 text-white'
                }`}
              >
                Dine-in
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType('takeaway')
                  setTableNumber('')
                  setTableWarning(null)
                }}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  orderType === 'takeaway'
                    ? 'bg-white text-[#B71C1C]'
                    : 'bg-white/15 text-white'
                }`}
              >
                Takeaway
              </button>
              {orderType === 'dine_in' && (
                <input
                  ref={tableInputRef}
                  type="text"
                  value={tableNumber}
                  onChange={(e) => {
                    setTableNumber(e.target.value)
                    if (e.target.value.trim()) {
                      setTableWarning(null)
                    }
                  }}
                  placeholder="No. Meja"
                  aria-label="Nomor Meja"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  className="w-20 h-8 px-2.5 rounded-full bg-white text-black placeholder:text-[#7A6A68] text-xs font-semibold focus:outline-none"
                />
              )}
            </div>
          )}
        </section>

        <main className="px-4 pt-4 space-y-3.5 flex-1">
          {tableWarning && (
            <div
              role="alert"
              className="rounded-2xl bg-[#FBE9E7] border border-[#F5C6C2] px-3.5 py-2.5 flex items-center justify-between gap-2"
            >
              <p className="text-xs font-bold text-[#B71C1C]">{tableWarning}</p>
              <button
                type="button"
                onClick={() => {
                  setEditingOrderContext(true)
                  setTimeout(() => tableInputRef.current?.focus(), 0)
                }}
                className="px-2.5 py-1 rounded-full bg-[#C62828] text-white text-[11px] font-bold shrink-0"
              >
                Isi Meja
              </button>
            </div>
          )}

          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
              className="w-full h-11 px-4 rounded-2xl border border-[#EAD7D5] bg-white text-[13.5px] font-semibold text-black placeholder:text-[#7A6A68] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {(['Semua', 'Mie', 'Minuman', 'Dine-in'] as const).map((chip) => {
              const isSelected = activeFilter === chip
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setActiveFilter(chip)
                    if (chip === 'Dine-in') {
                      setOrderType('dine_in')
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-[12.5px] transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#C62828] text-white font-bold shadow-xs'
                      : 'bg-white text-[#6E6564] font-medium border border-[#EAD7D5] hover:border-red-300'
                  }`}
                >
                  {chip}
                </button>
              )
            })}
          </div>

          {filteredMenus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EAD7D5] p-6 text-center text-xs text-zinc-500">
              Menu tidak ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              {filteredMenus.map((item) => {
                const badge = getStockBadge(item)
                const qty = quantities[item.id] ?? 0
                const isMaxReached = qty >= item.sisaKuota

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-white p-2.5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                      badge.isSoldOut
                        ? 'border-[#F3E5E3] bg-[#FFFCFC]'
                        : 'border-[#F3E2DF]'
                    }`}
                  >
                    <div>
                      <MenuArtwork
                        kind={item.iconKind}
                        disabled={badge.isSoldOut}
                      />

                      <div className="mt-2.5 px-0.5">
                        <p
                          className={`text-[14px] font-bold leading-snug ${
                            badge.isSoldOut ? 'text-[#B5A9A8]' : 'text-zinc-900'
                          }`}
                        >
                          {item.nama}
                        </p>
                        <p
                          className={`text-[13.5px] font-bold mt-0.5 ${
                            badge.isSoldOut ? 'text-[#DE9A9A]' : 'text-[#C62828]'
                          }`}
                        >
                          {formatRupiah(item.harga)}
                        </p>

                        <span
                          className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 px-0.5">
                      {badge.isSoldOut ? (
                        <div className="h-8" aria-hidden="true" />
                      ) : qty > 0 ? (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleChangeQty(item, -1)}
                            aria-label={`Kurangi porsi ${item.nama}`}
                            className="w-8 h-8 rounded-full border border-[#EAD7D5] bg-white text-[#C62828] font-bold text-base flex items-center justify-center hover:bg-red-50 transition-colors"
                          >
                            −
                          </button>

                          <span className="text-[14px] font-bold text-zinc-900 tabular-nums">
                            {qty}
                          </span>

                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={() => handleChangeQty(item, 1)}
                            aria-label={`Tambah porsi ${item.nama}`}
                            className="w-8 h-8 rounded-full bg-[#C62828] text-white font-bold text-base flex items-center justify-center hover:bg-[#A61B1B] disabled:opacity-40 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChangeQty(item, 1)}
                          className="w-full h-8 rounded-full bg-gradient-to-r from-[#D32F2F] to-[#9A171B] text-white text-[12px] font-bold flex items-center justify-center hover:opacity-95 transition-opacity"
                        >
                          + Tambah
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        <div className="fixed bottom-16 w-full max-w-[430px] px-3.5 pb-2 pt-1 z-20 pointer-events-none">
          <button
            type="button"
            onClick={handleLanjutRingkasan}
            disabled={submitting || cartSummary.totalPortions <= 0}
            className="pointer-events-auto w-full rounded-2xl bg-gradient-to-r from-[#C92A2A] via-[#B2181B] to-[#8C1317] px-4 py-3 text-white shadow-lg flex items-center justify-between gap-3 disabled:opacity-60 hover:opacity-98 transition-opacity"
          >
            <div className="text-left">
              <p className="text-[11px] text-red-100 font-medium">
                Keranjang · {cartSummary.totalPortions} porsi
              </p>
              <p className="text-[18px] font-extrabold tracking-tight leading-snug">
                {formatRupiah(cartSummary.totalAmount)}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-white shrink-0">
              <span>{submitting ? 'Memproses...' : 'Lihat Pesanan'}</span>
              <span aria-hidden="true">→</span>
            </span>
          </button>
        </div>

        <nav
          aria-label="Navigasi Kasir"
          className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-zinc-100 px-10 py-2 flex items-center justify-around z-20"
        >
          <Link
            href="/kasir"
            className="flex flex-col items-center gap-1 text-[#C62828]"
          >
            <span className="px-4 py-1 rounded-full bg-[#FBE9E7] flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="text-[11px] font-bold">Pesanan</span>
          </Link>

          <Link
            href="/kasir/daftar"
            className="flex flex-col items-center gap-1 text-zinc-600 hover:text-[#C62828] transition-colors"
          >
            <span className="px-4 py-1 rounded-full flex items-center justify-center">
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
                <circle cx="4" cy="6" r="1.2" fill="currentColor" />
                <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                <circle cx="4" cy="18" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <span className="text-[11px] font-medium">Daftar</span>
          </Link>
        </nav>

        <MobileAdminDrawer
          open={drawerOpen}
          activeKey="dashboard-kasir"
          userRole={userRole}
          signingOut={signingOut}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}