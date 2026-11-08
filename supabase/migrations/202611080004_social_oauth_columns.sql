-- ============================================================================
-- MIGRASI: kolom OAuth untuk public.connected_accounts (Daryapedia)
-- ============================================================================
-- CARA PAKAI (WAJIB MANUAL — migrasi ini TIDAK auto-jalan):
--   1. Buka Supabase Dashboard -> project "darya" -> SQL Editor -> New query.
--   2. Tempel SELURUH isi file ini, lalu klik Run.
--   3. Cek hasil: SELECT column_name FROM information_schema.columns
--      WHERE table_name = 'connected_accounts' AND column_name IN ('state','external_user_id');
--      -- harus 2 baris.
--
-- KENAPA PERLU:
--   Endpoint POST /api/social/{instagram,threads} dan GET /api/social/callback
--   (server/worker.js) memakai kolom `state` (token acak penanda sesi OAuth)
--   dan `external_user_id` (id akun Instagram/Threads) serta status 'pending'.
--   Tanpa migrasi ini, hubungkan akun akan gagal di Supabase.
--   TIDAK ada token akses/refresh yang disimpan di tabel ini — sesuai komentar
--   di migrasi 001: kredensial OAuth harus tinggal di penyimpanan terpisah.
--   File ini idempotent (aman dijalankan ulang).
-- ============================================================================

alter table public.connected_accounts
  add column if not exists state text,
  add column if not exists external_user_id text;

-- Longgarkan check status ('connected','expired') -> tambah 'pending'.
-- Nama constraint dicari dinamis (dibuat otomatis Postgres dari migrasi 001),
-- supaya migrasi tidak gagal bila namanya berbeda.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = any(con.conkey)
    where con.conrelid = 'public.connected_accounts'::regclass
      and con.contype = 'c'
      and att.attname = 'status'
  loop
    execute 'alter table public.connected_accounts drop constraint ' || quote_ident(c.conname);
  end loop;
end $$;

alter table public.connected_accounts
  add constraint connected_accounts_status_check
  check (status in ('connected', 'expired', 'pending'));
