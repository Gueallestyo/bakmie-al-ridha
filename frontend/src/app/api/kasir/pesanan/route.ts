import { requireKasirOrAdminApi } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'

interface PesananItemInput {
  id_menu: string
  jumlah: number
  harga_satuan?: number
  catatan_khusus?: string | null
  subtotal?: number
  detail_topping?: Array<{
    id_topping: string
    harga?: number
  }>
}

interface PesananRow {
  id_pesanan: string
  nomor_pesanan: string
  jenis_pesanan: string
  nomor_meja: string | null
  total_harga: number
  status_pesanan: string
  dibuat_pada: string
  id_kasir: string
  detail_pesanan?: Array<{
    id_detail: string
    id_menu: string
    jumlah: number
    harga_satuan: number
    catatan_khusus: string | null
    subtotal: number
    menu?: { nama_menu: string | null }
    detail_topping?: Array<{
      id_topping: string
      topping?: { nama_topping: string | null }
      harga: number
    }>
  }>
}

export async function GET() {
  const { profile, errorResponse } = await requireKasirOrAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const admin = createAdminClient()

    const { data: pesanan, error } = await admin
      .from('pesanan')
      .select(`
        id_pesanan,
        nomor_pesanan,
        jenis_pesanan,
        nomor_meja,
        total_harga,
        status_pesanan,
        dibuat_pada,
        id_kasir,
        detail_pesanan (
          id_detail,
          id_menu,
          jumlah,
          harga_satuan,
          catatan_khusus,
          subtotal,
          menu (nama_menu),
          detail_topping (
            id_topping,
            topping (nama_topping),
            harga
          )
        )
      `)
      .order('dibuat_pada', { ascending: false })

    if (error) {
      return NextResponseError(error.message, 500)
    }

    // Kasir hanya melihat pesanan yang dibuat sendiri, Admin melihat semua
    const rows = (pesanan ?? []) as unknown as PesananRow[]
    const filtered = profile.role === 'Kasir'
      ? rows.filter((p) => p.id_kasir === profile.id_pengguna)
      : rows

    return Response.json({
      pesanan: filtered,
    })
  } catch {
    return NextResponseError('Terjadi kesalahan saat memuat daftar pesanan.', 500)
  }
}

