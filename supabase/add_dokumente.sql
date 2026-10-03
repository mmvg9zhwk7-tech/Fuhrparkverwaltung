-- Dokumente je Fahrzeug (Fahrzeugschein, Leasingvertrag, Versicherung, ...).
-- Nach add_schaeden.sql im Supabase SQL Editor ausführen.

-- Eigener privater Bucket, max. 25 MB je Datei. Hochgeladen wird direkt aus
-- dem Browser (an Vercel vorbei, das nur 4,5 MB je Anfrage annimmt).
insert into storage.buckets (id, name, public, file_size_limit)
values ('dokumente', 'dokumente', false, 26214400)
on conflict (id) do nothing;

create policy "dokumente_fleet_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'dokumente' and (select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check (bucket_id = 'dokumente' and (select public.current_user_role()) in ('admin', 'fuhrparkleiter'));

create table public.fahrzeug_dokumente (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  kategorie text not null default 'sonstiges'
    check (kategorie in ('fahrzeugschein', 'vertrag', 'versicherung', 'rechnung', 'pruefbericht', 'sonstiges')),
  name text not null,
  -- Pfad im Bucket "dokumente": <vehicle-id>/<zufall>.<endung>
  pfad text not null unique,
  groesse integer,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index fahrzeug_dokumente_vehicle_idx on public.fahrzeug_dokumente (vehicle_id, created_at desc);

alter table public.fahrzeug_dokumente enable row level security;

create policy "fahrzeug_dokumente_fleet_all" on public.fahrzeug_dokumente
  for all to authenticated
  using ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'))
  with check ((select public.current_user_role()) in ('admin', 'fuhrparkleiter'));
