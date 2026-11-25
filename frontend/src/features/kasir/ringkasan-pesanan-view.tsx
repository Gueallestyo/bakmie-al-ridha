'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import { buatPesanan } from '@/lib/api/kasir'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'
import type { OrderType } from '@/features/kasir/input-pesanan-view'

export interface RingkasanItemInput {
  menuId: string
  nama: string
  hargaSatuan: number
  toppingNama?: string
  hargaTopping?: number
  jumlah: number
  iconKind: 'noodle' | 'drink'
}

interface RingkasanPesananViewProps {
  orderNumber?: string
  orderType?: OrderType
  tableNumber?: string | null
  items?: RingkasanItemInput[]
  rawItemsParam?: string
  userRole?: 'admin' | 'kasir'
  onBackToInput?: () => void
  onSavedOrder?: (savedOrderId: string) => void
}

const MENU_CATALOG_LOOKUP: Record<
  string,
  Omit<RingkasanItemInput, 'menuId' | 'jumlah'>
> = {
  'm-1': {
    nama: 'Bakmie Ayam',
    hargaSatuan: 15000,
    toppingNama: 'Bakso',
    hargaTopping: 3000,
    iconKind: 'noodle',
  },
  'm-2': {
    nama: 'Bakmie Ayam Bakso',
    hargaSatuan: 18000,
    iconKind: 'noodle',
  },
  'm-3': {
    nama: 'Bakmie Pangsit',
    hargaSatuan: 17000,
    iconKind: 'noodle',
  },
  'm-4': {
    nama: 'Es Teh Manis',
    hargaSatuan: 5000,
    iconKind: 'drink',
  },
}

function parseItemsFromQuery(
  rawItemsParam?: string,
): RingkasanItemInput[] {
  if (!rawItemsParam) return []

  try {
    const parsed = JSON.parse(rawItemsParam) as Array<{
      menuId?: string
      qty?: number
      jumlah?: number
    }>
    if (!Array.isArray(parsed) || parsed.length === 0) return []

    const mapped: RingkasanItemInput[] = []
    for (const entry of parsed) {
      const qty = Number(entry.qty ?? entry.jumlah ?? 0)
      if (!entry.menuId || qty <= 0) continue

      const catalog = MENU_CATALOG_LOOKUP[entry.menuId]
      if (catalog) {
        mapped.push({
          menuId: entry.menuId,
          jumlah: qty,
          ...catalog,
        })
      } else {
        mapped.push({
          menuId: entry.menuId,
          nama: `Menu ${entry.menuId}`,
          hargaSatuan: 15000,
          jumlah: qty,
          iconKind: 'noodle',
        })
      }
    }

    return mapped
  } catch {
    return []
  }
}

