-- Naikkan batas analisis AI harian dari 10 menjadi 30 per pengguna per hari (WIB).
-- Fungsi lama di 202611080001_initial.sql mengunci batas atas di 10
-- (least(greatest(p_limit,1),10)), jadi menaikkan env var saja tidak cukup:
-- fungsi ini harus diganti agar batas baru berlaku.
-- Kuota tetap dipakai bersama oleh Darya AI (consult) dan estimasi makanan
-- (food-estimate: AI Tulis Bebas + AI Foto Piring).
begin;
create or replace function public.consume_ai_quota(p_limit integer default 30) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare count_now integer; day_now date := (now() at time zone 'Asia/Jakarta')::date; uid uuid := auth.uid(); quota integer := least(greatest(p_limit,1),30);
begin
 if uid is null then raise exception 'Authentication required'; end if;
 insert into public.daily_usage(user_id,date,calls) values(uid,day_now,1)
 on conflict(user_id,date) do update set calls=daily_usage.calls+1 where daily_usage.calls<quota
 returning calls into count_now;
 if count_now is null then return -1; end if;
 return quota-count_now;
end $$;
revoke all on function public.consume_ai_quota(integer) from public;
grant execute on function public.consume_ai_quota(integer) to authenticated;
commit;
