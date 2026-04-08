

Product Requirements Document (PRD)
Project Name: Panel Admin Rumah Qurban (V2.0 - B2B & B2C Unified)
## Document Status: Final
## Target Platform: Web Desktop / Tablet
## 1. Executive Summary
Panel Admin Rumah Qurban dirancang ulang untuk menjadi Core ERP & Invoicing System yang
menjembatani transaksi B2C (individu) dan B2B (korporasi/kolektif). Sistem ini mendigitalisasi
seluruh rantai pasok mulai dari pembuatan tagihan fleksibel (DP & Diskon), alokasi hewan
secara massal (Bulk Assign), manajemen logistik presisi (koordinat peta), hingga rekonsiliasi
akuntansi berbasis COA (Chart of Accounts).
## 2. User Roles & Access
Sistem membagi hak akses ke dalam 5 peran utama untuk menjaga keamanan dan spesialisasi
alur kerja operasional:
## 1.
Super Admin / Management: Memiliki akses penuh ke seluruh 10 modul sistem. Fokus
utama pada Dashboard Analytics, Target & Performa, pengaturan Pricing, Master Data,
dan System Logs.
## 2.
Admin Cabang / Customer Service (CS): Memiliki akses ke modul POS / Invoicing,
Manajemen Pesanan, dan Verifikasi Pembayaran. Bertugas membuat invoice B2B/B2C,
melayani pesanan offline, dan memvalidasi pembayaran manual.
## 3.
Tim Kandang & Penyembelihan: Hanya memiliki akses ke modul Kandang & Inventaris.
Bertugas mengalokasikan Eartag fisik ke dalam invoice (baik secara retail/satuan maupun
bulk/massal) dan mengunggah multi-dokumentasi (foto hewan dan video penyembelihan).
## 4.
Tim Logistik & Pengiriman: Hanya memiliki akses ke modul Logistik & Pengiriman.
Bertugas melakukan penjadwalan pengiriman, menetapkan armada/supir, melacak titik
koordinat (Lat/Lng) pengiriman, dan mencetak Delivery Order (DO).
## 5.
Mitra / Sales (Closer): Akses dashboard komisi dan Analytics secara read-only (Melihat
performa konversi leads dan pesanan yang membawa kode referal mereka).
## 3. Modul & Fitur Utama (10 Menus)
## 3.1. Dashboard Analytics
## ●
Fungsi: Halaman ringkasan eksekutif (Overview).
## ●
Fitur Kunci: * Metrik Real-time: Total Omset (Rp), Total Ekor Terjual, dan Jumlah Pesanan
## Pending.
## ○
Proporsi Transaksi: Menampilkan persentase pesanan B2B vs B2C.

