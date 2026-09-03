-- ============================================================
-- Fjellhamar Bistro — Supabase schema (bordbestilling)
-- Kjøres i SAMME Supabase-prosjekt som Lørenskog Dyrebutikk
-- (jldfqgnbfihxspdehejb) — kun én ny tabell, påvirker ikke
-- eksisterende "bookings" eller "prices"-tabeller.
--
-- Kjør denne i Supabase → SQL Editor (kjør alt på én gang).
-- Trygt å kjøre flere ganger — hele filen er idempotent.
-- ============================================================

create table if not exists public.restaurant_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text,
  guests integer not null,
  booking_date date not null,
  booking_time text not null,
  message text,
  admin_comment text,
  status text not null default 'ny' check (status in ('ny', 'bekreftet', 'avbestilt', 'ikke_møtt', 'fullført'))
);

alter table public.restaurant_bookings enable row level security;

-- Hvem som helst (også ikke-innloggede besøkende) kan LEGGE INN en bordbestilling …
drop policy if exists "Alle kan sende inn bordbestilling" on public.restaurant_bookings;
create policy "Alle kan sende inn bordbestilling"
  on public.restaurant_bookings for insert
  to anon, authenticated
  with check (true);

-- … men KUN innloggede admin-brukere kan LESE/ENDRE/SLETTE bestillinger.
drop policy if exists "Kun innlogget admin kan lese bordbestillinger" on public.restaurant_bookings;
create policy "Kun innlogget admin kan lese bordbestillinger"
  on public.restaurant_bookings for select
  to authenticated
  using (true);

drop policy if exists "Kun innlogget admin kan oppdatere bordbestillinger" on public.restaurant_bookings;
create policy "Kun innlogget admin kan oppdatere bordbestillinger"
  on public.restaurant_bookings for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Kun innlogget admin kan slette bordbestillinger" on public.restaurant_bookings;
create policy "Kun innlogget admin kan slette bordbestillinger"
  on public.restaurant_bookings for delete
  to authenticated
  using (true);


-- ============================================================
-- MIGRERING — for en tabell som allerede finnes fra før (kjør
-- HELE denne filen på nytt i Supabase → SQL Editor, den er trygg
-- å kjøre om igjen). Lagt til 2026-09-01: internt notat-felt +
-- utvidet statusflyt (avbestilt/ikke møtt i tillegg til
-- bekreftet/ankommet).
-- ============================================================

alter table public.restaurant_bookings add column if not exists admin_comment text;

-- Fjern den GAMLE statusbegrensningen FØRST — ellers avviser den under-
-- veis UPDATE-en rett nedenfor (den tillot ikke "avbestilt" ennå).
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.restaurant_bookings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.restaurant_bookings drop constraint %I', r.conname);
  end loop;
end $$;

-- Gamle "avvist"-statuser (fra en tidligere versjon) regnes nå som "avbestilt".
update public.restaurant_bookings set status = 'avbestilt' where status = 'avvist';

alter table public.restaurant_bookings
  add constraint restaurant_bookings_status_check
  check (status in ('ny', 'bekreftet', 'avbestilt', 'ikke_møtt', 'fullført'));
