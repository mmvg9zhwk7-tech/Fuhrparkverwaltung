import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedPhotoUrls } from "@/lib/storage/photos";
import { formatValue } from "@/lib/vehicles/format";

export type MileageRow = {
  id: string;
  km: number;
  gemeldet_am: string;
  foto_pfad: string | null;
  notiz: string | null;
  melder: { full_name: string | null; email: string | null } | null;
};

export async function MileageHistory({ vehicleId, rows }: { vehicleId: string; rows: MileageRow[] }) {
  const urls = await signedPhotoUrls(
    await createClient(),
    rows.map((r) => r.foto_pfad ?? ""),
  );

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand">KM-Verlauf</h2>
        <Link href={`/km-melden?fahrzeug=${vehicleId}`} className="btn-secondary">
          KM-Stand eintragen
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Meldungen.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {rows.map((r) => {
            const url = r.foto_pfad ? urls.get(r.foto_pfad) : undefined;
            return (
              <li key={r.id} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-3 py-2">
                <span className="text-muted">{formatValue("date", r.gemeldet_am)}</span>
                <span>
                  <strong>{formatValue("int", r.km)} km</strong>
                  <span className="text-muted"> · {r.melder?.full_name ?? r.melder?.email ?? "–"}</span>
                  {r.notiz && <span className="block text-muted">{r.notiz}</span>}
                </span>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="text-brand underline">
                    Foto
                  </a>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
