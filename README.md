# Fjellhamar Bistro — nettside

Statisk nettside (HTML/CSS/JS, ingen rammeverk) for Fjellhamar Bistro, bygget for GitHub Pages.

## Filer
- `index.html` — hovedsiden: hero, levering (Wolt/Foodora), meny, kombinasjonsmeny, selskaper, åpningstider, bordbestilling.
- `admin.html` — passordbeskyttet (Supabase Auth) oversikt over bordbestillinger. Ikke lenket fra det offentlige nettstedet, `noindex` + `robots.txt`.
- `css/style.css` — hovedstilark. `css/admin.css` — tillegg for adminsiden.
- `js/main.js` — hamburgermeny, "åpent nå"-status, menyflikar.
- `js/booking.js` — sender bordbestillinger til Supabase (tabell `restaurant_bookings`), flatpickr-kalender.
- `js/admin.js` — innlogging + liste over bordbestillinger i adminsiden.
- `js/supabase-config.js` — Supabase-URL og publishable key (trygt å ha i frontend, se kommentar i filen).
- `supabase-schema-fjellhamar-bistro.sql` — kjøres i Supabase → SQL Editor for å opprette `restaurant_bookings`-tabellen.

## Status (2026-08-28)
Bygget fra grunnen av på oppdrag fra Martin. Erstatter det forrige enkeltsidede designet fullstendig.

- **Supabase**: bruker samme delte prosjekt som Lørenskog Dyrebutikk (`jldfqgnbfihxspdehejb`), egen tabell `restaurant_bookings` — påvirker ikke dyrebutikkens `bookings`/`prices`-tabeller.
- **Innhold**: adresse, telefon og meny videreført fra forrige bygg (verifisert mot 1881.no og tredjepartskilder — se "Åpne punkter" under). Facebook-siden lot seg ikke hente automatisk (robots.txt blokkerer), så innholdet er ikke krysset direkte mot Facebook.
- **Wolt/Foodora**: ingen aktiv profil funnet ved søk — knappene peker til wolt.com/foodora.no sine hovedsider inntil ev. restaurantside finnes og lenkene kan spisses.
- **Bilder**: ingen — bevisst bildefri, tekst/ikon-drevet design (samme valg som forrige bygg) siden vi ikke har rettighetsklarerte foton av lokalet/maten.

## Før dette går live
1. **Kjør SQL-skjemaet**: lim inn `supabase-schema-fjellhamar-bistro.sql` i Supabase → SQL Editor → Run, på samme prosjekt som dyrebutikken.
2. **Admin-innlogging**: samme Supabase Auth-brukere som dyrebutikkens admin fungerer også her (delt prosjekt). Opprett en bruker under Authentication → Users hvis det ikke allerede finnes en.
3. **Legg filene i repoet** `8zfm6cz44m-dev/Fjellhamar-Bistro` og `git push` (husk: automatisk push fra skyverktøy fungerer ikke pålitelig — se lørenskog-dyrebutikk-notatene om Keychain/proxy-begrensninger; enklest er å laste opp filene direkte på github.com slik forrige commit ble gjort, eller pushe fra en Mac-terminal).
4. **Aktiver GitHub Pages** på repoet (Settings → Pages) hvis ikke allerede aktivert.
5. Bekreft med eier: åpningstider (funnet 14:00–23:30 daglig i tredjepartskilder, ikke direkte fra Facebook), meny/priser, og om Wolt/Foodora-lenkene skal pekes om når/hvis dere blir påkoblet.

## Åpne punkter / å bekrefte med kunden
- Nøyaktige åpningstider direkte fra eier (nåværende er hentet fra tredjepartskilder, ikke Facebook-siden selv).
- Oppdatert meny/priser fra eier — nåværende innhold er videreført fra forrige bygg.
- Om de vil ha en e-postadresse synlig på siden.
- Ekte foton av lokale/mat til å erstatte den bildefrie designen.
