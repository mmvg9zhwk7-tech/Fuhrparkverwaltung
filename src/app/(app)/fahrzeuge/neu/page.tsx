import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/profile";
import { Flash } from "@/components/flash";
import { createVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";

export const metadata: Metadata = { title: "Neues Fahrzeug" };

export default async function NeuesFahrzeugPage({ searchParams }: PageProps<"/fahrzeuge/neu">) {
  await requireRole("admin", "fuhrparkleiter");
  const { error } = (await searchParams) as { error?: string };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/fahrzeuge" className="text-sm text-muted hover:text-brand">
          ← Fahrzeuge
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">Neues Fahrzeug</h1>
      </div>
      <Flash error={error} />
      <VehicleForm action={createVehicle} submitLabel="Fahrzeug anlegen" />
    </div>
  );
}
