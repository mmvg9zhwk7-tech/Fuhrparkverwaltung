-- Schadensmeldungen: Fahrer:innen melden per Handy mit Fotos, die
-- Fuhrparkleitung bearbeitet sie. Nach add_erinnerungen.sql ausführen.

create table public.schaeden (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  datum date not null default current_date,
  ort text,
  beschreibung text not null check (length(trim(beschreibung)) > 0),
  -- Pfade im privaten Bucket "fotos" (<user-id>/schaden/...).
  fotos text[] not null default '{}',
  -- Ist das Fahrzeug noch sicher fahrbereit?
  fahrbereit boolean not null default true,
  status text not null default 'gemeldet' check (status in ('gemeldet', 'in_bearbeitung', 'erledigt')),
  -- Rückmeldung der Fuhrparkleitung (sieht auch die meldende Person).
  rueckmeldung text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schaeden_vehicle_idx on public.schaeden (vehicle_id, datum desc);
create index schaeden_status_idx on public.schaeden (status);

create trigger schaeden_set_updated_at
  before update on public.schaeden
  for each row execute function public.set_updated_at();

alter table public.schaeden enable row level security;

-- Eigene Meldungen sehen, Fuhrparkleitung sieht alle.
create policy "schaeden_select" on public.schaeden
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
  );

-- Melden für eigene/Pool-Fahrzeuge (Fuhrparkleitung: alle).
create policy "schaeden_insert" on public.schaeden
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_use_vehicle(vehicle_id)
  );

-- Bearbeiten und Löschen nur Fuhrparkleitung.
create policy "schaeden_update_fleet" on public.schaeden
  for update to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));

create policy "schaeden_delete_fleet" on public.schaeden
  for delete to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));
