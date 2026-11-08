-- ============================================================================
-- SEED: 70 makanan TKPI 2019 -> public.food_database (Daryapedia)
-- ============================================================================
-- CARA PAKAI (WAJIB MANUAL — migrasi ini TIDAK auto-jalan):
--   1. Buka Supabase Dashboard -> project "darya" -> SQL Editor -> New query.
--   2. Tempel SELURUH isi file ini, lalu klik Run.
--   3. Cek hasil: SELECT count(*) FROM public.food_database WHERE verified
--      AND source = 'TKPI 2019';  -- harus 70.
--   File ini HANYA seed data. Jangan dijalankan dua kali tanpa cek — aman
--   diulang (idempotent, lihat bawah), tapi tabel tetap KOSONG sampai langkah
--   di atas dilakukan.
--
-- SUMBER DATA:
--   Tabel Komposisi Pangan Indonesia (TKPI) 2019, Kementerian Kesehatan RI
--   (data pemerintah Indonesia). File sumber:
--   ~/workspace/darya-nutrition-db/data/tkpi_seed.json — 70 makanan,
--   nilai per 100 g, terverifikasi per baris (lihat SOURCES.md di repo itu).
--   TIDAK ADA nilai yang dikarang: hanya nilai yang tercantum di file sumber.
--
-- PEMETAAN KOLOM (tabel food_database dari migrasi 001):
--   id       = 'tkpi-<kode TKPI>' (mis. 'tkpi-ap001') — deterministik, PK.
--   name     = nama makanan (TKPI).
--   portion  = '100 g' (semua nilai TKPI adalah per 100 g).
--   calories = energy_kcal | protein = protein_g | carbs = carbs_g
--   fat      = fat_g (semua dari file sumber, apa adanya).
--   verified = true (data terverifikasi per baris dari TKPI 2019).
--   source   = 'TKPI 2019'.
--   license  = 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'.
--   barcode, icon = NULL (tidak ada di sumber TKPI; kolom tidak diisi).
--
-- PERHATIAN — KOLOM GULA TIDAK ADA:
--   Tabel food_database (migrasi 001) TIDAK punya kolom gula/sugar, jadi
--   tidak ada nilai gula yang disimpan. TKPI 2019 memang tidak punya kolom
--   gula (sugar_g = null untuk semua 70 baris di file sumber).
--
-- PERHATIAN — 3 NILAI MAKRO YANG TIDAK TERCANTUM DI TKPI:
--   TKPI menulis '-' (tidak tercantum) untuk 3 sel ini; file sumber
--   menyimpannya sebagai null. Karena kolom carbs/fat di food_database
--   NOT NULL, sel ini diisi DEFAULT (= 0, default kolom) — BUKAN nilai ukur,
--   dan HARUS dikoreksi bila angka resminya ditemukan:
--     FR005 Ayam, daging, segar            -> carbs DEFAULT (0)
--     GR004 Ikan bandeng, segar             -> carbs DEFAULT (0)
--     HR004 Telur ayam ras, bagian putih   -> fat   DEFAULT (0)
--   Semua nilai lain (termasuk semua kalori & protein) tercantum di TKPI.
--
-- IDEMPOTENSI:
--   ON CONFLICT (id) DO NOTHING — id adalah PRIMARY KEY tabel (migrasi 001),
--   jadi baris yang sudah ada dilewati dan file aman dijalankan ulang.
--   (Tidak pakai ON CONFLICT (name): name TIDAK punya unique constraint.)
-- ============================================================================

INSERT INTO public.food_database
  (id, name, portion, calories, protein, carbs, fat, verified, source, license)
