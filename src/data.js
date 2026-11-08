import tkpiData from './data/tkpi_seed.json';

export const goals = [
  { id: 'skin', name: 'Kulit & kecantikan', icon: 'sparkles' },
  { id: 'energy', name: 'Energi & fokus', icon: 'zap' },
  { id: 'immunity', name: 'Daya tahan tubuh', icon: 'shield-check' },
  { id: 'weight', name: 'Jaga berat badan', icon: 'scale' },
  { id: 'sleep', name: 'Kualitas tidur', icon: 'moon' },
  { id: 'digestion', name: 'Pencernaan', icon: 'leaf' },
];

// Display fixtures only. These are NOT verified clinical records or recommendations.
// Production reads exclusively from the reviewed Supabase catalogue.
export const previewProducts = [
  { id: 'enervon-c', name: 'Enervon-C', subtitle: 'Multivitamin untuk keseharian aktif', category: 'Vitamin', kind: 'supplement', brand: 'ENERVON', variant: 'C', color: 'orange', icon: 'zap', goals: ['immunity', 'energy'], form: 'Tablet', verified: false, composition: null, dosage: null, warnings: null, order_url: null },
  { id: 'natur-e', name: 'Natur-E', subtitle: 'Kenali pilihan nutrisi untuk kulitmu', category: 'Nutrisi kulit', kind: 'supplement', brand: 'natur-E', variant: 'Vitamin E', color: 'green', icon: 'sparkles', goals: ['skin'], form: 'Kapsul lunak', verified: false, composition: null, dosage: null, warnings: null, order_url: null },
  { id: 'enervon-active', name: 'Enervon Active', subtitle: 'Temani rutinitas dan aktivitas harian', category: 'Vitamin', kind: 'supplement', brand: 'ENERVON', variant: 'ACTIVE', color: 'red', icon: 'activity', goals: ['energy'], form: 'Tablet', verified: false, composition: null, dosage: null, warnings: null, order_url: null },
  { id: 'vicee', name: 'Vicee', subtitle: 'Pilihan vitamin C untuk hari-harimu', category: 'Vitamin', kind: 'supplement', brand: 'vicee', variant: 'Vitamin C', color: 'yellow', icon: 'sun', goals: ['immunity'], form: 'Tablet', verified: false, composition: null, dosage: null, warnings: null, order_url: null },
];

export const previewArticles = [
  { id: 'mulai-lari', title: 'Mulai lari pelan-pelan, badan makin bugar', category: 'Gerak & kebugaran', summary: 'Tidak perlu langsung jauh. Mulai dari langkah kecil yang bisa kamu ulang besok.', read_time: 4, art: 'run', related_products: ['enervon-active'], reviewed: false,
    body: ['Rutinitas bergerak bisa dimulai dari berjalan santai. Bila tubuh terasa nyaman, coba selingi jalan dengan lari ringan dan tingkatkan secara bertahap sesuai kemampuan.', 'Sisihkan waktu untuk pemanasan dan pendinginan. Hari istirahat juga bagian dari kebiasaan aktif. Jangan memaksakan diri mengejar jarak atau kecepatan tertentu.', 'Catat aktivitas di Daryapedia untuk melihat kebiasaan yang mulai terbentuk. Jika timbul nyeri dada, pusing, atau sesak yang tidak biasa, hentikan aktivitas dan cari pertolongan medis.'] },
  { id: 'hidup-seimbang', title: 'Tubuh sehat dimulai dari kebiasaan sederhana', category: 'Gaya hidup', summary: 'Gerak, makan, tidur, dan pikiran tenang. Empat hal kecil yang saling melengkapi.', read_time: 5, art: 'balance', related_products: ['enervon-c'], reviewed: false,
    body: ['Keseharian yang seimbang bukan soal melakukan semuanya dengan sempurna. Pilih satu kebiasaan sederhana: berjalan setelah makan, menambah sayur, atau mematikan layar lebih awal.', 'Tidur, pola makan, aktivitas, dan pengelolaan stres saling mendukung. Mencatatnya dapat membantu kamu mengenali pola yang membuat tubuh terasa nyaman.', 'Suplemen bukan pengganti makanan bergizi dan tidak selalu dibutuhkan setiap orang. Diskusikan kebutuhanmu dengan apoteker atau dokter.'] },
  { id: 'musim-kemarau', title: 'Cuaca panas? Tetap fit dari dalam', category: 'Daya tahan tubuh', summary: 'Cukup cairan dan istirahat adalah awal yang baik untuk hari yang lebih nyaman.', read_time: 3, art: 'water', related_products: ['vicee', 'natur-e'], reviewed: false,
    body: ['Saat cuaca panas, perhatikan kebutuhan cairan dan sesuaikan aktivitas dengan kondisi tubuh. Siapkan air minum dan beristirahat di tempat teduh jika diperlukan.', 'Makanan beragam, tidur cukup, dan perlindungan kulit dari matahari tetap menjadi dasar rutinitas harian. Kebutuhan cairan dapat berbeda pada orang dengan kondisi medis tertentu.', 'Bila lemas berat, bingung, atau keluhan tidak membaik, segera minta bantuan tenaga kesehatan.'] },
  { id: 'lingkar-perut', title: 'Kenali tubuhmu, lebih dari angka timbangan', category: 'Jaga berat badan', summary: 'Bangun kebiasaan yang mendukung kesehatan, bukan sekadar mengejar angka.', read_time: 4, art: 'balance', related_products: [], reviewed: false,
    body: ['Berat dan lingkar perut hanya sebagian dari gambaran kesehatan. Perubahan bertahap pada pola makan dan aktivitas lebih mudah dipertahankan daripada target yang terlalu ketat.', 'Kurangi minuman manis secara perlahan dan temukan aktivitas yang kamu sukai. Bila ingin mengubah target berat, konsultasikan dengan tenaga kesehatan, terutama bila ada kondisi khusus.'] },
  { id: 'gula-darah', title: 'Masih muda, tetap peduli gula darah', category: 'Gaya hidup', summary: 'Kenali kebiasaan sehari-hari dan diskusikan pemeriksaan yang tepat.', read_time: 4, art: 'water', related_products: [], reviewed: false,
    body: ['Kebiasaan duduk lama, kurang tidur, dan minuman manis patut diperhatikan pada berbagai usia. Mulailah dengan jeda bergerak dan memilih air putih lebih sering.', 'Pemeriksaan gula darah dan penilaian risiko dilakukan bersama tenaga kesehatan. Tidak ada suplemen yang ditawarkan di sini untuk mencegah atau mengobati diabetes.'] },
];

