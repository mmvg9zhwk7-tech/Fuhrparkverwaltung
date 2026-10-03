import Link from "next/link";
import type { Schaden } from "@/lib/schaeden/schaeden";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle } from "@/lib/vehicles/overview";
import { SchadenBadge } from "@/components/badges";

// Liste von Schadensmeldungen. Mit `href` als Links (Fuhrparkleitung),
// sonst nur lesbar (eigene Meldungen der Fahrer:innen).
export function SchadenList({
  schaeden,
  href,
  showVehicle = true,
  vehicleNames,
}: {
  schaeden: Schaden[];
  href?: (s: Schaden) => string;
  showVehicle?: boolean;
  // Fahrer:innen dürfen die Fahrzeugtabelle nicht lesen: Namen aus my_vehicles.
  vehicleNames?: Map<string, string>;
}) {
  return (
    <ul className="grid grid-cols-1 gap-2">
      {schaeden.map((s) => {
        const content = (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {showVehicle && (
                  <p className="font-semibold text-brand">
                    {s.vehicle ? vehicleTitle(s.vehicle) : (vehicleNames?.get(s.vehicle_id) ?? "Fahrzeug")}
                  </p>
                )}
                <p className="text-xs text-muted">
                  {formatValue("date", s.datum)}
                  {s.ort ? ` · ${s.ort}` : ""}
                  {s.melder ? ` · ${s.melder.full_name ?? s.melder.email}` : ""}
                  {s.fotos.length ? ` · 📷 ${s.fotos.length}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {!s.fahrbereit && s.status !== "erledigt" && (
                  <span className="inline-block w-fit rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white">
                    Nicht fahrbereit
                  </span>
                )}
                <SchadenBadge status={s.status} />
              </div>
            </div>
            <p className="line-clamp-3 text-sm">{s.beschreibung}</p>
            {s.rueckmeldung && (
              <p className="rounded-lg bg-black/5 px-3 py-2 text-sm">
                <span className="font-medium">Fuhrparkleitung:</span> {s.rueckmeldung}
              </p>
            )}
          </>
        );
        return (
          <li key={s.id}>
            {href ? (
              <Link href={href(s)} className="card flex flex-col gap-2 transition hover:border-brand/40">
                {content}
              </Link>
            ) : (
              <div className="card flex flex-col gap-2">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
