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
import { SchadenList } from "@/components/schaden-list";
import { SCHADEN_COLUMNS, type Schaden } from "@/lib/schaeden/schaeden";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteVehicle, updateVehicle } from "../actions";
import { VehicleForm } from "../vehicle-form";
import { AssignmentCard } from "./assignment-card";
import { AussteuerungCard } from "./aussteuerung-card";
import { FristenCard, type ErledigungRow } from "./fristen-card";
import { MileageHistory, type MileageRow } from "./mileage-history";

export const metadata: Metadata = { title: "Fahrzeug" };

export default async function FahrzeugPage({ params, searchParams }: PageProps<"/fahrzeuge/[id]">) {
  await requireRole("admin", "fuhrparkleiter");
  const { id } = await params;
  const { error, message } = (await searchParams) as { error?: string; message?: string };

  const supabase = await createClient();
  const [{ data }, { data: reports }, { data: erledigt }, { data: schaeden }, settings] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("mileage_reports")
      .select("id, km, gemeldet_am, foto_pfad, notiz, melder:profiles!mileage_reports_created_by_fkey(full_name, email)")
      .eq("vehicle_id", id)
      .order("gemeldet_am", { ascending: false })
      .limit(24),
    supabase
      .from("frist_erledigungen")
      .select("id, art, erledigt_am, naechste_faellig, notiz, person:profiles!frist_erledigungen_created_by_fkey(full_name, email)")
      .eq("vehicle_id", id)
      .order("erledigt_am", { ascending: false })
      .limit(12),
    supabase
      .from("schaeden")
      .select(SCHADEN_COLUMNS)
      .eq("vehicle_id", id)
      .order("datum", { ascending: false })
      .limit(10),
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
        <FristenCard
          vehicle={vehicle}
          settings={settings}
          erledigungen={(erledigt ?? []) as unknown as ErledigungRow[]}
        />
        <AssignmentCard vehicle={vehicle} />
      </div>

      <MileageHistory vehicleId={id} rows={rows} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand">Schäden</h2>
          <Link href={`/schaden-melden?fahrzeug=${id}`} className="btn-secondary">
            Schaden erfassen
          </Link>
        </div>
        {schaeden?.length ? (
          <SchadenList schaeden={schaeden as unknown as Schaden[]} href={(s) => `/schaeden/${s.id}`} showVehicle={false} />
        ) : (
          <p className="card text-sm text-muted">Keine Schäden gemeldet.</p>
        )}
      </section>

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
