import type { SupabaseClient } from "@supabase/supabase-js";

export type VehicleFilter = { q?: string; status?: string; filiale?: string };

// Fahrzeugliste mit Suchfeld und Filtern - für die Liste und den Export.
export function searchVehicles(supabase: SupabaseClient, columns: string, { q, status, filiale }: VehicleFilter) {
  let query = supabase.from("vehicles").select(columns).order("kennzeichen");
  if (status) query = query.eq("status", status);
  if (filiale) query = query.eq("filiale", filiale);
  if (q) {
    // Kommas/Klammern würden den or-Filter zerlegen.
    const term = q.replace(/[,()]/g, " ").trim();
    query = query.or(
      ["kennzeichen", "marke", "typ", "fin", "vorgang", "nutzer", "kostenstelle"]
        .map((col) => `${col}.ilike.%${term}%`)
        .join(","),
    );
  }
  return query;
}
