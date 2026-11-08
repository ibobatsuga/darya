# Daryapedia

AI wellness companion gratis, mobile-first PWA untuk Darya Varia. Implementasi berdasarkan PRD v1.1 dan referensi desain yang diberikan pemilik proyek.

## Pengembangan

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Isi Project URL dan publishable key Supabase dalam `.env.local`. Semua secret AI dan service-role disimpan di environment server, tidak di Git.

## Cakupan implementasi

- Dashboard, tema terang/gelap, dan navigasi responsif.
- Onboarding 6 langkah dengan pemeriksaan keamanan.
- Catat makanan, berat, exercise, dan suplemen.
- Katalog produk, bacaan, bookmark, rencana sehat, dan kartu pencapaian.
- Supabase Auth, skema PostgreSQL dengan RLS, serta Cloudflare Worker API.
- Adapter Sakelar OpenAI-compatible dengan model `gpt-6.1-terra`.

## Status

Kode sedang melalui audit UI/UX dan pengujian. Belum dinyatakan siap rilis publik. Deployment Cloudflare dan integrasi layanan belum terverifikasi karena pembatasan jaringan lingkungan. Data contoh bukan data produk terverifikasi. OAuth Instagram/Threads membutuhkan konfigurasi Meta; jangan menganggap tombol koneksi sebagai integrasi aktif.

## Perintah

```sh
npm run build
npm test
npm run worker:dev
npm run deploy
```
