import { createClient } from "@/lib/supabase/server";
import { signedPhotoUrls } from "@/lib/storage/photos";
import { ART_LABELS, ERGEBNIS_LABELS } from "@/lib/fuehrerschein/status";
import { formatValue } from "@/lib/vehicles/format";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteKontrolle } from "../actions";

export type KontrolleRow = {
  id: string;
  kontrolliert_am: string;
  art: keyof typeof ART_LABELS;
  ergebnis: keyof typeof ERGEBNIS_LABELS;
  foto_pfad: string | null;
  notiz: string | null;
  pruefer: { full_name: string | null; email: string | null } | null;
};

// Nachweise aller Kontrollen einer Person.
export async function KontrollenList({ profileId, rows }: { profileId: string; rows: KontrolleRow[] }) {
  const urls = await signedPhotoUrls(await createClient(), rows.map((r) => r.foto_pfad ?? ""));

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-brand">Nachweise</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Kontrolle eingetragen.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {rows.map((r) => {
            const url = r.foto_pfad ? urls.get(r.foto_pfad) : undefined;
            return (
              <li key={r.id} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-start gap-3 py-2">
                <span className="text-muted">{formatValue("date", r.kontrolliert_am)}</span>
                <span>
                  <strong className={r.ergebnis === "beanstandet" ? "text-red-700" : undefined}>
                    {ERGEBNIS_LABELS[r.ergebnis]}
                  </strong>
                  <span className="text-muted">
                    {" "}
                    · {ART_LABELS[r.art]} · {r.pruefer?.full_name ?? r.pruefer?.email ?? "–"}
                  </span>
                  {r.notiz && <span className="block text-muted">{r.notiz}</span>}
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="text-brand underline">
                      Foto
                    </a>
                  )}
                </span>
                <form action={deleteKontrolle.bind(null, profileId, r.id)}>
                  <ConfirmButton message="Diese Kontrolle wirklich löschen?" className="text-xs text-red-700 underline">
                    Löschen
                  </ConfirmButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
