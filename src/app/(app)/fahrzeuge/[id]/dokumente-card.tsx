import { createClient } from "@/lib/supabase/server";
import { DOKUMENT_BUCKET, DOKUMENT_KATEGORIEN, formatGroesse, type DokumentKategorie } from "@/lib/dokumente/dokumente";
import { formatValue } from "@/lib/vehicles/format";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteDokument } from "./dokumente-actions";
import { DokumentUpload } from "./dokument-upload";

type DokumentRow = {
  id: string;
  kategorie: DokumentKategorie;
  name: string;
  pfad: string;
  groesse: number | null;
  created_at: string;
};

export async function DokumenteCard({ vehicleId }: { vehicleId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fahrzeug_dokumente")
    .select("id, kategorie, name, pfad, groesse, created_at")
    .eq("vehicle_id", vehicleId)
    .order("kategorie")
    .order("created_at", { ascending: false });
  const docs = (data ?? []) as DokumentRow[];
  // Kurzlebige Download-Links mit dem ursprünglichen Namen.
  const links = await Promise.all(
    docs.map(async (d) => {
      const ext = d.pfad.split(".").pop();
      const fileName = d.name.endsWith(`.${ext}`) ? d.name : `${d.name}.${ext}`;
      const { data: signed } = await supabase.storage
        .from(DOKUMENT_BUCKET)
        .createSignedUrl(d.pfad, 60 * 60, { download: fileName });
      return signed?.signedUrl ?? null;
    }),
  );

  return (
    <section id="dokumente" className="card flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-brand">Dokumente</h2>
      {docs.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Dokumente.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {docs.map((d, i) => (
            <li key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
              <span>
                {links[i] ? (
                  <a href={links[i]!} className="font-medium text-brand underline">
                    {d.name}
                  </a>
                ) : (
                  <span className="font-medium">{d.name}</span>
                )}
                <span className="block text-xs text-muted">
                  {DOKUMENT_KATEGORIEN[d.kategorie]} · {formatValue("date", d.created_at.slice(0, 10))}
                  {d.groesse ? ` · ${formatGroesse(d.groesse)}` : ""}
                </span>
              </span>
              <form action={deleteDokument.bind(null, vehicleId, d.id)}>
                <ConfirmButton message={`„${d.name}“ wirklich löschen?`} className="text-xs text-red-700 underline">
                  Löschen
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      <DokumentUpload vehicleId={vehicleId} />
    </section>
  );
}
