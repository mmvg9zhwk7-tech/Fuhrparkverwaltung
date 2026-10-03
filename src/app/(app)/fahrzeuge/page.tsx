import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { type Vehicle } from "@/lib/vehicles/fields";
import { formatValue } from "@/lib/vehicles/format";
import { Flash } from "@/components/flash";
import { searchVehicles } from "@/lib/vehicles/search";

export const metadata: Metadata = { title: "Fahrzeuge" };

const LIST_COLUMNS =
  "id, kennzeichen, marke, typ, fin_kurz, art, filiale, nutzer, status, km_stand, km_stand_datum, kaufpreis, bestandswert, ende_lf";

type Search = { q?: string; status?: string; filiale?: string; error?: string; message?: string };

export default async function FahrzeugePage({ searchParams }: PageProps<"/fahrzeuge">) {
  await requireRole("admin", "fuhrparkleiter");
  const { q, status, filiale, error, message } = (await searchParams) as Search;

  const supabase = await createClient();
  const [{ data }, { data: options }] = await Promise.all([
    searchVehicles(supabase, LIST_COLUMNS, { q, status, filiale }),
    supabase.from("vehicles").select("status, filiale"),
  ]);
  const vehicles = (data ?? []) as unknown as Vehicle[];
  const statuses = unique(options?.map((o) => o.status));
  const filialen = unique(options?.map((o) => o.filiale));
  const exportParams = new URLSearchParams(
    Object.entries({ q, status, filiale }).filter((e): e is [string, string] => Boolean(e[1])),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          Fahrzeuge <span className="text-muted">({vehicles.length})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          {/* Normaler Link statt <Link>: liefert eine Datei, keine Seite. */}
          <a href={`/fahrzeuge/export?${exportParams}`} className="btn-secondary" download>
            Excel-Export
          </a>
          <Link href="/fahrzeuge/import" className="btn-secondary">
            Aus Excel importieren
          </Link>
          <Link href="/fahrzeuge/neu" className="btn-primary">
            + Fahrzeug
          </Link>
        </div>
      </div>

      <Flash error={error} message={message} />

      <form className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Kennzeichen, Marke, FIN, Nutzer …"
          className="input-field"
        />
        <select name="status" defaultValue={status ?? ""} className="input-field">
          <option value="">Alle Status</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select name="filiale" defaultValue={filiale ?? ""} className="input-field">
          <option value="">Alle Filialen</option>
          {filialen.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          Filtern
        </button>
      </form>

      {vehicles.length === 0 ? (
        <div className="card text-sm text-muted">
          Keine Fahrzeuge gefunden.{" "}
          {!q && !status && !filiale && (
            <>
              Leg das erste an oder{" "}
              <Link href="/fahrzeuge/import" className="text-brand underline">
                importiere deine Excel-Liste
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link
                href={`/fahrzeuge/${v.id}`}
                className="card grid grid-cols-1 gap-2 transition hover:border-brand/40 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_8rem] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-brand">{v.kennzeichen ?? "ohne Kennzeichen"}</p>
                  <p className="text-xs text-muted">{v.fin_kurz ? `FIN …${v.fin_kurz}` : ""}</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">{[v.marke, v.typ].filter(Boolean).join(" ") || "–"}</p>
                  <p className="text-muted">{[v.art, v.filiale].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="text-sm">
                  <p>{v.nutzer ?? "–"}</p>
                  <p className="text-muted">
                    {formatValue("int", v.km_stand)} km
                    {v.km_stand_datum ? ` (${formatValue("date", v.km_stand_datum)})` : ""}
                  </p>
                </div>
                <span className="justify-self-start rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-brand sm:justify-self-end">
                  {v.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function unique(values: (string | null | undefined)[] | undefined) {
  return [...new Set((values ?? []).filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
}