## ○
## Grafik Bar Chart: Tren Penjualan Harian.
## ○
Progress Bar: Proporsi penjualan per cabang (Bandung, Jakarta, Solo) dan penjualan
per kategori (Qurban Antar, Berbagi, Kaleng).
3.2. Target & Performa (Integrasi Spreadsheet)
## ●
Fungsi: Memvisualisasikan target operasional tahunan perusahaan.
## ●
## Fitur Kunci:
## ○
Metrik Global: Target Sales (Ekor), Target Omset (Rp), dan Estimasi HPP Global (Rp).
## ○
Tabel Matriks Target: Pemisahan target detail untuk Sapi dan Domba berdasarkan
kategori QA (Antar), QB (Berbagi), dan QK (Kaleng).
## ○
Tabel Komparasi B2B vs B2C: Menampilkan perbandingan target Ekor, Omset, dan HPP
dengan proporsi 60% B2B dan 40% B2C (berdasarkan lampiran data acuan).
3.3. POS / Invoicing Engine (Fokus B2B & B2C)
## ●
Fungsi: Pintu masuk (Entry Form) pembuatan pesanan secara manual/offline oleh
Admin/CS.
## ●
## Fitur Kunci:
## ○
Fleksibilitas Tipe Pelanggan: Toggle B2B (Instansi/Perusahaan) dan B2C (Individu).
B2B akan membuka isian Nama Perusahaan.
## ○
Input Alamat Presisi: Tersedia pengisian titik koordinat (Latitude & Longitude).
## ○
Sistem Keranjang (Multi-Item): Admin dapat menambahkan item tanpa batas. Terdiri
dari Dropdown Template (Hewan, Ongkos Kirim, Jasa Sembelih) dan Teks Kustom.
## ○
Item Pricing Bebas (Editable): Quantity (Qty) dan Harga Satuan per item dapat diedit
secara bebas. Setiap baris item otomatis direlasikan ke Category COA (Contoh:
## ANIMAL_PRODUCT, SHIPPING_FEE).
## ○
Kalkulasi Finansial Lanjut: Mendukung Diskon Global (Rp) dan Uang Muka/DP (Rp).
Sistem akan otomatis menghitung Sisa Tagihan dan melabeli status Invoice (PENDING,
## DP_PAID, FULL_PAID).
3.4. Manajemen Pesanan (Orders)
## ●
Fungsi: Tabel pangkalan data seluruh transaksi masuk (Web Online & POS Offline).
## ●
## Fitur Kunci:
## ○
Tabel yang merangkum Nominal DP, Sisa Tagihan, Status, dan Tipe Order.
## ○
Export Excel (COA): Tombol export tagihan terperinci untuk diserahkan ke bagian
akuntansi/keuangan.
## ○
360-Degree Order Detail Screen: Halaman detail (layar penuh) untuk setiap Invoice.
## Merangkum:
## ■
Info Pelanggan & Titik Peta (Lat/Lng).
## ■
Tabel Order Items (Hewan, Jasa, Ongkir beserta nama Peserta Qurban).
## ■
Tabel Riwayat Pembayaran (Timeline Uang Muka, Termin, Pelunasan).
## ■
## Status Logistik & Armada.
## ■
Galeri Multi-Dokumentasi Eartag (Foto & Video).

3.5. Verifikasi Pembayaran (Finance)
## ●
Fungsi: Pusat persetujuan untuk metode Transfer Manual.
## ●
## Fitur Kunci:
## ○
Menampilkan antrean pelanggan yang mengunggah struk/bukti transfer.
## ○
Terdapat tombol "Lihat Bukti", "Approve", dan "Tolak".
## ○
Ketika tombol "Approve" ditekan, status pembayaran otomatis disahkan dan status
pesanan aslinya akan berubah menjadi FULL_PAID (serta men-trigger sistem
pengiriman notifikasi/Invoice lunas ke WhatsApp pelanggan).
3.6. Manajemen Kandang & Inventaris (Farm)
## ●
Fungsi: Modul pengelolaan fisik hewan qurban dan sinkronisasi Eartag ke Invoice.
## ●
## Fitur Kunci:
## ○
B2B Bulk Assign (Alokasi Massal): Fitur utama menggunakan antarmuka
Dual-Listbox Modal. Tim kandang dapat memfilter stok hewan (AVAILABLE)
berdasarkan minimum berat, lalu mencentang/memindahkan 50-100 ekor hewan
sekaligus ke dalam satu Invoice Corporate (B2B) dalam sekali simpan.
## ○
Retail Assign (Alokasi Satuan): Input text cepat untuk memindai/mengetik Eartag
bagi pesanan B2C (1 ekor).
## ○
Upload Dokumentasi: Tombol "Camera" dan "Video" pada setiap hewan yang
statusnya BOOKED untuk menunjang laporan penyembelihan.
## 3.7. Logistik & Pengiriman
## ●
Fungsi: Modul penjadwalan dan pelacakan kurir.
## ●
## Fitur Kunci:
## ○
Menampilkan blok koordinat (Latitude/Longitude) lokasi rumah/instansi tujuan yang
disalin langsung dari Invoice.
## ○
Form isian "Jadwal Kirim" dan Dropdown "Pemilihan Armada/Supir".
## ○
Tombol "Cetak DO" (Delivery Order PDF) dan tombol penyelesaian pengiriman
(Terkirim / Delivered).
3.8. Harga, Produk & Kuota (Pricing)
## ●
Fungsi: Manajemen Pricing Engine dan paket layanan.
## ●
Fitur Kunci: Terbagi menjadi 3 tab:
## ○
Matriks Harga (Per Kg): Pembuatan harga dasar per Tipe Hewan dan Wilayah.
## ○
Produk Kuota: Mengelola stok digital (Target/Terkumpul) untuk paket Qurban Berbagi
dan Qurban Kaleng.
## ○
Add-ons: Penentuan harga statis untuk Jasa Potong dan Ongkos Kirim per cabang.
## ○
Setiap konfigurasi di modul ini wajib ditautkan dengan COA Code akuntansi.
3.9. Master Data & COA
## ●
Fungsi: Sistem referensi statis terpusat dengan dukungan integrasi akuntansi.
## ●
Fitur Kunci: Formulir CRUD untuk mengelola entitas:

## ○
Daftar Cabang (Tautkan ke COA Cabang).
## ○
Daftar Vendor/Kandang Pemasok.
## ○
Metode Pembayaran (Bank, VA, E-Wallet - Tautkan ke COA Kas/Bank).
## ○
## Daftar Tim Sales / Closer.
## ○
Daftar Users (Hak Akses Admin).
3.10. System Logs & API Integrations
## ●
Fungsi: Alat monitoring (debugging) bagi teknisi dan Super Admin.
## ●
Fitur Kunci: Menampilkan Data Table riwayat background jobs:
## ○
Notif_Logs: Melacak keberhasilan pengiriman PDF/Teks ke WhatsApp pelanggan via
API Starsender.
## ○
Payment_Logs: Riwayat tangkapan data Webhook dari Payment Gateway (e.g.,
Xendit) untuk Virtual Account otomatis.
## ○
Zains_Logs: Sinkronisasi API ke perangkat lunak ERP Zains pihak ketiga (opsional).
## ○
Fitur "Lihat JSON" yang memunculkan Pop-up Modal dengan tampilan Beautified
JSON Code (Payload vs Response).
- Non-Functional Requirements (NFR)
## 1.
Keamanan Concurrency: Penerapan database locking (optimistic/pessimistic lock) saat
pemrosesan checkout dan "Bulk Assign Kandang" agar satu hewan tidak teralokasi ke dua
Invoice berbeda di detik yang sama.
## 2.
Kinerja Database: Implementasi Table Partitioning pada PostgreSQL (tabel orders dan
transactions) secara bulanan/tahunan untuk menjaga performa kueri karena volume
riwayat transaksi yang membesar.
## 3.
Resiliency (Retry Mechanism): Pesan WhatsApp yang gagal terkirim (contoh: Rate Limit
Error Code 429) akan di-antre ulang (auto-retry) menggunakan layanan queue (seperti
## Upstash Workflow).