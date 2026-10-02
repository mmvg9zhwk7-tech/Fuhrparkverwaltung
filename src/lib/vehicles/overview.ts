import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, todayIso } from "@/lib/dates";
import { mileageStatus, type MileageStatus } from "@/lib/mileage/status";
import type { Settings } from "@/lib/settings";
import { berechneAussteuerung, type Aussteuerung, type KmPoint } from "./aussteuerung";

export type FleetVehicle = {
  id: string;
  kennzeichen: string | null;
  marke: string | null;
  typ: string | null;
  filiale: string | null;
  nutzer: string | null;
  status: string;
  km_stand: number | null;
  km_stand_datum: string | null;
  erstzulassung: string | null;
  einkaufsdatum: string | null;
  ende_lf: string | null;
  aussteuern_ab_km: number | null;
  aussteuern_ab_datum: string | null;
  fahrer_id: string | null;
  ist_pool: boolean;
  fahrer: { full_name: string | null; email: string | null } | null;
  km: MileageStatus;
  aussteuerung: Aussteuerung;
};

const COLUMNS =
  "id, kennzeichen, marke, typ, filiale, nutzer, status, km_stand, km_stand_datum, erstzulassung, einkaufsdatum, ende_lf, aussteuern_ab_km, aussteuern_ab_datum, fahrer_id, ist_pool, fahrer:profiles!vehicles_fahrer_id_fkey(full_name, email)";

// Alle Fahrzeuge im Bestand mit KM-Meldestatus und Aussteuerungs-Ampel.
// Für Übersicht, KM-Seite und Fahrzeugliste (nur Fuhrparkleitung/Admin).
export async function loadFleet(supabase: SupabaseClient, settings: Settings) {
  const today = todayIso();
  const [{ data: vehicles }, { data: reports }] = await Promise.all([
    supabase.from("vehicles").select(COLUMNS).eq("status", "Bestand").order("kennzeichen"),
    supabase
      .from("mileage_reports")
      .select("vehicle_id, km, gemeldet_am")
      .gte("gemeldet_am", addDays(today, -400)),
  ]);

  const history = new Map<string, KmPoint[]>();
  for (const r of reports ?? []) {
    const list = history.get(r.vehicle_id) ?? [];
    list.push({ km: r.km, datum: r.gemeldet_am });
    history.set(r.vehicle_id, list);
  }

  return ((vehicles ?? []) as unknown as Omit<FleetVehicle, "km" | "aussteuerung">[]).map(
    (v): FleetVehicle => ({
      ...v,
      km: mileageStatus(v.km_stand_datum, today, settings.km_faellig_tag),
      aussteuerung: berechneAussteuerung(v, settings, today, history.get(v.id)),
    }),
  );
}

export function vehicleTitle(v: Record<string, unknown>) {
  const model = [v.marke, v.typ].filter(Boolean).join(" ");
  return [v.kennzeichen, model].filter(Boolean).join(" · ") || "Fahrzeug";
}
