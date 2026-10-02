import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { getSettings } from "@/lib/settings";
import { formatValue } from "@/lib/vehicles/format";
import { GRUND_LABELS } from "@/lib/vehicles/aussteuerung";
import { loadFleet, vehicleTitle } from "@/lib/vehicles/overview";
import { AmpelBadge } from "@/components/badges";

export const metadata: Metadata = { title: "Aussteuerung" };

// Alle Fahrzeuge im Bestand, sortiert nach empfohlenem Aussteuerungsdatum.
export default async function AussteuerungPage() {
  const profile = await requireRole("admin", "fuhrparkleiter");
  const settings = await getSettings();
  const fleet = await loadFleet(await createClient(), settings);
  fleet.sort((a, b) => (a.aussteuerung.datum ?? "9999").localeCompare(b.aussteuerung.datum ?? "9999"));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">Aussteuerung</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Empfohlen wird der früheste Zeitpunkt aus: {formatValue("int", settings.aussteuern_max_km)} km
          (hochgerechnet mit der bisherigen Fahrleistung), {settings.aussteuern_max_alter_monate} Monaten
          ab Erstzulassung, Leasingende oder einem je Fahrzeug festgelegten Datum. „Bald“ heißt: innerhalb
          von {settings.aussteuern_vorlauf_monate} Monaten.
          {profile.role === "admin" && (
            <>
              {" "}
              <Link href="/admin/einstellungen" className="text-brand underline">
                Grenzen ändern
              </Link>
            </>
          )}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2">
        {fleet.map((v) => (
          <li key={v.id}>
            <Link
              href={`/fahrzeuge/${v.id}`}
              className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold text-brand">{vehicleTitle(v)}</p>
                <p className="text-xs text-muted">{v.filiale ?? ""}</p>
              </div>
              <p className="text-sm">
                {v.aussteuerung.datum
                  ? `${formatValue("date", v.aussteuerung.datum)} (${GRUND_LABELS[v.aussteuerung.grund!]})`
                  : "Erstzulassung/KM fehlen"}
              </p>
              <p className="text-sm text-muted">
                {formatValue("int", v.km_stand)} km
                {v.aussteuerung.kmProJahr ? ` · ${formatValue("int", v.aussteuerung.kmProJahr)} km/Jahr` : ""}
              </p>
              <AmpelBadge ampel={v.aussteuerung.ampel} />
            </Link>
          </li>
        ))}
        {!fleet.length && <li className="card text-sm text-muted">Keine Fahrzeuge im Bestand.</li>}
      </ul>
    </div>
  );
}
