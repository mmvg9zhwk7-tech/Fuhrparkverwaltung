import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { getSettings } from "@/lib/settings";
import { formatValue } from "@/lib/vehicles/format";
import { loadFleet, vehicleTitle } from "@/lib/vehicles/overview";
import { MILEAGE_STATUS_LABELS, type MileageStatus } from "@/lib/mileage/status";
import { KmBadge } from "@/components/badges";

export const metadata: Metadata = { title: "KM-Meldungen" };

const FILTERS: (MileageStatus | "alle")[] = ["alle", "ueberfaellig", "offen", "gemeldet"];

export default async function KmPage({ searchParams }: PageProps<"/km">) {
  await requireRole("admin", "fuhrparkleiter");
  const { filter = "alle" } = (await searchParams) as { filter?: string };
  const settings = await getSettings();
  const fleet = await loadFleet(await createClient(), settings);
  const shown = filter === "alle" ? fleet : fleet.filter((v) => v.km === filter);
  // Überfällige zuerst, dann nach ältester Meldung.
  const order: Record<MileageStatus, number> = { ueberfaellig: 0, offen: 1, gemeldet: 2 };
  shown.sort((a, b) => order[a.km] - order[b.km] || (a.km_stand_datum ?? "").localeCompare(b.km_stand_datum ?? ""));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">KM-Meldungen</h1>
        <p className="mt-1 text-sm text-muted">
          Fällig jeden Monat bis zum {settings.km_faellig_tag}. · Fahrzeuge im Bestand
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => {
          const count = f === "alle" ? fleet.length : fleet.filter((v) => v.km === f).length;
          return (
            <Link
              key={f}
              href={f === "alle" ? "/km" : `/km?filter=${f}`}
              className={`rounded-full px-3 py-1.5 font-medium ${filter === f ? "bg-brand text-white" : "bg-white text-brand ring-1 ring-border"}`}
            >
              {f === "alle" ? "Alle" : MILEAGE_STATUS_LABELS[f]} ({count})
            </Link>
          );
        })}
      </nav>

      <ul className="grid grid-cols-1 gap-2">
        {shown.map((v) => (
          <li key={v.id}>
            <Link
              href={`/fahrzeuge/${v.id}`}
              className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
            >
              <p className="font-semibold text-brand">{vehicleTitle(v)}</p>
              <p className="text-sm">
                {v.fahrer?.full_name ?? v.fahrer?.email ?? (v.ist_pool ? "Pool" : v.nutzer ?? "–")}
              </p>
              <p className="text-sm text-muted">
                {formatValue("int", v.km_stand)} km · {formatValue("date", v.km_stand_datum)}
              </p>
              <KmBadge status={v.km} />
            </Link>
          </li>
        ))}
        {!shown.length && <li className="card text-sm text-muted">Keine Fahrzeuge in dieser Ansicht.</li>}
      </ul>
    </div>
  );
}
