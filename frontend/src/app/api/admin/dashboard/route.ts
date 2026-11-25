import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const periode = req.nextUrl.searchParams.get('periode') || 'hari_ini'; // 'hari_ini' | 'bulan_ini'
    const now = new Date();

    // Tentukan batas tanggal awal filter ringkasan
    const startDate = new Date(now);
    if (periode === 'bulan_ini') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    // 1. Ambil transaksi berstatus 'dibayar' sesuai periode (Bab 6 SDD: Batal & Refund tidak dihitung)
    const { data: pesananDibayar, error: errPesanan } = await supabase
      .from('pesanan')
      .select('id_pesanan, total_harga, dibuat_pada, detail_pesanan(jumlah, menu(nama_menu))')
      .eq('status_pesanan', 'dibayar')
      .gte('dibuat_pada', startDate.toISOString());

    if (errPesanan) {
      return NextResponse.json({ error: errPesanan.message }, { status: 500 });
    }

    let totalOmzet = 0;
    const jumlahTransaksi = pesananDibayar?.length || 0;
    let totalPorsiTerjual = 0;
    const hitungPerMenu: Record<string, number> = {};

    for (const pesanan of pesananDibayar || []) {
      totalOmzet += Number(pesanan.total_harga || 0);

      const rawDetails = (pesanan.detail_pesanan ?? []) as Array<{
        jumlah?: number | string | null;
        menu?:
          | { nama_menu?: string | null }
          | Array<{ nama_menu?: string | null }>
          | null;
      }>;

      for (const item of rawDetails) {
        const jumlah = Number(item.jumlah ?? 0);
        const menuObj = Array.isArray(item.menu) ? item.menu[0] : item.menu;
        const namaMenu = menuObj?.nama_menu?.trim() || 'Menu Lainnya';

        totalPorsiTerjual += jumlah;
        hitungPerMenu[namaMenu] = (hitungPerMenu[namaMenu] ?? 0) + jumlah;
      }
    }

    // Cari menu terlaris
    let menuTerlaris = { nama: '-', porsi: 0 };
    for (const [nama, porsi] of Object.entries(hitungPerMenu)) {
      if (porsi > menuTerlaris.porsi) {
        menuTerlaris = { nama, porsi };
      }
    }

    // 2. Ambil data omzet 7 hari terakhir untuk grafik line chart
    const tujuhHariLalu = new Date(now);
    tujuhHariLalu.setDate(now.getDate() - 6);
    tujuhHariLalu.setHours(0, 0, 0, 0);

    const { data: data7Hari } = await supabase
      .from('pesanan')
      .select('total_harga, dibuat_pada')
      .eq('status_pesanan', 'dibayar')
      .gte('dibuat_pada', tujuhHariLalu.toISOString());

    const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const grafik7Hari: { hari: string; tanggal: string; omzet: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      grafik7Hari.push({
        hari: namaHari[d.getDay()],
        tanggal: isoDate,
        omzet: 0,
      });
    }

    for (const row of data7Hari || []) {
      const tglRow = new Date(row.dibuat_pada).toISOString().split('T')[0];
      const target = grafik7Hari.find((g) => g.tanggal === tglRow);
      if (target) {
        target.omzet += Number(row.total_harga || 0);
      }
    }

    return NextResponse.json({
      ringkasan: {
        omzet: totalOmzet,
        transaksi: jumlahTransaksi,
        porsi_terjual: totalPorsiTerjual,
        menu_terlaris: menuTerlaris,
      },
      grafik_7_hari: grafik7Hari,
    });
  } catch {
    return NextResponse.json({ error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}