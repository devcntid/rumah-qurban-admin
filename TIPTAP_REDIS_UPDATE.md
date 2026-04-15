# Update: Tiptap Editor dan Redis Cache Integration

## Fitur Baru yang Ditambahkan

### 1. Tiptap Rich Text Editor untuk FAQ

FAQ answer field sekarang menggunakan Tiptap rich text editor dengan fitur lengkap:

**Features:**
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3
- **Lists**: Bullet list, Numbered list
- **Text Alignment**: Left, Center, Right, Justify
- **Links**: Insert dan edit hyperlinks
- **Images**: Upload gambar via paste, drag & drop, atau file picker
- **Image Upload**: Otomatis upload ke Vercel Blob storage

**Component Location:** `components/ui/TiptapEditor.tsx`

**Toolbar Controls:**
```
[B] [I] [U] [S] | [H1] [H2] [H3] | [•] [1.] | [←] [↔] [→] [≡] | [🔗] [📷]
```

**Image Upload Flow:**
1. User paste/drop/select image
2. Validasi: harus image type, max 5MB
3. Upload ke `/api/upload` (Vercel Blob)
4. Insert image dengan URL dari Vercel Blob
5. HTML content disimpan ke database

**Usage:**
```tsx
<TiptapEditor
  content={htmlContent}
  onChange={(html) => setContent(html)}
  placeholder="Tulis konten..."
/>
```

### 2. Redis Cache Invalidation untuk Pricing

Halaman `/pricing` (catalog_offers) sekarang terintegrasi dengan Upstash Redis untuk cache invalidation:

**Cache Keys:**
- `catalog:all` - semua catalog offers
- `catalog:branch:{id}` - catalog per branch
- `catalog:product:{code}` - catalog per product code

**Invalidation Triggers:**
- Create catalog offer baru → invalidate cache
- Update catalog offer → invalidate cache
- Delete catalog offer → invalidate cache
- Bulk import catalog → invalidate all cache

**Implementation:**
- `lib/cache/redis.ts`: Added `invalidateCatalogCache()` function
- `lib/actions/catalog.ts`: Updated `saveCatalogOfferAction()`, `deleteCatalogOfferAction()`, `bulkSaveCatalogAction()`
- `lib/db/queries/catalog.ts`: Updated `getCatalogOfferById()` untuk include productCode

## Environment Variables

Redis sudah dikonfigurasi di `.env.local`:

```bash
KV_REST_API_URL=https://mighty-swift-79930.upstash.io
KV_REST_API_TOKEN=gQAAAAAAATg6AAIncDI0YWU3ODZjOTY2OTY0MjM5YmFkMGVjNmM5NTM3NzQ3OHAyNzk5MzA
```

Vercel Blob juga sudah dikonfigurasi:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_PDvaX6mq7nMUpQ1b_3FoLJTXSbzLX0xJHRJaUgnxfdsi4N1
```

## Dependencies Installed

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-color
```

## Testing Guide

### Test Tiptap Editor di FAQ:

1. Buka `/faqs`
2. Klik "+ Tambah FAQ"
3. Test formatting:
   - Bold text dengan Ctrl+B atau toolbar
   - Italic dengan Ctrl+I
   - Heading dengan toolbar
   - Lists dengan toolbar
4. Test image upload:
   - **Paste**: Copy gambar dari browser/screenshot, paste di editor (Ctrl+V)
   - **Drag & Drop**: Drag gambar dari file explorer ke editor
   - **File Picker**: Klik icon image di toolbar, pilih file
5. Verify:
   - Image muncul di editor setelah upload
   - Save FAQ
   - Edit FAQ dan verify content loaded correctly
   - View FAQ list dan verify HTML displayed (truncated)

### Test Redis Cache di Pricing:

1. Buka terminal dan monitor logs (optional):
   ```bash
   npm run dev
   ```
2. Buka `/pricing`
3. Test create catalog offer:
   - Klik "+ Tambah Penawaran"
   - Isi data dan save
   - Check console logs: "Invalidating catalog cache keys: ['catalog:all', ...]"
4. Test update catalog offer:
   - Edit existing offer
   - Save changes
   - Check console logs untuk cache invalidation
5. Test delete catalog offer:
   - Delete offer
   - Check console logs untuk cache invalidation
6. Test bulk import:
   - Import Excel file
   - Check console logs untuk cache invalidation

## Database Schema

FAQ answer field tetap menggunakan tipe `text`, tapi sekarang menyimpan HTML content:

```sql
CREATE TABLE faqs (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL,
  category varchar(100) NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,  -- Stores HTML content
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

## Security Notes

1. **HTML Content**: FAQ answer menggunakan `dangerouslySetInnerHTML` untuk display HTML. Consider adding DOMPurify untuk sanitization jika user input tidak terpercaya.
2. **Image Upload**: Sudah ada validasi di `/api/upload/route.ts`:
   - File type: harus image
   - File size: max 5MB
3. **Redis Keys**: Cache keys menggunakan pattern yang jelas untuk mudah di-invalidate

## Files Modified

```
components/
  ui/
    TiptapEditor.tsx           # NEW: Rich text editor dengan image upload

app/
  (app)/
    faqs/
      FaqCrud.tsx              # UPDATED: Gunakan TiptapEditor, display HTML

lib/
  cache/
    redis.ts                   # UPDATED: Add catalog cache keys, fix env vars

lib/
  actions/
    catalog.ts                 # UPDATED: Add Redis cache invalidation

lib/
  db/
    queries/
      catalog.ts               # UPDATED: getCatalogOfferById include productCode
```

## Next Steps (Optional)

1. **DOMPurify**: Install `isomorphic-dompurify` untuk sanitize HTML sebelum display
2. **Tailwind Typography**: Install `@tailwindcss/typography` untuk better prose styling
3. **Image Optimization**: Consider resize/compress image sebelum upload ke Vercel Blob
4. **Cache Strategy**: Implement cache read (get from Redis before DB query) untuk better performance
