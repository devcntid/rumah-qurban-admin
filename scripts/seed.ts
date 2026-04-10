import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);

  await sql`BEGIN`;
  try {
    const branchSeed: [string, string][] = [
      ["Bandung Raya", "400-10-101"],
      ["Bogor", "400-10-102"],
      ["Cilegon", "400-10-103"],
      ["Jakarta Raya", "400-10-104"],
      ["Semarang", "400-10-105"],
      ["Solo", "400-10-106"],
    ];
    for (const [name, coa] of branchSeed) {
      await sql`
        INSERT INTO branches (name, coa_code, is_active)
        VALUES (${name}, ${coa}, TRUE)
        ON CONFLICT (name) DO UPDATE
        SET coa_code = EXCLUDED.coa_code,
            is_active = EXCLUDED.is_active
      `;
    }

    await sql`
      INSERT INTO vendors (id, name, location) VALUES
        (1, 'Farm Agrosurya', 'Bandung'),
        (2, 'Vendor Nasional', 'Indonesia')
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          location = EXCLUDED.location
    `;

    const bRows = (await sql`SELECT id, name FROM branches`) as { id: number; name: string }[];
    const vRows = (await sql`SELECT id, name FROM vendors`) as { id: number; name: string }[];
    const branchIdByName = (n: string) => {
      const r = bRows.find((x) => x.name === n);
      if (!r) throw new Error(`Branch tidak ditemukan: ${n}`);
      return r.id;
    };
    const vendorIdByName = (n: string) => {
      const r = vRows.find((x) => x.name === n);
      if (!r) throw new Error(`Vendor tidak ditemukan: ${n}`);
      return r.id;
    };

    const bandungId = branchIdByName("Bandung Raya");
    const jakartaId = branchIdByName("Jakarta Raya");
    const farmAgroId = vendorIdByName("Farm Agrosurya");

    await sql`
      INSERT INTO farm_pens (id, branch_id, name) VALUES
        (1, ${bandungId}, 'FARM AGROSURYA'),
        (2, ${bandungId}, 'Kandang A'),
        (3, ${bandungId}, 'Kandang B'),
        (4, ${jakartaId}, 'MAJALENGKA')
      ON CONFLICT (id) DO UPDATE
      SET branch_id = EXCLUDED.branch_id,
          name = EXCLUDED.name
    `;

    await sql`
      INSERT INTO sales_agents (id, name, category, phone) VALUES
        (1, 'Agro Great Indoberkah', 'KEMITRAAN', '08123456789'),
        (2, 'Tim Telemarketing Internal', 'INTERNAL', '0000000000')
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          category = EXCLUDED.category,
          phone = EXCLUDED.phone
    `;

    await sql`
      INSERT INTO animal_variants (id, species, class_grade, weight_range, description) VALUES
        (1, 'Sapi', 'A', '250 - 300 Kg', NULL),
        (2, 'Sapi', 'B', '310 - 350 Kg', NULL),
        (3, 'Domba', 'A', '27 - 30 Kg', NULL),
        (4, 'Domba', 'B', '23 - 26 Kg', NULL),
        (5, 'Sapi', '-', '-', 'Generic kaleng/berbagi'),
        (6, 'Domba', '-', '-', 'Generic kaleng/berbagi')
      ON CONFLICT (id) DO UPDATE
      SET species = EXCLUDED.species,
          class_grade = EXCLUDED.class_grade,
          weight_range = EXCLUDED.weight_range,
          description = EXCLUDED.description
    `;

    await sql`
      INSERT INTO products (id, code, name, requires_shipping, coa_code) VALUES
        (1, 'QA', 'Qurban Antar', TRUE, NULL),
        (2, 'QK', 'Qurban Kaleng', FALSE, NULL),
        (3, 'QB', 'Qurban Berbagi', FALSE, NULL)
      ON CONFLICT (id) DO UPDATE
      SET code = EXCLUDED.code,
          name = EXCLUDED.name,
          requires_shipping = EXCLUDED.requires_shipping,
          coa_code = EXCLUDED.coa_code
    `;

    await sql`
      INSERT INTO catalog_offers (
        id, product_id, animal_variant_id, branch_id, vendor_id,
        display_name, sub_type, sku_code, projected_weight, price, image_url, is_active
      ) VALUES
        (1, 1, 1, ${bandungId}, ${farmAgroId}, 'Qurban Antar Sapi Jawa', NULL, '0231', '308 Kg', 22000000,
         'https://example.com/sapi-a.png', TRUE),
        (2, 1, 2, ${bandungId}, ${farmAgroId}, 'Qurban Antar Sapi Jawa', NULL, '0207', '340 Kg', 26000000,
         'https://example.com/sapi-b.png', TRUE),
        (3, 1, 3, ${bandungId}, ${farmAgroId}, 'Qurban Antar Domba Jantan Tanduk', NULL, NULL, '28 Kg', 3100000,
         'https://example.com/domba-a.jpg', TRUE),
        (4, 2, 6, ${bandungId}, NULL, 'Qurban Kaleng Rendang Domba', 'rendang', NULL, NULL, 2500000,
         'https://example.com/rendang-domba.jpg', TRUE),
        (5, 2, 5, ${bandungId}, NULL, 'Qurban Kaleng Rendang Sapi', 'rendang', NULL, NULL, 18000000,
         'https://example.com/rendang-sapi.jpg', TRUE),
        (6, 3, 5, NULL, NULL, 'Qurban Berbagi Sapi di Desa Oebufu Kupang', NULL, NULL, NULL, 17000000,
         'https://example.com/kupang.jpg', TRUE),
        (7, 3, 6, NULL, NULL, 'Qurban Berbagi Domba Kambing Di Desa Dukuh Turi', NULL, NULL, NULL, 2500000,
         'https://example.com/brebes.jpg', TRUE),
        (8, 1, 4, ${bandungId}, ${farmAgroId}, 'Qurban Antar Domba Tipe B (Bandung)', NULL, NULL, '23 - 26 Kg', 2100000,
         NULL, TRUE)
      ON CONFLICT (id) DO UPDATE
      SET product_id = EXCLUDED.product_id,
          animal_variant_id = EXCLUDED.animal_variant_id,
          branch_id = EXCLUDED.branch_id,
          vendor_id = EXCLUDED.vendor_id,
          display_name = EXCLUDED.display_name,
          sub_type = EXCLUDED.sub_type,
          sku_code = EXCLUDED.sku_code,
          projected_weight = EXCLUDED.projected_weight,
          price = EXCLUDED.price,
          image_url = EXCLUDED.image_url,
          is_active = EXCLUDED.is_active
    `;

    await sql`
      INSERT INTO services (id, name, service_type, base_price, branch_id, animal_variant_id, coa_code) VALUES
        (1, 'Ongkos Kirim Domba Area Bandung', 'SHIPPING', 50000, ${bandungId}, 4, '400-40-101'),
        (2, 'Ongkos Kirim Sapi Area Bandung', 'SHIPPING', 250000, ${bandungId}, 1, '400-40-102'),
        (3, 'Jasa Potong & Cacah Sapi', 'SLAUGHTER', 1000000, NULL, 1, '400-50-101')
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          service_type = EXCLUDED.service_type,
          base_price = EXCLUDED.base_price,
          branch_id = EXCLUDED.branch_id,
          animal_variant_id = EXCLUDED.animal_variant_id,
          coa_code = EXCLUDED.coa_code
    `;

    await sql`
      INSERT INTO sales_targets (
        branch_id, year, season, species, category, target_ekor, target_omset, target_hpp, notes
      ) VALUES
        (${bandungId}, 2026, 'RAMADAN', 'DOMBA', 'QA', 600, 6000000000, 4200000000, 'Target QA domba cabang Bandung'),
        (${bandungId}, 2026, 'RAMADAN', 'SAPI', 'QB', 80, 136000000, 104000000, 'Target QB sapi cabang Bandung'),
        (${jakartaId}, 2026, 'RAMADAN', 'DOMBA', 'QA', 400, 5200000000, 3600000000, 'Target QA domba cabang Jakarta'),
        (${jakartaId}, 2026, 'RAMADAN', 'SAPI', 'QB', 60, 102000000, 78000000, 'Target QB sapi cabang Jakarta')
      ON CONFLICT (branch_id, year, species, category) DO UPDATE
      SET season = EXCLUDED.season,
          target_ekor = EXCLUDED.target_ekor,
          target_omset = EXCLUDED.target_omset,
          target_hpp = EXCLUDED.target_hpp,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
    `;

    await sql`
      INSERT INTO payment_methods (id, code, name, category, coa_code, is_active) VALUES
        (1, 'CASH', 'Tunai / Cash', 'OFFLINE_CASH', NULL, TRUE),
        (2, 'TF_MANDIRI', 'Transfer Bank Mandiri', 'MANUAL_TRANSFER', '110-10-101', TRUE),
        (3, 'XENDIT_VA_MANDIRI', 'Virtual Account Mandiri', 'VIRTUAL_ACCOUNT', NULL, TRUE),
        (4, 'XENDIT_QRIS', 'QRIS Dinamis', 'EWALLET', NULL, TRUE)
      ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name,
          category = EXCLUDED.category,
          coa_code = EXCLUDED.coa_code,
          is_active = EXCLUDED.is_active
    `;

    await sql`
      INSERT INTO payment_instructions (id, payment_method_code, channel, instruction_steps, is_active)
      VALUES
        (1, 'TF_MANDIRI', 'ATM', '1. Masukkan Kartu ATM\n2. Pilih Transfer -> Antar Rekening\n3. Masukkan Rekening 1310007965835', TRUE),
        (2, 'TF_MANDIRI', 'MBANKING', '1. Buka Livin by Mandiri\n2. Pilih Transfer ke Sesama\n3. Masukkan Rek 1310007965835', TRUE),
        (3, 'XENDIT_VA_MANDIRI', 'ATM', '1. Masukkan Kartu ATM\n2. Pilih Bayar/Beli -> Multipayment\n3. Masukkan Kode VA {{va_number}}', TRUE),
        (4, 'XENDIT_VA_MANDIRI', 'MBANKING', '1. Buka Aplikasi m-Banking\n2. Pilih Bayar -> Multipayment\n3. Masukkan Kode VA {{va_number}}', TRUE),
        (5, 'XENDIT_QRIS', 'ALL', '1. Buka Aplikasi e-Wallet / m-Banking\n2. Pilih Scan QR\n3. Scan QR di layar.', TRUE)
      ON CONFLICT (id) DO UPDATE
      SET payment_method_code = EXCLUDED.payment_method_code,
          channel = EXCLUDED.channel,
          instruction_steps = EXCLUDED.instruction_steps,
          is_active = EXCLUDED.is_active
    `;

    await sql`
      INSERT INTO orders (
        id, invoice_number, branch_id, sales_agent_id,
        customer_type, customer_name, company_name, customer_phone, customer_email,
        delivery_address, latitude, longitude, subtotal, discount, grand_total, dp_paid, remaining_balance, status, created_at
      ) VALUES
        (1, 'INV-B2B-001', 1, NULL, 'B2B', 'Bpk. Ahmad', 'PT. Telkom', NULL, NULL, NULL, NULL, NULL, 107000000.00, 0.00, 107000000.00, 50000000.00, 57000000.00, 'DP_PAID', '2026-05-20 10:00:00'),
        (2, 'INV-WEB-001', 1, NULL, 'B2C', 'Lili Apriliyani', NULL, '081317854742', NULL, 'Jl. Dipatiukur No. 1, Bandung', -6.89123000, 107.60351000, 3150000.00, 0.00, 3150000.00, 3150000.00, 0.00, 'FULL_PAID', '2026-05-21 11:00:00'),
        (3, 'INV-WEB-002', NULL, NULL, 'B2C', 'Hasan Basri', NULL, '081299998888', NULL, NULL, NULL, NULL, 2500000.00, 0.00, 2500000.00, 2500000.00, 0.00, 'FULL_PAID', '2026-05-22 08:00:00')
      ON CONFLICT (id) DO UPDATE
      SET invoice_number = EXCLUDED.invoice_number,
          branch_id = EXCLUDED.branch_id,
          sales_agent_id = EXCLUDED.sales_agent_id,
          customer_type = EXCLUDED.customer_type,
          customer_name = EXCLUDED.customer_name,
          company_name = EXCLUDED.company_name,
          customer_phone = EXCLUDED.customer_phone,
          customer_email = EXCLUDED.customer_email,
          delivery_address = EXCLUDED.delivery_address,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          subtotal = EXCLUDED.subtotal,
          discount = EXCLUDED.discount,
          grand_total = EXCLUDED.grand_total,
          dp_paid = EXCLUDED.dp_paid,
          remaining_balance = EXCLUDED.remaining_balance,
          status = EXCLUDED.status,
          created_at = EXCLUDED.created_at
    `;

    await sql`
      INSERT INTO order_items (
        id, order_id, item_type, catalog_offer_id, service_id, item_name, quantity, unit_price, total_price, coa_code
      ) VALUES
        (1, 1, 'ANIMAL', 8, NULL, 'Domba Tipe B (Bandung)', 50, 2100000.00, 105000000.00, NULL),
        (2, 1, 'CUSTOM', NULL, NULL, 'Sewa Truk Fuso B2B', 1, 2000000.00, 2000000.00, NULL),
        (3, 2, 'ANIMAL', 3, NULL, 'Domba Tipe A', 1, 3100000.00, 3100000.00, NULL),
        (4, 2, 'SERVICE', NULL, 1, 'Ongkos Kirim Domba Area Bandung', 1, 50000.00, 50000.00, NULL),
        (5, 3, 'ANIMAL', 7, NULL, 'Qurban Berbagi Domba Kambing', 1, 2500000.00, 2500000.00, NULL)
      ON CONFLICT (id) DO UPDATE
      SET order_id = EXCLUDED.order_id,
          item_type = EXCLUDED.item_type,
          catalog_offer_id = EXCLUDED.catalog_offer_id,
          service_id = EXCLUDED.service_id,
          item_name = EXCLUDED.item_name,
          quantity = EXCLUDED.quantity,
          unit_price = EXCLUDED.unit_price,
          total_price = EXCLUDED.total_price,
          coa_code = EXCLUDED.coa_code
    `;

    await sql`
      INSERT INTO order_participants (id, order_item_id, participant_name, father_name) VALUES
        (1, 3, 'Lili Apriliyani', 'Doddy Sebo'),
        (2, 5, 'Hasan Basri', 'Fulan')
      ON CONFLICT (id) DO UPDATE
      SET order_item_id = EXCLUDED.order_item_id,
          participant_name = EXCLUDED.participant_name,
          father_name = EXCLUDED.father_name
    `;

    await sql`
      INSERT INTO farm_inventories (
        id, generated_id, farm_animal_id, eartag_id, animal_variant_id, branch_id, vendor_id, 
        entry_date, acquisition_type, initial_product_type, pen_id, pan_name, 
        purchase_price, initial_weight_source, price_per_kg, shipping_cost, total_hpp, 
        horn_type, initial_weight, initial_type, final_type, weight_actual, 
        photo_url, status, order_item_id, created_at
      ) VALUES
        (1, 'RQ26A001', 'JT001', 'TAG-1001', 4, ${bandungId}, ${farmAgroId}, 
         '2026-01-17', 'MANDIRI', 'QURBAN ANTAR', 1, 'A', 
         6035000, 71, 85000, 32222, 6067222, 
         'TANDUK', 71, 'TIPE F', 'TIPE F', 24.50, 
         NULL, 'ALLOCATED', 3, '2026-05-01 08:00:00'),
        (2, 'RQ26A002', 'JT002', 'TAG-1002', 4, ${bandungId}, ${farmAgroId}, 
         '2026-01-17', 'MANDIRI', 'QURBAN ANTAR', 1, 'A', 
         5695000, 67, 85000, 32222, 5727222, 
         'TANDUK', 67, 'TIPE F', 'TIPE F', 25.10, 
         NULL, 'AVAILABLE', NULL, '2026-05-01 08:00:00'),
        (3, 'RQ26A003', 'JT003', 'TAG-1003', 4, ${bandungId}, ${farmAgroId}, 
         '2026-01-17', 'MANDIRI', 'QURBAN ANTAR', 1, 'A', 
         4573000, 53.8, 85000, 32222, 4605222, 
         'TANDUK', 53.8, 'TIPE F', 'TIPE F', 23.80, 
         NULL, 'AVAILABLE', NULL, '2026-05-01 08:00:00'),
        (4, 'RQ26B001', 'QB001', 'TAG-2001', 6, ${jakartaId}, 2, 
         '2026-01-20', 'BOOKING', 'QURBAN BERBAGI', 4, NULL, 
         5000000, 60, 80000, 40000, 5040000, 
         'POLL', 60, 'TIPE F', 'TIPE F', 25.00, 
         NULL, 'ALLOCATED', 5, '2026-05-23 09:00:00')
      ON CONFLICT (id) DO UPDATE
      SET generated_id = EXCLUDED.generated_id,
          farm_animal_id = EXCLUDED.farm_animal_id,
          eartag_id = EXCLUDED.eartag_id,
          animal_variant_id = EXCLUDED.animal_variant_id,
          branch_id = EXCLUDED.branch_id,
          vendor_id = EXCLUDED.vendor_id,
          entry_date = EXCLUDED.entry_date,
          acquisition_type = EXCLUDED.acquisition_type,
          initial_product_type = EXCLUDED.initial_product_type,
          pen_id = EXCLUDED.pen_id,
          pan_name = EXCLUDED.pan_name,
          purchase_price = EXCLUDED.purchase_price,
          initial_weight_source = EXCLUDED.initial_weight_source,
          price_per_kg = EXCLUDED.price_per_kg,
          shipping_cost = EXCLUDED.shipping_cost,
          total_hpp = EXCLUDED.total_hpp,
          horn_type = EXCLUDED.horn_type,
          initial_weight = EXCLUDED.initial_weight,
          initial_type = EXCLUDED.initial_type,
          final_type = EXCLUDED.final_type,
          weight_actual = EXCLUDED.weight_actual,
          status = EXCLUDED.status,
          order_item_id = EXCLUDED.order_item_id,
          created_at = EXCLUDED.created_at
    `;

    await sql`
      INSERT INTO animal_trackings (id, farm_inventory_id, milestone, description, location_lat, location_lng, media_url, logged_at)
      VALUES
        (1, 1, 'Foto Hewan Hidup', 'Hewan qurban Anda dalam kondisi sehat dan siap.', NULL, NULL, 'https://images.pexels.com/photos/288621/pexels-photo-288621.jpeg?auto=compress&cs=tinysrgb&w=600', '2026-05-01 09:00:00'),
        (2, 1, 'Persiapan Pengiriman', 'Hewan sedang disiapkan untuk dimuat ke dalam armada pengiriman.', NULL, NULL, NULL, '2026-05-18 10:00:00'),
        (3, 1, 'Dalam Perjalanan', 'Armada pengiriman sedang menuju ke alamat tujuan pengiriman Anda.', -6.91470000, 107.60980000, NULL, '2026-05-19 08:30:00'),
        (4, 1, 'Hewan Tiba di Lokasi', 'Hewan qurban telah tiba di alamat tujuan Anda dengan selamat.', -6.89120000, 107.60350000, 'https://images.pexels.com/photos/288621/pexels-photo-288621.jpeg?auto=compress&cs=tinysrgb&w=600', '2026-05-19 11:45:00'),
        (5, 4, 'Foto Hewan Hidup', 'Hewan qurban Anda telah disiapkan di kandang desa Brebes.', NULL, NULL, 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?auto=compress&cs=tinysrgb&w=600', '2026-05-23 10:00:00'),
        (6, 4, 'Proses Penyembelihan', 'Alhamdulillah, hewan qurban Anda telah disembelih sesuai syariat.', NULL, NULL, NULL, '2026-05-26 09:00:00'),
        (7, 4, 'Dikirim / Disalurkan', 'Daging qurban telah disalurkan kepada penerima manfaat di sekitar desa Brebes.', NULL, NULL, 'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=600', '2026-05-26 14:00:00'),
        (8, 4, 'Sertifikat Qurban', 'Sertifikat qurban Anda telah diterbitkan.', NULL, NULL, NULL, '2026-05-27 10:00:00')
      ON CONFLICT (id) DO UPDATE
      SET farm_inventory_id = EXCLUDED.farm_inventory_id,
          milestone = EXCLUDED.milestone,
          description = EXCLUDED.description,
          location_lat = EXCLUDED.location_lat,
          location_lng = EXCLUDED.location_lng,
          media_url = EXCLUDED.media_url,
          logged_at = EXCLUDED.logged_at
    `;

    await sql`
      INSERT INTO transactions (id, order_id, payment_method_code, transaction_type, amount, va_number, qr_code_url, status, transaction_date, created_at)
      VALUES
        (1, 1, 'TF_MANDIRI', 'DP', 50000000.00, NULL, NULL, 'VERIFIED', '2026-05-20 10:30:00', '2026-05-20 10:30:00'),
        (2, 2, 'XENDIT_VA_MANDIRI', 'PELUNASAN', 3150000.00, NULL, NULL, 'SUCCESS', '2026-05-21 11:05:00', '2026-05-21 11:05:00'),
        (3, 3, 'XENDIT_QRIS', 'PELUNASAN', 2500000.00, NULL, NULL, 'SUCCESS', '2026-05-22 08:05:00', '2026-05-22 08:05:00')
      ON CONFLICT (id) DO UPDATE
      SET order_id = EXCLUDED.order_id,
          payment_method_code = EXCLUDED.payment_method_code,
          transaction_type = EXCLUDED.transaction_type,
          amount = EXCLUDED.amount,
          va_number = EXCLUDED.va_number,
          qr_code_url = EXCLUDED.qr_code_url,
          status = EXCLUDED.status,
          transaction_date = EXCLUDED.transaction_date,
          created_at = EXCLUDED.created_at
    `;

    await sql`
      INSERT INTO payment_receipts (id, transaction_id, file_url, status, verifier_notes, uploaded_at)
      VALUES
        (1, 1, 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=600', 'APPROVED', 'DP Telkom has been verified.', '2026-05-20 10:35:00')
      ON CONFLICT (id) DO UPDATE
      SET transaction_id = EXCLUDED.transaction_id,
          file_url = EXCLUDED.file_url,
          status = EXCLUDED.status,
          verifier_notes = EXCLUDED.verifier_notes,
          uploaded_at = EXCLUDED.uploaded_at
    `;

    await sql`
      INSERT INTO payment_logs (id, transaction_id, reference_id, log_type, payload, response)
      VALUES
        (
          1, 2, 'XND-VA-12345', 'CALLBACK_RECEIVED', 
          '{"external_id": "VA_MANDIRI_3150000", "amount": 3150000, "status": "COMPLETED"}'::jsonb,
          '{"status": "processed"}'::jsonb
        ),
        (
          2, 3, 'XND-QRIS-67890', 'QRIS_PAID', 
          '{"qr_id": "QR-001", "amount": 2500000, "channel": "SHOPEEPAY"}'::jsonb,
          '{"status": "success"}'::jsonb
        )
      ON CONFLICT (id) DO UPDATE
      SET transaction_id = EXCLUDED.transaction_id,
          reference_id = EXCLUDED.reference_id,
          log_type = EXCLUDED.log_type,
          payload = EXCLUDED.payload,
          response = EXCLUDED.response
    `;

    await sql`
      INSERT INTO notif_templates (id, name, template_text, created_at)
      VALUES
        (1, 'DP_RECEIVED', 'Halo {{name}}, DP untuk {{invoice}} telah kami terima.', '2026-05-20 10:01:00')
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          template_text = EXCLUDED.template_text
    `;

    await sql`
      INSERT INTO notif_logs (id, order_id, template_id, target_number, status, payload, provider_response, created_at)
      VALUES
        (
          1, 1, 1, '08123456789', 'SENT',
          '{"name": "Bpk. Ahmad", "invoice": "INV-B2B-001"}'::jsonb,
          '{}'::jsonb,
          '2026-05-20 10:40:00'
        )
      ON CONFLICT (id) DO UPDATE
      SET order_id = EXCLUDED.order_id,
          template_id = EXCLUDED.template_id,
          target_number = EXCLUDED.target_number,
          status = EXCLUDED.status,
          payload = EXCLUDED.payload,
          provider_response = EXCLUDED.provider_response
    `;

    await sql`COMMIT`;
    // eslint-disable-next-line no-console
    console.log("Seed complete.");
  } catch (e) {
    await sql`ROLLBACK`;
    throw e;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
