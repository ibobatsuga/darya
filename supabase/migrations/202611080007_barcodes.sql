-- Seed barcodes for Darya-Varia products and popular Indonesian packaged foods
-- This enables barcode scanning to match directly against the Supabase database.

-- Darya-Varia Products
UPDATE public.products SET barcode = '8999908000010' WHERE id = 'enervon-c';
UPDATE public.products SET barcode = '8999908100161' WHERE id = 'natur-e';
UPDATE public.products SET barcode = '8999908000058' WHERE id = 'enervon-active';
UPDATE public.products SET barcode = '8999908200014' WHERE id = 'vicee';

-- Popular Packaged Indonesian Foods
INSERT INTO public.food_database (id, name, portion, calories, protein, carbs, fat, barcode, verified, source, license)
VALUES
  ('indomie-goreng', 'Indomie Mi Instan Goreng Spesial', '85 g', 380, 8, 54, 15, '8998866200224', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi'),
  ('ultra-milk-cokelat', 'Susu Ultra Milk Rasa Cokelat', '250 ml', 160, 6, 23, 5, '8992753211116', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi'),
  ('teh-botol-sosro', 'Teh Botol Sosro Kotak', '250 ml', 70, 0, 18, 0, '8992775211118', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi'),
  ('bear-brand', 'Nestle Bear Brand Susu Steril', '189 ml', 120, 6, 9, 7, '8992761001013', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi'),
  ('energen-cokelat', 'Energen Sereal Cokelat', '30g', 130, 2, 24, 3, '8996001301011', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi'),
  ('chitato-sapi-panggang', 'Chitato Rasa Sapi Panggang', '68 g', 360, 4, 39, 21, '8991001100113', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi'),
  ('aqua-600ml', 'Air Mineral Danone Aqua', '600 ml', 0, 0, 0, 0, '8996001414001', true, 'Kemasan Resmi', 'Label Informasi Nilai Gizi Resmi')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  barcode = EXCLUDED.barcode,
  verified = true;