function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`
}

function ItemThumbnail({ kind }: { kind: RingkasanItemInput['iconKind'] }) {
  if (kind === 'drink') {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#E4F0F7] flex items-center justify-center shrink-0">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
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
    <div className="w-12 h-12 rounded-2xl bg-[#FDECE4] flex items-center justify-center shrink-0">
      <svg width="34" height="34" viewBox="0 0 68 68" fill="none">
        <circle
          cx="34"
          cy="34"
          r="22"
          fill="#FFF8E7"
          stroke="#C62828"
          strokeWidth="3.5"
        />
        <path
          d="M19 32C24 28 30 36 36 32C42 28 46 34 50 32"
          stroke="#E6A100"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M21 40C27 38 32 44 39 40C43 38 46 41 49 40"
          stroke="#E6A100"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="27.5" cy="31" r="4.5" fill="#795548" />
        <circle cx="40.5" cy="35" r="4.2" fill="#6D4C41" />
        <circle cx="35" cy="26" r="2.4" fill="#2E7D32" />
        <circle cx="30" cy="39.5" r="2.2" fill="#2E7D32" />
      </svg>
    </div>
  )
}

export default function RingkasanPesananView({
  orderNumber,
  orderType = 'dine_in',
  tableNumber,
  items,
  rawItemsParam,
  userRole = 'admin',
  onBackToInput,
  onSavedOrder,
}: RingkasanPesananViewProps) {
  const router = useRouter()
  const [catatanKhusus, setCatatanKhusus] = useState('')
  const [savingOrder, setSavingOrder] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const resolvedItems = useMemo(() => {
    if (items && items.length > 0) return items
    return parseItemsFromQuery(rawItemsParam)
  }, [items, rawItemsParam])

  const computedRows = useMemo(() => {
    return resolvedItems.map((item) => {
      const toppingPrice = item.hargaTopping ?? 0
      const unitWithTopping = item.hargaSatuan + toppingPrice
      const subtotal = unitWithTopping * item.jumlah
      const formulaText = item.toppingNama
        ? `(${formatRupiah(item.hargaSatuan)} + ${item.toppingNama} ${formatRupiah(
            toppingPrice,
          )}) × ${item.jumlah}`
        : `${formatRupiah(item.hargaSatuan)} × ${item.jumlah}`

      return {
        ...item,
        subtotal,
        formulaText,
      }
    })
  }, [resolvedItems])

  const totalPesanan = useMemo(() => {
    return computedRows.reduce((sum, row) => sum + row.subtotal, 0)
  }, [computedRows])

  const hasOrderedItems = computedRows.length > 0 && totalPesanan > 0

  function handleBack() {
    if (onBackToInput) {
      onBackToInput()
      return
    }
    router.push('/kasir')
  }

  async function handleSimpanPesanan() {
    if (!hasOrderedItems) {
      setFeedbackMessage(
        'Pilih minimal satu menu terlebih dahulu sebelum menyimpan pesanan.',
      )
      return
    }
    if (savingOrder) return

    setSavingOrder(true)
    setFeedbackMessage(null)

    const cleanOrderId =
      orderNumber?.replace(/^No\.\s*/i, '').trim() ||
      `P-${Date.now().toString().slice(-6)}`

    const itemsPayload = computedRows.map((row) => ({
      id_menu: row.menuId,
      jumlah: row.jumlah,
      harga_satuan: row.hargaSatuan,
      catatan_khusus: null,
      subtotal: row.subtotal,
      detail_topping: [],
    }))

    try {
      const result = await buatPesanan({
        jenis_pesanan: orderType,
        nomor_meja:
          orderType === 'dine_in' && tableNumber
            ? tableNumber.trim()
            : null,
        items: itemsPayload,
        catatan_khusus: catatanKhusus.trim() || null,
        total_harga: totalPesanan,
      })

      const savedNomor = result.pesanan?.nomor_pesanan || cleanOrderId

      if (onSavedOrder) {
        onSavedOrder(savedNomor)
        setSavingOrder(false)
        return
      }

      const params = new URLSearchParams({
        nomor: savedNomor,
        total: String(totalPesanan),
        jenis: orderType,
        ...(orderType === 'dine_in' && tableNumber
          ? { meja: tableNumber.trim() }
          : {}),
      })

      router.push(`/kasir/pembayaran?${params.toString()}`)
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Gagal menyimpan pesanan.')
      setSavingOrder(false)
    }
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
              onClick={handleBack}
              aria-label="Kembali ke input pesanan"
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
                Ringkasan Pesanan
              </h1>
              <p className="text-[12.5px] text-red-100/90 mt-0.5 font-normal">
                {orderNumber}
              </p>
            </div>
          </div>
        </section>

        {/* Konten Utama Ringkasan Pesanan */}
        <main className="px-4 pt-5 space-y-4 flex-1">
          {/* Kartu Daftar Item */}
          {computedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EAD7D5] bg-white p-6 text-center text-xs text-zinc-500">
              Belum ada menu yang dipilih. Silakan kembali untuk memilih menu.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#F3E2DF] bg-white px-4 py-2 divide-y divide-[#F6ECEA] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              {computedRows.map((row, index) => (
                <div
                  key={`${row.menuId}-${index}`}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ItemThumbnail kind={row.iconKind} />
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-bold text-zinc-900 truncate">
                        {row.nama} ×{row.jumlah}
                      </p>
                      <p className="text-[11.5px] text-[#7A6A68] mt-0.5 truncate">
                        {row.formulaText}
                      </p>
                    </div>
                  </div>

                  <p className="text-[14.5px] font-extrabold text-zinc-900 shrink-0 tabular-nums">
                    {formatRupiah(row.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Input Catatan Khusus */}
          <div>
            <label
              htmlFor="catatan-khusus"
              className="block text-[12px] font-medium text-[#7A6A68] mb-1.5"
            >
              Catatan khusus
            </label>
            <input
              id="catatan-khusus"
              type="text"
              value={catatanKhusus}
              onChange={(e) => setCatatanKhusus(e.target.value)}
              placeholder="Contoh: Tanpa seledri, kuah dipisah"
              style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
              className="w-full h-12 px-4 rounded-2xl border border-[#EAD7D5] bg-white text-[14px] font-semibold text-black placeholder:text-[#7A6A68] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          {/* Kotak Total Tagihan */}
          <div className="rounded-2xl bg-[#FBECEB] px-4 py-4 flex items-center justify-between gap-3">
            <span className="text-[13.5px] font-medium text-[#6E6564]">
              Total
            </span>
            <span className="text-[22px] font-extrabold text-[#C62828] tracking-tight tabular-nums">
              {formatRupiah(totalPesanan)}
            </span>
          </div>

          {/* Catatan Status Awal & Kuota */}
          <p className="text-[11.5px] text-[#7A6A68] leading-relaxed">
            Status awal: Belum Dibayar. Kuota belum berkurang sampai pembayaran
            divalidasi.
          </p>

          {feedbackMessage && (
            <p className="text-[12px] font-semibold text-[#C62828]">
              {feedbackMessage}
            </p>
          )}

          {/* Tombol Aksi Simpan Pesanan & Ubah Pesanan */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleSimpanPesanan}
              disabled={savingOrder || !hasOrderedItems}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] text-white text-[14.5px] font-bold shadow-md hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center"
            >
              {savingOrder ? 'Menyimpan...' : 'Simpan Pesanan'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full h-12 rounded-full border-[1.5px] border-[#C62828] bg-white text-[#C62828] text-[14px] font-bold hover:bg-red-50/60 transition-colors flex items-center justify-center"
            >
              Ubah Pesanan
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
