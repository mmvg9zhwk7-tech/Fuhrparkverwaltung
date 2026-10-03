import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { fuehrerscheinLage, type Kontrolle } from "@/lib/fuehrerschein/status";
import { inputValue } from "@/lib/vehicles/format";
import { FristBadge } from "@/components/badges";
import { Flash } from "@/components/flash";
import { addKontrolle, saveFuehrerschein } from "../actions";
import { KontrollenList, type KontrolleRow } from "./kontrollen-list";

export const metadata: Metadata = { title: "Führerschein" };

export default async function FuehrerscheinPage({ params, searchParams }: PageProps<"/fuehrerscheine/[id]">) {
  await requireRole("admin", "fuhrparkleiter");
  const { id } = await params;
  const { error, message } = (await searchParams) as { error?: string; message?: string };

  const supabase = await createClient();
  const [{ data: person }, { data: schein }, { data: kontrollen }, settings] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", id).maybeSingle(),
    supabase.from("fuehrerscheine").select("klassen, gueltig_bis").eq("profile_id", id).maybeSingle(),
    supabase
      .from("fuehrerschein_kontrollen")
      .select("id, kontrolliert_am, art, ergebnis, foto_pfad, notiz, pruefer:profiles!fuehrerschein_kontrollen_created_by_fkey(full_name, email)")
      .eq("profile_id", id)
      .order("kontrolliert_am", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    getSettings(),
  ]);
  if (!person) notFound();

  const today = todayIso();
  const rows = (kontrollen ?? []) as unknown as KontrolleRow[];
  const gueltigBis = (schein?.gueltig_bis as string | null) ?? null;
  const lage = fuehrerscheinLage({ letzte: (rows[0] as Kontrolle | undefined) ?? null, gueltigBis }, today, settings);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/fuehrerscheine" className="text-sm text-muted hover:text-brand">
          ← Führerscheine
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">{person.full_name ?? person.email}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <FristBadge status={lage.status} />
          <span className="text-sm text-muted">{lage.grund}</span>
        </div>
      </div>
      <Flash error={error} message={message} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form action={addKontrolle.bind(null, id)} className="card flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-brand">Kontrolle eintragen</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="label">
              Kontrolliert am
              <input type="date" name="kontrolliert_am" defaultValue={today} max={today} className="input-field" />
            </label>
            <label className="label">
              Wie
              <select name="art" defaultValue="vorlage" className="input-field">
                <option value="vorlage">Original vorgelegt</option>
                <option value="foto">Per Foto geprüft</option>
              </select>
            </label>
          </div>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-medium text-brand">Ergebnis</legend>
            <label className="flex items-center gap-2">
              <input type="radio" name="ergebnis" value="ok" defaultChecked />
              In Ordnung (gültig, passende Klasse)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="ergebnis" value="beanstandet" />
              Beanstandet (z.B. abgelaufen, Fahrverbot)
            </label>
          </fieldset>
          <label className="label">
            Foto (optional)
            <input type="file" name="foto" accept="image/*" capture="environment" className="text-sm" />
          </label>
          <label className="label">
            Notiz
            <input name="notiz" placeholder="Pflicht bei Beanstandung" className="input-field" />
          </label>
          <button type="submit" className="btn-primary self-start">
            Kontrolle speichern
          </button>
        </form>

        <form action={saveFuehrerschein.bind(null, id)} className="card flex flex-col gap-4 self-start">
          <h2 className="text-lg font-semibold text-brand">Führerschein</h2>
          <label className="label">
            Klassen
            <input name="klassen" defaultValue={(schein?.klassen as string | null) ?? ""} placeholder="z.B. B, BE" className="input-field" />
          </label>
          <label className="label">
            Gültig bis (nur wenn befristet)
            <input type="date" name="gueltig_bis" defaultValue={inputValue("date", gueltigBis)} className="input-field" />
          </label>
          <button type="submit" className="btn-secondary self-start">
            Speichern
          </button>
        </form>
      </div>

      <KontrollenList profileId={id} rows={rows} />
    </div>
  );
}
