import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, isRole } from "@/lib/auth/roles";
import { inputValue } from "@/lib/vehicles/format";
import type { Vehicle } from "@/lib/vehicles/fields";
import { saveAssignment } from "../actions";

// Wer fährt das Fahrzeug, und gelten eigene Aussteuerungsgrenzen?
export async function AssignmentCard({ vehicle }: { vehicle: Vehicle }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name");
  const people = data ?? [];

  return (
    <form action={saveAssignment.bind(null, vehicle.id)} className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-brand">Fahrer:in & Grenzen</h2>
      <label className="label">
        Feste:r Fahrer:in
        <select name="fahrer_id" defaultValue={(vehicle.fahrer_id as string) ?? ""} className="input-field">
          <option value="">– keine:r –</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? p.email}
              {isRole(p.role) && p.role !== "fahrer" ? ` (${ROLE_LABELS[p.role]})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-brand">
        <input type="checkbox" name="ist_pool" defaultChecked={vehicle.ist_pool === true} />
        Pool-Fahrzeug (alle Fahrer:innen können es nutzen und KM melden)
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="label">
          Eigene km-Grenze
          <input
            name="aussteuern_ab_km"
            inputMode="numeric"
            defaultValue={inputValue("int", vehicle.aussteuern_ab_km ?? null)}
            placeholder="Standard"
            className="input-field"
          />
        </label>
        <label className="label">
          Aussteuern am
          <input
            type="date"
            name="aussteuern_ab_datum"
            defaultValue={inputValue("date", vehicle.aussteuern_ab_datum ?? null)}
            className="input-field"
          />
        </label>
      </div>
      <button type="submit" className="btn-secondary self-start">
        Speichern
      </button>
    </form>
  );
}
