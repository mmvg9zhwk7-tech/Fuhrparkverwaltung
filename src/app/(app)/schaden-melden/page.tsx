import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageFleet } from "@/lib/auth/roles";
import { todayIso } from "@/lib/dates";
import { MAX_FOTOS, SCHADEN_COLUMNS, type Schaden } from "@/lib/schaeden/schaeden";
import { vehicleTitle } from "@/lib/vehicles/overview";
import { Flash } from "@/components/flash";
import { PhotoInput } from "@/components/photo-input";
import { SchadenList } from "@/components/schaden-list";
import { reportSchaden } from "./actions";

export const metadata: Metadata = { title: "Schaden melden" };

type MyVehicle = { id: string; kennzeichen: string | null; marke: string | null; typ: string | null };

export default async function SchadenMeldenPage({ searchParams }: PageProps<"/schaden-melden">) {
  const profile = await requireProfile();
  const { fahrzeug, error, message } = (await searchParams) as { fahrzeug?: string; error?: string; message?: string };

  const supabase = await createClient();
  const vehicleQuery = canManageFleet(profile.role)
    ? supabase.from("vehicles").select("id, kennzeichen, marke, typ").eq("status", "Bestand").order("kennzeichen")
    : supabase.rpc("my_vehicles");
  const [{ data }, { data: meine }] = await Promise.all([
    vehicleQuery,
    supabase
      .from("schaeden")
      .select(SCHADEN_COLUMNS)
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const vehicles = (data ?? []) as MyVehicle[];
  const selected = vehicles.find((v) => v.id === fahrzeug) ?? (vehicles.length === 1 ? vehicles[0] : undefined);
  const today = todayIso();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-brand">
          ← Übersicht
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">Schaden melden</h1>
        <p className="mt-1 text-sm text-muted">
          Unfall, Kratzer, Steinschlag, Warnleuchte – lieber einmal zu viel melden. Bei einem Unfall mit
          Verletzten zuerst 112 anrufen.
        </p>
      </div>
      <Flash error={error} message={message} />

      {vehicles.length === 0 ? (
        <p className="card text-sm text-muted">Dir ist noch kein Fahrzeug zugeordnet.</p>
      ) : (
        <form action={reportSchaden} className="card flex flex-col gap-4">
          <label className="label">
            Fahrzeug
            <select name="vehicle_id" defaultValue={selected?.id ?? ""} required className="input-field">
              <option value="" disabled>
                Bitte wählen
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {vehicleTitle(v)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="label">
              Wann
              <input type="date" name="datum" defaultValue={today} max={today} className="input-field" />
            </label>
            <label className="label">
              Wo (optional)
              <input name="ort" placeholder="z.B. Parkplatz Filiale" className="input-field" />
            </label>
          </div>
          <label className="label">
            Was ist passiert?
            <textarea
              name="beschreibung"
              required
              rows={4}
              placeholder="z.B. Beim Ausparken Pfosten touchiert, Delle hinten links"
              className="input-field"
            />
          </label>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-medium text-brand">Kann das Fahrzeug weiter sicher fahren?</legend>
            <label className="flex items-center gap-2">
              <input type="radio" name="fahrbereit" value="ja" defaultChecked /> Ja
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="fahrbereit" value="nein" /> Nein / unsicher
            </label>
          </fieldset>
          <label className="label">
            Fotos (bis zu {MAX_FOTOS})
            <PhotoInput name="fotos" multiple max={MAX_FOTOS} />
          </label>
          <button type="submit" className="btn-primary">
            Schaden melden
          </button>
        </form>
      )}

      {(meine?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-brand">Meine Meldungen</h2>
          <SchadenList
            schaeden={(meine ?? []) as unknown as Schaden[]}
            vehicleNames={new Map(vehicles.map((v) => [v.id, vehicleTitle(v)]))}
          />
        </section>
      )}
    </div>
  );
}
