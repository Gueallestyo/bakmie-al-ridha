'use client'

import { useEffect, useState } from 'react'
import { signOut } from '@/features/auth/auth-actions'
import { listMenu, toggleMenuStatus, deleteMenu } from '@/features/menu/menu-actions'

export interface Menu {
  id_menu: string
  id_kategori: string
  nama_menu: string
  harga: number
  kuota_default: number
  ambang_default: number
  status_aktif: boolean
  kategori?: { nama_kategori: string }
}

interface FormMode {
  type: 'create' | 'edit'
  data?: Menu
}

export default function AdminMenuPage() {
  const [menuList, setMenuList] = useState<Menu[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<{ id_kategori: string; nama_kategori: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadMenu()
    loadKategori()
  }, [])

  async function loadMenu() {
    setLoading(true)
    setError(null)
    const { menu, error: err } = await listMenu()
    if (err) {
      setError(err)
    } else {
      setMenuList(menu)
    }
    setLoading(false)
  }

  async function loadKategori() {
    const res = await fetch('/api/admin/kategori', {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return
    const result = await res.json()
    setKategoriOptions(result.kategori ?? [])
  }

  async function handleCreate(formData: FormData) {
    setFormError(null)
    const id_kategori = formData.get('id_kategori') as string
    const nama_menu = formData.get('nama_menu') as string
    const harga = Number(formData.get('harga'))
    const kuota_default = Number(formData.get('kuota_default'))
    const ambang_default = Number(formData.get('ambang_default'))
    const status_aktif = formData.get('status_aktif') === 'true'

    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_kategori,
        nama_menu: nama_menu.trim(),
        harga,
        kuota_default,
        ambang_default,
        status_aktif,
      }),
    })
    const result = await res.json()
    if (!res.ok) {
      setFormError(result.error || 'Gagal menambahkan menu.')
      return
    }
    setFormMode(null)
    loadMenu()
  }

  async function handleUpdate(id_menu: string, formData: FormData) {
    setFormError(null)
    const id_kategori = formData.get('id_kategori') as string
    const nama_menu = formData.get('nama_menu') as string
    const harga = Number(formData.get('harga'))
    const kuota_default = Number(formData.get('kuota_default'))
    const ambang_default = Number(formData.get('ambang_default'))
    const status_aktif = formData.get('status_aktif') === 'true'

    const res = await fetch('/api/admin/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_menu,
        id_kategori,
        nama_menu: nama_menu.trim(),
        harga,
        kuota_default,
        ambang_default,
        status_aktif,
      }),
    })
    const result = await res.json()
    if (!res.ok) {
      setFormError(result.error || 'Gagal memperbarui menu.')
      return
    }
    setFormMode(null)
    loadMenu()
  }

  async function handleToggleStatus(menu: Menu) {
    if (saving.has(menu.id_menu)) return
    setSaving((prev) => new Set([...prev, menu.id_menu]))

    const { success, error: err } = await toggleMenuStatus(
      menu.id_menu,
      !menu.status_aktif,
    )

    setSaving((prev) => {
      const next = new Set(prev)
      next.delete(menu.id_menu)
      return next
    })

    if (!success) {
      setError(err ?? 'Gagal mengubah status menu.')
      return
    }
    loadMenu()
  }

  async function handleDelete(menu: Menu) {
    if (!window.confirm(`Yakin ingin menghapus menu "${menu.nama_menu}"?`)) {
      return
    }
    if (saving.has(menu.id_menu)) return
    setSaving((prev) => new Set([...prev, menu.id_menu]))

    const { success, error: err } = await deleteMenu(menu.id_menu)

    setSaving((prev) => {
      const next = new Set(prev)
      next.delete(menu.id_menu)
      return next
    })

    if (!success) {
      setError(err ?? 'Gagal menghapus menu.')
      return
    }
    loadMenu()
  }

  function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-zinc-600">Memuat data menu…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Kelola Menu</h1>
            <p className="text-zinc-600">
              Atur menu makanan Bakmie Al-Ridha. Pastikan ambang default tidak
              melebihi kuota default.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFormMode({ type: 'create' })}
              className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 font-medium transition-colors"
            >
              + Tambah Menu
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {formMode && (
          <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                if (formMode.type === 'create') {
                  handleCreate(formData)
                } else {
                  handleUpdate(formMode.data!.id_menu, formData)
                }
              }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {formMode.type === 'create' ? 'Tambah Menu' : 'Ubah Menu'}
              </h3>

              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Kategori
                </label>
                <select
                  name="id_kategori"
                  defaultValue={formMode.data?.id_kategori ?? ''}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
                >
                  {kategoriOptions.map((k) => (
                    <option key={k.id_kategori} value={k.id_kategori}>
                      {k.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Nama Menu
                </label>
                <input
                  name="nama_menu"
                  defaultValue={formMode.data?.nama_menu ?? ''}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
                  placeholder="Contoh: Bakmie Ayam Special"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Harga (Rp)
                </label>
                <input
                  name="harga"
                  type="number"
                  min="0"
                  defaultValue={formMode.data?.harga ?? ''}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
                  placeholder="Contoh: 15000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Kuota Default (porsi)
                  </label>
                  <input
                    name="kuota_default"
                    type="number"
                    min="0"
                    defaultValue={formMode.data?.kuota_default ?? ''}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
                    placeholder="Contoh: 50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Ambang Default (peringatan)
                  </label>
                  <input
                    name="ambang_default"
                    type="number"
                    min="0"
                    defaultValue={formMode.data?.ambang_default ?? ''}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
                    placeholder="Contoh: 10"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Tidak boleh melebihi kuota default
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  name="status_aktif"
                  type="checkbox"
                  defaultChecked={formMode.data?.status_aktif ?? true}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-zinc-300"
                />
                <label className="text-sm text-zinc-700">Aktif</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode(null)}
                  className="px-4 py-3 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-300 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-200">
                <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
                  Nama Menu
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
                  Kategori
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-zinc-600 text-right">
                  Harga
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-zinc-600 text-right">
                  Kuota / Ambang
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-zinc-600">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-zinc-600 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {menuList.map((menu) => (
                <tr key={menu.id_menu}>
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    {menu.nama_menu}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {menu.kategori?.nama_kategori ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 text-right font-medium">
                    {formatRupiah(menu.harga)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700 text-right">
                    {menu.kuota_default} / {menu.ambang_default}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        menu.status_aktif
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {menu.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setFormMode({ type: 'edit', data: menu })}
                        disabled={saving.has(menu.id_menu)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => handleToggleStatus(menu)}
                        disabled={saving.has(menu.id_menu)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                          menu.status_aktif
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {menu.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDelete(menu)}
                        disabled={saving.has(menu.id_menu)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menuList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 text-sm">
                    Tidak ada data menu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
