'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'
import type { OrderType } from '@/features/kasir/input-pesanan-view'

export type DaftarOrderStatus = 'Belum Dibayar' | 'Dibayar' | 'Batal' | 'Refund'

export interface DaftarOrderItem {
  nomorPesanan: string
  jenisPesanan: OrderType
  nomorMeja?: string | null
  metodePembayaran?: 'Tunai' | 'QRIS'
  totalHarga: number
  status: DaftarOrderStatus
  alasan?: string
  persiapanDimulai?: boolean
}

const INITIAL_ORDERS: DaftarOrderItem[] = [
  {
    nomorPesanan: 'A-0012',
    jenisPesanan: 'dine_in',
    nomorMeja: '5',
    totalHarga: 46000,
    status: 'Belum Dibayar',
    persiapanDimulai: false,
  },
  {
    nomorPesanan: 'A-0011',
    jenisPesanan: 'takeaway',
    metodePembayaran: 'Tunai',
    totalHarga: 18000,
    status: 'Dibayar',
    persiapanDimulai: false,
  },
  {
    nomorPesanan: 'A-0010',
    jenisPesanan: 'dine_in',
    nomorMeja: '2',
    totalHarga: 32000,
    status: 'Batal',
    alasan: 'Pelanggan membatalkan pesanan sebelum dibuat',
    persiapanDimulai: false,
  },
]

function buildInitialOrdersFromStorage(): DaftarOrderItem[] {
  const updatedOrders = [...INITIAL_ORDERS]
  if (typeof window === 'undefined') return updatedOrders

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i)
    if (!key || !key.startsWith('bakmie_order_')) continue

    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as {
        nomor_pesanan?: string
        jenis_pesanan?: OrderType
        nomor_meja?: string | null
        total_harga?: number
        status_pesanan?: string
      }

      const nomor = parsed.nomor_pesanan?.trim()
      if (!nomor) continue

      const existingIndex = updatedOrders.findIndex(
        (o) => o.nomorPesanan === nomor,
      )
      const mappedOrder: DaftarOrderItem = {
        nomorPesanan: nomor,
        jenisPesanan:
          parsed.jenis_pesanan === 'takeaway' ? 'takeaway' : 'dine_in',
        nomorMeja: parsed.nomor_meja ?? null,
        totalHarga: Number(parsed.total_harga ?? 0),
        status:
          parsed.status_pesanan === 'dibayar' ? 'Dibayar' : 'Belum Dibayar',
        persiapanDimulai: false,
      }

      if (existingIndex >= 0) {
        updatedOrders[existingIndex] = {
          ...updatedOrders[existingIndex],
          ...mappedOrder,
        }
      } else {
        updatedOrders.unshift(mappedOrder)
      }
    } catch {
      // Abaikan entri storage yang tidak valid
    }
  }

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i)
    if (!key || !key.startsWith('bakmie_payment_')) continue

    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as {
        nomor_pesanan?: string
        metode_pembayaran?: 'tunai' | 'qris'
      }

      const nomor = parsed.nomor_pesanan?.trim()
      if (!nomor) continue

      const idx = updatedOrders.findIndex((o) => o.nomorPesanan === nomor)
      if (idx >= 0) {
        updatedOrders[idx] = {
          ...updatedOrders[idx],
          status: 'Dibayar',
          metodePembayaran:
            parsed.metode_pembayaran === 'qris' ? 'QRIS' : 'Tunai',
        }
      }
    } catch {
      // Abaikan entri storage yang tidak valid
    }
  }

  return updatedOrders
}

function formatRupiah(amount: number): string {
  return `Rp${Math.max(0, Math.round(amount)).toLocaleString('id-ID')}`
}

function getOrderSubtitle(order: DaftarOrderItem): string {
  const base =
    order.jenisPesanan === 'dine_in'
      ? `Dine-in · Meja ${order.nomorMeja || '-'}`
      : 'Takeaway'

  if (order.status === 'Dibayar' && order.metodePembayaran) {
    return `${base} · ${order.metodePembayaran}`
  }

  return base
}

