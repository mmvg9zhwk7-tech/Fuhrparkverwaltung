import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageFleet } from "@/lib/auth/roles";
import { getSettings } from "@/lib/settings";
import { todayIso } from "@/lib/dates";
import { formatValue } from "@/lib/vehicles/format";
import { Flash } from "@/components/flash";
import { PhotoInput } from "@/components/photo-input";
import { reportMileage } from "./actions";

export const metadata: Metadata = { title: "KM-Stand melden" };

type MyVehicle = { id: string; kennzeichen: string | null; marke: string | null; typ: string | null; km_stand: number | null; km_stand_datum: string | null };

export default async function KmMeldenPage({ searchParams }: PageProps<"/km-melden">) {
  const profile = await requireProfile();
  const { fahrzeug, error } = (await searchParams) as { fahrzeug?: string; error?: string };

  const supabase = await createClient();
  // Fuhrparkleitung/Admin dürfen für jedes Fahrzeug im Bestand melden.
  const vehicleQuery = canManageFleet(profile.role)
    ? supabase
        .from("vehicles")
        .select("id, kennzeichen, marke, typ, km_stand, km_stand_datum")
        .eq("status", "Bestand")
        .order("kennzeichen")
    : supabase.rpc("my_vehicles");
  const [{ data }, settings] = await Promise.all([vehicleQuery, getSettings()]);
  const vehicles = (data ?? []) as MyVehicle[];
  const selected = vehicles.find((v) => v.id === fahrzeug) ?? (vehicles.length === 1 ? vehicles[0] : undefined);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-brand">
          ← Übersicht
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">KM-Stand melden</h1>
      </div>
      <Flash error={error} />

      {vehicles.length === 0 ? (
        <p className="card text-sm text-muted">
          Dir ist noch kein Fahrzeug zugeordnet. Bitte wende dich an die Fuhrparkleitung.
        </p>
      ) : (
        <form action={reportMileage} className="card flex flex-col gap-4">
          <label className="label">
            Fahrzeug
            <select name="vehicle_id" defaultValue={selected?.id ?? ""} required className="input-field">
              <option value="" disabled>
                Bitte wählen
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.kennzeichen ?? "ohne Kennzeichen"} · {[v.marke, v.typ].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>
          {selected?.km_stand != null && (
            <p className="-mt-2 text-sm text-muted">
              Zuletzt: {formatValue("int", selected.km_stand)} km am{" "}
              {formatValue("date", selected.km_stand_datum)}
            </p>
          )}
          <label className="label">
            Kilometerstand
            <input
              name="km"
              inputMode="numeric"
              pattern="[0-9. ]*"
              required
              placeholder="z.B. 95120"
              className="input-field text-lg"
            />
          </label>
          <label className="label">
            Datum
            <input type="date" name="gemeldet_am" defaultValue={todayIso()} max={todayIso()} className="input-field" />
          </label>
          <label className="label">
            Foto vom Tacho {settings.km_foto_pflicht ? "(Pflicht)" : "(optional)"}
            <PhotoInput name="foto" capture required={settings.km_foto_pflicht} />
          </label>
          <label className="label">
            Notiz (optional)
            <input name="notiz" className="input-field" placeholder="z.B. Warnleuchte an" />
          </label>
          <button type="submit" className="btn-primary">
            Melden
          </button>
        </form>
      )}
    </div>
  );
}
