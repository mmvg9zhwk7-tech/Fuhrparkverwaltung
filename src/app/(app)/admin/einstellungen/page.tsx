import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/profile";
import { getSettings } from "@/lib/settings";
import { Flash } from "@/components/flash";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function EinstellungenPage({ searchParams }: PageProps<"/admin/einstellungen">) {
  await requireRole("admin");
  const { error, message } = (await searchParams) as { error?: string; message?: string };
  const s = await getSettings();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand">Einstellungen</h1>
      <Flash error={error} message={message} />

      <form action={saveSettings} className="flex flex-col gap-6">
        <fieldset className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="sr-only">KM-Meldung</legend>
          <h2 className="text-lg font-semibold text-brand sm:col-span-2">KM-Meldung (monatlich)</h2>
          <label className="label">
            Fällig bis zum … Tag des Monats
            <input name="km_faellig_tag" type="number" min={1} max={28} defaultValue={s.km_faellig_tag} className="input-field" />
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-brand">
            <input type="checkbox" name="km_foto_pflicht" defaultChecked={s.km_foto_pflicht} />
            Tacho-Foto ist Pflicht
          </label>
        </fieldset>

        <fieldset className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="sr-only">Aussteuerung</legend>
          <div className="sm:col-span-3">
            <h2 className="text-lg font-semibold text-brand">Aussteuerung</h2>
            <p className="mt-1 text-sm text-muted">
              Allgemeine Grenzen. Für einzelne Fahrzeuge lassen sich auf der Fahrzeugseite eigene
              Werte festlegen.
            </p>
          </div>
          <label className="label">
            Max. Kilometer
            <input name="aussteuern_max_km" inputMode="numeric" defaultValue={s.aussteuern_max_km} className="input-field" />
          </label>
          <label className="label">
            Max. Alter (Monate)
            <input name="aussteuern_max_alter_monate" type="number" min={1} defaultValue={s.aussteuern_max_alter_monate} className="input-field" />
          </label>
          <label className="label">
            Vorwarnung (Monate)
            <input name="aussteuern_vorlauf_monate" type="number" min={0} defaultValue={s.aussteuern_vorlauf_monate} className="input-field" />
          </label>
        </fieldset>

        <fieldset className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="sr-only">Fristen</legend>
          <div className="sm:col-span-2">
            <h2 className="text-lg font-semibold text-brand">Fristen</h2>
            <p className="mt-1 text-sm text-muted">HU, UVV-Prüfung und Inspektion.</p>
          </div>
          <label className="label">
            Vorwarnung (Tage)
            <input name="fristen_vorlauf_tage" type="number" min={0} max={365} defaultValue={s.fristen_vorlauf_tage} className="input-field" />
          </label>
        </fieldset>

        <button type="submit" className="btn-primary self-start">
          Speichern
        </button>
      </form>
    </div>
  );
}
