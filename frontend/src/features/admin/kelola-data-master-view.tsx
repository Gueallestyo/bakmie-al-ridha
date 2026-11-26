'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
import {
  daftarKategori,
  daftarMenu,
  daftarTopping,
  daftarKuotaHarian,
  buatKategori,
  ubahKategori,
  hapusKategori,
  buatMenu,
  ubahMenu,
  hapusMenu,
  buatTopping,
  ubahTopping,
  hapusTopping,
  tambahPorsiMenu,
  kurangiPorsiMenu,
} from '@/lib/api/admin'
import MobileAdminDrawer from '@/components/layout/mobile-admin-drawer'

export type MasterCategoryTab = 'menu' | 'kategori' | 'topping' | 'akun'

export interface MasterDataRow {
  id: string
  tab: MasterCategoryTab
  nama: string
  subjudul: string
  aktif: boolean
  iconKind: 'noodle' | 'drink' | 'category' | 'topping' | 'user'
  harga?: number
  kategori?: string
}

function getJakartaToday(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  })
}

function formatRupiah(nominal: number): string {
  return `Rp${nominal.toLocaleString('id-ID')}`
}

function MasterRowIcon({ kind }: { kind: MasterDataRow['iconKind'] }) {
  if (kind === 'noodle') {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FDECE4] flex items-center justify-center shrink-0">
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="12" fill="#FFF8E7" stroke="#B71C1C" strokeWidth="2.2" />
          <path d="M10 17C13 15 16 19 19 17C22 15 24 18 26 17" stroke="#E6A100" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M11 21C14 20 17 23 21 21C23 20 24.5 21.5 25.5 21" stroke="#E6A100" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="14.5" cy="16.5" r="2.6" fill="#795548" />
          <circle cx="21.5" cy="18.5" r="2.4" fill="#6D4C41" />
          <circle cx="18.5" cy="14" r="1.4" fill="#2E7D32" />
          <circle cx="16" cy="21" r="1.2" fill="#2E7D32" />
        </svg>
      </div>
    )
  }

  if (kind === 'drink') {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#E6F1F8] flex items-center justify-center shrink-0">
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
          <rect x="11" y="10" width="13" height="18" rx="3" fill="#F5A623" />
          <rect x="11" y="10" width="13" height="4" rx="1.5" fill="#F8C471" />
          <rect x="14" y="15" width="3.5" height="3.5" rx="0.8" fill="#FFF3D6" />
          <rect x="18.5" y="20" width="3.5" height="3.5" rx="0.8" fill="#FFF3D6" />
          <path d="M21 6L23.5 21" stroke="#C62828" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-[#FBE9E7] text-[#C62828] flex items-center justify-center shrink-0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'user' ? (
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </>
        ) : (
          <>
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="13" y2="14" />
          </>
        )}
      </svg>
    </div>
  )
}

const MASTER_TAB_META: Record<
  MasterCategoryTab,
  { label: string; searchPlaceholder: string; ctaText: string }
> = {
  menu: { label: 'Menu', searchPlaceholder: 'Cari menu...', ctaText: '+  Tambah Menu' },
  kategori: { label: 'Kategori', searchPlaceholder: 'Cari kategori...', ctaText: '+  Tambah Kategori' },
  topping: { label: 'Topping', searchPlaceholder: 'Cari topping...', ctaText: '+  Tambah Topping' },
  akun: { label: 'Akun', searchPlaceholder: 'Cari akun...', ctaText: '+  Tambah Akun' },
}

