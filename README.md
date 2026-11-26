# Bakmie Al-Ridha

Aplikasi Kasir Digital dengan Validasi Porsi Harian dan Laporan Penjualan (berbasis PWA _mobile-first_ untuk **Admin/Owner** dan **Kasir**).

## Ringkasan Fitur & Modul

- **Autentikasi & Hak Akses**: Login staf (`username` & `password`), verifikasi `bcrypt`, sesi/RBAC, serta pembatasan akses antara peran **Admin/Owner** dan **Kasir**.
- **Data Master**: Pengelolaan `kategori`, `menu`, `topping`, dan akun staf (`pengguna`) oleh **Admin/Owner**.
- **Kuota Porsi Harian**: Pengaturan kuota porsi dan ambang batas peringatan (`Aman`, `Hampir habis`, `Sold Out`) pada `kuota_harian` dan `menu`.
- **Pesanan**: Pembuatan pesanan `dine_in` (dengan nomor meja) atau `takeaway`, pemilihan menu, jumlah porsi, topping, catatan khusus, serta status awal `dibuat` (Belum Dibayar).
- **Pembayaran**: Pencatatan dan validasi pembayaran (`tunai` dengan hitung kembalian atau `qris` manual), pembaruan status ke `dibayar`, pengurangan `sisa_porsi`, dan pencatatan `riwayat_status_pesanan`.
- **Pembatalan & Refund**: Pembatalan pesanan (`batal`) atau pencatatan `refund` (pengembalian kuota hanya jika persiapan makanan belum dimulai), tercatat pada `riwayat_status_pesanan` dan dikecualikan dari omzet.
- **Dashboard & Laporan Penjualan**: Rekap omzet periode terpilih (hanya transaksi `dibayar`), rincian metode pembayaran (`tunai` / `qris`), porsi terjual, menu terlaris, dan grafik penjualan.

## Teknologi Utama

- **Frontend & API Route Handlers**: Next.js (App Router), React, TypeScript
- **Basis Data & Auth**: PostgreSQL melalui Supabase (`@supabase/supabase-js` / `@supabase/ssr`) & `bcrypt`
- **Pengujian**: Skrip pengujian basis data dan integrasi pada `tests/`

## Struktur Proyek

```text
BAKMIE-AL-RIDHA/
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   └── images/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Dashboard, Kelola Data, Menu, Kategori, Akun
│   │   │   ├── api/            # Route Handlers (/api/admin/* dan /api/kasir/*)
│   │   │   ├── auth/login/     # Halaman login
│   │   │   ├── kasir/          # Input Pesanan, Ringkasan, Pembayaran, Daftar
│   │   │   ├── layout.tsx
│   │   │   ├── manifest.ts
│   │   │   └── page.tsx
│   │   ├── components/         # Komponen auth, layout (header, sidebar, drawer), ui
│   │   ├── features/           # Fitur per modul (admin, auth, kasir, kategori, menu, toppings, users)
│   │   ├── hooks/
│   │   ├── lib/                # API client helpers, auth/RBAC, supabase clients, utils
│   │   └── types/
│   ├── .env.local.example      # Contoh variabel lingkungan (jangan commit .env.local)
│   ├── next.config.ts
│   └── package.json
├── supabase/
│   ├── migrations/             # Skema awal & migrasi tabel PostgreSQL
│   ├── config.toml
│   └── seed.sql                # Data awal / seeding
├── tests/
│   ├── database/
│   └── integration/
└── README.md