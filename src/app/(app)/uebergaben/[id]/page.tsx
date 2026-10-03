import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageFleet } from "@/lib/auth/roles";
import { signedPhotoUrls } from "@/lib/storage/photos";
import { personName, UEBERGABE_ARTEN, UEBERGABE_COLUMNS, ZUBEHOER, type Uebergabe } from "@/lib/uebergaben/uebergaben";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle } from "@/lib/vehicles/overview";
import { ConfirmButton } from "@/components/confirm-button";
import { Flash } from "@/components/flash";
import { PrintButton } from "@/components/print-button";
import { deleteUebergabe } from "../actions";

export const metadata: Metadata = { title: "Übergabeprotokoll" };

// Protokoll zum Ansehen und Drucken. Fuhrparkleitung und die Person, die
// übernommen/zurückgegeben hat (RLS).
export default async function UebergabePage({ params, searchParams }: PageProps<"/uebergaben/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const { message } = (await searchParams) as { message?: string };
  const fleet = canManageFleet(profile.role);

  const supabase = await createClient();
  const { data } = await supabase.from("uebergaben").select(UEBERGABE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const u = data as unknown as Uebergabe;
  // Fahrer:innen dürfen die Fahrzeugtabelle nicht lesen: dann über my_vehicles.
  const vehicle: { kennzeichen: string | null; marke: string | null; typ: string | null; fin?: string | null } | undefined = fleet
    ? ((await supabase.from("vehicles").select("kennzeichen, marke, typ, fin").eq("id", u.vehicle_id).maybeSingle()).data ?? undefined)
    : ((await supabase.rpc("my_vehicles")).data as { id: string; kennzeichen: string | null; marke: string | null; typ: string | null }[] | null)?.find(
        (v) => v.id === u.vehicle_id,
      );
  const urls = await signedPhotoUrls(supabase, [...u.fotos, u.unterschrift_pfad ?? ""]);
  const unterschrift = u.unterschrift_pfad ? urls.get(u.unterschrift_pfad) : undefined;

  const rows: [string, string][] = [
    ["Fahrzeug", vehicle ? vehicleTitle(vehicle) : "–"],
    ...(vehicle?.fin ? ([["FIN", vehicle.fin]] as [string, string][]) : []),
    ["Datum", formatValue("date", u.datum)],
    [u.art === "ausgabe" ? "Übernommen von" : "Zurückgegeben von", personName(u)],
    ["Kilometerstand", u.km != null ? `${formatValue("int", u.km)} km` : "–"],
    ["Tank / Akku", u.tank ?? "–"],
    ["Sauber", u.sauber == null ? "–" : u.sauber ? "ja" : "nein"],
    ["Protokoll von", u.ersteller?.full_name ?? u.ersteller?.email ?? "–"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {fleet && (
            <Link href={`/fahrzeuge/${u.vehicle_id}#uebergaben`} className="text-sm text-muted hover:text-brand print:hidden">
              ← Fahrzeug
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">
            Übergabeprotokoll · {UEBERGABE_ARTEN[u.art]}
          </h1>
        </div>
        <PrintButton />
      </div>
      <div className="print:hidden">
        <Flash message={message} />
      </div>

      <section className="card flex flex-col gap-4 print:border-0 print:p-0 print:shadow-none">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="mb-1 sm:mb-0">{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <h2 className="mb-1 text-sm font-semibold text-brand">Zubehör</h2>
          <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {ZUBEHOER.map((z) => (
              <li key={z}>
                {u.zubehoer.includes(z) ? "☑" : "☐"} {z}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-1 text-sm font-semibold text-brand">Schäden / Mängel</h2>
          <p className="whitespace-pre-line text-sm">{u.maengel ?? "Keine angegeben."}</p>
        </div>
        {u.fotos.length > 0 && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {u.fotos.map((p) => {
              const url = urls.get(p);
              return url ? (
                <li key={p}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- kurzlebige, private Links */}
                  <img src={url} alt="Foto vom Fahrzeug" className="aspect-square w-full rounded-xl object-cover" />
                </li>
              ) : null;
            })}
          </ul>
        )}
        <div className="border-t border-border pt-3">
          <h2 className="mb-1 text-sm font-semibold text-brand">Unterschrift {personName(u)}</h2>
          {unterschrift ? (
            // eslint-disable-next-line @next/next/no-img-element -- kurzlebiger, privater Link
            <img src={unterschrift} alt="Unterschrift" className="h-28 w-auto" />
          ) : (
            <p className="text-sm text-muted">Nicht unterschrieben.</p>
          )}
        </div>
      </section>

      {fleet && (
        <form action={deleteUebergabe.bind(null, id, u.vehicle_id)} className="border-t border-border pt-6 print:hidden">
          <ConfirmButton message="Dieses Protokoll wirklich löschen?" className="text-sm font-semibold text-red-700 underline">
            Protokoll löschen
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
