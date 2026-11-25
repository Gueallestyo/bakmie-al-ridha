export interface KategoriRow {
  id_kategori: string
  nama_kategori: string
  status_aktif: boolean
}

export interface MenuRow {
  id_menu: string
  id_kategori: string
  nama_menu: string
  harga: number
  kuota_default: number
  ambang_default: number
  status_aktif: boolean
  kategori?: { nama_kategori: string }
}

export interface ToppingRow {
  id_topping: string
  nama_topping: string
  harga_topping: number
  status_aktif: boolean
}

export interface KuotaHarianRow {
  id_kuota: string
  id_menu: string
  tanggal: string
  kuota_awal: number
  sisa_porsi: number
  ambang_peringatan: number
  diatur_oleh: string | null
  menu?: { nama_kategori?: string; nama_menu?: string }
}

export interface DashboardRingkasan {
  omzet: number
  transaksi: number
  porsi_terjual: number
  menu_terlaris: { nama: string; porsi: number }
  rekap_metode_pembayaran: { tunai: number; qris: number }
}

export interface Grafik7Hari {
  hari: string
  tanggal: string
  omzet: number
}

export interface DashboardData {
  ringkasan: DashboardRingkasan
  grafik_7_hari: Grafik7Hari[]
}

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Gagal memuat data.')
  }
  return json
}

export async function daftarKategori(): Promise<KategoriRow[]> {
  const json = await fetchApi('/api/admin/kategori')
  return json.kategori ?? []
}

export async function buatKategori(payload: {
  nama_kategori: string
  status_aktif?: boolean
}) {
  return fetchApi('/api/admin/kategori', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function ubahKategori(payload: {
  id_kategori: string
  nama_kategori?: string
  status_aktif?: boolean
}) {
  return fetchApi('/api/admin/kategori', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function hapusKategori(id_kategori: string) {
  return fetchApi(`/api/admin/kategori?id_kategori=${encodeURIComponent(id_kategori)}`, {
    method: 'DELETE',
  })
}

export async function daftarMenu(): Promise<MenuRow[]> {
  const json = await fetchApi('/api/admin/menu')
  return json.menu ?? []
}

export async function buatMenu(payload: {
  id_kategori: string
  nama_menu: string
  harga: number
  kuota_default: number
  ambang_default: number
  status_aktif?: boolean
}) {
  return fetchApi('/api/admin/menu', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function ubahMenu(payload: {
  id_menu: string
  id_kategori?: string
  nama_menu?: string
  harga?: number
  kuota_default?: number
  ambang_default?: number
  status_aktif?: boolean
}) {
  return fetchApi('/api/admin/menu', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function hapusMenu(id_menu: string) {
  return fetchApi(`/api/admin/menu?id_menu=${encodeURIComponent(id_menu)}`, {
    method: 'DELETE',
  })
}

export async function daftarTopping(): Promise<ToppingRow[]> {
  const json = await fetchApi('/api/admin/topping')
  return json.topping ?? []
}

export async function buatTopping(payload: {
  nama_topping: string
  harga_topping: number
  status_aktif?: boolean
}) {
  return fetchApi('/api/admin/topping', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function ubahTopping(payload: {
  id_topping: string
  nama_topping?: string
  harga_topping?: number
  status_aktif?: boolean
}) {
  return fetchApi('/api/admin/topping', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function hapusTopping(id_topping: string) {
  return fetchApi(`/api/admin/topping?id_topping=${encodeURIComponent(id_topping)}`, {
    method: 'DELETE',
  })
}

export async function daftarKuotaHarian(): Promise<KuotaHarianRow[]> {
  const json = await fetchApi('/api/admin/kuota')
  return json.kuota ?? []
}

export async function tambahPorsiMenu(payload: {
  id_menu: string
  jumlahPorsi: number
  diatur_oleh?: string
}) {
  const today = new Date().toISOString().split('T')[0]

  // Cari kuota_harian yang sudah ada untuk menu + tanggal ini
  const existing = await daftarKuotaHarian()
  const found = existing.find((k) => k.id_menu === payload.id_menu && k.tanggal === today)

  if (found) {
    // Update kuota_harian yang sudah ada
    return ubahKuotaHarian({
      id_kuota: found.id_kuota,
      kuota_awal: found.kuota_awal + payload.jumlahPorsi,
      sisa_porsi: found.sisa_porsi + payload.jumlahPorsi,
      ambang_peringatan: found.ambang_peringatan,
      diatur_oleh: payload.diatur_oleh,
    })
  }

  // Buat kuota_harian baru
  return buatKuotaHarian({
    id_menu: payload.id_menu,
    tanggal: today,
    kuota_awal: payload.jumlahPorsi,
    ambang_peringatan: Math.ceil(payload.jumlahPorsi / 2),
    diatur_oleh: payload.diatur_oleh,
  })
}

export async function kurangiPorsiMenu(payload: {
  id_menu: string
  jumlahPorsi: number
  diatur_oleh?: string
}) {
  const today = new Date().toISOString().split('T')[0]

  const existing = await daftarKuotaHarian()
  const found = existing.find((k) => k.id_menu === payload.id_menu && k.tanggal === today)

  if (!found) {
    throw new Error('Kuota harian untuk menu ini belum tersedia hari ini.')
  }

  if (found.sisa_porsi < payload.jumlahPorsi) {
    throw new Error(`Sisa porsi tidak mencukupi (tersedia: ${found.sisa_porsi}).`)
  }

  const newKuotaAwal = found.kuota_awal - payload.jumlahPorsi
  const newSisaPorsi = found.sisa_porsi - payload.jumlahPorsi

  return ubahKuotaHarian({
    id_kuota: found.id_kuota,
    kuota_awal: newKuotaAwal,
    sisa_porsi: newSisaPorsi,
    ambang_peringatan: found.ambang_peringatan,
    diatur_oleh: payload.diatur_oleh,
  })
}

export async function buatKuotaHarian(payload: {
  id_menu: string
  tanggal: string
  kuota_awal: number
  ambang_peringatan: number
  diatur_oleh?: string
}) {
  return fetchApi('/api/admin/kuota', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function ubahKuotaHarian(payload: {
  id_kuota: string
  kuota_awal?: number
  ambang_peringatan?: number
  sisa_porsi?: number
  diatur_oleh?: string
}) {
  return fetchApi('/api/admin/kuota', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function hapusKuotaHarian(id_kuota: string) {
  return fetchApi(`/api/admin/kuota?id_kuota=${encodeURIComponent(id_kuota)}`, {
    method: 'DELETE',
  })
}

export async function getDashboard(periode: 'hari_ini' | 'bulan_ini' = 'hari_ini'): Promise<DashboardData> {
  return fetchApi(`/api/admin/dashboard?periode=${periode}`)
}
