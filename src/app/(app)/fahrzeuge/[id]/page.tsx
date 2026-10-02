import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { VEHICLE_COLUMNS, type Vehicle } from "@/lib/vehicles/fields";
import { Flash } from "@/components/flash";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteVehicle, updateVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";

export const metadata: Metadata = { title: "Fahrzeug" };

export default async function FahrzeugPage({ params, searchParams }: PageProps<"/fahrzeuge/[id]">) {
  await requireRole("admin", "fuhrparkleiter");
  const { id } = await params;
  const { error, message } = (await searchParams) as { error?: string; message?: string };

  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select(VEHICLE_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const vehicle = data as unknown as Vehicle;

  const title = [vehicle.kennzeichen, [vehicle.marke, vehicle.typ].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/fahrzeuge" className="text-sm text-muted hover:text-brand">
          ← Fahrzeuge
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">
          {title || "Fahrzeug"}
        </h1>
        {vehicle.fin_kurz && (
          <p className="text-sm text-muted">FIN …{vehicle.fin_kurz}</p>
        )}
      </div>
      <Flash error={error} message={message} />
      <VehicleForm action={updateVehicle.bind(null, id)} vehicle={vehicle} submitLabel="Speichern" />
      <form action={deleteVehicle.bind(null, id)} className="border-t border-border pt-6">
        <ConfirmButton
          message="Dieses Fahrzeug wirklich löschen? Das lässt sich nicht rückgängig machen."
          className="text-sm font-semibold text-red-700 underline"
        >
          Fahrzeug löschen
        </ConfirmButton>
      </form>
    </div>
  );
}
