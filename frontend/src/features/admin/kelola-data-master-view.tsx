'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/auth-actions'
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

const DEFAULT_MASTER_ROWS: MasterDataRow[] = [
  {
    id: 'menu-1',
    tab: 'menu',
    nama: 'Bakmie Ayam',
    subjudul: 'Mie · Rp15.000',
    aktif: true,
    iconKind: 'noodle',
    harga: 15000,
    kategori: 'Mie',
  },
  {
    id: 'menu-2',
    tab: 'menu',
    nama: 'Bakmie Ayam Bakso',
    subjudul: 'Mie · Rp18.000',
    aktif: true,
    iconKind: 'noodle',
    harga: 18000,
    kategori: 'Mie',
  },
  {
    id: 'menu-3',
    tab: 'menu',
    nama: 'Bakmie Pangsit',
    subjudul: 'Mie · Rp17.000',
    aktif: true,
    iconKind: 'noodle',
    harga: 17000,
    kategori: 'Mie',
  },
  {
    id: 'menu-4',
    tab: 'menu',
    nama: 'Es Teh Manis',
    subjudul: 'Minuman · Rp5.000',
    aktif: true,
    iconKind: 'drink',
    harga: 5000,
    kategori: 'Minuman',
  },
  {
    id: 'menu-5',
    tab: 'menu',
    nama: 'Es Jeruk',
    subjudul: 'Minuman · Rp6.000',
    aktif: false,
    iconKind: 'drink',
    harga: 6000,
    kategori: 'Minuman',
  },
  {
    id: 'kat-1',
    tab: 'kategori',
    nama: 'Mie',
    subjudul: 'Hidangan utama bakmie',
    aktif: true,
    iconKind: 'category',
  },
  {
    id: 'kat-2',
    tab: 'kategori',
    nama: 'Minuman',
    subjudul: 'Aneka minuman dingin & hangat',
    aktif: true,
    iconKind: 'category',
  },
  {
    id: 'kat-3',
    tab: 'kategori',
    nama: 'Pelengkap',
    subjudul: 'Pangsit goreng & kerupuk',
    aktif: false,
    iconKind: 'category',
  },
  {
    id: 'top-1',
    tab: 'topping',
    nama: 'Bakso Sapi (2 pcs)',
    subjudul: 'Topping · Rp4.000',
    aktif: true,
    iconKind: 'topping',
    harga: 4000,
  },
  {
    id: 'top-2',
    tab: 'topping',
    nama: 'Pangsit Rebus (3 pcs)',
    subjudul: 'Topping · Rp4.000',
    aktif: true,
    iconKind: 'topping',
    harga: 4000,
  },
  {
    id: 'top-3',
    tab: 'topping',
    nama: 'Ceker Ayam Lunak',
    subjudul: 'Topping · Rp5.000',
    aktif: false,
    iconKind: 'topping',
    harga: 5000,
  },
  {
    id: 'usr-1',
    tab: 'akun',
    nama: 'Owner Al-Ridha',
    subjudul: 'Admin · @admin',
    aktif: true,
    iconKind: 'user',
  },
  {
    id: 'usr-2',
    tab: 'akun',
    nama: 'Kasir Shift Pagi',
    subjudul: 'Kasir · @kasir1',
    aktif: true,
    iconKind: 'user',
  },
]

const MASTER_TAB_META: Record<
  MasterCategoryTab,
  {
    label: string
    searchPlaceholder: string
    ctaText: string
  }
> = {
  menu: {
    label: 'Menu',
    searchPlaceholder: 'Cari menu...',
    ctaText: '+  Tambah Menu',
  },
  kategori: {
    label: 'Kategori',
    searchPlaceholder: 'Cari kategori...',
    ctaText: '+  Tambah Kategori',
  },
  topping: {
    label: 'Topping',
    searchPlaceholder: 'Cari topping...',
    ctaText: '+  Tambah Topping',
  },
  akun: {
    label: 'Akun',
    searchPlaceholder: 'Cari akun...',
    ctaText: '+  Tambah Akun',
  },
}

function formatRupiah(nominal: number): string {
  return `Rp${nominal.toLocaleString('id-ID')}`
}

