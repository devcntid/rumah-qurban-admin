# Upload Orders Massal - Dokumentasi

## Ringkasan

Fitur upload orders massal memungkinkan admin untuk mengimport banyak pesanan sekaligus melalui file Excel. Fitur ini menggunakan identifikasi berbasis string (nama cabang, sales, produk) sehingga user tidak perlu mengetahui ID internal.

## Cara Penggunaan

### 1. Akses Halaman Orders
Buka halaman `/orders` di admin panel.

### 2. Download Template
- Klik tombol **"Upload Orders"** (warna ungu)
- Di modal yang muncul, klik **"Download Template"**
- Template Excel akan terdownload dengan contoh data yang sudah terisi

### 3. Isi Data di Excel
Template memiliki kolom-kolom berikut:

| Kolom | Wajib | Contoh | Keterangan |
|-------|-------|--------|------------|
| Invoice | Opsional | RQD/2024/001 | Auto-generate jika kosong |
| Cabang | Ya | Rumah Qurban Depok | Harus persis sama dengan nama di database |
| Sales | Ya | Zainudin | Nama sales agent |
| Nama Customer | Ya | Budi Santoso | - |
| Telepon | Tidak | 081234567890 | - |
| Email | Tidak | budi@email.com | - |
| Alamat Pengiriman | Tidak | Jl. Margonda Raya 100 | - |
| Produk | Ya | Sapi Kurban Kelas A - Lokal | Harus persis dengan nama produk di catalog |
| Jumlah | Ya | 1 | Default 1 |
| Harga Satuan | Ya | 18500000 | - |
| Diskon | Tidak | 0 | Default 0 |
| Total | Ya | 18500000 | - |
| DP Dibayar | Tidak | 0 | Default 0 |
| Status Bayar | Ya | Lunas / DP / Belum Bayar | - |
| Tanggal Order | Ya | 2024-06-14 | Format YYYY-MM-DD |
| Metode Pembayaran | Tidak | Bank Mandiri | Untuk auto-create transaction |

### 4. Upload File
- Klik **"Choose File"** dan pilih file Excel yang sudah diisi
- Klik **"Upload & Process"**

### 5. Review Hasil
- Jika semua data valid, orders akan langsung masuk ke database
- Jika ada error, sistem akan menampilkan detail error per baris dengan suggestion
- Fix error di Excel, lalu upload ulang

## Fitur Utama

### 1. String-Based Identification
User tidak perlu tahu ID internal. Cukup ketik nama:
- **Cabang**: "Rumah Qurban Depok" → otomatis di-map ke branch_id
- **Sales**: "Zainudin" → otomatis di-map ke sales_agent_id
- **Produk**: "Sapi Kurban Kelas A" → otomatis di-map ke catalog_offer_id

### 2. Case-Insensitive Matching
Sistem akan mencocokkan nama dengan case-insensitive:
- "rumah qurban depok" = "Rumah Qurban Depok" = "RUMAH QURBAN DEPOK"

### 3. Auto Invoice Generation
Jika kolom Invoice kosong atau diisi "AUTO", sistem akan generate invoice number otomatis.

### 4. Auto Transaction Creation
Jika Status Bayar = "Lunas", sistem otomatis:
- Set order status = "FULL_PAID"
- Create transaction dengan status "SUCCESS"
- Jika ada Metode Pembayaran, transaction akan linked ke payment method tersebut

Jika Status Bayar = "DP", sistem otomatis:
- Set order status = "DP_PAID"
- Create transaction type "DOWN_PAYMENT" dengan status "SUCCESS"

### 5. Smart Validation
Sistem memberikan error message yang jelas dengan suggestion:
```
Cabang "Rumah Qurban Jakarta" tidak ditemukan. 
Pilihan: rumah qurban depok, rumah qurban bsd, rumah qurban serpong
```

### 6. Preview Before Insert
Jika ada error, user bisa melihat preview error tanpa data ter-insert ke database.

## File Structure

```
lib/
  db/
    queries/
      order-upload.ts          # Lookup map queries
  actions/
    order-upload.ts            # Server actions untuk upload & generate template

components/
  orders/
    UploadOrdersModal.tsx      # UI Modal
    OrdersClient.tsx           # Modified: tambah button + modal
```

## Database Impact

Setiap row yang valid akan:
1. Insert ke tabel `orders`
2. Insert ke tabel `order_items` (1 item per order)
3. Jika status "Lunas" atau "DP", insert ke tabel `transactions`

## Validasi

### Required Fields
- Cabang (harus ada di database)
- Sales (harus ada di database)
- Nama Customer
- Produk (harus ada di database dan is_active = true)
- Harga Satuan (harus > 0)
- Total (harus > 0)
- Status Bayar
- Tanggal Order

### Optional Fields
- Invoice (auto-generate jika kosong)
- Telepon
- Email
- Alamat Pengiriman
- Jumlah (default 1)
- Diskon (default 0)
- DP Dibayar (default 0)
- Metode Pembayaran

## Error Handling

### Common Errors

**1. Cabang tidak ditemukan**
- Pastikan nama cabang persis sama dengan database
- Cek di halaman Master Data → Branches untuk nama yang benar

**2. Sales tidak ditemukan**
- Pastikan nama sales persis sama dengan database
- Cek di halaman Master Data → Sales Agents

**3. Produk tidak ditemukan**
- Pastikan nama produk persis sama dengan catalog_offers.display_name
- Cek di halaman Pricing → Catalog

**4. Harga Satuan atau Total tidak valid**
- Harus angka dan lebih dari 0
- Jangan gunakan format Rupiah (Rp) atau separator (.)
- Contoh benar: 18500000

**5. Tanggal tidak valid**
- Format harus YYYY-MM-DD
- Contoh: 2024-06-14

## Tips & Best Practices

1. **Download template terlebih dahulu** untuk melihat format yang benar
2. **Copy-paste nama** dari Master Data untuk menghindari typo
3. **Validasi di Excel dulu** sebelum upload (cek formula, format tanggal, dll)
4. **Upload bertahap** jika data banyak (misal 50 baris dulu untuk test)
5. **Backup data** sebelum upload massal pertama kali

## Troubleshooting

### Template tidak terdownload?
- Pastikan browser tidak memblokir download
- Cek console browser untuk error
- Coba refresh halaman

### Upload gagal terus?
- Pastikan file format .xlsx atau .xls
- Pastikan tidak ada cell yang merge
- Pastikan header row (baris 1) tidak diubah

### Data tidak muncul setelah upload?
- Refresh halaman /orders
- Cek filter yang aktif (mungkin order tidak masuk filter)
- Cek terminal/console untuk error log

## Limitasi

1. **1 Order = 1 Item**: Saat ini hanya support 1 item per order
2. **Customer Type**: Default semua order adalah B2C
3. **No Participants**: Fitur patungan belum support via upload
4. **No Duplicate Check**: Invoice yang duplicate akan failed saat insert

## Future Enhancements

- Support multiple items per order
- Support B2B orders
- Support participants (patungan)
- Export error report as Excel
- Dry-run mode (preview without insert)
- Progress bar untuk upload besar
- Duplicate detection warning