const MENU_PRESETS: Array<{
  nama_menu: string
  kategori_nama: string
  harga: number
  kuota_default: number
  ambang_default: number
  iconKind: 'noodle' | 'drink'
}> = [
  // Bakmie
  { nama_menu: 'Bakmie Biasa', kategori_nama: 'Mie', harga: 12000, kuota_default: 50, ambang_default: 10, iconKind: 'noodle' },
  { nama_menu: 'Bakmie Bakso', kategori_nama: 'Mie', harga: 15000, kuota_default: 50, ambang_default: 10, iconKind: 'noodle' },
  { nama_menu: 'Bakmie Pangsit', kategori_nama: 'Mie', harga: 15000, kuota_default: 50, ambang_default: 10, iconKind: 'noodle' },
  { nama_menu: 'Bakmie Komplit', kategori_nama: 'Mie', harga: 18000, kuota_default: 40, ambang_default: 8, iconKind: 'noodle' },
  { nama_menu: 'Bakmi 1/2 + Bakso', kategori_nama: 'Mie', harga: 14000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  { nama_menu: 'Bakmi 1/2 + Pangsit', kategori_nama: 'Mie', harga: 14000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  { nama_menu: 'Bakmi 1/2 + Komplit', kategori_nama: 'Mie', harga: 16000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  // Kwetiau
  { nama_menu: 'Kwetiau Biasa', kategori_nama: 'Mie', harga: 12000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  { nama_menu: 'Kwetiau Bakso', kategori_nama: 'Mie', harga: 15000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  { nama_menu: 'Kwetiau Pangsit', kategori_nama: 'Mie', harga: 15000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  { nama_menu: 'Kwetiau Komplit', kategori_nama: 'Mie', harga: 18000, kuota_default: 30, ambang_default: 6, iconKind: 'noodle' },
  { nama_menu: 'Kwetiau 1/2', kategori_nama: 'Mie', harga: 10000, kuota_default: 20, ambang_default: 4, iconKind: 'noodle' },
  // Minuman
  { nama_menu: 'Es Jeruk', kategori_nama: 'Minuman', harga: 5000, kuota_default: 40, ambang_default: 8, iconKind: 'drink' },
  { nama_menu: 'Es Teh Manis', kategori_nama: 'Minuman', harga: 4000, kuota_default: 50, ambang_default: 10, iconKind: 'drink' },
  { nama_menu: 'Es Teh Tawar', kategori_nama: 'Minuman', harga: 3000, kuota_default: 40, ambang_default: 8, iconKind: 'drink' },
  { nama_menu: 'Es Tawar', kategori_nama: 'Minuman', harga: 2000, kuota_default: 40, ambang_default: 8, iconKind: 'drink' },
  { nama_menu: 'Es Batu', kategori_nama: 'Minuman', harga: 1000, kuota_default: 50, ambang_default: 10, iconKind: 'drink' },
  { nama_menu: 'Teh Manis Hangat', kategori_nama: 'Minuman', harga: 3000, kuota_default: 30, ambang_default: 6, iconKind: 'drink' },
  { nama_menu: 'Teh Tawar Hangat', kategori_nama: 'Minuman', harga: 2000, kuota_default: 30, ambang_default: 6, iconKind: 'drink' },
]

export default function KelolaDataMasterView() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<MasterCategoryTab>('menu')
  const [searchText, setSearchText] = useState('')
  const [rows, setRows] = useState<MasterDataRow[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<{ id_kategori: string; nama_kategori: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<MasterDataRow | null>(null)

  // Form state - Create / Edit
  const [namaInput, setNamaInput] = useState('')
  const [kategoriInput, setKategoriInput] = useState('')
  const [hargaInput, setHargaInput] = useState('')
  const [catatanInput, setCatatanInput] = useState('')
  const [aktifInput, setAktifInput] = useState(true)

  // Form state - Preset selection
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customNamaMenu, setCustomNamaMenu] = useState('')
  const [tambahPorsiInput, setTambahPorsiInput] = useState('')

  // Form state - Edit menu (porsi adjustment)
  const [editTambahPorsi, setEditTambahPorsi] = useState('')
  const [editKurangiPorsi, setEditKurangiPorsi] = useState('')
  const [editKuotaData, setEditKuotaData] = useState<{
    sisa_porsi: number
    kuota_awal: number
    ambang_peringatan: number
  } | null>(null)

  const tabMeta = MASTER_TAB_META[activeTab]
  const isMenuTab = activeTab === 'menu'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'kategori') {
        const data = await daftarKategori()
        setRows(
          data.map((k) => ({
            id: k.id_kategori,
            tab: 'kategori' as MasterCategoryTab,
            nama: k.nama_kategori,
            subjudul: k.status_aktif ? 'Kategori aktif' : 'Kategori nonaktif',
            aktif: k.status_aktif,
            iconKind: 'category',
          }))
        )
      } else if (activeTab === 'menu') {
        const [menuData, kategoriData] = await Promise.all([
          daftarMenu(),
          daftarKategori(),
        ])
        setKategoriOptions(
          kategoriData.map((k) => ({
            id_kategori: k.id_kategori,
            nama_kategori: k.nama_kategori,
          }))
        )
        setRows(
          menuData.map((m) => ({
            id: m.id_menu,
            tab: 'menu' as MasterCategoryTab,
            nama: m.nama_menu,
            subjudul: `${m.kategori?.nama_kategori ?? '-'} - ${formatRupiah(m.harga)}`,
            aktif: m.status_aktif,
            iconKind: m.kategori?.nama_kategori?.toLowerCase() === 'minuman' ? 'drink' : 'noodle',
            harga: m.harga,
            kategori: m.kategori?.nama_kategori,
          }))
        )
      } else if (activeTab === 'topping') {
        const data = await daftarTopping()
        setRows(
          data.map((t) => ({
            id: t.id_topping,
            tab: 'topping' as MasterCategoryTab,
            nama: t.nama_topping,
            subjudul: `Topping - ${formatRupiah(t.harga_topping)}`,
            aktif: t.status_aktif,
            iconKind: 'topping',
            harga: t.harga_topping,
          }))
        )
      } else {
        setRows([])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const visibleRows = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return rows.filter((row) => {
      if (row.tab !== activeTab) return false
      if (!query) return true
      return row.nama.toLowerCase().includes(query) || row.subjudul.toLowerCase().includes(query)
    })
  }, [rows, activeTab, searchText])

  async function ensureKategoriIdByName(kategoriNama: string): Promise<string> {
    const existing = kategoriOptions.find(
      (k) => k.nama_kategori.toLowerCase().trim() === kategoriNama.toLowerCase().trim()
    )
    if (existing) return existing.id_kategori

    await buatKategori({ nama_kategori: kategoriNama, status_aktif: true })
    const freshKategori = await daftarKategori()
    setKategoriOptions(
      freshKategori.map((k) => ({
        id_kategori: k.id_kategori,
        nama_kategori: k.nama_kategori,
      }))
    )
    const created = freshKategori.find(
      (k) => k.nama_kategori.toLowerCase().trim() === kategoriNama.toLowerCase().trim()
    )
    return created?.id_kategori || (freshKategori[0]?.id_kategori ?? '')
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setError(null)

    if (activeTab === 'menu' && !editingRow) {
      let namaMenu = customNamaMenu.trim() || namaInput.trim()
      let kategoriId = kategoriInput
      const nominal = Number(hargaInput) || 0
      const kuotaDefault = Number(tambahPorsiInput) || 0
      const preset = selectedPreset
        ? MENU_PRESETS.find((p) => p.nama_menu === selectedPreset)
        : undefined
      const ambangDefault = preset
        ? Math.min(preset.ambang_default, kuotaDefault)
        : Math.ceil(kuotaDefault / 2)

      setSaving(true)
      try {
        if (preset) {
          namaMenu = customNamaMenu.trim() || preset.nama_menu
          if (!kategoriId) {
            kategoriId = await ensureKategoriIdByName(preset.kategori_nama)
          }
        } else if (!namaMenu) {
          setError('Nama menu wajib diisi.')
          return
        }

        if (!kategoriId) {
          setError('Kategori wajib dipilih.')
          return
        }
        if (nominal <= 0) {
          setError('Harga wajib diisi dan harus lebih dari 0.')
          return
        }
        if (kuotaDefault < 0) {
          setError('Jumlah porsi tidak boleh negatif.')
          return
        }
        if (ambangDefault > kuotaDefault) {
          setError('Ambang peringatan tidak boleh melebihi kuota default.')
          return
        }

        await buatMenu({
          id_kategori: kategoriId,
          nama_menu: namaMenu,
          harga: nominal,
          kuota_default: kuotaDefault,
          ambang_default: ambangDefault,
          status_aktif: aktifInput,
        })

        setFormOpen(false)
        setEditingRow(null)
        setNamaInput('')
        setKategoriInput('')
        setHargaInput('')
        setCatatanInput('')
        setAktifInput(true)
        setSelectedPreset(null)
        setCustomNamaMenu('')
        setTambahPorsiInput('')
        await loadData()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan menu.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (editingRow && activeTab === 'menu') {
      const tambahPorsi = Number(editTambahPorsi) || 0
      const kurangiPorsi = Number(editKurangiPorsi) || 0

      if (editKuotaData && kurangiPorsi > editKuotaData.sisa_porsi) {
        setError(`Pengurangan porsi tidak boleh melebihi sisa porsi (${editKuotaData.sisa_porsi}).`)
        return
      }

      setSaving(true)
      try {
        await ubahMenu({
          id_menu: editingRow.id,
          status_aktif: aktifInput,
        })

        if (tambahPorsi > 0) {
          await tambahPorsiMenu({
            id_menu: editingRow.id,
            jumlahPorsi: tambahPorsi,
          })
        }

        if (kurangiPorsi > 0) {
          await kurangiPorsiMenu({
            id_menu: editingRow.id,
            jumlahPorsi: kurangiPorsi,
          })
        }

        setFormOpen(false)
        setEditingRow(null)
        setAktifInput(true)
        setEditTambahPorsi('')
        setEditKurangiPorsi('')
        setEditKuotaData(null)
        await loadData()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memperbarui menu.')
      } finally {
        setSaving(false)
      }
      return
    }

    if (!namaInput.trim()) {
      setError('Nama wajib diisi.')
      return
    }

    const nominal = Number(hargaInput) || 0

    setSaving(true)
    try {
      if (activeTab === 'kategori') {
        if (editingRow) {
          await ubahKategori({
            id_kategori: editingRow.id,
            nama_kategori: namaInput.trim(),
            status_aktif: aktifInput,
          })
        } else {
          await buatKategori({ nama_kategori: namaInput.trim(), status_aktif: aktifInput })
        }
      } else if (activeTab === 'topping') {
        if (editingRow) {
          await ubahTopping({
            id_topping: editingRow.id,
            nama_topping: namaInput.trim(),
            harga_topping: nominal,
            status_aktif: aktifInput,
          })
        } else {
          await buatTopping({
            nama_topping: namaInput.trim(),
            harga_topping: nominal,
            status_aktif: aktifInput,
          })
        }
      }

      setFormOpen(false)
      setEditingRow(null)
      setNamaInput('')
      setKategoriInput('')
      setHargaInput('15000')
      setCatatanInput('')
      setAktifInput(true)
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: MasterDataRow) {
    if (!window.confirm(`Yakin ingin menghapus "${row.nama}"?`)) return

    try {
      if (activeTab === 'kategori') {
        await hapusKategori(row.id)
      } else if (activeTab === 'menu') {
        await hapusMenu(row.id)
      } else if (activeTab === 'topping') {
        await hapusTopping(row.id)
      }
      await loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data.')
    }
  }

  async function handleLogout() {
    setSigningOut(true)
    await signOut()
    router.replace('/auth/login')
  }

  function handleOpenCreate() {
    setError(null)
    setEditingRow(null)
    setNamaInput('')
    setKategoriInput(kategoriOptions.length > 0 ? kategoriOptions[0].id_kategori : '')
    setHargaInput(activeTab === 'topping' ? '4000' : '15000')
    setCatatanInput('')
    setAktifInput(true)
    setSelectedPreset(null)
    setCustomNamaMenu('')
    setTambahPorsiInput('')
    setEditTambahPorsi('')
    setEditKurangiPorsi('')
    setEditKuotaData(null)
    setFormOpen(true)
  }

  async function handleOpenEdit(row: MasterDataRow) {
    setError(null)
    if (activeTab === 'menu') {
      setEditingRow(row)
      setAktifInput(row.aktif)
      setEditTambahPorsi('')
      setEditKurangiPorsi('')
      setEditKuotaData(null)
      try {
        const today = getJakartaToday()
        const kuotaData = await daftarKuotaHarian()
        const found = kuotaData.find((k) => k.id_menu === row.id && k.tanggal === today)
        if (found) {
          setEditKuotaData({
            sisa_porsi: found.sisa_porsi,
            kuota_awal: found.kuota_awal,
            ambang_peringatan: found.ambang_peringatan,
          })
        }
      } catch {
        setEditKuotaData(null)
      }
    } else {
      setEditingRow(row)
      setNamaInput(row.nama)
      setKategoriInput(row.kategori ?? 'Mie')
      setHargaInput(row.harga ? String(row.harga) : '15000')
      setCatatanInput(row.subjudul)
      setAktifInput(row.aktif)
    }
    setFormOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
        <p className="text-zinc-600">Memuat data...</p>
      </div>
    )
  }

  const sisaPorsi = editKuotaData?.sisa_porsi
  const kuotaAwal = editKuotaData?.kuota_awal
  const ambangPeringatan = editKuotaData?.ambang_peringatan ?? 0
  const statusKuotaText =
    sisaPorsi === undefined
      ? ''
      : sisaPorsi === 0
        ? 'Sold Out'
        : sisaPorsi <= ambangPeringatan
          ? 'Hampir habis'
          : 'Aman'

  return (
    <div className="min-h-screen bg-[#F9F7F6] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col relative pb-36">
        <MobileAdminDrawer
          open={drawerOpen}
          activeKey="kelola-data"
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
          signingOut={signingOut}
        />

        <header className="sticky top-0 z-20 bg-white px-4 h-14 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu navigasi"
              className="p-1.5 -ml-1.5 rounded-lg text-[#B82025] hover:bg-red-50 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="font-bold text-[17px] tracking-tight text-[#B82025]">Bakmie Al Ridha</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Profil Admin"
            className="w-9 h-9 rounded-full bg-[#2C3E4C] flex items-center justify-center overflow-hidden ring-2 ring-red-100"
          >
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="11" r="5" fill="#F3C6A5" />
              <path d="M11 10.5C11 7.8 13.2 6 16 6C18.8 6 21 10.5C20.2 9.2 18.5 8.6 16 8.6C13.5 8.6 11.8 9.2 11 10.5Z" fill="#1F2933" />
              <path d="M7 27C7 22.4 10.8 19.5 16 19.5C21.2 19.5 25 27" fill="#1E293B" />
              <path d="M14.5 19.5L16 24L17.5 19.5H14.5Z" fill="#FFFFFF" />
            </svg>
          </button>
        </header>

        <section className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] px-5 pt-5 pb-7 rounded-b-[28px] text-white shadow-sm">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight">Kelola Data</h1>
          <p className="text-[13px] text-red-100/90 mt-0.5 font-normal">Admin/Owner</p>
        </section>

        <main className="px-4 pt-5 space-y-3.5 flex-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {(Object.keys(MASTER_TAB_META) as MasterCategoryTab[]).map((tabKey) => {
              const isSelected = activeTab === tabKey
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => {
                    setActiveTab(tabKey)
                    setSearchText('')
                  }}
                  className={`px-4 py-2 rounded-full text-[13px] transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#C62828] text-white font-bold shadow-xs'
                      : 'bg-white text-[#7A6A68] font-medium border border-[#EAD7D5] hover:border-red-300'
                  }`}
                >
                  {MASTER_TAB_META[tabKey].label}
                </button>
              )
            })}
          </div>

          <div>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={tabMeta.searchPlaceholder}
              className="w-full h-11 px-4 rounded-2xl border border-[#EAD7D5] bg-white text-[13.5px] text-zinc-900 placeholder:text-[#A39290] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          <div className="space-y-3 pt-0.5">
            {visibleRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#EAD7D5] p-6 text-center text-xs text-zinc-500">
                Tidak ada data yang cocok dengan &quot;{searchText}&quot;.
              </div>
            ) : (
              visibleRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-[#F3E2DF] bg-white px-3.5 py-3 flex items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MasterRowIcon kind={row.iconKind} />
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-bold text-zinc-900 truncate">{row.nama}</p>
                      <p className="text-[12px] text-[#7A6A68] mt-0.5 truncate">{row.subjudul}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        row.aktif ? 'bg-[#E6F4EA] text-[#1E7E34]' : 'bg-[#EFECEB] text-[#6E6564]'
                      }`}
                    >
                      {row.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleOpenEdit(row)}
                      aria-label={`Edit ${row.nama}`}
                      className="w-8 h-8 rounded-full bg-[#FBE9E7] text-[#C62828] flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    {activeTab !== 'akun' && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        aria-label={`Hapus ${row.nama}`}
                        className="w-8 h-8 rounded-full bg-[#FBE9E7] text-[#C62828] flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <div className="fixed bottom-16 w-full max-w-[430px] px-4 pb-3 pt-2 bg-gradient-to-t from-white via-white to-white/80 z-20">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1418] text-white text-[14.5px] font-bold shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            {tabMeta.ctaText}
          </button>
        </div>

        <nav
          aria-label="Navigasi Utama Admin"
          className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-zinc-100 px-6 py-2 flex items-center justify-between z-20"
        >
          <Link href="/admin" className="flex flex-col items-center gap-1 text-zinc-600 hover:text-[#C62828] transition-colors">
            <span className="px-4 py-1 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="5" rx="1.5" />
                <rect x="13" y="10" width="8" height="11" rx="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" />
              </svg>
            </span>
            <span className="text-[11px] font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/kelola-data" className="flex flex-col items-center gap-1 text-[#C62828]">
            <span className="px-4 py-1 rounded-full bg-[#FBE9E7] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </span>
            <span className="text-[11px] font-bold">Kelola Data</span>
          </Link>
          <Link href="/admin/menu" className="flex flex-col items-center gap-1 text-zinc-600 hover:text-[#C62828] transition-colors">
            <span className="px-4 py-1 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
            <form
              onSubmit={(e) => void handleSubmitForm(e)}
              className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-3xl sm:rounded-3xl z-10 border-b border-zinc-100">
                <h2 className="text-base font-bold text-zinc-900">
                  {editingRow && isMenuTab
                    ? `Edit ${editingRow.nama}`
                    : editingRow
                      ? `Edit ${tabMeta.label}`
                      : `Tambah ${tabMeta.label}`}
                </h2>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 px-2.5 py-1 rounded-lg bg-zinc-100"
                >
                  Batal
                </button>
              </div>

              {error && (
                <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm z-10">
                  {error}
                </div>
              )}

              <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-white">
                {activeTab === 'menu' && editingRow ? (
                  <div className="space-y-3">
                    <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-700">Nama Menu</span>
                        <span className="text-xs text-zinc-500">{editingRow.nama}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-700">Kategori</span>
                        <span className="text-xs text-zinc-500">{editingRow.kategori ?? '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-700">Harga</span>
                        <span className="text-xs text-zinc-500">
                          {editingRow.harga ? formatRupiah(editingRow.harga) : '-'}
                        </span>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-zinc-200">
                        <label className="block text-xs font-semibold text-zinc-700">Sisa Porsi Hari Ini</label>
                        <div className="flex items-center gap-2">
                          <span className={`text-[14px] font-bold ${sisaPorsi === 0 ? 'text-red-600' : 'text-zinc-900'}`}>
                            {sisaPorsi ?? '-'} / {kuotaAwal ?? '-'}
                          </span>
                          {statusKuotaText && (
                            <span
                              className={`text-[10px] font-semibold ${
                                sisaPorsi === 0
                                  ? 'text-red-500'
                                  : (sisaPorsi ?? 0) <= ambangPeringatan
                                    ? 'text-orange-500'
                                    : 'text-green-600'
                              }`}
                            >
                              {statusKuotaText}
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center justify-between pt-1 cursor-pointer">
                        <span className="text-xs font-semibold text-zinc-700">Status Aktif</span>
                        <input
                          type="checkbox"
                          checked={aktifInput}
                          onChange={(e) => setAktifInput(e.target.checked)}
                          className="w-4 h-4 accent-[#C62828]"
                        />
                      </label>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-700">Tambah Porsi</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editTambahPorsi}
                          onChange={(e) => setEditTambahPorsi(e.target.value)}
                          placeholder="0"
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:border-[#C62828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-700">Kurangi Porsi</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={editKurangiPorsi}
                          onChange={(e) => setEditKurangiPorsi(e.target.value)}
                          placeholder="0"
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:border-[#C62828]"
                        />
                        <p className="text-[10px] text-zinc-500">Maksimal {sisaPorsi ?? 0} porsi</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTab === 'menu' ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Pilih Menu Preset</label>
                          <select
                            value={selectedPreset ?? ''}
                            onChange={(e) => {
                              const nextPreset = e.target.value || null
                              setSelectedPreset(nextPreset)
                              const preset = MENU_PRESETS.find((p) => p.nama_menu === nextPreset)
                              if (preset) {
                                setCustomNamaMenu(preset.nama_menu)
                                setNamaInput(preset.nama_menu)
                                setHargaInput(String(preset.harga))
                                setTambahPorsiInput(String(preset.kuota_default))
                                void ensureKategoriIdByName(preset.kategori_nama).then((resolvedId) => {
                                  setKategoriInput(resolvedId)
                                })
                              } else {
                                setCustomNamaMenu('')
                                setNamaInput('')
                                setHargaInput('')
                                setTambahPorsiInput('')
                                setKategoriInput(kategoriOptions.length > 0 ? kategoriOptions[0].id_kategori : '')
                              }
                            }}
                            className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:border-[#C62828]"
                          >
                            <option value="">-- Pilih preset menu --</option>
                            {MENU_PRESETS.map((p) => (
                              <option key={p.nama_menu} value={p.nama_menu}>
                                {p.nama_menu}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Menu (custom)</label>
                          <input
                            type="text"
                            value={customNamaMenu}
                            onChange={(e) => {
                              setCustomNamaMenu(e.target.value)
                              setNamaInput(e.target.value)
                              setSelectedPreset(null)
                            }}
                            placeholder="Ketik menu sendiri..."
                            className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">Kosongkan jika menggunakan preset di atas.</p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Kategori</label>
                          <select
                            value={kategoriInput}
                            onChange={(e) => setKategoriInput(e.target.value)}
                            className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:border-[#C62828]"
                          >
                            <option value="">-- Pilih kategori --</option>
                            {kategoriOptions.map((k) => (
                              <option key={k.id_kategori} value={k.id_kategori}>
                                {k.nama_kategori}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga (Rp)</label>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            value={hargaInput}
                            onChange={(e) => setHargaInput(e.target.value)}
                            placeholder="0"
                            className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Jumlah Porsi Awal</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={tambahPorsiInput}
                            onChange={(e) => setTambahPorsiInput(e.target.value)}
                            placeholder="0"
                            className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">Disimpan ke kuota_default dan kuota harian hari ini.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama {tabMeta.label}</label>
                          <input
                            type="text"
                            required
                            value={namaInput}
                            onChange={(e) => setNamaInput(e.target.value)}
                            placeholder={`Masukkan nama ${tabMeta.label.toLowerCase()}`}
                            className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                          />
                        </div>
                        {activeTab === 'topping' && (
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga (Rp)</label>
                            <input
                              type="number"
                              min={0}
                              step={500}
                              required
                              value={hargaInput}
                              onChange={(e) => setHargaInput(e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                            />
                          </div>
                        )}
                        {(activeTab === 'kategori' || activeTab === 'akun') && (
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                              {activeTab === 'akun' ? 'Role & Username' : 'Keterangan'}
                            </label>
                            <input
                              type="text"
                              value={catatanInput}
                              onChange={(e) => setCatatanInput(e.target.value)}
                              placeholder={activeTab === 'akun' ? 'Contoh: Kasir @kasir2' : 'Deskripsi singkat kategori'}
                              className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!(activeTab === 'menu' && editingRow) && (
                  <label className="flex items-center justify-between pt-1 cursor-pointer">
                    <span className="text-xs font-semibold text-zinc-700">Status Aktif</span>
                    <input
                      type="checkbox"
                      checked={aktifInput}
                      onChange={(e) => setAktifInput(e.target.checked)}
                      className="w-4 h-4 accent-[#C62828]"
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-full bg-gradient-to-r from-[#D32F2F] to-[#8E1418] text-white text-sm font-bold shadow-sm hover:opacity-95 disabled:opacity-60 transition-opacity"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}