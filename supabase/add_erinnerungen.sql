-- E-Mail-Erinnerungen (täglicher Vercel-Cron, /api/cron/erinnerungen).
-- Nach add_fuehrerscheine.sql im Supabase SQL Editor ausführen.

alter table public.settings
  add column erinnerungen_aktiv boolean not null default true;

-- Was schon verschickt wurde, damit niemand dieselbe Erinnerung zweimal
-- bekommt. Schlüssel = Empfänger + Anlass (z.B. HU von Fahrzeug X am Datum Y).
create table public.erinnerungen_log (
  schluessel text primary key,
  gesendet_am timestamptz not null default now()
);

create index erinnerungen_log_gesendet_idx on public.erinnerungen_log (gesendet_am);

-- Keine Regeln = kein Zugriff aus der App. Nur der Server-Job mit dem
-- Service-Role-Key liest und schreibt.
alter table public.erinnerungen_log enable row level security;
