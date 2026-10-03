import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/settings";
import { formatValue } from "@/lib/vehicles/format";
import { GRUND_LABELS } from "@/lib/vehicles/aussteuerung";
import { loadFleet, vehicleTitle } from "@/lib/vehicles/overview";
import { loadFuehrerscheine } from "@/lib/fuehrerschein/overview";
import { AmpelBadge } from "@/components/badges";
import { FristenList } from "./fristen-list";

// Übersicht für Fuhrparkleitung/Admin: Kennzahlen und was zu tun ist.
export async function FleetSection({ settings }: { settings: Settings }) {
  const supabase = await createClient();
  const [fleet, fuehrerscheine, { count: offeneSchaeden }] = await Promise.all([
    loadFleet(supabase, settings),
    loadFuehrerscheine(supabase, settings),
    supabase.from("schaeden").select("id", { count: "exact", head: true }).neq("status", "erledigt"),
  ]);

  const ueberfaellig = fleet.filter((v) => v.km === "ueberfaellig");
  const aussteuern = fleet
    .filter((v) => v.aussteuerung.ampel === "jetzt" || v.aussteuerung.ampel === "bald")
    .sort((a, b) => (a.aussteuerung.datum ?? "").localeCompare(b.aussteuerung.datum ?? ""));
  const ohneDaten = fleet.filter((v) => v.aussteuerung.ampel === "unbekannt");
  const fristen = fleet.flatMap((v) => v.fristen);

  const stats: { label: string; value: number; href: string; hint?: string }[] = [
    { label: "Fahrzeuge im Bestand", value: fleet.length, href: "/fahrzeuge?status=Bestand" },
    { label: "Offene Schäden", value: offeneSchaeden ?? 0, href: "/schaeden" },
    { label: "KM-Meldung überfällig", value: ueberfaellig.length, href: "/km?filter=ueberfaellig" },
    {
      label: "Fristen überfällig",
      value: fristen.filter((f) => f.status === "ueberfaellig").length,
      hint: `${fristen.filter((f) => f.status === "bald").length} in ${settings.fristen_vorlauf_tage} Tagen`,
      href: "/fristen",
    },
    {
      label: "Führerscheine fällig",
      value: fuehrerscheine.filter((p) => p.lage.status === "ueberfaellig").length,
      hint: `${fuehrerscheine.filter((p) => p.lage.status === "bald").length} bald`,
      href: "/fuehrerscheine",
    },
    {
      label: "Jetzt aussteuern",
      value: fleet.filter((v) => v.aussteuerung.ampel === "jetzt").length,
      hint: `${fleet.filter((v) => v.aussteuerung.ampel === "bald").length} bald`,
      href: "/aussteuerung",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="card block transition hover:border-brand/40">
              <p className="text-3xl font-bold text-brand">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
              {s.hint && <p className="mt-0.5 text-xs text-muted">{s.hint}</p>}
            </Link>
          </li>
        ))}
      </ul>

      <FristenList fleet={fleet} vorlaufTage={settings.fristen_vorlauf_tage} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand">Aussteuern: als Nächstes</h2>
          <Link href="/aussteuerung" className="text-sm text-brand underline">
            Alle anzeigen
          </Link>
        </div>
        {aussteuern.length === 0 ? (
          <p className="card text-sm text-muted">
            In den nächsten {settings.aussteuern_vorlauf_monate} Monaten steht kein Fahrzeug zur Aussteuerung an.
            {ohneDaten.length > 0 &&
              ` Bei ${ohneDaten.length} Fahrzeug(en) fehlen Erstzulassung/Einkaufsdatum oder KM-Stand für die Berechnung.`}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2">
            {aussteuern.slice(0, 8).map((v) => (
              <li key={v.id}>
                <Link
                  href={`/fahrzeuge/${v.id}`}
                  className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
                >
                  <p className="font-semibold text-brand">{vehicleTitle(v)}</p>
                  <p className="text-sm text-muted">
                    {formatValue("date", v.aussteuerung.datum)} · {GRUND_LABELS[v.aussteuerung.grund!]} ·{" "}
                    {formatValue("int", v.km_stand)} km
                  </p>
                  <AmpelBadge ampel={v.aussteuerung.ampel} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
