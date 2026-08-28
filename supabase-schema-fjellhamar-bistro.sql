-- ============================================================
-- Fjellhamar Bistro — Supabase schema (bordbestilling)
-- Kjøres i SAMME Supabase-prosjekt som Lørenskog Dyrebutikk
-- (jldfqgnbfihxspdehejb) — kun én ny tabell, påvirker ikke
-- eksisterende "bookings" eller "prices"-tabeller.
--
-- Kjør denne i Supabase → SQL Editor (kjør alt på én gang)
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
  status text not null default 'ny' check (status in ('ny', 'bekreftet', 'avvist', 'fullført'))
);

alter table public.restaurant_bookings enable row level security;

-- Hvem som helst (også ikke-innloggede besøkende) kan LEGGE INN en bordbestilling …
create policy "Alle kan sende inn bordbestilling"
  on public.restaurant_bookings for insert
  to anon
  with check (true);

-- … men KUN innloggede admin-brukere kan LESE/ENDRE/SLETTE bestillinger.
create policy "Kun innlogget admin kan lese bordbestillinger"
  on public.restaurant_bookings for select
  to authenticated
  using (true);

create policy "Kun innlogget admin kan oppdatere bordbestillinger"
  on public.restaurant_bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "Kun innlogget admin kan slette bordbestillinger"
  on public.restaurant_bookings for delete
  to authenticated
  using (true);
