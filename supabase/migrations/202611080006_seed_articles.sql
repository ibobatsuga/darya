-- Seed official reviewed articles into public.articles
-- This satisfies the foreign key constraint on public.article_bookmarks(article_id)
-- and populates reviewed articles for the dashboard and article feed.

insert into public.articles (id, title, category, summary, body, art, read_time, related_products, reviewed, reviewer, reviewed_at, published_at)
values
  (
    'mulai-lari',
    'Mulai lari pelan-pelan, badan makin bugar',
    'Gerak & kebugaran',
    'Tidak perlu langsung jauh. Mulai dari langkah kecil yang bisa kamu ulang besok.',
    '["Rutinitas bergerak bisa dimulai dari berjalan santai. Bila tubuh terasa nyaman, coba selingi jalan dengan lari ringan dan tingkatkan secara bertahap sesuai kemampuan.", "Sisihkan waktu untuk pemanasan dan pendinginan. Hari istirahat juga bagian dari kebiasaan aktif. Jangan memaksakan diri mengejar jarak atau kecepatan tertentu.", "Catat aktivitas di Daryapedia untuk melihat kebiasaan yang mulai terbentuk. Jika timbul nyeri dada, pusing, atau sesak yang tidak biasa, hentikan aktivitas dan cari pertolongan medis."]'::jsonb,
    'run',
    4,
    array['enervon-active']::text[],
    true,
    'Tim Medis Daryapedia',
    now(),
    now()
  ),
  (
    'hidup-seimbang',
    'Tubuh sehat dimulai dari kebiasaan sederhana',
    'Gaya hidup',
    'Gerak, makan, tidur, dan pikiran tenang. Empat hal kecil yang saling melengkapi.',
    '["Keseharian yang seimbang bukan soal melakukan semuanya dengan sempurna. Pilih satu kebiasaan sederhana: berjalan setelah makan, menambah sayur, atau mematikan layar lebih awal.", "Tidur, pola makan, aktivitas, dan pengelolaan stres saling mendukung. Mencatatnya dapat membantu kamu mengenali pola yang membuat tubuh terasa nyaman.", "Suplemen bukan pengganti makanan bergizi dan tidak selalu dibutuhkan setiap orang. Diskusikan kebutuhanmu dengan apoteker atau dokter."]'::jsonb,
    'balance',
    5,
    array['enervon-c']::text[],
    true,
    'Tim Medis Daryapedia',
    now(),
    now()
  ),
  (
    'musim-kemarau',
    'Cuaca panas? Tetap fit dari dalam',
    'Daya tahan tubuh',
    'Cukup cairan dan istirahat adalah awal yang baik untuk hari yang lebih nyaman.',
    '["Saat cuaca panas, perhatikan kebutuhan cairan dan sesuaikan aktivitas dengan kondisi tubuh. Siapkan air minum dan beristirahat di tempat teduh jika diperlukan.", "Makanan beragam, tidur cukup, dan perlindungan kulit dari matahari tetap menjadi dasar rutinitas harian. Kebutuhan cairan dapat berbeda pada orang dengan kondisi medis tertentu.", "Bila lemas berat, bingung, atau keluhan tidak membaik, segera minta bantuan tenaga kesehatan."]'::jsonb,
    'water',
    3,
    array['vicee', 'natur-e']::text[],
    true,
    'Tim Medis Daryapedia',
    now(),
    now()
  ),
  (
    'lingkar-perut',
    'Kenali tubuhmu, lebih dari angka timbangan',
    'Jaga berat badan',
    'Bangun kebiasaan yang mendukung kesehatan, bukan sekadar mengejar angka.',
    '["Berat dan lingkar perut hanya sebagian dari gambaran kesehatan. Perubahan bertahap pada pola makan dan aktivitas lebih mudah dipertahankan daripada target yang terlalu ketat.", "Kurangi minuman manis secara perlahan dan temukan aktivitas yang kamu sukai. Bila ingin mengubah target berat, konsultasikan dengan tenaga kesehatan, terutama bila ada kondisi khusus."]'::jsonb,
    'balance',
    4,
    array[]::text[],
    true,
    'Tim Medis Daryapedia',
    now(),
    now()
  ),
  (
    'gula-darah',
    'Masih muda, tetap peduli gula darah',
    'Gaya hidup',
    'Kenali kebiasaan sehari-hari dan diskusikan pemeriksaan yang tepat.',
    '["Kebiasaan duduk lama, kurang tidur, dan minuman manis patut diperhatikan pada berbagai usia. Mulailah dengan jeda bergerak dan memilih air putih lebih sering.", "Pemeriksaan gula darah dan penilaian risiko dilakukan bersama tenaga kesehatan. Tidak ada suplemen yang ditawarkan di sini untuk mencegah atau mengobati diabetes."]'::jsonb,
    'water',
    4,
    array[]::text[],
    true,
    'Tim Medis Daryapedia',
    now(),
    now()
  )
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  body = excluded.body,
  reviewed = true,
  reviewer = excluded.reviewer,
  reviewed_at = now();
