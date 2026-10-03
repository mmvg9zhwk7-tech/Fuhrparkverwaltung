import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/profile";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Flash } from "@/components/flash";
import { FristBadge } from "@/components/badges";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { loadMeinFuehrerschein } from "@/lib/fuehrerschein/overview";
import { formatValue } from "@/lib/vehicles/format";

export const metadata: Metadata = { title: "Konto" };

export default async function KontoPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const profile = await requireProfile();
  const fs = await loadMeinFuehrerschein(await createClient(), profile.id, await getSettings());
  // Ohne Führerscheindaten und Kontrollen (z.B. Büro ohne Fahrzeug) kein Abschnitt.
  const zeigeFs = profile.role === "fahrer" || fs.letzte || fs.klassen;

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand">Konto</h1>
      <Flash message={message} />
      <dl className="card grid grid-cols-1 gap-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-muted">Name</dt>
        <dd>{profile.full_name ?? "–"}</dd>
        <dt className="text-muted">E-Mail</dt>
        <dd>{profile.email}</dd>
        <dt className="text-muted">Rolle</dt>
        <dd>{ROLE_LABELS[profile.role]}</dd>
      </dl>
      {zeigeFs && (
        <section className="card flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-brand">Führerscheinkontrolle</h2>
            <FristBadge status={fs.lage.status} />
          </div>
          <p>{fs.lage.grund}</p>
          <dl className="grid grid-cols-1 gap-1 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <dt className="text-muted">Letzte Kontrolle</dt>
            <dd>{fs.letzte ? formatValue("date", fs.letzte.kontrolliert_am) : "–"}</dd>
            <dt className="text-muted">Klassen</dt>
            <dd>{fs.klassen ?? "–"}</dd>
            {fs.gueltigBis && (
              <>
                <dt className="text-muted">Gültig bis</dt>
                <dd>{formatValue("date", fs.gueltigBis)}</dd>
              </>
            )}
          </dl>
          <p className="text-muted">Die Kontrolle trägt die Fuhrparkleitung ein, wenn du deinen Führerschein vorzeigst.</p>
        </section>
      )}
      <Link href="/update-password" className="btn-secondary self-start">
        Passwort ändern
      </Link>
    </div>
  );
}
