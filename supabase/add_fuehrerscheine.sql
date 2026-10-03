-- Führerscheinkontrolle (Halterpflicht): regelmäßig prüfen und dokumentieren,
-- dass alle, die Firmenfahrzeuge fahren, einen gültigen Führerschein haben.
-- Nach add_fristen.sql im Supabase SQL Editor ausführen.

-- Alle wie viele Monate kontrolliert wird (üblich: halbjährlich).
alter table public.settings
  add column fs_kontrolle_intervall_monate integer not null default 6
    check (fs_kontrolle_intervall_monate between 1 and 24);

-- Stammdaten des Führerscheins, eine Zeile je Person.
create table public.fuehrerscheine (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  klassen text,
  -- Nur wenn befristet (z.B. Klasse C/D oder Ablaufdatum der Karte).
  gueltig_bis date,
  updated_at timestamptz not null default now()
);

alter table public.fuehrerscheine enable row level security;

create policy "fuehrerscheine_select" on public.fuehrerscheine
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
  );

create policy "fuehrerscheine_fleet_write" on public.fuehrerscheine
  for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));

create trigger fuehrerscheine_set_updated_at
  before update on public.fuehrerscheine
  for each row execute function public.set_updated_at();

-- Jede durchgeführte Kontrolle als Nachweis.
create table public.fuehrerschein_kontrollen (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kontrolliert_am date not null,
  -- vorlage = Original persönlich gesehen, foto = anhand von Fotos geprüft.
  art text not null default 'vorlage' check (art in ('vorlage', 'foto')),
  ergebnis text not null default 'ok' check (ergebnis in ('ok', 'beanstandet')),
  foto_pfad text,
  notiz text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index fuehrerschein_kontrollen_profile_idx
  on public.fuehrerschein_kontrollen (profile_id, kontrolliert_am desc);

alter table public.fuehrerschein_kontrollen enable row level security;

-- Fahrer:innen sehen ihre eigenen Kontrollen, eintragen darf nur die
-- Fuhrparkleitung.
create policy "fs_kontrollen_select" on public.fuehrerschein_kontrollen
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
  );

create policy "fs_kontrollen_fleet_write" on public.fuehrerschein_kontrollen
  for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));
