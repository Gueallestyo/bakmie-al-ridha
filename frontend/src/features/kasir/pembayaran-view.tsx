'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import { validasiPembayaran } from '@/lib/api/kasir'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'
import type { OrderType } from '@/features/kasir/input-pesanan-view'

export type PaymentMethod = 'tunai' | 'qris'

interface PembayaranViewProps {
  orderId?: string
  orderNumber?: string
  totalAmount?: number
  orderType?: OrderType
  tableNumber?: string | null
  initialStatus?: 'Belum Dibayar' | 'Dibayar'
  userRole?: 'admin' | 'kasir'
  onBack?: () => void
  onValidated?: (payload: {
    orderNumber: string
    method: PaymentMethod
    cashReceived: number | null
    changeAmount: number
  }) => void
}

function formatRupiah(amount: number): string {
  return `Rp${Math.max(0, Math.round(amount)).toLocaleString('id-ID')}`
}

function parseRupiahInput(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, '')
  return digitsOnly ? Number(digitsOnly) : 0
}

export default function PembayaranView({
  orderId = '',
  orderNumber = '',
  totalAmount = 0,
  orderType = 'dine_in',
  tableNumber,
  initialStatus = 'Belum Dibayar',
  userRole = 'admin',
  onBack,
  onValidated,
}: PembayaranViewProps) {
  const router = useRouter()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai')
  const [cashInput, setCashInput] = useState<string>(
    totalAmount > 0 ? formatRupiah(totalAmount) : formatRupiah(50000),
  )
  const [paymentStatus, setPaymentStatus] = useState<'Belum Dibayar' | 'Dibayar'>(
    initialStatus,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [qrisConfirmed, setQrisConfirmed] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setPaymentMethod('tunai')
    setPaymentStatus(initialStatus)
    setErrorMessage(null)
    setInfoMessage(null)
    setSubmitting(false)
    setQrisConfirmed(false)
    setCashInput(
      totalAmount > 0 ? formatRupiah(totalAmount) : formatRupiah(50000),
    )
  }, [orderId, orderNumber, totalAmount, initialStatus])

  const cashReceived = useMemo(() => parseRupiahInput(cashInput), [cashInput])

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'tunai') return 0
    return Math.max(0, cashReceived - (totalAmount || 0))
  }, [paymentMethod, cashReceived, totalAmount])

  const orderContextLabel =
    orderType === 'dine_in'
      ? `Dine-in · Meja ${tableNumber?.trim() || '-'}`
      : 'Takeaway'

  function handleCashChange(value: string) {
    setErrorMessage(null)
    const numeric = parseRupiahInput(value)
    setCashInput(numeric > 0 ? formatRupiah(numeric) : '')
  }

  function handleBackClick() {
    if (onBack) {
      onBack()
      return
    }
    router.back()
  }

  async function handleValidatePayment() {
    if (submitting) return
    if (paymentStatus === 'Dibayar') return

    const cleanOrderNumber = orderNumber.replace(/^No\.\s*/i, '').trim()
    const cleanOrderId = orderId.trim()

    if (!cleanOrderNumber && !cleanOrderId) {
      setErrorMessage('Data pesanan tidak lengkap.')
      return
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      setErrorMessage('Total tagihan tidak valid.')
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)

    if (paymentMethod === 'qris' && !qrisConfirmed) {
      setErrorMessage(
        'Konfirmasi terlebih dahulu bahwa dana QRIS sudah diterima.',
      )
      return
    }

    if (paymentMethod === 'tunai' && cashReceived < totalAmount) {
      setErrorMessage(
        `Uang diterima kurang dari total tagihan (${formatRupiah(totalAmount)}).`,
      )
      return
    }

    setSubmitting(true)

    const uangDiterima = paymentMethod === 'tunai' ? cashReceived : null
    const kembalian = paymentMethod === 'tunai' ? changeAmount : 0

    try {
      await validasiPembayaran({
        ...(cleanOrderId ? { id_pesanan: cleanOrderId } : {}),
        ...(cleanOrderNumber ? { nomor_pesanan: cleanOrderNumber } : {}),
        metode_pembayaran: paymentMethod,
        uang_diterima: uangDiterima,
        jumlah_dibayar: totalAmount,
      })

      setPaymentStatus('Dibayar')

      if (onValidated) {
        onValidated({
          orderNumber: cleanOrderNumber || cleanOrderId,
          method: paymentMethod,
          cashReceived: uangDiterima,
          changeAmount: kembalian,
        })
        return
      }

      setInfoMessage(
        `Pembayaran ${orderNumber || cleanOrderNumber} (${paymentMethod.toUpperCase()}) divalidasi.`,
      )
      router.push(
        `/kasir/daftar?nomor=${encodeURIComponent(cleanOrderNumber || cleanOrderId)}`,
      )
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memvalidasi pembayaran.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/auth/login')
    } finally {
      setSigningOut(false)
    }
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
                d="M11 10.5C11 7.8 13.2 6 16 6C18.8 6 21 10.5C20.2 9.2 18.5 8.6 16 8.6C13.5 8.6 11.8 9.2 11 10.5Z"
                fill="#1F2933"
              />
              <path
                d="M7 27C7 22.4 10.8 19.5 16 19.5C21.2 19.5 25 27"
                fill="#1E293B"
              />
              <path d="M14.5 19.5L16 24L17.5 19.5H14.5Z" fill="#FFFFFF" />
            </svg>
          </button>
        </header>

        {/* Hero Merah Gradasi dengan Tombol Kembali & Nomor Pesanan */}
        <section className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-5 pb-6 rounded-b-[28px] text-white shadow-sm">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleBackClick}
              aria-label="Kembali"
              className="mt-1 p-1 -ml-1 rounded-full text-white/95 hover:bg-white/15 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight">
                Pembayaran
              </h1>
              <p className="text-[12.5px] text-red-100/90 mt-0.5 font-normal">
                {orderNumber}
              </p>
            </div>
          </div>
        </section>

        {/* Konten Utama Pembayaran */}
        <main className="px-4 pt-4 space-y-4 flex-1">
          {/* Kartu Total Tagihan */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D32F2F] via-[#B71C1C] to-[#8B1317] p-5 text-white shadow-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10"
            />
            <div className="relative flex items-start justify-between gap-2">
              <span className="text-[12.5px] font-medium text-red-100/90">
                Total tagihan
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs ${
                  paymentStatus === 'Dibayar'
                    ? 'bg-[#E3F5E8] text-[#1D7A36]'
                    : 'bg-[#FFF3CC] text-[#8A5A00]'
                }`}
              >
                {paymentStatus}
              </span>
            </div>

            <p className="relative text-[32px] font-extrabold tracking-tight mt-2 leading-none tabular-nums">
              {formatRupiah(totalAmount || 0)}
            </p>

            <p className="relative text-[12px] text-red-100/85 mt-3 font-medium">
              {orderContextLabel}
            </p>
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div>
            <p className="text-[13px] font-bold text-zinc-900 mb-2.5">
              Metode pembayaran
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('tunai')
                  setErrorMessage(null)
                }}
                className={`rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'tunai'
                    ? 'border-[1.8px] border-[#C62828] bg-[#FFF8F7] shadow-xs'
                    : 'border border-[#EFE3E1] bg-white hover:border-red-200'
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-extrabold ${
                    paymentMethod === 'tunai'
                      ? 'bg-[#C62828] text-white'
                      : 'bg-[#F0ECEB] text-[#7A7170]'
                  }`}
                >
                  Rp
                </span>
                <span
                  className={`text-[13.5px] font-bold ${
                    paymentMethod === 'tunai'
                      ? 'text-[#C62828]'
                      : 'text-zinc-900'
                  }`}
                >
                  Tunai
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('qris')
                  setErrorMessage(null)
                }}
                className={`rounded-2xl py-4 px-3 flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-[1.8px] border-[#C62828] bg-[#FFF8F7] shadow-xs'
                    : 'border border-[#EFE3E1] bg-white hover:border-red-200'
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-extrabold ${
                    paymentMethod === 'qris'
                      ? 'bg-[#C62828] text-white'
                      : 'bg-[#F0ECEB] text-[#7A7170]'
                  }`}
                >
                  QR
                </span>
                <span
                  className={`text-[13.5px] font-bold ${
                    paymentMethod === 'qris' ? 'text-[#C62828]' : 'text-zinc-900'
                  }`}
                >
                  QRIS
                </span>
              </button>
            </div>
          </div>

          {/* Detail Pembayaran Tunai atau QRIS */}
          {paymentMethod === 'tunai' ? (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="uang-diterima"
                  className="block text-[12px] font-medium text-[#7A6A68] mb-1.5"
                >
                  Uang diterima
                </label>
                <input
                  id="uang-diterima"
                  type="text"
                  inputMode="numeric"
                  value={cashInput}
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="Rp0"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  className="w-full h-12 px-4 rounded-2xl border border-[#EAD7D5] bg-white text-[14.5px] font-semibold text-black placeholder:text-[#7A6A68] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all tabular-nums"
                />
              </div>

              <div className="rounded-2xl bg-[#E8F6EC] px-4 py-3.5 flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-[#2E7D32]">
                  Kembalian
                </span>
                <span className="text-[19px] font-extrabold text-[#1E7E34] tracking-tight tabular-nums">
                  {formatRupiah(changeAmount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#EAD7D5] bg-[#FFFCFC] p-4 space-y-1.5">
              <p className="text-[13px] font-bold text-zinc-900">
                Pembayaran QRIS Manual
              </p>
              <p className="text-[12px] text-[#7A6A68] leading-relaxed">
                Pastikan dana masuk sebesar{' '}
                <span className="font-bold text-zinc-900">
                  {formatRupiah(totalAmount || 0)}
                </span>{' '}
                telah diterima sebelum menekan Validasi Pembayaran.
              </p>
              <label className="flex items-center gap-2 text-[11.5px] text-[#6E6564] cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  checked={qrisConfirmed}
                  onChange={(e) => setQrisConfirmed(e.target.checked)}
                  className="rounded border-[#EAD7D5] text-[#C62828] focus:ring-[#C62828]"
                />
                <span>Saya telah menerima dana QRIS dari pelanggan</span>
              </label>
            </div>
          )}

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

          {/* Tombol Aksi Validasi Pembayaran & Kembali */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleValidatePayment}
              disabled={
                submitting ||
                (paymentMethod === 'qris' && !qrisConfirmed) ||
                paymentStatus === 'Dibayar'
              }
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] text-white text-[14.5px] font-bold shadow-md hover:opacity-95 disabled:opacity-60 transition-opacity flex items-center justify-center"
            >
              {submitting ? 'Memvalidasi...' : 'Validasi Pembayaran'}
            </button>

            <button
              type="button"
              onClick={handleBackClick}
              className="w-full h-12 rounded-full border-[1.5px] border-[#C62828] bg-white text-[#C62828] text-[14px] font-bold hover:bg-red-50/60 transition-colors flex items-center justify-center"
            >
              Kembali
            </button>
          </div>
        </main>

        {/* Bottom Navigation Kasir */}
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