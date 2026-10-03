import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { VEHICLE_COLUMNS } from "@/lib/vehicles/fields";
import { vehiclesToCsv } from "@/lib/vehicles/export";
import { searchVehicles } from "@/lib/vehicles/search";

// Fahrzeugliste als Excel-Datei (CSV), mit denselben Filtern wie die Liste.
export async function GET(request: NextRequest) {
  await requireRole("admin", "fuhrparkleiter");
  const params = request.nextUrl.searchParams;
  const filter = {
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    filiale: params.get("filiale") ?? undefined,
  };

  const supabase = await createClient();
  const { data, error } = await searchVehicles(
    supabase,
    `${VEHICLE_COLUMNS}, fahrer:profiles!vehicles_fahrer_id_fkey(full_name, email)`,
    filter,
  );
  if (error) return new Response("Export fehlgeschlagen.", { status: 500 });

  return new Response(vehiclesToCsv((data ?? []) as unknown as Record<string, unknown>[]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fahrzeuge-${todayIso()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