export async function POST(request: Request) {
  const { profile, errorResponse } = await requireKasirOrAdminApi()

  if (errorResponse) {
    return errorResponse
  }

  try {
    const body = await request.json()
    const {
      jenis_pesanan,
      nomor_meja,
      items,
      catatan_khusus,
      total_harga,
    } = body as {
      jenis_pesanan?: string
      nomor_meja?: string
      items?: PesananItemInput[]
      catatan_khusus?: string | null
      total_harga?: number
    }

    if (!jenis_pesanan || !['dine_in', 'takeaway'].includes(jenis_pesanan)) {
      return NextResponseError('Jenis pesanan wajib diisi (dine_in atau takeaway).', 400)
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponseError('Pesanan harus memiliki minimal satu item.', 400)
    }
    if (!total_harga || Number(total_harga) <= 0) {
      return NextResponseError('Total harga wajib lebih dari nol.', 400)
    }
    if (jenis_pesanan === 'dine_in' && (!nomor_meja || !nomor_meja.trim())) {
      return NextResponseError('Nomor meja wajib diisi untuk pesanan dine-in.', 400)
    }

    const admin = createAdminClient()

    // Generate nomor pesanan unik
    const nomorPesanan = `P-${Date.now().toString().slice(-6)}`

    // Validasi kuota sisa untuk setiap item sebelum membuat pesanan
    const today = new Date().toISOString().split('T')[0]

    for (const item of items) {
      if (!item.id_menu || !item.jumlah || item.jumlah < 1) {
        return NextResponseError('Setiap item harus memiliki menu dan jumlah yang valid.', 400)
      }

      const { data: kuota, error: kuotaError } = await admin
        .from('kuota_harian')
        .select('id_kuota, sisa_porsi, ambang_peringatan')
        .eq('id_menu', item.id_menu)
        .eq('tanggal', today)
        .single()

      if (kuotaError || !kuota) {
        // Buat kuota_harian baru jika belum ada untuk menu ini hari ini
        const { data: newKuota, error: createKuotaError } = await admin
          .from('kuota_harian')
          .insert({
            id_menu: item.id_menu,
            tanggal: today,
            kuota_awal: 0,
            sisa_porsi: 0,
            ambang_peringatan: 0,
          })
          .select('id_kuota, sisa_porsi, ambang_peringatan')
          .single()

        if (createKuotaError || !newKuota) {
          return NextResponseError(
            'Kuota harian untuk salah satu menu belum diatur untuk hari ini.',
            400,
          )
        }

        // Sisa porsi 0, tidak bisa memesan
        return NextResponseError(
          'Sisa porsi untuk salah satu menu tidak mencukupi.',
          400,
        )
      }

      if (kuota.sisa_porsi < item.jumlah) {
        return NextResponseError(
          'Sisa porsi untuk salah satu menu tidak mencukupi.',
          400,
        )
      }
    }

    // Buat pesanan (status 'dibuat', kuota BELUM dikurangi)
    const { data: pesanan, error: pesananError } = await admin
      .from('pesanan')
      .insert({
        nomor_pesanan: nomorPesanan,
        jenis_pesanan,
        nomor_meja: jenis_pesanan === 'dine_in' ? nomor_meja?.trim() : null,
        total_harga: Number(total_harga),
        status_pesanan: 'dibuat',
        id_kasir: profile.id_pengguna,
        catatan_khusus: catatan_khusus?.trim() || null,
      })
      .select('id_pesanan')
      .single()

    if (pesananError || !pesanan) {
      console.error('Pesanan insert error:', pesananError)
      return NextResponseError(
        `Gagal membuat pesanan: ${pesananError?.message || 'Unknown error'}`,
        500,
      )
    }

    const idPesanan = pesanan.id_pesanan

    // Simpan detail pesanan
    const detailRows = items.map((item) => ({
      id_pesanan: idPesanan,
      id_menu: item.id_menu,
      jumlah: item.jumlah,
      harga_satuan: Number(item.harga_satuan || 0),
      catatan_khusus: item.catatan_khusus?.trim() || null,
      subtotal: Number(item.subtotal || 0),
    }))

    const { error: detailError } = await admin
      .from('detail_pesanan')
      .insert(detailRows)

    if (detailError) {
      console.error('Detail pesanan insert error:', detailError)
      // Rollback: hapus pesanan jika detail gagal
      await admin.from('pesanan').delete().eq('id_pesanan', idPesanan)
      return NextResponseError(
        `Gagal menyimpan detail pesanan: ${detailError.message || 'Unknown error'}`,
        500,
      )
    }

    // Simpan detail topping jika ada
    for (const item of items) {
      if (item.detail_topping && Array.isArray(item.detail_topping)) {
        // Ambil detail_id yang baru dibuat untuk item ini
        const { data: detailCreated } = await admin
          .from('detail_pesanan')
          .select('id_detail')
          .eq('id_pesanan', idPesanan)
          .eq('id_menu', item.id_menu)
          .limit(1)

        if (detailCreated && detailCreated.length > 0) {
          const toppingRows = item.detail_topping.map((tp) => ({
            id_detail: detailCreated[0].id_detail,
            id_topping: tp.id_topping,
            harga: Number(tp.harga || 0),
          }))
          const { error: toppingError } = await admin
            .from('detail_topping')
            .insert(toppingRows)

          if (toppingError) {
            console.error('Detail topping insert error:', toppingError)
            // Rollback: hapus detail pesanan dan pesanan
            await admin.from('detail_pesanan').delete().eq('id_pesanan', idPesanan)
            await admin.from('pesanan').delete().eq('id_pesanan', idPesanan)
            return NextResponseError(
              `Gagal menyimpan detail topping: ${toppingError.message || 'Unknown error'}`,
              500,
            )
          }
        }
      }
    }

    return Response.json(
      {
        message: 'Pesanan berhasil dibuat.',
        pesanan: {
          id_pesanan: idPesanan,
          nomor_pesanan: nomorPesanan,
          status_pesanan: 'dibuat',
        },
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('Unexpected error creating pesanan:', err)
    return NextResponseError(
      `Terjadi kesalahan saat membuat pesanan: ${err.message || 'Unknown error'}`,
      500,
    )
  }
}

function NextResponseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
