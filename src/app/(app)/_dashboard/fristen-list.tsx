import Link from "next/link";
import { todayIso } from "@/lib/dates";
import { compareFristen, faelligText } from "@/lib/fristen/fristen";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle, type FleetVehicle } from "@/lib/vehicles/overview";
import { FristBadge } from "@/components/badges";

// Überfällige und bald fällige HU/UVV/Inspektionen für die Übersicht.
export function FristenList({ fleet, vorlaufTage }: { fleet: FleetVehicle[]; vorlaufTage: number }) {
  const today = todayIso();
  const faellig = fleet
    .flatMap((v) => v.fristen.map((f) => ({ ...f, vehicle: v })))
    .filter((f) => f.status === "ueberfaellig" || f.status === "bald")
    .sort(compareFristen);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand">Fristen: als Nächstes</h2>
        <Link href="/fristen" className="text-sm text-brand underline">
          Alle anzeigen
        </Link>
      </div>
      {faellig.length === 0 ? (
        <p className="card text-sm text-muted">
          In den nächsten {vorlaufTage} Tagen ist keine HU, UVV-Prüfung oder Inspektion fällig.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {faellig.slice(0, 8).map((f) => (
            <li key={`${f.vehicle.id}-${f.art}`}>
              <Link
                href={`/fahrzeuge/${f.vehicle.id}#fristen`}
                className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
              >
                <p className="font-semibold text-brand">{vehicleTitle(f.vehicle)}</p>
                <p className="text-sm text-muted">
                  {f.kurz} · {formatValue("date", f.faellig)} · {faelligText(f.faellig, today)}
                </p>
                <FristBadge status={f.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
