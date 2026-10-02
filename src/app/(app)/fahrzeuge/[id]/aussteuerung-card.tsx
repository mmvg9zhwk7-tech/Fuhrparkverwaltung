import type { Settings } from "@/lib/settings";
import { todayIso } from "@/lib/dates";
import { formatValue } from "@/lib/vehicles/format";
import { berechneAussteuerung, GRUND_LABELS, type AussteuerungInput, type KmPoint } from "@/lib/vehicles/aussteuerung";
import { AmpelBadge } from "@/components/badges";

export function AussteuerungCard({
  vehicle,
  history,
  settings,
}: {
  vehicle: AussteuerungInput;
  history: KmPoint[];
  settings: Settings;
}) {
  const a = berechneAussteuerung(vehicle, settings, todayIso(), history);

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand">Aussteuerung</h2>
        <AmpelBadge ampel={a.ampel} />
      </div>
      {a.datum ? (
        <p className="text-2xl font-bold text-brand">
          {formatValue("date", a.datum)}
          <span className="ml-2 text-sm font-normal text-muted">({GRUND_LABELS[a.grund!]})</span>
        </p>
      ) : (
        <p className="text-sm text-muted">
          Für eine Empfehlung fehlen Erstzulassung/Einkaufsdatum oder ein KM-Stand.
        </p>
      )}
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Fahrleistung</dt>
        <dd>{a.kmProJahr ? `${formatValue("int", a.kmProJahr)} km/Jahr` : "–"}</dd>
        <dt className="text-muted">km-Grenze</dt>
        <dd>{formatValue("int", a.maxKm)} km</dd>
        {a.gruende.map((g) => (
          <div key={g.grund} className="contents">
            <dt className="text-muted">{GRUND_LABELS[g.grund]}</dt>
            <dd>{formatValue("date", g.datum)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
