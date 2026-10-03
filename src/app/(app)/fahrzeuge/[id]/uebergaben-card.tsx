import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { personName, UEBERGABE_ARTEN, UEBERGABE_COLUMNS, type Uebergabe } from "@/lib/uebergaben/uebergaben";
import { formatValue } from "@/lib/vehicles/format";

export async function UebergabenCard({ vehicleId }: { vehicleId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("uebergaben")
    .select(UEBERGABE_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .order("datum", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  const rows = (data ?? []) as unknown as Uebergabe[];

  return (
    <section id="uebergaben" className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand">Übergaben</h2>
        <Link href={`/fahrzeuge/${vehicleId}/uebergabe`} className="btn-secondary">
          Übergabe protokollieren
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Übergabeprotokolle.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {rows.map((u) => (
            <li key={u.id}>
              <Link href={`/uebergaben/${u.id}`} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2 hover:text-brand">
                <span className="text-muted">{formatValue("date", u.datum)}</span>
                <span>
                  <strong>{UEBERGABE_ARTEN[u.art]}</strong> · {personName(u)}
                  {u.km != null ? ` · ${formatValue("int", u.km)} km` : ""}
                  {u.unterschrift_pfad ? " · ✍️" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
