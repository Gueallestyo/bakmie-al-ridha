-- =========================================================
-- Migration: create_initial_schema
-- Project  : Aplikasi Kasir Digital Bakmie Al-Ridha
-- Tujuan   : Membuat 9 tabel operasional berdasarkan SDD.
-- Catatan  : Tabel pengguna dan FK ke pengguna dibuat pada
--            migration create_pengguna_auth_profile.
-- =========================================================

-- UUID generator gen_random_uuid() tersedia pada PostgreSQL
-- yang digunakan oleh Supabase.

-- =========================================================
-- 1. KATEGORI
-- =========================================================
CREATE TABLE public.kategori (
    id_kategori UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori VARCHAR(50) NOT NULL UNIQUE,
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- 2. MENU
-- =========================================================
CREATE TABLE public.menu (
    id_menu UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_kategori UUID NOT NULL
        REFERENCES public.kategori(id_kategori)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    nama_menu VARCHAR(100) NOT NULL,

    harga DECIMAL(12,2) NOT NULL
        CHECK (harga >= 0),

    kuota_default INTEGER NOT NULL
        CHECK (kuota_default >= 0),

    ambang_default INTEGER NOT NULL
        CHECK (
            ambang_default >= 0
            AND ambang_default <= kuota_default
        ),

    status_aktif BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- 3. TOPPING
-- =========================================================
CREATE TABLE public.topping (
    id_topping UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_topping VARCHAR(50) NOT NULL,
    harga_topping DECIMAL(12,2) NOT NULL
        CHECK (harga_topping >= 0),
    status_aktif BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================================================
-- 4. KUOTA HARIAN
-- =========================================================
CREATE TABLE public.kuota_harian (
    id_kuota UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_menu UUID NOT NULL
        REFERENCES public.menu(id_menu)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    tanggal DATE NOT NULL,

    kuota_awal INTEGER NOT NULL
        CHECK (kuota_awal >= 0),

    sisa_porsi INTEGER NOT NULL
        CHECK (
            sisa_porsi >= 0
            AND sisa_porsi <= kuota_awal
        ),

    ambang_peringatan INTEGER NOT NULL
        CHECK (
            ambang_peringatan >= 0
            AND ambang_peringatan <= kuota_awal
        ),

    -- NULL jika kuota menggunakan nilai default menu.
    diatur_oleh UUID NULL,

    CONSTRAINT uq_kuota_menu_tanggal
        UNIQUE (id_menu, tanggal)
);

-- =========================================================
-- 5. PESANAN
-- =========================================================
CREATE TABLE public.pesanan (
    id_pesanan UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nomor_pesanan VARCHAR(10) NOT NULL UNIQUE,

    jenis_pesanan VARCHAR(10) NOT NULL
        CHECK (jenis_pesanan IN ('dine_in', 'takeaway')),

    nomor_meja VARCHAR(10) NULL,

    total_harga DECIMAL(12,2) NOT NULL
        CHECK (total_harga >= 0),

    status_pesanan VARCHAR(20) NOT NULL DEFAULT 'dibuat'
        CHECK (
            status_pesanan IN ('dibuat', 'dibayar', 'batal', 'refund')
        ),

    -- FK ke public.pengguna ditambahkan pada migration kedua.
    id_kasir UUID NOT NULL,

    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_nomor_meja_pesanan
        CHECK (
            (jenis_pesanan = 'dine_in' AND nomor_meja IS NOT NULL)
            OR
            (jenis_pesanan = 'takeaway' AND nomor_meja IS NULL)
        )
);

-- =========================================================
-- 6. DETAIL PESANAN
-- =========================================================
CREATE TABLE public.detail_pesanan (
    id_detail UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_pesanan UUID NOT NULL
        REFERENCES public.pesanan(id_pesanan)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    id_menu UUID NOT NULL
        REFERENCES public.menu(id_menu)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    jumlah INTEGER NOT NULL
        CHECK (jumlah >= 1),

    -- Snapshot harga menu saat transaksi.
    harga_satuan DECIMAL(12,2) NOT NULL
        CHECK (harga_satuan >= 0),

    catatan_khusus VARCHAR(255) NULL,

    -- Subtotal mencakup harga menu dan topping.
    subtotal DECIMAL(12,2) NOT NULL
        CHECK (subtotal >= 0)
);

-- =========================================================
-- 7. DETAIL TOPPING
-- =========================================================
CREATE TABLE public.detail_topping (
    id_detail_topping UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_detail UUID NOT NULL
        REFERENCES public.detail_pesanan(id_detail)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    id_topping UUID NOT NULL
        REFERENCES public.topping(id_topping)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    -- Snapshot harga topping saat transaksi.
    harga DECIMAL(12,2) NOT NULL
        CHECK (harga >= 0),

);

-- =========================================================
-- 8. PEMBAYARAN
-- =========================================================
CREATE TABLE public.pembayaran (
    id_pembayaran UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_pesanan UUID NOT NULL UNIQUE
        REFERENCES public.pesanan(id_pesanan)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    metode_pembayaran VARCHAR(20) NOT NULL
        CHECK (metode_pembayaran IN ('tunai', 'qris')),

    -- Nilai pembayaran yang menutup total pesanan.
    jumlah_dibayar DECIMAL(12,2) NOT NULL
        CHECK (jumlah_dibayar >= 0),

    -- Diisi untuk tunai; NULL untuk QRIS.
    uang_diterima DECIMAL(12,2) NULL
        CHECK (uang_diterima IS NULL OR uang_diterima >= 0),

    -- Kembalian dihitung oleh backend, bukan dipercaya dari browser.
    kembalian DECIMAL(12,2) NOT NULL DEFAULT 0
        CHECK (kembalian >= 0),

    divalidasi_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- FK ke public.pengguna ditambahkan pada migration kedua.
    divalidasi_oleh UUID NOT NULL,

    CONSTRAINT ck_pembayaran_tunai_qris
        CHECK (
            (
                metode_pembayaran = 'tunai'
                AND uang_diterima IS NOT NULL
                AND uang_diterima >= jumlah_dibayar
                AND kembalian = uang_diterima - jumlah_dibayar
            )
            OR
            (
                metode_pembayaran = 'qris'
                AND uang_diterima IS NULL
                AND kembalian = 0
            )
        )
);

-- =========================================================
-- 9. RIWAYAT STATUS PESANAN
-- =========================================================
CREATE TABLE public.riwayat_status_pesanan (
    id_riwayat UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_pesanan UUID NOT NULL
        REFERENCES public.pesanan(id_pesanan)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    status_awal VARCHAR(20) NOT NULL
        CHECK (
            status_awal IN ('dibuat', 'dibayar', 'batal', 'refund')
        ),

    status_akhir VARCHAR(20) NOT NULL
        CHECK (
            status_akhir IN ('dibuat', 'dibayar', 'batal', 'refund')
        ),

    alasan VARCHAR(255) NULL,
    persiapan_dimulai BOOLEAN NULL,
    kuota_dikembalikan BOOLEAN NULL,

    -- FK ke public.pengguna ditambahkan pada migration kedua.
    id_pengguna UUID NOT NULL,

    waktu_perubahan TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_status_pesanan_berubah
        CHECK (status_awal <> status_akhir)
);

-- =========================================================
-- 10. INDEX
-- =========================================================
CREATE INDEX idx_menu_id_kategori
    ON public.menu(id_kategori);

CREATE INDEX idx_kuota_harian_tanggal
    ON public.kuota_harian(tanggal);

CREATE INDEX idx_kuota_harian_id_menu
    ON public.kuota_harian(id_menu);

CREATE INDEX idx_pesanan_id_kasir
    ON public.pesanan(id_kasir);

CREATE INDEX idx_pesanan_dibuat_pada
    ON public.pesanan(dibuat_pada);

CREATE INDEX idx_pesanan_status
    ON public.pesanan(status_pesanan);

CREATE INDEX idx_detail_pesanan_id_pesanan
    ON public.detail_pesanan(id_pesanan);

CREATE INDEX idx_detail_pesanan_id_menu
    ON public.detail_pesanan(id_menu);

CREATE INDEX idx_detail_topping_id_detail
    ON public.detail_topping(id_detail);

CREATE INDEX idx_detail_topping_id_topping
    ON public.detail_topping(id_topping);

CREATE INDEX idx_riwayat_status_id_pesanan
    ON public.riwayat_status_pesanan(id_pesanan);

-- =========================================================
-- SELESAI: 9 tabel operasional telah didefinisikan.
-- =========================================================
