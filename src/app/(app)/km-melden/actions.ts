"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageFleet } from "@/lib/auth/roles";
import { checkNewKm } from "@/lib/mileage/status";
import { getSettings } from "@/lib/settings";
import { uploadPhoto } from "@/lib/storage/photos";
import { parseDate, parseInteger } from "@/lib/vehicles/parse";
import { todayIso } from "@/lib/dates";

export async function reportMileage(formData: FormData) {
  const profile = await requireProfile();
  const vehicleId = String(formData.get("vehicle_id") ?? "");
  const back = (error: string): never =>
    redirect(`/km-melden?fahrzeug=${vehicleId}&error=${encodeURIComponent(error)}`);

  const km = parseInteger(String(formData.get("km") ?? ""));
  const today = todayIso();
  const datum = parseDate(String(formData.get("gemeldet_am") ?? "")) ?? today;
  const notiz = String(formData.get("notiz") ?? "").trim() || null;
  const foto = formData.get("foto");
  const hasFoto = foto instanceof File && foto.size > 0;

  if (!vehicleId) back("Bitte ein Fahrzeug auswählen.");
  if (km === null) back("Bitte den Kilometerstand eingeben.");
  if (datum > today) back("Das Datum darf nicht in der Zukunft liegen.");

  const settings = await getSettings();
  if (settings.km_foto_pflicht && !hasFoto) back("Bitte ein Foto vom Tacho hinzufügen.");

  const supabase = await createClient();
  // my_vehicles() liefert nur Fahrzeuge, für die die Person melden darf.
  const { data: vehicles } = await supabase.rpc("my_vehicles");
  let current = (vehicles as { id: string; km_stand: number | null }[] | null)?.find(
    (v) => v.id === vehicleId,
  );
  if (!current && canManageFleet(profile.role)) {
    const { data } = await supabase.from("vehicles").select("id, km_stand").eq("id", vehicleId).maybeSingle();
    current = data ?? undefined;
  }
  if (!current) back("Für dieses Fahrzeug darfst du keinen Stand melden.");

  const problem = checkNewKm(km!, current!.km_stand);
  // Fuhrparkleitung darf korrigieren (z.B. Tachotausch), Fahrer:innen nicht.
  if (problem && !canManageFleet(profile.role)) back(problem);

  let fotoPfad: string | null = null;
  if (hasFoto) {
    const upload = await uploadPhoto(supabase, profile.id, "km", foto as File);
    if ("error" in upload) back(upload.error);
    else fotoPfad = upload.path;
  }

  const { error } = await supabase.from("mileage_reports").insert({
    vehicle_id: vehicleId,
    km,
    gemeldet_am: datum,
    foto_pfad: fotoPfad,
    notiz,
  });
  if (error) back("Meldung konnte nicht gespeichert werden.");

  revalidatePath("/");
  revalidatePath("/km");
  revalidatePath(`/fahrzeuge/${vehicleId}`);
  redirect(`/?message=${encodeURIComponent(`KM-Stand ${km!.toLocaleString("de-DE")} km gemeldet. Danke!`)}`);
}
