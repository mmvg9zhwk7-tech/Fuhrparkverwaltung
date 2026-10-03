"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { MAX_FOTOS } from "@/lib/schaeden/schaeden";
import { notifyNewSchaden } from "@/lib/schaeden/notify";
import { uploadPhoto } from "@/lib/storage/photos";
import { parseDate } from "@/lib/vehicles/parse";
import { vehicleTitle } from "@/lib/vehicles/overview";

export async function reportSchaden(formData: FormData) {
  const profile = await requireProfile();
  const vehicleId = String(formData.get("vehicle_id") ?? "");
  function back(error: string): never {
    redirect(`/schaden-melden?fahrzeug=${vehicleId}&error=${encodeURIComponent(error)}`);
  }

  const today = todayIso();
  const datum = parseDate(String(formData.get("datum") ?? "")) ?? today;
  const ort = String(formData.get("ort") ?? "").trim() || null;
  const beschreibung = String(formData.get("beschreibung") ?? "").trim();
  const fahrbereit = formData.get("fahrbereit") !== "nein";
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!vehicleId) back("Bitte ein Fahrzeug auswählen.");
  if (!beschreibung) back("Bitte kurz beschreiben, was passiert ist.");
  if (datum > today) back("Das Datum darf nicht in der Zukunft liegen.");
  if (fotos.length > MAX_FOTOS) back(`Bitte höchstens ${MAX_FOTOS} Fotos.`);

  const supabase = await createClient();
  // Darf die Person für dieses Fahrzeug melden? (Die Datenbank prüft das
  // per RLS ebenfalls; hier für eine verständliche Meldung und den Titel.)
  const { data: mine } = await supabase.rpc("my_vehicles");
  let vehicle = (mine as { id: string; kennzeichen: string | null; marke: string | null; typ: string | null }[] | null)?.find(
    (v) => v.id === vehicleId,
  );
  if (!vehicle && profile.role !== "fahrer") {
    const { data } = await supabase.from("vehicles").select("id, kennzeichen, marke, typ").eq("id", vehicleId).maybeSingle();
    vehicle = data ?? undefined;
  }
  if (!vehicle) back("Für dieses Fahrzeug darfst du keinen Schaden melden.");

  const pfade: string[] = [];
  for (const foto of fotos) {
    const upload = await uploadPhoto(supabase, profile.id, "schaden", foto);
    if ("error" in upload) back(upload.error);
    pfade.push(upload.path);
  }

  const { data: created, error } = await supabase
    .from("schaeden")
    .insert({ vehicle_id: vehicleId, datum, ort, beschreibung, fahrbereit, fotos: pfade })
    .select("id")
    .single();
  if (error || !created) back("Meldung konnte nicht gespeichert werden.");

  await notifyNewSchaden({
    id: created.id,
    fahrzeug: vehicleTitle(vehicle),
    datum,
    beschreibung,
    fahrbereit,
    melder: profile.full_name ?? profile.email ?? "Jemand",
  });

  revalidatePath("/", "layout");
  redirect(`/schaden-melden?message=${encodeURIComponent("Danke! Der Schaden ist gemeldet, die Fuhrparkleitung ist informiert.")}`);
}
