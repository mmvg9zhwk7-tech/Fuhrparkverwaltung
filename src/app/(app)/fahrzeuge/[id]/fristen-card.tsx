import { todayIso } from "@/lib/dates";
import { faelligText, fristArt, fristenOf, type FristArt } from "@/lib/fristen/fristen";
import type { Settings } from "@/lib/settings";
import type { Vehicle } from "@/lib/vehicles/fields";
import { formatValue } from "@/lib/vehicles/format";
import { FristBadge } from "@/components/badges";
import { markFristDone } from "../../fristen/actions";

export type ErledigungRow = {
  id: string;
  art: FristArt;
  erledigt_am: string;
  naechste_faellig: string;
  notiz: string | null;
  person: { full_name: string | null; email: string | null } | null;
};

// HU, UVV und Inspektion: Status, "erledigt" eintragen, Nachweise.
export function FristenCard({
  vehicle,
  settings,
  erledigungen,
}: {
  vehicle: Vehicle;
  settings: Settings;
  erledigungen: ErledigungRow[];
}) {
  const today = todayIso();
  const fristen = fristenOf(vehicle, today, settings.fristen_vorlauf_tage);
  const action = markFristDone.bind(null, vehicle.id);

  return (
    <section id="fristen" className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-brand">Fristen</h2>
      <ul className="flex flex-col divide-y divide-border">
        {fristen.map((f) => (
          <li key={f.art} className="flex flex-col gap-2 py-3 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="text-sm text-muted">
                  {f.faellig ? `${formatValue("date", f.faellig)} · ` : ""}
                  {faelligText(f.faellig, today)}
                </p>
              </div>
              <FristBadge status={f.status} />
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-brand underline">Erledigt eintragen</summary>
              <form action={action} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="hidden" name="art" value={f.art} />
                <label className="label">
                  Erledigt am
                  <input type="date" name="erledigt_am" defaultValue={today} max={today} className="input-field" />
                </label>
                <label className="label">
                  Nächste Fälligkeit
                  <input type="date" name="naechste_faellig" className="input-field" />
                  <span className="text-xs font-normal text-muted">
                    Leer = automatisch {fristArt(f.art).intervallMonate} Monate später
                  </span>
                </label>
                <label className="label sm:col-span-2">
                  Notiz (optional)
                  <input name="notiz" placeholder="z.B. Werkstatt, Prüfer, Mängel" className="input-field" />
                </label>
                <button type="submit" className="btn-primary sm:col-span-2 sm:justify-self-start">
                  Speichern
                </button>
              </form>
            </details>
          </li>
        ))}
      </ul>

      {erledigungen.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="mb-2 text-sm font-semibold text-brand">Nachweise</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {erledigungen.map((e) => (
              <li key={e.id} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                <span className="text-muted">{formatValue("date", e.erledigt_am)}</span>
                <span>
                  <strong>{fristArt(e.art).kurz}</strong> erledigt · nächste {formatValue("date", e.naechste_faellig)}
                  <span className="text-muted"> · {e.person?.full_name ?? e.person?.email ?? "–"}</span>
                  {e.notiz && <span className="block text-muted">{e.notiz}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
