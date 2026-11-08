begin;
create extension if not exists pgcrypto;
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}', onboarding_complete boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.onboarding_answers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 safety jsonb not null, red_flag boolean not null default true
);
create table public.products (
 id text primary key, name text not null, subtitle text, brand text, variant text,
 category text not null, kind text not null check(kind in ('supplement','otc','prescription')),
 composition text, benefits text, dosage text, warnings text, form text,
 goals text[] not null default '{}', color text, icon text, barcode text unique,
 order_url text check(order_url is null or order_url like 'https://%'),
 verified boolean not null default false, updated_at timestamptz not null default now(),
 check(not verified or (composition is not null and dosage is not null and warnings is not null))
);
create table public.articles (
 id text primary key, title text not null, category text not null, summary text not null,
 body jsonb not null default '[]', art text default 'balance', read_time integer default 4,
 related_products text[] default '{}', reviewed boolean not null default false,
 reviewer text, reviewed_at timestamptz, published_at timestamptz not null default now(), source_url text,
 check(not reviewed or (reviewer is not null and reviewed_at is not null))
);
create table public.food_database (
 id text primary key, name text not null, portion text not null, calories numeric not null check(calories>=0),
 protein numeric not null default 0 check(protein>=0), carbs numeric not null default 0 check(carbs>=0), fat numeric not null default 0 check(fat>=0),
 barcode text unique, icon text, verified boolean not null default false, source text not null, license text not null
);
create table public.consultations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 summary text not null, cache_key text not null, response jsonb not null, created_at timestamptz not null default now()
);
create table public.recommendations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 consultation_id uuid not null references public.consultations(id) on delete cascade,
 product_id text not null references public.products(id), reason text not null, created_at timestamptz not null default now()
);
create table public.order_clicks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.products(id), source text not null check(source in ('catalogue','consultation')),
 created_at timestamptz not null default now()
);
create table public.shares (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 completed integer not null check(completed between 0 and 3), channel text not null default 'device', created_at timestamptz not null default now()
);
create table public.audit_log (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 event text not null check(event in ('recommendation','safety_flag','message_flag','profile_incomplete')),
 red_flag boolean not null, product_ids text[] not null default '{}', created_at timestamptz not null default now()
);
create table public.weight_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 weight numeric not null check(weight between 25 and 350), date date not null default current_date,
 created_at timestamptz not null default now()
);
create table public.exercise_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 activity text not null, minutes numeric not null check(minutes between 1 and 600),
 calories numeric not null check(calories>=0), estimated boolean not null default true, date date not null default current_date,
 created_at timestamptz not null default now()
);
create table public.food_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, meal text not null, calories numeric not null check(calories between 0 and 10000),
 protein numeric not null check(protein between 0 and 1000), carbs numeric not null check(carbs between 0 and 1000), fat numeric not null check(fat between 0 and 1000),
 source text not null check(source in ('text','photo','manual','barcode')), estimated boolean not null default true,
 corrected boolean not null default false, date date not null default current_date, created_at timestamptz not null default now()
);
create table public.supplement_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.products(id), time time not null, taken boolean not null default true,
 date date not null default current_date, created_at timestamptz not null default now()
);
create table public.article_bookmarks (
 user_id uuid not null references auth.users(id) on delete cascade, article_id text not null references public.articles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id, article_id)
);
create table public.connected_accounts (
 user_id uuid not null references auth.users(id) on delete cascade, platform text not null check(platform in ('instagram','threads')),
 status text not null default 'connected' check(status in ('connected','expired')), connected_at timestamptz not null default now(),
 primary key(user_id, platform)
);
-- OAuth credentials, when enabled, must live in a separate service-role-only encrypted store.
-- Never add access_token/refresh_token to the user-visible connected_accounts table.
create table public.habit_logs (
 user_id uuid not null references auth.users(id) on delete cascade, habit_id text not null check(habit_id in ('breakfast','move','rest')),
 date date not null, done boolean not null default false, primary key(user_id, date, habit_id)
);
create table public.water_logs (
 user_id uuid not null references auth.users(id) on delete cascade, date date not null, glasses integer not null check(glasses between 0 and 40),
 primary key(user_id, date)
);
create table public.daily_usage (
 user_id uuid not null references auth.users(id) on delete cascade, date date not null, calls integer not null default 0,
 primary key(user_id, date)
);
-- Every user-owned record is isolated even if a caller bypasses the Worker.
do $$ declare t text; begin
 foreach t in array array['profiles','onboarding_answers','consultations','recommendations','order_clicks','shares','weight_logs','exercise_logs','food_logs','supplement_logs','article_bookmarks','habit_logs','water_logs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy own_data on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
  execute format('create index if not exists %I on public.%I(user_id)',t || '_user_idx',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
alter table public.audit_log enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.daily_usage enable row level security;
create policy own_connections on public.connected_accounts for select to authenticated using ((select auth.uid())=user_id);
create policy own_usage on public.daily_usage for select to authenticated using ((select auth.uid())=user_id);
grant select on public.connected_accounts,public.daily_usage to authenticated;
alter table public.products enable row level security;
alter table public.articles enable row level security;
alter table public.food_database enable row level security;
create policy verified_products on public.products for select to anon,authenticated using(verified);
create policy reviewed_articles on public.articles for select to anon,authenticated using(reviewed and reviewed_at is not null and published_at<=now());
create policy verified_foods on public.food_database for select to authenticated using(verified);
grant select on public.products,public.articles to anon,authenticated;
grant select on public.food_database to authenticated;
grant all on all tables in schema public to service_role;
-- Atomic quota: concurrent requests cannot each observe the same remaining balance.
create or replace function public.consume_ai_quota(p_limit integer default 10) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare count_now integer; day_now date := (now() at time zone 'Asia/Jakarta')::date; uid uuid := auth.uid(); quota integer := least(greatest(p_limit,1),10);
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
create index consultations_cache_idx on public.consultations(user_id,cache_key,created_at desc);
create index food_logs_date_idx on public.food_logs(user_id,date);
create index exercise_logs_date_idx on public.exercise_logs(user_id,date);
commit;
