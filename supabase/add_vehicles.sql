-- Fahrzeuge: genau die Spalten der bisherigen Excel-Liste.
-- Nach schema.sql im Supabase SQL Editor ausführen.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vorgang text,
  vertrag_lf text,
  marke text,
  typ text,
  kennzeichen text,
  fin text,
  -- "letzten 6 der FIN" wird automatisch berechnet, nie von Hand gepflegt.
  fin_kurz text generated always as (right(fin, 6)) stored,
  art text,
  mandant text,
  filiale text,
  kostenstelle text,
  nutzer text,
  miete text,
  leasingbelastung numeric(12, 2),
  pauschale numeric(12, 2),
  ende_lf date,
  kaufpreis numeric(12, 2),
  einkaufsdatum date,
  berechnung numeric(12, 2),
  status text not null default 'Bestand',
  verkaufsdatum date,
  rg_nummer text,
  km_stand integer,
  km_stand_datum date,
  bestandswert numeric(12, 2),
  thg text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users on delete set null default auth.uid()
);

-- Eine FIN gibt es nur einmal (Import aktualisiert dann statt doppelt anzulegen).
create unique index vehicles_fin_unique on public.vehicles (fin) where fin is not null;
create index vehicles_kennzeichen_idx on public.vehicles (kennzeichen);
create index vehicles_status_idx on public.vehicles (status);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;

-- Fahrzeugdaten (inkl. Kaufpreise) nur für Admin und Fuhrparkleitung.
create policy "vehicles_fleet_all" on public.vehicles
  for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));
