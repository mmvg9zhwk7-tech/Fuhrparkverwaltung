import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { compareFristen, faelligText, FRIST_ARTEN, type FristStatus } from "@/lib/fristen/fristen";
import { formatValue } from "@/lib/vehicles/format";
import { loadFleet, vehicleTitle } from "@/lib/vehicles/overview";
import { FristBadge } from "@/components/badges";

export const metadata: Metadata = { title: "Fristen" };

const FILTERS: { key: FristStatus | "faellig" | "alle"; label: string }[] = [
  { key: "faellig", label: "Fällig" },
  { key: "ueberfaellig", label: "Überfällig" },
  { key: "bald", label: "Bald" },
  { key: "fehlt", label: "Ohne Datum" },
  { key: "alle", label: "Alle" },
];

// HU, UVV und Inspektion aller Fahrzeuge im Bestand.
export default async function FristenPage({ searchParams }: PageProps<"/fristen">) {
  await requireRole("admin", "fuhrparkleiter");
  const { filter = "faellig", art } = (await searchParams) as { filter?: string; art?: string };
  const settings = await getSettings();
  const fleet = await loadFleet(await createClient(), settings);
  const today = todayIso();

  const all = fleet
    .flatMap((v) => v.fristen.map((f) => ({ ...f, vehicle: v })))
    .filter((f) => !art || f.art === art);
  const matches = (key: string) => (f: (typeof all)[number]) =>
    key === "alle" || (key === "faellig" ? f.status === "ueberfaellig" || f.status === "bald" : f.status === key);
  const shown = all.filter(matches(filter)).sort(compareFristen);
  const href = (next: { filter?: string; art?: string }) => {
    const params = new URLSearchParams({ filter: next.filter ?? filter });
    const nextArt = next.art ?? art;
    if (nextArt) params.set("art", nextArt);
    return `/fristen?${params}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">Fristen</h1>
        <p className="mt-1 text-sm text-muted">
          HU, UVV-Prüfung und Inspektion · „Bald“ heißt: in den nächsten {settings.fristen_vorlauf_tage} Tagen.
          Daten pflegst du auf der Fahrzeugseite oder per Excel-Import.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ filter: f.key })}
            className={`rounded-full px-3 py-1.5 font-medium ${filter === f.key ? "bg-brand text-white" : "bg-white text-brand ring-1 ring-border"}`}
          >
            {f.label} ({all.filter(matches(f.key)).length})
          </Link>
        ))}
      </nav>
      <nav className="-mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {[{ art: "", kurz: "Alle Arten" }, ...FRIST_ARTEN].map((a) => (
          <Link
            key={a.art}
            href={href({ art: a.art })}
            className={(art ?? "") === a.art ? "font-semibold text-brand underline" : "text-muted hover:text-brand"}
          >
            {a.kurz}
          </Link>
        ))}
      </nav>

      <ul className="grid grid-cols-1 gap-2">
        {shown.map((f) => (
          <li key={`${f.vehicle.id}-${f.art}`}>
            <Link
              href={`/fahrzeuge/${f.vehicle.id}#fristen`}
              className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold text-brand">{vehicleTitle(f.vehicle)}</p>
                <p className="text-xs text-muted">{f.vehicle.filiale ?? ""}</p>
              </div>
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-sm text-muted">
                {f.faellig ? `${formatValue("date", f.faellig)} · ` : ""}
                {faelligText(f.faellig, today)}
              </p>
              <FristBadge status={f.status} />
            </Link>
          </li>
        ))}
        {!shown.length && <li className="card text-sm text-muted">Nichts in dieser Ansicht. 👍</li>}
      </ul>
    </div>
  );
}
