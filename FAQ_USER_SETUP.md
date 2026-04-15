# Setup FAQ dan User Management

## Environment Variables

Tambahkan ke file `.env.local`:

```bash
# Upstash Redis (untuk FAQ cache)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

## Cara Mendapatkan Upstash Redis Credentials

1. Buka [https://upstash.com/](https://upstash.com/)
2. Login atau buat akun baru
3. Buat Redis database baru
4. Copy `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` dari dashboard
5. Paste ke file `.env.local`

## Default Admin Users

Setelah menjalankan `npm run seed`, akan tersedia 2 admin users:

### Superadmin
- Email: `superadmin@rumahqurban.id`
- Password: `Admin123!`
- Role: SUPERADMIN
- Access: Full access ke semua fitur

### Admin Branch (Bandung)
- Email: `admin.bandung@rumahqurban.id`
- Password: `Admin123!`
- Role: ADMIN_BRANCH
- Branch: Bandung Raya
- Access: Limited access

## Fitur FAQ Management

- **Lokasi**: `/faqs`
- **Fitur**:
  - CRUD lengkap (Create, Read, Update, Delete)
  - Filter by product, category, status
  - Search by question/answer
  - Pagination (10 items per page)
  - Redis cache integration
  - Display order management

## Fitur User Management

- **Lokasi**: `/users`
- **Fitur**:
  - CRUD lengkap untuk admin users
  - 2 Role types: SUPERADMIN dan ADMIN_BRANCH
  - Password reset functionality
  - Filter by role, branch, status
  - Search by name/email
  - Pagination (10 items per page)
  - Password validation (minimal 8 karakter, kombinasi huruf & angka)

## Testing

### Test FAQ CRUD:
1. Buka `/faqs`
2. Pilih product (Qurban Antar, Qurban Berbagi, atau Qurban Kaleng)
3. Test create: Klik "+ Tambah FAQ"
4. Test edit: Klik "Edit" pada FAQ yang ada
5. Test delete: Klik "Hapus" pada FAQ yang ada
6. Test filter: Gunakan dropdown kategori dan status
7. Test search: Ketik di search box
8. Test pagination: Klik "Prev" dan "Next"

### Test User CRUD:
1. Buka `/users`
2. Test create: Klik "+ Tambah User"
   - Isi email, nama, password
   - Pilih role (SUPERADMIN atau ADMIN_BRANCH)
   - Jika ADMIN_BRANCH, pilih branch
3. Test edit: Klik "Edit" pada user yang ada
4. Test password reset: Klik icon key pada user yang ada
5. Test delete: Klik "Hapus" pada user yang ada
6. Test filter: Gunakan dropdown role, branch, dan status
7. Test search: Ketik nama atau email
8. Test pagination: Klik "Prev" dan "Next"

## Cache Invalidation

FAQ cache akan otomatis di-invalidate ketika:
- Create FAQ baru
- Update FAQ existing
- Delete FAQ

Cache keys:
- `faqs:all` - semua FAQ
- `faqs:product:{id}` - FAQ per product

## Security

- Password di-hash menggunakan bcrypt (10 rounds)
- Validasi role vs branch_id di database level
- API routes dilindungi dengan session authentication
- SUPERADMIN tidak boleh memiliki branch_id
- ADMIN_BRANCH wajib memiliki branch_id