function MasterRowIcon({ kind }: { kind: MasterDataRow['iconKind'] }) {
  if (kind === 'noodle') {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#FDECE4] flex items-center justify-center shrink-0">
        <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
          <circle
            cx="18"
            cy="18"
            r="12"
            fill="#FFF8E7"
            stroke="#B71C1C"
            strokeWidth="2.2"
          />
          <path
            d="M10 17C13 15 16 19 19 17C22 15 24 18 26 17"
            stroke="#E6A100"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M11 21C14 20 17 23 21 21C23 20 24.5 21.5 25.5 21"
            stroke="#E6A100"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
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
          <path
            d="M21 6L23.5 21"
            stroke="#C62828"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-[#FBE9E7] text-[#C62828] flex items-center justify-center shrink-0">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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

export default function KelolaDataMasterView() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<MasterCategoryTab>('menu')
  const [searchText, setSearchText] = useState('')
  const [rows, setRows] = useState<MasterDataRow[]>(DEFAULT_MASTER_ROWS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<MasterDataRow | null>(null)
  const [namaInput, setNamaInput] = useState('')
  const [kategoriInput, setKategoriInput] = useState('Mie')
  const [hargaInput, setHargaInput] = useState('15000')
  const [catatanInput, setCatatanInput] = useState('')
  const [aktifInput, setAktifInput] = useState(true)

  const tabMeta = MASTER_TAB_META[activeTab]

  const visibleRows = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return rows.filter((row) => {
      if (row.tab !== activeTab) return false
      if (!query) return true
      return (
        row.nama.toLowerCase().includes(query) ||
        row.subjudul.toLowerCase().includes(query)
      )
    })
  }, [rows, activeTab, searchText])

  function handleOpenCreate() {
    setEditingRow(null)
    setNamaInput('')
    setKategoriInput('Mie')
    setHargaInput(activeTab === 'topping' ? '4000' : '15000')
    setCatatanInput('')
    setAktifInput(true)
    setFormOpen(true)
  }

  function handleOpenEdit(row: MasterDataRow) {
    setEditingRow(row)
    setNamaInput(row.nama)
    setKategoriInput(row.kategori ?? 'Mie')
    setHargaInput(row.harga ? String(row.harga) : '15000')
    setCatatanInput(row.subjudul)
    setAktifInput(row.aktif)
    setFormOpen(true)
  }

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!namaInput.trim()) return

    const nominal = Number(hargaInput) || 0
    let subjudul = catatanInput.trim()
    let iconKind: MasterDataRow['iconKind'] = 'category'

    if (activeTab === 'menu') {
      subjudul = `${kategoriInput} · ${formatRupiah(nominal)}`
      iconKind = kategoriInput.toLowerCase() === 'minuman' ? 'drink' : 'noodle'
    } else if (activeTab === 'topping') {
      subjudul = `Topping · ${formatRupiah(nominal)}`
      iconKind = 'topping'
    } else if (activeTab === 'akun') {
      subjudul = subjudul || 'Kasir · @staf_baru'
      iconKind = 'user'
    } else {
      subjudul = subjudul || 'Kategori aktif'
      iconKind = 'category'
    }

    if (editingRow) {
      setRows((prev) =>
        prev.map((item) =>
          item.id === editingRow.id
            ? {
                ...item,
                nama: namaInput.trim(),
                subjudul,
                aktif: aktifInput,
                kategori: kategoriInput,
                harga: nominal,
                iconKind,
              }
            : item,
        ),
      )
    } else {
      const created: MasterDataRow = {
        id: `${activeTab}-${Date.now()}`,
        tab: activeTab,
        nama: namaInput.trim(),
        subjudul,
        aktif: aktifInput,
        kategori: kategoriInput,
        harga: nominal,
        iconKind,
      }
      setRows((prev) => [...prev, created])
    }

    setFormOpen(false)
  }

  async function handleLogout() {
    setSigningOut(true)
    await signOut()
    router.replace('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#F9F7F6] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col relative pb-36">
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
            Kelola Data
          </h1>
          <p className="text-[13px] text-red-100/90 mt-0.5 font-normal">
            Admin/Owner
          </p>
        </section>

        <main className="px-4 pt-5 space-y-3.5 flex-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {(Object.keys(MASTER_TAB_META) as MasterCategoryTab[]).map(
              (tabKey) => {
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
              },
            )}
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
                Tidak ada data yang cocok dengan “{searchText}”.
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
                      <p className="text-[14.5px] font-bold text-zinc-900 truncate">
                        {row.nama}
                      </p>
                      <p className="text-[12px] text-[#7A6A68] mt-0.5 truncate">
                        {row.subjudul}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        row.aktif
                          ? 'bg-[#E6F4EA] text-[#1E7E34]'
                          : 'bg-[#EFECEB] text-[#6E6564]'
                      }`}
                    >
                      {row.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(row)}
                      aria-label={`Edit ${row.nama}`}
                      className="w-8 h-8 rounded-full bg-[#FBE9E7] text-[#C62828] flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
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

          <Link
            href="/admin/kelola-data"
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
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </span>
            <span className="text-[11px] font-bold">Kelola Data</span>
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

        {formOpen && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
            <form
              onSubmit={handleSubmitForm}
              className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900">
                  {editingRow
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

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nama {tabMeta.label}
                  </label>
                  <input
                    type="text"
                    required
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    placeholder={`Masukkan nama ${tabMeta.label.toLowerCase()}`}
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                  />
                </div>

                {activeTab === 'menu' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={kategoriInput}
                      onChange={(e) => setKategoriInput(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:border-[#C62828]"
                    >
                      <option value="Mie">Mie</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Pelengkap">Pelengkap</option>
                    </select>
                  </div>
                )}

                {(activeTab === 'menu' || activeTab === 'topping') && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Harga (Rp)
                    </label>
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
                      placeholder={
                        activeTab === 'akun'
                          ? 'Contoh: Kasir · @kasir2'
                          : 'Deskripsi singkat kategori'
                      }
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#C62828]"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between pt-1 cursor-pointer">
                  <span className="text-xs font-semibold text-zinc-700">
                    Status Aktif
                  </span>
                  <input
                    type="checkbox"
                    checked={aktifInput}
                    onChange={(e) => setAktifInput(e.target.checked)}
                    className="w-4 h-4 accent-[#C62828]"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-full bg-gradient-to-r from-[#D32F2F] to-[#8E1418] text-white text-sm font-bold shadow-sm hover:opacity-95 transition-opacity"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        )}

        <MobileAdminDrawer
          open={drawerOpen}
          activeKey="kelola-data"
          signingOut={signingOut}
          onClose={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}