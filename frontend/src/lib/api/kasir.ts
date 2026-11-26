import type { OrderType } from '@/features/kasir/input-pesanan-view'

interface PesananItemInput {
  id_menu: string
  jumlah: number
  harga_satuan?: number
  catatan_khusus?: string | null
  subtotal?: number
  detail_topping?: Array<{
    id_topping: string
    harga?: number
  }>
}

export async function buatPesanan(payload: {
  jenis_pesanan: OrderType
  nomor_meja?: string | null
  items: PesananItemInput[]
  catatan_khusus?: string | null
  total_harga: number
}) {
  const res = await fetch('/api/kasir/pesanan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Gagal membuat pesanan.')
  }
  return json
}

export async function daftarPesanan() {
  const res = await fetch('/api/kasir/pesanan', {
    headers: { 'Content-Type': 'application/json' },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Gagal memuat daftar pesanan.')
  }
  return json.pesanan ?? []
}

export async function validasiPembayaran(payload: {
  id_pesanan?: string
  nomor_pesanan?: string
  metode_pembayaran: 'tunai' | 'qris'
  uang_diterima?: number | null
  jumlah_dibayar: number
}) {
  const res = await fetch('/api/kasir/pembayaran', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Gagal memvalidasi pembayaran.')
  }
  return json
}

export async function batalkanAtauRefundPesanan(payload: {
  id_pesanan: string
  aksi: 'batal' | 'refund'
  alasan: string
  persiapan_dimulai?: boolean
}) {
  const res = await fetch('/api/kasir/pembatalan', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Gagal memproses pembatalan/refund.')
  }
  return json
}