export default function DaftarPesananView({
  highlightedOrderNumber,
  userRole = 'admin',
}: {
  highlightedOrderNumber?: string
  userRole?: 'admin' | 'kasir'
}) {
  const router = useRouter()

  const [orders, setOrders] = useState<DaftarOrderItem[]>(() =>
    buildInitialOrdersFromStorage(),
  )
  const [activeFilter, setActiveFilter] = useState<
    'Semua' | 'Belum' | 'Dibayar' | 'Batal' | 'Refund'
  >('Semua')

  const [reasonText, setReasonText] = useState('')
  const [persiapanDimulai, setPersiapanDimulai] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter === 'Semua') return true
      if (activeFilter === 'Belum') return order.status === 'Belum Dibayar'
      if (activeFilter === 'Dibayar') return order.status === 'Dibayar'
      if (activeFilter === 'Batal') return order.status === 'Batal'
      if (activeFilter === 'Refund') return order.status === 'Refund'
      return true
    })
  }, [orders, activeFilter])

  function handlePayOrder(order: DaftarOrderItem) {
    const params = new URLSearchParams({
      nomor: order.nomorPesanan,
      total: String(order.totalHarga),
      jenis: order.jenisPesanan,
      ...(order.jenisPesanan === 'dine_in' && order.nomorMeja
        ? { meja: order.nomorMeja }
        : {}),
    })
    router.push(`/kasir/pembayaran?${params.toString()}`)
  }

  function handleCancelOrder(order: DaftarOrderItem) {
    const trimmedReason = reasonText.trim()
    if (!trimmedReason) {
      setErrorMessage(
        'Alasan pembatalan / refund wajib diisi terlebih dahulu.',
      )
      setInfoMessage(null)
      return
    }

    setErrorMessage(null)
    setOrders((prev) =>
      prev.map((item) =>
        item.nomorPesanan === order.nomorPesanan
          ? { ...item, status: 'Batal', alasan: trimmedReason }
          : item,
      ),
    )
    setReasonText('')
    setInfoMessage(
      `Pesanan ${order.nomorPesanan} dibatalkan (kuota tidak berubah).`,
    )
  }

  function handleRefundOrder(order: DaftarOrderItem) {
    const trimmedReason = reasonText.trim()
    if (!trimmedReason) {
      setErrorMessage(
        'Alasan pembatalan / refund wajib diisi terlebih dahulu.',
      )
      setInfoMessage(null)
      return
    }

    setErrorMessage(null)
    setOrders((prev) =>
      prev.map((item) =>
        item.nomorPesanan === order.nomorPesanan
          ? {
              ...item,
              status: 'Refund',
              alasan: trimmedReason,
              persiapanDimulai,
            }
          : item,
      ),
    )
    setReasonText('')
    setInfoMessage(
      persiapanDimulai
        ? `Refund pesanan ${order.nomorPesanan} dicatat (kuota tidak dikembalikan karena persiapan sudah dimulai).`
        : `Refund pesanan ${order.nomorPesanan} dicatat dan kuota porsi dikembalikan.`,
    )
  }

  async function handleLogout() {
    setSigningOut(true)
    await signOut()
    router.replace('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#F9F7F6] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col relative pb-28">
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
            aria-label="Profil Kasir"
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

        {/* Hero Merah Gradasi */}
        <section className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-5 pb-6 rounded-b-[28px] text-white shadow-sm">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">
            Daftar Pesanan
          </h1>
          <p className="text-[12.5px] text-red-100/90 mt-0.5 font-normal">
            Kasir{highlightedOrderNumber ? ` · #${highlightedOrderNumber}` : ''}
          </p>
        </section>

        {/* Konten Utama Daftar Pesanan */}
        <main className="px-4 pt-4 space-y-3.5 flex-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {(['Semua', 'Belum', 'Dibayar', 'Batal', 'Refund'] as const).map(
              (chip) => {
                const isSelected = activeFilter === chip
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setActiveFilter(chip)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-[#C62828] text-white font-bold shadow-xs'
                        : 'bg-white text-[#6E6564] font-medium border border-[#EAD7D5] hover:border-red-300'
                    }`}
                  >
                    {chip}
                  </button>
                )
              },
            )}
          </div>

          {/* Daftar Kartu Pesanan */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EAD7D5] p-6 text-center text-xs text-zinc-500">
              Tidak ada pesanan pada filter status ini.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const accentClass =
                  order.status === 'Belum Dibayar'
                    ? 'bg-[#C62828]'
                    : order.status === 'Dibayar'
                      ? 'bg-[#1D7A36]'
                      : order.status === 'Refund'
                        ? 'bg-[#D97706]'
                        : 'bg-[#A89F9E]'

                const badgeClass =
                  order.status === 'Belum Dibayar'
                    ? 'bg-[#FBE9E7] text-[#C62828]'
                    : order.status === 'Dibayar'
                      ? 'bg-[#E3F5E8] text-[#1D7A36]'
                      : order.status === 'Refund'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#EFECEB] text-[#7A7170]'

                const isHighlighted =
                  highlightedOrderNumber &&
                  order.nomorPesanan === highlightedOrderNumber

                return (
                  <div
                    key={order.nomorPesanan}
                    className={`relative overflow-hidden rounded-2xl border bg-white pl-5 pr-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                      isHighlighted ? 'border-[#C62828]' : 'border-[#F2E2DF]'
                    }`}
                  >
                    {/* Garis Aksen Status di Sisi Kiri */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentClass}`}
                    />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15.5px] font-extrabold text-zinc-900 leading-snug">
                          {order.nomorPesanan}
                        </p>
                        <p className="text-[12px] text-[#7A6A68] mt-0.5">
                          {getOrderSubtitle(order)}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${badgeClass}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <p className="text-[18px] font-extrabold text-[#C62828] mt-2 tracking-tight tabular-nums">
                      {formatRupiah(order.totalHarga)}
                    </p>

                    {order.alasan && (
                      <p className="text-[11px] text-[#7A6A68] mt-1.5">
                        Alasan: {order.alasan}
                      </p>
                    )}

                    {/* Tombol Aksi Sesuai Status */}
                    {order.status === 'Belum Dibayar' && (
                      <div className="grid grid-cols-2 gap-2.5 mt-3">
                        <button
                          type="button"
                          onClick={() => handlePayOrder(order)}
                          className="h-9 rounded-full bg-gradient-to-r from-[#D32F2F] to-[#9A171B] text-white text-[12.5px] font-bold hover:opacity-95 transition-opacity"
                        >
                          Bayar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          className="h-9 rounded-full border border-[#C62828] bg-white text-[#C62828] text-[12.5px] font-bold hover:bg-red-50 transition-colors"
                        >
                          Batalkan
                        </button>
                      </div>
                    )}

                    {order.status === 'Dibayar' && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleRefundOrder(order)}
                          className="w-full h-9 rounded-full border border-[#C62828] bg-white text-[#C62828] text-[12.5px] font-bold hover:bg-red-50 transition-colors"
                        >
                          Catat Refund
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Input Alasan Pembatalan / Refund */}
          <div className="pt-1 space-y-2">
            <label
              htmlFor="alasan-batal-refund"
              className="block text-[12px] font-medium text-[#7A6A68]"
            >
              Alasan pembatalan / refund
            </label>
            <input
              id="alasan-batal-refund"
              type="text"
              value={reasonText}
              onChange={(e) => {
                setReasonText(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="Wajib diisi"
              style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
              className="w-full h-12 px-4 rounded-2xl border border-[#EAD7D5] bg-white text-[13.5px] font-semibold text-black placeholder:text-[#7A6A68] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all"
            />

            <label className="flex items-center gap-2 text-[11.5px] text-[#6E6564] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={persiapanDimulai}
                onChange={(e) => setPersiapanDimulai(e.target.checked)}
                className="rounded border-[#EAD7D5] text-[#C62828] focus:ring-[#C62828]"
              />
              <span>Persiapan pesanan sudah dimulai di dapur</span>
            </label>

            <p className="text-[11.5px] text-[#7A6A68] leading-relaxed">
              Refund: kuota kembali hanya bila persiapan belum dimulai.
            </p>

            {errorMessage && (
              <p className="text-[12px] font-semibold text-[#C62828]">
                {errorMessage}
              </p>
            )}

            {infoMessage && (
              <p className="text-[12px] font-semibold text-[#1D7A36]">
                {infoMessage}
              </p>
            )}
          </div>
        </main>

        {/* Bottom Navigation Kasir (Pesanan & Daftar Aktif) */}
        <nav
          aria-label="Navigasi Kasir"
          className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-zinc-100 px-10 py-2 flex items-center justify-around z-20"
        >
          <Link
            href="/kasir"
            className="flex flex-col items-center gap-1 text-zinc-600 hover:text-[#C62828] transition-colors"
          >
            <span className="px-4 py-1 rounded-full flex items-center justify-center">
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
            <span className="text-[11px] font-medium">Pesanan</span>
          </Link>

          <Link
            href="/kasir/daftar"
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
                <circle cx="4" cy="6" r="1.2" fill="currentColor" />
                <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                <circle cx="4" cy="18" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <span className="text-[11px] font-bold">Daftar</span>
          </Link>
        </nav>

        <MobileAdminDrawer
          open={drawerOpen}
          activeKey="daftar-pesanan"
          userRole={userRole}
          signingOut={signingOut}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}