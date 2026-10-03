import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { SCHADEN_COLUMNS, SCHADEN_STATUS, SCHADEN_STATUS_LABELS, type Schaden } from "@/lib/schaeden/schaeden";
import { signedPhotoUrls } from "@/lib/storage/photos";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle } from "@/lib/vehicles/overview";
import { SchadenBadge } from "@/components/badges";
import { ConfirmButton } from "@/components/confirm-button";
import { Flash } from "@/components/flash";
import { deleteSchaden, updateSchaden } from "../actions";

export const metadata: Metadata = { title: "Schaden" };

export default async function SchadenPage({ params, searchParams }: PageProps<"/schaeden/[id]">) {
  await requireRole("admin", "fuhrparkleiter");
  const { id } = await params;
  const { error, message } = (await searchParams) as { error?: string; message?: string };

  const supabase = await createClient();
  const { data } = await supabase.from("schaeden").select(SCHADEN_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as unknown as Schaden;
  const urls = await signedPhotoUrls(supabase, s.fotos);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/schaeden" className="text-sm text-muted hover:text-brand">
          ← Schäden
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">
          Schaden · {s.vehicle ? vehicleTitle(s.vehicle) : "Fahrzeug"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SchadenBadge status={s.status} />
          {!s.fahrbereit && (
            <span className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white">Nicht fahrbereit</span>
          )}
        </div>
      </div>
      <Flash error={error} message={message} />

      <section className="card flex flex-col gap-3">
        <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted">Datum</dt>
          <dd>{formatValue("date", s.datum)}</dd>
          <dt className="text-muted">Ort</dt>
          <dd>{s.ort ?? "–"}</dd>
          <dt className="text-muted">Gemeldet von</dt>
          <dd>{s.melder?.full_name ?? s.melder?.email ?? "–"}</dd>
          <dt className="text-muted">Fahrzeug</dt>
          <dd>
            <Link href={`/fahrzeuge/${s.vehicle_id}`} className="text-brand underline">
              Zur Fahrzeugseite
            </Link>
          </dd>
        </dl>
        <p className="whitespace-pre-line">{s.beschreibung}</p>
        {s.fotos.length > 0 && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {s.fotos.map((pfad) => {
              const url = urls.get(pfad);
              return url ? (
                <li key={pfad}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- kurzlebige, private Links */}
                    <img src={url} alt="Schadensfoto" className="aspect-square w-full rounded-xl object-cover" />
                  </a>
                </li>
              ) : null;
            })}
          </ul>
        )}
      </section>

      <form action={updateSchaden.bind(null, id)} className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-brand">Bearbeiten</h2>
        <label className="label">
          Status
          <select name="status" defaultValue={s.status} className="input-field">
            {SCHADEN_STATUS.map((st) => (
              <option key={st} value={st}>
                {SCHADEN_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-brand">
          <input type="checkbox" name="fahrbereit" defaultChecked={s.fahrbereit} />
          Fahrzeug ist fahrbereit
        </label>
        <label className="label">
          Rückmeldung an {s.melder?.full_name?.split(" ")[0] ?? "die meldende Person"}
          <textarea
            name="rueckmeldung"
            rows={3}
            defaultValue={s.rueckmeldung ?? ""}
            placeholder="z.B. Werkstatttermin am 12.10., Fahrzeug bitte bis dahin stehen lassen"
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Speichern
        </button>
      </form>

      <form action={deleteSchaden.bind(null, id)} className="border-t border-border pt-6">
        <ConfirmButton message="Diese Meldung wirklich löschen?" className="text-sm font-semibold text-red-700 underline">
          Meldung löschen
        </ConfirmButton>
      </form>
    </div>
  );
}
