'use client'

import { useEffect, useState } from 'react'
import { signOut } from '@/features/auth/auth-actions'
import { listKategori, toggleKategoriStatus, deleteKategori } from '@/features/kategori/kategori-actions'

export interface Kategori {
  id_kategori: string
  nama_kategori: string
  status_aktif: boolean
}

interface FormMode {
  type: 'create' | 'edit'
  data?: Kategori
}

export default function AdminKategoriPage() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    loadKategori()
  }, [])

  async function loadKategori() {
    setLoading(true)
    setError(null)
    const { kategori, error: err } = await listKategori()
    if (err) {
      setError(err)
    } else {
      setKategoriList(kategori)
    }
    setLoading(false)
  }

  async function handleCreate(nama_kategori: string, status_aktif: boolean) {
    setFormError(null)
    const res = await fetch('/api/admin/kategori', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_kategori: nama_kategori.trim(), status_aktif }),
    })
    const result = await res.json()
    if (!res.ok) {
      setFormError(result.error || 'Gagal menambahkan kategori.')
      return
    }
    setFormMode(null)
    loadKategori()
  }

  async function handleUpdate(id_kategori: string, nama_kategori: string, status_aktif: boolean) {
    setFormError(null)
    const res = await fetch('/api/admin/kategori', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_kategori, nama_kategori: nama_kategori.trim(), status_aktif }),
    })
    const result = await res.json()
    if (!res.ok) {
      setFormError(result.error || 'Gagal memperbarui kategori.')
      return
    }
    setFormMode(null)
    loadKategori()
  }

  async function handleToggleStatus(kategori: Kategori) {
    if (saving.has(kategori.id_kategori)) return
    setSaving((prev) => new Set([...prev, kategori.id_kategori]))

    const { success, error: err } = await toggleKategoriStatus(
      kategori.id_kategori,
      !kategori.status_aktif,
    )

    setSaving((prev) => {
      const next = new Set(prev)
      next.delete(kategori.id_kategori)
      return next
    })

    if (!success) {
      setError(err ?? 'Gagal mengubah status kategori.')
      return
    }
    loadKategori()
  }

  async function handleDelete(kategori: Kategori) {
    if (!window.confirm(`Yakin ingin menghapus kategori "${kategori.nama_kategori}"?`)) {
      return
    }
    if (saving.has(kategori.id_kategori)) return
    setSaving((prev) => new Set([...prev, kategori.id_kategori]))

    const { success, error: err } = await deleteKategori(kategori.id_kategori)

    setSaving((prev) => {
      const next = new Set(prev)
      next.delete(kategori.id_kategori)
      return next
    })

    if (!success) {
      setError(err ?? 'Gagal menghapus kategori.')
      return
    }
    loadKategori()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-zinc-600">Memuat data kategori…</p>
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
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Kelola Kategori</h1>
            <p className="text-zinc-600">
              Atur kategori menu Bakmie Al-Ridha. Nonaktifkan untuk menyembunyikan
              tanpa menghapus data permanen.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFormMode({ type: 'create' })}
              className="px-4 py-2 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 font-medium transition-colors"
            >
              + Tambah Kategori
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
                const nama_kategori = formData.get('nama_kategori') as string
                const status_aktif = formData.get('status_aktif') === 'true'

                if (formMode.type === 'create') {
                  handleCreate(nama_kategori, status_aktif)
                } else {
                  handleUpdate(formMode.data!.id_kategori, nama_kategori, status_aktif)
                }
              }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {formMode.type === 'create' ? 'Tambah Kategori' : 'Ubah Kategori'}
              </h3>

              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Nama Kategori
                </label>
                <input
                  name="nama_kategori"
                  defaultValue={formMode.data?.nama_kategori ?? ''}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-500 outline-none"
                  placeholder="Contoh: Bakmie, Minuman, Topping"
                />
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
                  Nama Kategori
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
              {kategoriList.map((kategori) => (
                <tr key={kategori.id_kategori}>
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    {kategori.nama_kategori}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        kategori.status_aktif
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-200 text-zinc-600'
                      }`}
                    >
                      {kategori.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() =>
                          setFormMode({ type: 'edit', data: kategori })
                        }
                        disabled={saving.has(kategori.id_kategori)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => handleToggleStatus(kategori)}
                        disabled={saving.has(kategori.id_kategori)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                          kategori.status_aktif
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {kategori.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDelete(kategori)}
                        disabled={saving.has(kategori.id_kategori)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {kategoriList.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-500 text-sm">
                    Tidak ada data kategori.
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