const iconMap = {
  Serealia: 'wheat',
  Daging: 'drumstick',
  Ikan: 'fish',
  Telur: 'egg',
  Buah: 'apple',
  Sayur: 'salad',
  Kacang: 'nut',
  Susu: 'milk',
  Lemak: 'flame',
};

// Database pangan Indonesia dari TKPI 2019 (Kemenkes RI) via darya-nutrition-db
export const foods = (tkpiData.foods || []).map(f => ({
  id: (f.code || f.name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
  code: f.code,
  name: f.name,
  portion: '1 porsi · 100 g',
  calories: Math.round(Number(f.energy_kcal) || 0),
  protein: Number(f.protein_g) || 0,
  carbs: Number(f.carbs_g) || 0,
  fat: Number(f.fat_g) || 0,
  group: f.group,
  aliases: f.aliases || [],
  icon: iconMap[f.group] || 'utensils',
}));

export const exerciseOptions = [
  ['walking', 'Jalan santai (Walking)'],
  ['running', 'Lari / Jogging'],
  ['cycling', 'Bersepeda (Cycling)'],
  ['swimming', 'Berenang (Swimming)'],
  ['yoga', 'Yoga & Stretching'],
  ['strength', 'Latihan kekuatan / Gym'],
  ['hiit', 'HIIT / Cardio interval'],
  ['pilates', 'Pilates / Core training'],
  ['aerobics', 'Senam aerobik'],
  ['jump-rope', 'Lompat tali (Jump rope)'],
  ['badminton', 'Bulu tangkis / Badminton'],
];

export const exerciseBurnRates = {
  walking: 4.5,
  running: 10,
  cycling: 8,
  swimming: 9,
  yoga: 3.5,
  strength: 6,
  hiit: 11,
  pilates: 5,
  aerobics: 6.5,
  'jump-rope': 12,
  badminton: 7,
};

export const previewFoodLogs = [
  { id: 'example-1', name: 'Oatmeal, pisang & susu', meal: 'Sarapan', calories: 380, protein: 15, carbs: 58, fat: 10, time: '07.30', icon: 'soup', example: true },
  { id: 'example-2', name: 'Nasi, ayam & sayuran', meal: 'Makan siang', calories: 620, protein: 35, carbs: 78, fat: 18, time: '12.15', icon: 'salad', example: true },
  { id: 'example-3', name: 'Yogurt & buah segar', meal: 'Camilan', calories: 280, protein: 12, carbs: 38, fat: 8, time: '15.00', icon: 'apple', example: true },
];