VALUES
  ('tkpi-ap001', 'Nasi', '100 g', 180, 3, 39.8, 0.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap002', 'Nasi tim', '100 g', 120, 2.4, 26, 0.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap003', 'Tapai beras', '100 g', 99, 1.7, 22.4, 0.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap004', 'Tepung beras, mentah', '100 g', 353, 7, 80, 0.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap005', 'Nasi beras merah', '100 g', 149, 2.8, 32.5, 0.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap006', 'Bihun, mentah', '100 g', 348, 4.7, 82.1, 0.1, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap007', 'Bihun goreng instan', '100 g', 381, 6.1, 80.3, 3.9, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap008', 'Bihun jagung, mentah', '100 g', 354, 0.5, 87.4, 0.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap009', 'Nasi jagung', '100 g', 357, 8.8, 79.5, 0.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap010', 'Jagung muda, rebus', '100 g', 142, 5, 30.3, 0.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap011', 'Jagung kuning, tepung', '100 g', 355, 9.2, 73.7, 3.9, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap012', 'Jagung kuning pipil, rebus', '100 g', 154, 3.8, 28.4, 3.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap015', 'Ketan hitam, matang', '100 g', 181, 4, 37.3, 1.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap017', 'Ketan putih, matang', '100 g', 163, 3, 35.7, 0.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap018', 'Tapai ketan putih', '100 g', 172, 3, 37.5, 0.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap020', 'Makaroni, mentah', '100 g', 353, 8.7, 78.7, 0.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap021', 'Mi basah', '100 g', 88, 0.6, 14, 3.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap023', 'Misoa', '100 g', 345, 8.5, 78, 2.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap025', 'Tepung terigu', '100 g', 333, 9, 77.2, 1, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap029', 'Biskuit', '100 g', 458, 6.9, 75.1, 14.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap030', 'Bakpia, kue', '100 g', 272, 8.7, 44.1, 6.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap031', 'Bakwan', '100 g', 280, 8.2, 39, 10.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap060', 'Ketoprak', '100 g', 153, 7.9, 13, 7.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap085', 'Mie ayam', '100 g', 102, 6.2, 10.5, 3.9, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap086', 'Mie bakso', '100 g', 114, 5.3, 16.4, 3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap089', 'Nasi gemuk', '100 g', 192, 3.8, 24.4, 8.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap090', 'Nasi gurih', '100 g', 190, 4.7, 26, 7.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap092', 'Nasi rames', '100 g', 155, 10.3, 19.1, 4.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ap106', 'Spaghetti', '100 g', 139, 7.4, 22.6, 2.1, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-ar001', 'Beras giling, mentah', '100 g', 357, 8.4, 77.1, 1.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-bp002', 'Batatas kelapa, ubi, kukus', '100 g', 92, 1.2, 21, 0.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-bp008', 'Ketela pohon/singkong kukus', '100 g', 153, 1.2, 36.4, 0.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-bp010', 'Talas bogor, kukus', '100 g', 120, 1.5, 28.2, 0.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-bp036', 'Keripik kentang', '100 g', 448, 2.7, 67.1, 18.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-br013', 'Kentang, segar', '100 g', 62, 2.1, 13.5, 0.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp012', 'Kacang tanah, goreng', '100 g', 564, 25.5, 25.5, 44.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp013', 'Kacang tanah, rebus', '100 g', 220, 10.6, 8, 18, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp016', 'Ampas tahu, mentah', '100 g', 67, 5, 8.1, 2.1, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp037', 'Kembang tahu', '100 g', 380, 48.9, 23.3, 13.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp061', 'Tahu, mentah', '100 g', 80, 10.9, 0.8, 4.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp062', 'Tahu goreng', '100 g', 115, 9.7, 2.5, 8.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp076', 'Tempe kedelai murni, goreng', '100 g', 350, 24.5, 10.4, 26.6, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp077', 'Tempe kedelai murni, mentah', '100 g', 201, 20.8, 13.5, 8.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp082', 'Tempe pasar', '100 g', 150, 14, 9.1, 7.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cp083', 'Tempe pasar goreng', '100 g', 336, 20, 7.8, 28, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-cr032', 'Kacang tanah, kering', '100 g', 525, 27.9, 17.4, 42.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-dp001', 'Bayam, kukus', '100 g', 30, 1.3, 5.8, 0.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-dp002', 'Bayam, rebus', '100 g', 23, 1.2, 3.7, 0.6, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-dp020', 'Wortel, rebus', '100 g', 28, 0.7, 6.3, 0.5, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-dp021', 'Wortel, kukus', '100 g', 37, 1, 8.3, 0.6, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-dr008', 'Bayam, segar', '100 g', 16, 0.9, 2.9, 0.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-dr166', 'Wortel, segar', '100 g', 36, 1, 7.9, 0.6, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp001', 'Ayam, ampela, goreng', '100 g', 270, 32.3, 9.9, 11.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp002', 'Ayam, usus, goreng', '100 g', 473, 45.2, 13.9, 26.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp024', 'Ayam goreng kalasan, paha', '100 g', 275, 37.4, 1.3, 12.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp025', 'Ayam goreng kentucky, dada', '100 g', 298, 34.2, 0.1, 16.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp026', 'Ayam goreng kentucky, paha', '100 g', 286, 32.1, 1.1, 16.1, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp027', 'Ayam goreng kentucky, sayap', '100 g', 297, 35.9, 1.6, 15.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fp034', 'Ayam taliwang, masakan', '100 g', 264, 18.2, 2.7, 20.1, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-fr005', 'Ayam, daging, segar', '100 g', 298, 18.2, DEFAULT, 25, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-gp005', 'Ikan bandeng presto, masakan', '100 g', 296, 17.1, 11.3, 20.3, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-gp090', 'Sate bandeng', '100 g', 283, 12.1, 20.9, 16.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-gp094', 'Tumis bandeng', '100 g', 189, 11.3, 0.6, 15.7, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-gr004', 'Ikan bandeng, segar', '100 g', 123, 20, DEFAULT, 4.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-hp001', 'Telur ayam, dadar, masakan', '100 g', 251, 16.3, 1.4, 19.4, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-hr001', 'Telur ayam kampung, segar', '100 g', 174, 10.8, 1.2, 14, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-hr002', 'Telur ayam ras, segar', '100 g', 154, 12.4, 0.7, 10.8, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-hr003', 'Telur ayam ras, bagian kuning, segar', '100 g', 355, 16.3, 0.7, 31.9, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-hr004', 'Telur ayam ras, bagian putih, segar', '100 g', 50, 10.8, 0.8, DEFAULT, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)'),
  ('tkpi-er076', 'Pisang ayam, segar', '100 g', 120, 1.1, 26.8, 0.2, true, 'TKPI 2019', 'TKPI 2019 - Kementerian Kesehatan RI (data pemerintah Indonesia)')
ON CONFLICT (id) DO NOTHING;
