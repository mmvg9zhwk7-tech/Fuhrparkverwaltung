-- Fristen je Fahrzeug: Hauptuntersuchung (HU/TÜV), UVV-Prüfung, Inspektion.
-- Nach add_drivers_mileage.sql im Supabase SQL Editor ausführen.

-- Nächste Fälligkeit direkt am Fahrzeug (auch per Excel-Import pflegbar).
alter table public.vehicles
  add column hu_faellig date,
  add column uvv_faellig date,
  add column inspektion_faellig date;

-- So viele Tage vorher gilt eine Frist als "bald fällig" (auch für die
-- Führerscheinkontrolle und die Erinnerungs-Mails).
alter table public.settings
  add column fristen_vorlauf_tage integer not null default 30
    check (fristen_vorlauf_tage between 0 and 365);

-- Nachweis: wann wurde was erledigt (für UVV vorgeschrieben). Ein neuer
-- Eintrag setzt die nächste Fälligkeit am Fahrzeug (Trigger unten).
create table public.frist_erledigungen (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  art text not null check (art in ('hu', 'uvv', 'inspektion')),
  erledigt_am date not null,
  naechste_faellig date not null,
  notiz text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index frist_erledigungen_vehicle_idx
  on public.frist_erledigungen (vehicle_id, erledigt_am desc);

alter table public.frist_erledigungen enable row level security;

create policy "frist_erledigungen_fleet_all" on public.frist_erledigungen
  for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));

create function public.apply_frist_erledigung()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.vehicles
  set hu_faellig = case when new.art = 'hu' then new.naechste_faellig else hu_faellig end,
      uvv_faellig = case when new.art = 'uvv' then new.naechste_faellig else uvv_faellig end,
      inspektion_faellig = case when new.art = 'inspektion' then new.naechste_faellig else inspektion_faellig end
  where id = new.vehicle_id;
  return new;
end;
$$;

create trigger frist_erledigungen_apply
  after insert on public.frist_erledigungen
  for each row execute function public.apply_frist_erledigung();
