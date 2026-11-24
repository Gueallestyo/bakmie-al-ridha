-- =========================================================
-- Migration: create_pengguna_auth_profile
-- Project  : Aplikasi Kasir Digital Bakmie Al-Ridha
-- Tujuan   : Membuat profil staf, relasi FK, RLS, grants,
--            dan kebijakan akses Admin/Kasir.
--
-- Autentikasi email/password dikelola Supabase Auth.
-- Password TIDAK disimpan di public.pengguna.
-- Profil staf dibuat melalui backend tepercaya setelah
-- Admin API berhasil membuat akun Auth.
-- =========================================================

-- =========================================================
-- 1. TABEL PENGGUNA
-- =========================================================
CREATE TABLE public.pengguna (
    id_pengguna UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    username VARCHAR(50) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'Kasir'
        CHECK (role IN ('Admin', 'Kasir')),

    status_aktif BOOLEAN NOT NULL DEFAULT TRUE,
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pengguna IS
'Profil staf aplikasi. Kredensial email/password dikelola oleh Supabase Auth.';

COMMENT ON COLUMN public.pengguna.username IS
'Username profil staf; login aplikasi menggunakan email dan password Supabase Auth.';

-- =========================================================
-- 2. FOREIGN KEY KE PENGGUNA
-- =========================================================
ALTER TABLE public.kuota_harian
    ADD CONSTRAINT fk_kuota_harian_pengguna
    FOREIGN KEY (diatur_oleh)
    REFERENCES public.pengguna(id_pengguna)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE public.pesanan
    ADD CONSTRAINT fk_pesanan_kasir
    FOREIGN KEY (id_kasir)
    REFERENCES public.pengguna(id_pengguna)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE public.pembayaran
    ADD CONSTRAINT fk_pembayaran_validator
    FOREIGN KEY (divalidasi_oleh)
    REFERENCES public.pengguna(id_pengguna)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

ALTER TABLE public.riwayat_status_pesanan
    ADD CONSTRAINT fk_riwayat_pengguna
    FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna(id_pengguna)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

CREATE INDEX idx_kuota_harian_diatur_oleh
    ON public.kuota_harian(diatur_oleh);

CREATE INDEX idx_pembayaran_divalidasi_oleh
    ON public.pembayaran(divalidasi_oleh);

CREATE INDEX idx_riwayat_status_id_pengguna
    ON public.riwayat_status_pesanan(id_pengguna);

-- =========================================================
-- 3. FUNGSI PEMERIKSAAN ROLE UNTUK RLS
-- =========================================================
-- Schema private tidak diekspos sebagai schema API.
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Fungsi ini membaca role dari tabel public.pengguna,
-- bukan dari user_metadata yang dapat diubah oleh pengguna.
CREATE OR REPLACE FUNCTION private.is_active_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.pengguna AS p
        WHERE p.id_pengguna = (SELECT auth.uid())
          AND p.status_aktif = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.pengguna AS p
        WHERE p.id_pengguna = (SELECT auth.uid())
          AND p.status_aktif = TRUE
          AND p.role = 'Admin'
    );
$$;

REVOKE ALL ON FUNCTION private.is_active_staff()
    FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.is_admin()
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.is_active_staff()
    TO authenticated;

GRANT EXECUTE ON FUNCTION private.is_admin()
    TO authenticated;

-- =========================================================
-- 4. AKTIFKAN RLS PADA SEMUA 10 TABEL
-- =========================================================
ALTER TABLE public.pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kuota_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_pesanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_topping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_status_pesanan ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 5. GRANTS DATA API
-- =========================================================
-- Hak akses objek (GRANT) dan hak akses baris (RLS) adalah
-- dua lapisan berbeda. Tidak ada akses untuk anon.
REVOKE ALL ON TABLE
    public.pengguna,
    public.kategori,
    public.menu,
    public.topping,
    public.kuota_harian,
    public.pesanan,
    public.detail_pesanan,
    public.detail_topping,
    public.pembayaran,
    public.riwayat_status_pesanan
FROM anon, authenticated;

-- Profil: hanya SELECT langsung. Perubahan akun melalui
-- backend tepercaya menggunakan Supabase Auth Admin API.
GRANT SELECT ON public.pengguna TO authenticated;

-- Data master: staf dapat membaca sesuai RLS; operasi tulis
-- tersedia pada level objek, tetapi RLS membatasinya ke Admin.
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.kategori, public.menu, public.topping, public.kuota_harian
TO authenticated;

-- Data transaksi: untuk tahap ini hanya SELECT langsung.
-- Penulisan transaksi akan dilakukan melalui backend/RPC
-- yang memvalidasi pembayaran dan kuota secara atomik.
GRANT SELECT
ON public.pesanan,
   public.detail_pesanan,
   public.detail_topping,
   public.pembayaran,
   public.riwayat_status_pesanan
TO authenticated;

