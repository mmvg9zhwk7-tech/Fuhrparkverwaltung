import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { getSettings } from "@/lib/settings";
import { VEHICLE_COLUMNS, type Vehicle } from "@/lib/vehicles/fields";
import { vehicleTitle } from "@/lib/vehicles/overview";
import type { AussteuerungInput } from "@/lib/vehicles/aussteuerung";
import { Flash } from "@/components/flash";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteVehicle, updateVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";
import { AssignmentCard } from "./assignment-card";
import { AussteuerungCard } from "./aussteuerung-card";
import { MileageHistory, type MileageRow } from "./mileage-history";

export const metadata: Metadata = { title: "Fahrzeug" };

export default async function FahrzeugPage({ params, searchParams }: PageProps<"/fahrzeuge/[id]">) {
  await requireRole("admin", "fuhrparkleiter");
  const { id } = await params;
  const { error, message } = (await searchParams) as { error?: string; message?: string };

  const supabase = await createClient();
  const [{ data }, { data: reports }, settings] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("mileage_reports")
      .select("id, km, gemeldet_am, foto_pfad, notiz, melder:profiles!mileage_reports_created_by_fkey(full_name, email)")
      .eq("vehicle_id", id)
      .order("gemeldet_am", { ascending: false })
      .limit(24),
    getSettings(),
  ]);
  if (!data) notFound();
  const vehicle = data as unknown as Vehicle;
  const rows = (reports ?? []) as unknown as MileageRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/fahrzeuge" className="text-sm text-muted hover:text-brand">
          ← Fahrzeuge
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand">{vehicleTitle(vehicle)}</h1>
        {vehicle.fin_kurz && <p className="text-sm text-muted">FIN …{vehicle.fin_kurz}</p>}
      </div>
      <Flash error={error} message={message} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AussteuerungCard
          vehicle={vehicle as unknown as AussteuerungInput}
          history={rows.map((r) => ({ km: r.km, datum: r.gemeldet_am }))}
          settings={settings}
        />
        <AssignmentCard vehicle={vehicle} />
      </div>

      <MileageHistory vehicleId={id} rows={rows} />

      <h2 className="mt-2 text-xl font-bold tracking-tight text-brand">Stammdaten</h2>
      <VehicleForm action={updateVehicle.bind(null, id)} vehicle={vehicle} submitLabel="Stammdaten speichern" />

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
