import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/profile";
import { Flash } from "@/components/flash";
import { importVehicles } from "../actions";
import { ImportPreview } from "./import-preview";

export const metadata: Metadata = { title: "Fahrzeuge importieren" };

export default async function ImportPage({ searchParams }: PageProps<"/fahrzeuge/import">) {
  await requireRole("admin", "fuhrparkleiter");
  const { error } = (await searchParams) as { error?: string };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/fahrzeuge" className="text-sm text-muted hover:text-brand">
          ← Fahrzeuge
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">Aus Excel importieren</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          In Excel die Überschriftenzeile und alle Fahrzeugzeilen markieren, kopieren
          (⌘C) und unten einfügen (⌘V). Fahrzeuge mit bereits bekannter
          Fahrgestellnummer werden aktualisiert, alle anderen neu angelegt.
        </p>
      </div>
      <Flash error={error} />
      <form action={importVehicles}>
        <ImportPreview />
      </form>
    </div>
  );
}
