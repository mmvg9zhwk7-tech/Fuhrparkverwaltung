import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { SCHADEN_COLUMNS, type Schaden } from "@/lib/schaeden/schaeden";
import { Flash } from "@/components/flash";
import { SchadenList } from "@/components/schaden-list";

export const metadata: Metadata = { title: "Schäden" };

const FILTERS = [
  { key: "offen", label: "Offen" },
  { key: "erledigt", label: "Erledigt" },
  { key: "alle", label: "Alle" },
] as const;

export default async function SchaedenPage({ searchParams }: PageProps<"/schaeden">) {
  await requireRole("admin", "fuhrparkleiter");
  const { filter = "offen", message } = (await searchParams) as { filter?: string; message?: string };

  const supabase = await createClient();
  const { data } = await supabase
    .from("schaeden")
    .select(SCHADEN_COLUMNS)
    .order("datum", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  const all = (data ?? []) as unknown as Schaden[];
  const matches = (key: string) => (s: Schaden) =>
    key === "alle" || (key === "erledigt" ? s.status === "erledigt" : s.status !== "erledigt");
  // Nicht fahrbereite und neue zuerst.
  const shown = all
    .filter(matches(filter))
    .sort((a, b) => Number(a.fahrbereit) - Number(b.fahrbereit) || Number(a.status !== "gemeldet") - Number(b.status !== "gemeldet"));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-brand">Schäden</h1>
        <Link href="/schaden-melden" className="btn-primary">
          + Schaden erfassen
        </Link>
      </div>
      <Flash message={message} />

      <nav className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/schaeden?filter=${f.key}`}
            className={`rounded-full px-3 py-1.5 font-medium ${filter === f.key ? "bg-brand text-white" : "bg-white text-brand ring-1 ring-border"}`}
          >
            {f.label} ({all.filter(matches(f.key)).length})
          </Link>
        ))}
      </nav>

      {shown.length ? (
        <SchadenList schaeden={shown} href={(s) => `/schaeden/${s.id}`} />
      ) : (
        <p className="card text-sm text-muted">Keine Meldungen in dieser Ansicht.</p>
      )}
    </div>
  );
}
