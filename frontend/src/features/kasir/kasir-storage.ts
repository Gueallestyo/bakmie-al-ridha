import type { OrderType } from '@/features/kasir/input-pesanan-view'
import type { DaftarOrderItem, DaftarOrderStatus } from '@/features/kasir/daftar-pesanan-view'

export interface SavedKasirOrderRecord {
  nomor_pesanan: string
  jenis_pesanan: OrderType
  nomor_meja: string | null
  catatan_khusus: string | null
  total_harga: number
  status_pesanan: 'dibuat' | 'dibayar' | 'batal' | 'refund'
  metode_pembayaran?: 'tunai' | 'qris'
  uang_diterima?: number | null
  kembalian?: number
  alasan?: string
  persiapan_dimulai?: boolean
  kuota_dikembalikan?: boolean
  items: Array<{
    menu_id: string
    nama: string
    jumlah: number
    harga_satuan: number
    harga_topping: number
    subtotal: number
  }>
}

const ORDER_PREFIX = 'bakmie_order_'
const PAYMENT_PREFIX = 'bakmie_payment_'

export function saveOrderDraftToStorage(record: SavedKasirOrderRecord): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(
    `${ORDER_PREFIX}${record.nomor_pesanan}`,
    JSON.stringify(record),
  )
}

export function getOrderFromStorage(
  orderNumber: string,
): SavedKasirOrderRecord | null {
  if (typeof window === 'undefined') return null
  const cleanId = orderNumber.replace(/^No\.\s*/i, '').trim()
  const raw = window.sessionStorage.getItem(`${ORDER_PREFIX}${cleanId}`)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SavedKasirOrderRecord
  } catch {
    return null
  }
}

export function validatePaymentInStorage(params: {
  orderNumber: string
  method: 'tunai' | 'qris'
  cashReceived: number | null
  changeAmount: number
}): void {
  if (typeof window === 'undefined') return
  const cleanId = params.orderNumber.replace(/^No\.\s*/i, '').trim()

  window.sessionStorage.setItem(
    `${PAYMENT_PREFIX}${cleanId}`,
    JSON.stringify({
      nomor_pesanan: cleanId,
      metode_pembayaran: params.method,
      uang_diterima: params.cashReceived,
      kembalian: params.changeAmount,
      status_pesanan: 'dibayar',
      validated_at: new Date().toISOString(),
    }),
  )

  const existing = getOrderFromStorage(cleanId)
  if (existing) {
    saveOrderDraftToStorage({
      ...existing,
      status_pesanan: 'dibayar',
      metode_pembayaran: params.method,
      uang_diterima: params.cashReceived,
      kembalian: params.changeAmount,
    })
  }
}

export function updateOrderStatusInStorage(params: {
  orderNumber: string
  status: Extract<DaftarOrderStatus, 'Batal' | 'Refund'>
  alasan: string
  persiapanDimulai?: boolean
}): { kuotaDikembalikan: boolean } {
  const cleanId = params.orderNumber.replace(/^No\.\s*/i, '').trim()
  const kuotaDikembalikan =
    params.status === 'Refund' ? !Boolean(params.persiapanDimulai) : false

  if (typeof window !== 'undefined') {
    const existing = getOrderFromStorage(cleanId)
    if (existing) {
      saveOrderDraftToStorage({
        ...existing,
        status_pesanan: params.status === 'Refund' ? 'refund' : 'batal',
        alasan: params.alasan,
        persiapan_dimulai:
          params.status === 'Refund' ? Boolean(params.persiapanDimulai) : undefined,
        kuota_dikembalikan:
          params.status === 'Refund' ? kuotaDikembalikan : undefined,
      })
    }
  }

  return { kuotaDikembalikan }
}

export function mergeStoredOrders(
  baseOrders: DaftarOrderItem[],
): DaftarOrderItem[] {
  if (typeof window === 'undefined') return baseOrders
  const merged = [...baseOrders]

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i)
    if (!key || !key.startsWith(ORDER_PREFIX)) continue

    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as SavedKasirOrderRecord
      const nomor = parsed.nomor_pesanan?.trim()
      if (!nomor) continue

      const statusLabel: DaftarOrderStatus =
        parsed.status_pesanan === 'dibayar'
          ? 'Dibayar'
          : parsed.status_pesanan === 'batal'
            ? 'Batal'
            : parsed.status_pesanan === 'refund'
              ? 'Refund'
              : 'Belum Dibayar'

      const mapped: DaftarOrderItem = {
        nomorPesanan: nomor,
        jenisPesanan: parsed.jenis_pesanan,
        nomorMeja: parsed.nomor_meja,
        metodePembayaran:
          parsed.metode_pembayaran === 'qris'
            ? 'QRIS'
            : parsed.metode_pembayaran === 'tunai'
              ? 'Tunai'
              : undefined,
        totalHarga: Number(parsed.total_harga ?? 0),
        status: statusLabel,
        alasan: parsed.alasan,
        persiapanDimulai: parsed.persiapan_dimulai,
      }

      const idx = merged.findIndex((item) => item.nomorPesanan === nomor)
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...mapped }
      } else {
        merged.unshift(mapped)
      }
    } catch {
      // Abaikan data tidak valid
    }
  }

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i)
    if (!key || !key.startsWith(PAYMENT_PREFIX)) continue

    try {
      const raw = window.sessionStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as {
        nomor_pesanan?: string
        metode_pembayaran?: 'tunai' | 'qris'
      }
      const nomor = parsed.nomor_pesanan?.trim()
      if (!nomor) continue

      const idx = merged.findIndex((item) => item.nomorPesanan === nomor)
      if (idx >= 0 && merged[idx].status === 'Belum Dibayar') {
        merged[idx] = {
          ...merged[idx],
          status: 'Dibayar',
          metodePembayaran: parsed.metode_pembayaran === 'qris' ? 'QRIS' : 'Tunai',
        }
      }
    } catch {
      // Abaikan data tidak valid
    }
  }

  return merged
}