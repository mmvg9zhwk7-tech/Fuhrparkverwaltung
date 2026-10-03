-- Übergabeprotokolle bei Ausgabe und Rückgabe eines Fahrzeugs.
-- Nach add_dokumente.sql im Supabase SQL Editor ausführen.

create table public.uebergaben (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  art text not null check (art in ('ausgabe', 'rueckgabe')),
  datum date not null default current_date,
  -- Wer übernimmt bzw. gibt zurück: Konto in der App oder freier Name
  -- (z.B. Werkstatt, Leasinggesellschaft).
  person_id uuid references public.profiles (id) on delete set null,
  person_name text,
  km integer check (km >= 0),
  -- Tank- bzw. Ladestand
  tank text check (tank in ('leer', '1/4', '1/2', '3/4', 'voll')),
  zubehoer text[] not null default '{}',
  sauber boolean,
  maengel text,
  -- Pfade im Bucket "fotos" (<user-id>/uebergabe/...), Unterschrift als PNG.
  fotos text[] not null default '{}',
  unterschrift_pfad text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index uebergaben_vehicle_idx on public.uebergaben (vehicle_id, datum desc);
create index uebergaben_person_idx on public.uebergaben (person_id);

alter table public.uebergaben enable row level security;

-- Fahrer:innen sehen Protokolle, in denen sie stehen.
create policy "uebergaben_select" on public.uebergaben
  for select to authenticated
  using (
    person_id = (select auth.uid())
    or (select public.current_user_role()) in ('admin', 'fuhrparkleiter')
  );

create policy "uebergaben_fleet_write" on public.uebergaben
  for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));

-- Fotos/Unterschrift eines Protokolls darf auch die übernehmende Person sehen
-- (liegen im Ordner der Fuhrparkleitung, siehe fotos_select).
create policy "fotos_select_uebergabe" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and exists (
      select 1 from public.uebergaben u
      where u.person_id = (select auth.uid())
        and (name = u.unterschrift_pfad or name = any (u.fotos))
    )
  );
