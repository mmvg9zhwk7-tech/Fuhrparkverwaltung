import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/dates";
import { mileageStatus } from "@/lib/mileage/status";
import type { Settings } from "@/lib/settings";
import { formatValue } from "@/lib/vehicles/format";
import { vehicleTitle } from "@/lib/vehicles/overview";
import { KmBadge } from "@/components/badges";

type MyVehicle = {
  id: string;
  kennzeichen: string | null;
  marke: string | null;
  typ: string | null;
  fin_kurz: string | null;
  km_stand: number | null;
  km_stand_datum: string | null;
  ist_pool: boolean;
  ist_meins: boolean;
};

// "Meine Fahrzeuge": eigenes Fahrzeug zuerst, dann Pool-Fahrzeuge.
export async function DriverSection({ settings, hideIfEmpty }: { settings: Settings; hideIfEmpty?: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_vehicles");
  const vehicles = (data ?? []) as MyVehicle[];
  if (!vehicles.length && hideIfEmpty) return null;
  const today = todayIso();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-brand">Meine Fahrzeuge</h2>
      {!vehicles.length && (
        <p className="card text-sm text-muted">
          Dir ist noch kein Fahrzeug zugeordnet. Bitte wende dich an die Fuhrparkleitung.
        </p>
      )}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {vehicles.map((v) => {
          const status = mileageStatus(v.km_stand_datum, today, settings.km_faellig_tag);
          return (
            <li key={v.id} className="card flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-brand">{vehicleTitle(v)}</p>
                  <p className="text-sm text-muted">
                    {v.ist_meins ? "Dein Fahrzeug" : "Pool-Fahrzeug"}
                    {v.fin_kurz ? ` · FIN …${v.fin_kurz}` : ""}
                  </p>
                </div>
                <KmBadge status={status} />
              </div>
              <p className="text-sm">
                Letzter Stand: <strong>{formatValue("int", v.km_stand)} km</strong>
                {v.km_stand_datum ? ` am ${formatValue("date", v.km_stand_datum)}` : ""}
              </p>
              {v.ist_meins && status !== "gemeldet" && (
                <p className="text-sm text-muted">
                  Bitte melde den Stand bis zum {settings.km_faellig_tag}. des Monats.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link href={`/km-melden?fahrzeug=${v.id}`} className="btn-primary">
                  KM-Stand melden
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
