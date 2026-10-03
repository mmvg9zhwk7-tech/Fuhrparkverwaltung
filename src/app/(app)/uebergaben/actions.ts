"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { uploadPhoto } from "@/lib/storage/photos";
import { signatureFile, TANK_STUFEN, ZUBEHOER } from "@/lib/uebergaben/uebergaben";
import { parseDate, parseInteger } from "@/lib/vehicles/parse";

const MAX_FOTOS = 6;

export async function saveUebergabe(vehicleId: string, formData: FormData) {
  const me = await requireRole("admin", "fuhrparkleiter");
  function back(error: string): never {
    redirect(`/fahrzeuge/${vehicleId}/uebergabe?error=${encodeURIComponent(error)}`);
  }

  const today = todayIso();
  const art = formData.get("art") === "rueckgabe" ? "rueckgabe" : "ausgabe";
  const datum = parseDate(String(formData.get("datum") ?? "")) ?? today;
  const personId = String(formData.get("person_id") ?? "") || null;
  const personName = String(formData.get("person_name") ?? "").trim() || null;
  const kmRaw = String(formData.get("km") ?? "").trim();
  const km = kmRaw ? parseInteger(kmRaw) : null;
  const tankRaw = String(formData.get("tank") ?? "");
  const tank = (TANK_STUFEN as readonly string[]).includes(tankRaw) ? tankRaw : null;
  const zubehoer = formData.getAll("zubehoer").map(String).filter((z) => (ZUBEHOER as readonly string[]).includes(z));
  const sauberRaw = formData.get("sauber");
  const maengel = String(formData.get("maengel") ?? "").trim() || null;
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const unterschrift = signatureFile(String(formData.get("unterschrift") ?? ""));

  if (datum > today) back("Das Datum darf nicht in der Zukunft liegen.");
  if (!personId && !personName) back("Bitte angeben, wer das Fahrzeug übernimmt bzw. zurückgibt.");
  if (kmRaw && km === null) back("Bitte einen gültigen Kilometerstand eingeben.");
  if (fotos.length > MAX_FOTOS) back(`Bitte höchstens ${MAX_FOTOS} Fotos.`);

  const supabase = await createClient();
  const { data: vehicle } = await supabase.from("vehicles").select("id, km_stand").eq("id", vehicleId).maybeSingle();
  if (!vehicle) back("Fahrzeug nicht gefunden.");

  const pfade: string[] = [];
  for (const foto of fotos) {
    const upload = await uploadPhoto(supabase, me.id, "uebergabe", foto);
    if ("error" in upload) back(upload.error);
    pfade.push(upload.path);
  }
  let unterschriftPfad: string | null = null;
  if (unterschrift) {
    const upload = await uploadPhoto(supabase, me.id, "uebergabe", unterschrift);
    if ("error" in upload) back("Unterschrift konnte nicht gespeichert werden.");
    unterschriftPfad = upload.path;
  }

  const { data: created, error } = await supabase
    .from("uebergaben")
    .insert({
      vehicle_id: vehicleId,
      art,
      datum,
      person_id: personId,
      person_name: personId ? null : personName,
      km,
      tank,
      zubehoer,
      sauber: sauberRaw === "ja" ? true : sauberRaw === "nein" ? false : null,
      maengel,
      fotos: pfade,
      unterschrift_pfad: unterschriftPfad,
    })
    .select("id")
    .single();
  if (error || !created) back("Protokoll konnte nicht gespeichert werden.");

  // KM-Stand mitschreiben (nur wenn plausibel, Korrekturen über KM-Meldungen).
  if (km !== null && (vehicle.km_stand == null || km >= vehicle.km_stand)) {
    await supabase.from("mileage_reports").insert({
      vehicle_id: vehicleId,
      km,
      gemeldet_am: datum,
      notiz: `Übergabe (${art === "ausgabe" ? "Ausgabe" : "Rückgabe"})`,
    });
  }
  // Optional die feste Zuordnung gleich mitändern.
  if (art === "ausgabe" && personId && formData.get("zuordnen") === "on") {
    await supabase.from("vehicles").update({ fahrer_id: personId }).eq("id", vehicleId);
  }
  if (art === "rueckgabe" && formData.get("zuordnung_aufheben") === "on") {
    await supabase.from("vehicles").update({ fahrer_id: null }).eq("id", vehicleId);
  }

  revalidatePath("/", "layout");
  redirect(`/uebergaben/${created.id}?message=${encodeURIComponent("Protokoll gespeichert.")}`);
}

export async function deleteUebergabe(id: string, vehicleId: string) {
  await requireRole("admin", "fuhrparkleiter");
  const supabase = await createClient();
  await supabase.from("uebergaben").delete().eq("id", id);
  revalidatePath(`/fahrzeuge/${vehicleId}`);
  redirect(`/fahrzeuge/${vehicleId}?message=${encodeURIComponent("Protokoll gelöscht.")}#uebergaben`);
}