-- Backend tepercaya menggunakan service_role hanya di server.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- =========================================================
-- 6. POLICY: PENGGUNA
-- =========================================================
CREATE POLICY pengguna_select_sendiri_atau_admin
ON public.pengguna
FOR SELECT
TO authenticated
USING (
    id_pengguna = (SELECT auth.uid())
    OR (SELECT private.is_admin())
);

-- Tidak ada policy INSERT/UPDATE/DELETE untuk authenticated.
-- Provisioning dan perubahan akun dilakukan oleh backend Admin.

-- =========================================================
-- 7. POLICY: KATEGORI
-- =========================================================
CREATE POLICY kategori_select_staf
ON public.kategori
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND (
        status_aktif = TRUE
        OR (SELECT private.is_admin())
    )
);

CREATE POLICY kategori_admin_insert
ON public.kategori
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY kategori_admin_update
ON public.kategori
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY kategori_admin_delete
ON public.kategori
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));

-- =========================================================
-- 8. POLICY: MENU
-- =========================================================
CREATE POLICY menu_select_staf
ON public.menu
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND (
        status_aktif = TRUE
        OR (SELECT private.is_admin())
    )
);

CREATE POLICY menu_admin_insert
ON public.menu
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY menu_admin_update
ON public.menu
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY menu_admin_delete
ON public.menu
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));

-- =========================================================
-- 9. POLICY: TOPPING
-- =========================================================
CREATE POLICY topping_select_staf
ON public.topping
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND (
        status_aktif = TRUE
        OR (SELECT private.is_admin())
    )
);

CREATE POLICY topping_admin_insert
ON public.topping
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY topping_admin_update
ON public.topping
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY topping_admin_delete
ON public.topping
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));

-- =========================================================
-- 10. POLICY: KUOTA HARIAN
-- =========================================================
CREATE POLICY kuota_select_staf
ON public.kuota_harian
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND (
        (SELECT private.is_admin())
        OR EXISTS (
            SELECT 1
            FROM public.menu AS m
            WHERE m.id_menu = kuota_harian.id_menu
              AND m.status_aktif = TRUE
        )
    )
);

CREATE POLICY kuota_admin_insert
ON public.kuota_harian
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY kuota_admin_update
ON public.kuota_harian
FOR UPDATE
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY kuota_admin_delete
ON public.kuota_harian
FOR DELETE
TO authenticated
USING ((SELECT private.is_admin()));

-- =========================================================
-- 11. POLICY: PESANAN
-- =========================================================
CREATE POLICY pesanan_select_pemilik_atau_admin
ON public.pesanan
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND (
        id_kasir = (SELECT auth.uid())
        OR (SELECT private.is_admin())
    )
);

-- =========================================================
-- 12. POLICY: DETAIL PESANAN
-- =========================================================
CREATE POLICY detail_pesanan_select_pemilik_atau_admin
ON public.detail_pesanan
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND EXISTS (
        SELECT 1
        FROM public.pesanan AS p
        WHERE p.id_pesanan = detail_pesanan.id_pesanan
          AND (
              p.id_kasir = (SELECT auth.uid())
              OR (SELECT private.is_admin())
          )
    )
);

-- =========================================================
-- 13. POLICY: DETAIL TOPPING
-- =========================================================
CREATE POLICY detail_topping_select_pemilik_atau_admin
ON public.detail_topping
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND EXISTS (
        SELECT 1
        FROM public.detail_pesanan AS dp
        JOIN public.pesanan AS p
          ON p.id_pesanan = dp.id_pesanan
        WHERE dp.id_detail = detail_topping.id_detail
          AND (
              p.id_kasir = (SELECT auth.uid())
              OR (SELECT private.is_admin())
          )
    )
);

-- =========================================================
-- 14. POLICY: PEMBAYARAN
-- =========================================================
CREATE POLICY pembayaran_select_pemilik_atau_admin
ON public.pembayaran
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND EXISTS (
        SELECT 1
        FROM public.pesanan AS p
        WHERE p.id_pesanan = pembayaran.id_pesanan
          AND (
              p.id_kasir = (SELECT auth.uid())
              OR (SELECT private.is_admin())
          )
    )
);

-- =========================================================
-- 15. POLICY: RIWAYAT STATUS PESANAN
-- =========================================================
CREATE POLICY riwayat_select_pemilik_atau_admin
ON public.riwayat_status_pesanan
FOR SELECT
TO authenticated
USING (
    (SELECT private.is_active_staff())
    AND EXISTS (
        SELECT 1
        FROM public.pesanan AS p
        WHERE p.id_pesanan = riwayat_status_pesanan.id_pesanan
          AND (
              p.id_kasir = (SELECT auth.uid())
              OR (SELECT private.is_admin())
          )
    )
);

-- =========================================================
-- SELESAI
-- 10 tabel telah memiliki RLS.
-- Hak tulis transaksi belum diberikan ke authenticated:
-- transaksi akan diproses melalui backend/RPC yang aman.
-- =========================================================
