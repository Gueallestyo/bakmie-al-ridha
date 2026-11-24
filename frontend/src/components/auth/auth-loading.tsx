'use client'

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-600">Memuat sesi…</p>
      </div>
    </div>
  )
}
