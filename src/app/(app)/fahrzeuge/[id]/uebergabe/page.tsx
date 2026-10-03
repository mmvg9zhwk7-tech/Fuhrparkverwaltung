import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { TANK_STUFEN, ZUBEHOER } from "@/lib/uebergaben/uebergaben";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle } from "@/lib/vehicles/overview";
import { Flash } from "@/components/flash";
import { PhotoInput } from "@/components/photo-input";
import { SignaturePad } from "@/components/signature-pad";
import { saveUebergabe } from "../../../uebergaben/actions";

export const metadata: Metadata = { title: "Übergabe" };

export default async function UebergabeFormPage({ params, searchParams }: PageProps<"/fahrzeuge/[id]/uebergabe">) {
  await requireRole("admin", "fuhrparkleiter");
  const { id } = await params;
  const { error } = (await searchParams) as { error?: string };

  const supabase = await createClient();
  const [{ data: vehicle }, { data: people }] = await Promise.all([
    supabase.from("vehicles").select("id, kennzeichen, marke, typ, km_stand, km_stand_datum, fahrer_id").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("id, full_name, email").eq("is_active", true).order("full_name"),
  ]);
  if (!vehicle) notFound();
  // Hat das Fahrzeug eine:n Fahrer:in, ist eher eine Rückgabe dran.
  const defaultArt = vehicle.fahrer_id ? "rueckgabe" : "ausgabe";
  const today = todayIso();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <Link href={`/fahrzeuge/${id}`} className="text-sm text-muted hover:text-brand">
          ← {vehicleTitle(vehicle)}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">Übergabeprotokoll</h1>
      </div>
      <Flash error={error} />

      <form action={saveUebergabe.bind(null, id)} className="flex flex-col gap-6">
        <fieldset className="card flex flex-col gap-4">
          <legend className="sr-only">Übergabe</legend>
          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            {(["ausgabe", "rueckgabe"] as const).map((art) => (
              <label key={art} className="flex items-center justify-center gap-2 rounded-xl border border-border p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
                <input type="radio" name="art" value={art} defaultChecked={art === defaultArt} />
                {art === "ausgabe" ? "Ausgabe" : "Rückgabe"}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="label">
              Datum
              <input type="date" name="datum" defaultValue={today} max={today} className="input-field" />
            </label>
            <label className="label">
              Person
              <select name="person_id" defaultValue={vehicle.fahrer_id ?? ""} className="input-field">
                <option value="">– andere (unten eintragen) –</option>
                {(people ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="label">
            Oder Name (ohne Konto, z.B. Werkstatt)
            <input name="person_name" className="input-field" />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="zuordnen" defaultChecked={!vehicle.fahrer_id} className="mt-1" />
            Bei Ausgabe: Person als feste:n Fahrer:in eintragen
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="zuordnung_aufheben" defaultChecked={Boolean(vehicle.fahrer_id)} className="mt-1" />
            Bei Rückgabe: feste Zuordnung aufheben
          </label>
        </fieldset>

        <fieldset className="card flex flex-col gap-4">
          <legend className="sr-only">Zustand</legend>
          <h2 className="text-lg font-semibold text-brand">Zustand</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="label">
              Kilometerstand
              <input name="km" inputMode="numeric" placeholder={vehicle.km_stand ? `zuletzt ${formatValue("int", vehicle.km_stand)}` : ""} className="input-field" />
            </label>
            <label className="label">
              Tank / Akku
              <select name="tank" defaultValue="" className="input-field">
                <option value="">–</option>
                {TANK_STUFEN.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-medium text-brand">Vorhanden</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ZUBEHOER.map((z) => (
                <label key={z} className="flex items-center gap-2">
                  <input type="checkbox" name="zubehoer" value={z} /> {z}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <legend className="mb-1 w-full font-medium text-brand">Innen und außen sauber?</legend>
            <label className="flex items-center gap-2"><input type="radio" name="sauber" value="ja" /> Ja</label>
            <label className="flex items-center gap-2"><input type="radio" name="sauber" value="nein" /> Nein</label>
          </fieldset>
          <label className="label">
            Schäden / Mängel
            <textarea name="maengel" rows={3} placeholder="z.B. Kratzer Stoßstange vorne rechts (bekannt)" className="input-field" />
          </label>
          <label className="label">
            Fotos (bis zu 6)
            <PhotoInput name="fotos" multiple max={6} />
          </label>
        </fieldset>

        <fieldset className="card flex flex-col gap-3">
          <legend className="sr-only">Unterschrift</legend>
          <h2 className="text-lg font-semibold text-brand">Unterschrift</h2>
          <p className="text-sm text-muted">Die übernehmende bzw. zurückgebende Person bestätigt den Zustand.</p>
          <SignaturePad name="unterschrift" />
        </fieldset>

        <button type="submit" className="btn-primary">
          Protokoll speichern
        </button>
      </form>
    </div>
  );
}
