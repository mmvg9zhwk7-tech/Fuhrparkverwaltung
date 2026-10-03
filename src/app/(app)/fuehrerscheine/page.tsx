import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { getSettings } from "@/lib/settings";
import { loadFuehrerscheine } from "@/lib/fuehrerschein/overview";
import { formatValue } from "@/lib/vehicles/format";
import { FristBadge } from "@/components/badges";

export const metadata: Metadata = { title: "Führerscheine" };

const FILTERS = [
  { key: "faellig", label: "Zu kontrollieren" },
  { key: "alle", label: "Alle" },
] as const;

export default async function FuehrerscheinePage({ searchParams }: PageProps<"/fuehrerscheine">) {
  await requireRole("admin", "fuhrparkleiter");
  const { filter = "faellig" } = (await searchParams) as { filter?: string };
  const settings = await getSettings();
  const people = await loadFuehrerscheine(await createClient(), settings);
  const faellig = people.filter((p) => p.lage.status !== "ok");
  const shown = filter === "alle" ? people : faellig;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">Führerscheinkontrolle</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Als Halter muss die Firma regelmäßig prüfen, dass alle, die Firmenfahrzeuge fahren, einen gültigen
          Führerschein haben. Kontrolliert wird alle {settings.fs_kontrolle_intervall_monate} Monate. Erfasst sind
          alle Fahrer:innen und alle anderen mit fest zugeordnetem Fahrzeug.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/fuehrerscheine?filter=${f.key}`}
            className={`rounded-full px-3 py-1.5 font-medium ${filter === f.key ? "bg-brand text-white" : "bg-white text-brand ring-1 ring-border"}`}
          >
            {f.label} ({f.key === "alle" ? people.length : faellig.length})
          </Link>
        ))}
      </nav>

      <ul className="grid grid-cols-1 gap-2">
        {shown.map((p) => (
          <li key={p.id}>
            <Link
              href={`/fuehrerscheine/${p.id}`}
              className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold text-brand">{p.full_name ?? p.email}</p>
                <p className="text-xs text-muted">{p.klassen ? `Klassen ${p.klassen}` : "Klassen nicht erfasst"}</p>
              </div>
              <p className="text-sm">{p.lage.grund}</p>
              <p className="text-sm text-muted">
                Zuletzt: {p.letzte ? formatValue("date", p.letzte.kontrolliert_am) : "–"}
              </p>
              <FristBadge status={p.lage.status} />
            </Link>
          </li>
        ))}
        {!shown.length && (
          <li className="card text-sm text-muted">
            {people.length ? "Alle Kontrollen sind aktuell. 👍" : "Noch keine Fahrer:innen angelegt."}
          </li>
        )}
      </ul>
    </div>
  );
}
