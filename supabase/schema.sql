-- Grundschema der Fuhrparkverwaltung: Nutzerprofile mit Rollen.
-- Einmalig im Supabase SQL Editor ausführen. Spätere Änderungen kommen als
-- eigene Dateien (add_*.sql) dazu, wie bei Plantodelta.

create type public.user_role as enum ('admin', 'fuhrparkleiter', 'fahrer');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'fahrer',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Rolle der eingeloggten Person (null, wenn deaktiviert oder ausgeloggt).
-- security definer, damit die RLS-Regeln auf profiles sich nicht selbst
-- abfragen und in eine Endlosschleife laufen.
create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = (select auth.uid()) and is_active
$$;

-- Lesen: das eigene Profil, Admins und Fuhrparkleitung sehen alle
-- (z.B. um Fahrer:innen Fahrzeuge zuzuweisen).
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
  );

-- Ändern (Rolle, Name, aktiv/inaktiv): nur Admins. Neue Profile entstehen
-- ausschließlich über den Trigger unten, deshalb keine insert-Regel.
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

-- Jedes neue Konto (Einladung oder im Supabase-Dashboard angelegt) bekommt
-- automatisch ein Profil. Das allererste Konto wird Admin, alle weiteren
-- starten als Fahrer:in und werden beim Einladen auf ihre Rolle gesetzt.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when not exists (select 1 from public.profiles) then 'admin'::public.user_role
      else 'fahrer'::public.user_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
