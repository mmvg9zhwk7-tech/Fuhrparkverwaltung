-- Fahrer-Zuordnung, monatliche KM-Meldungen, Fotos und Einstellungen.
-- Nach add_vehicles.sql im Supabase SQL Editor ausführen.

-- Fahrzeuge: feste Fahrer:in oder Pool, Erstzulassung (für das Alter)
-- und optionale eigene Aussteuerungsgrenzen je Fahrzeug.
alter table public.vehicles
  add column fahrer_id uuid references public.profiles (id) on delete set null,
  add column ist_pool boolean not null default false,
  add column erstzulassung date,
  add column aussteuern_ab_km integer,
  add column aussteuern_ab_datum date;

create index vehicles_fahrer_idx on public.vehicles (fahrer_id);

-- Einstellungen (genau eine Zeile), von Admins in der App pflegbar.
create table public.settings (
  id integer primary key default 1 check (id = 1),
  -- Bis zu diesem Tag des Monats muss der KM-Stand gemeldet sein.
  km_faellig_tag integer not null default 10 check (km_faellig_tag between 1 and 28),
  km_foto_pflicht boolean not null default false,
  -- Allgemeine Aussteuerungsgrenzen (je Fahrzeug überschreibbar).
  aussteuern_max_km integer not null default 150000,
  aussteuern_max_alter_monate integer not null default 60,
  -- So viele Monate vorher erscheint ein Fahrzeug unter "bald aussteuern".
  aussteuern_vorlauf_monate integer not null default 3,
  updated_at timestamptz not null default now()
);
insert into public.settings default values;

alter table public.settings enable row level security;

create policy "settings_select" on public.settings
  for select to authenticated
  using ((select public.current_user_role()) is not null);

create policy "settings_update_admin" on public.settings
  for update to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

-- Darf die eingeloggte Person für dieses Fahrzeug melden? Eigenes oder
-- Pool-Fahrzeug, für Fuhrparkleitung/Admin jedes.
create function public.can_use_vehicle(vid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.current_user_role() in ('admin', 'fuhrparkleiter') then true
    when public.current_user_role() = 'fahrer' then exists (
      select 1 from public.vehicles v
      where v.id = vid and (v.fahrer_id = (select auth.uid()) or v.ist_pool)
    )
    else false
  end
$$;

-- Fahrzeuge für Fahrer:innen - bewusst ohne Kaufpreise & Co., deshalb als
-- Funktion statt direktem Zugriff auf die Tabelle.
create function public.my_vehicles()
returns table (
  id uuid,
  kennzeichen text,
  marke text,
  typ text,
  fin_kurz text,
  filiale text,
  km_stand integer,
  km_stand_datum date,
  ist_pool boolean,
  ist_meins boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, v.kennzeichen, v.marke, v.typ, v.fin_kurz, v.filiale,
         v.km_stand, v.km_stand_datum, v.ist_pool,
         coalesce(v.fahrer_id = (select auth.uid()), false)
  from public.vehicles v
  where public.current_user_role() is not null
    and v.status = 'Bestand'
    and (v.fahrer_id = (select auth.uid()) or v.ist_pool)
  order by 10 desc, v.kennzeichen
$$;

-- KM-Meldungen.
create table public.mileage_reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  km integer not null check (km >= 0),
  gemeldet_am date not null default current_date,
  foto_pfad text,
  notiz text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index mileage_reports_vehicle_idx on public.mileage_reports (vehicle_id, gemeldet_am desc);

alter table public.mileage_reports enable row level security;

create policy "mileage_select" on public.mileage_reports
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
  );

create policy "mileage_insert" on public.mileage_reports
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_use_vehicle(vehicle_id)
  );

create policy "mileage_delete_fleet" on public.mileage_reports
  for delete to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));

-- Neueste Meldung = aktueller KM-Stand am Fahrzeug.
create function public.apply_mileage_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.vehicles
  set km_stand = new.km, km_stand_datum = new.gemeldet_am
  where id = new.vehicle_id
    and (km_stand_datum is null or km_stand_datum <= new.gemeldet_am);
  return new;
end;
$$;

create trigger mileage_reports_apply
  after insert on public.mileage_reports
  for each row execute function public.apply_mileage_report();

-- Fotos (Tacho, später Schäden): privater Speicher, jede Person lädt in
-- ihren eigenen Ordner <user-id>/..., Fuhrparkleitung/Admin sehen alles.
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy "fotos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.current_user_role()) is not null
  );

create policy "fotos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
    )
  );
