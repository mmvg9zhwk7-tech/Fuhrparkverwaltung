"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { fristArt, isFristArt, naechsteFaelligkeit } from "@/lib/fristen/fristen";
import { parseDate } from "@/lib/vehicles/parse";

// HU/UVV/Inspektion als erledigt eintragen. Der Trigger in
// supabase/add_fristen.sql setzt danach die nächste Fälligkeit am Fahrzeug.
export async function markFristDone(vehicleId: string, formData: FormData) {
  await requireRole("admin", "fuhrparkleiter");
  const path = `/fahrzeuge/${vehicleId}`;
  function back(key: "error" | "message", text: string): never {
    redirect(`${path}?${key}=${encodeURIComponent(text)}#fristen`);
  }

  const art = formData.get("art");
  if (!isFristArt(art)) back("error", "Unbekannte Frist.");
  const today = todayIso();
  const erledigtRaw = String(formData.get("erledigt_am") ?? "").trim();
  const erledigtAm = erledigtRaw ? parseDate(erledigtRaw) : today;
  const naechsteRaw = String(formData.get("naechste_faellig") ?? "").trim();
  const naechste = naechsteRaw ? parseDate(naechsteRaw) : erledigtAm && naechsteFaelligkeit(art, erledigtAm);
  const notiz = String(formData.get("notiz") ?? "").trim() || null;

  if (!erledigtAm || erledigtAm > today) back("error", "Bitte ein gültiges Datum (nicht in der Zukunft) angeben.");
  if (!naechste || naechste <= erledigtAm) back("error", "Die nächste Fälligkeit muss nach dem Erledigt-Datum liegen.");

  const supabase = await createClient();
  const { error } = await supabase.from("frist_erledigungen").insert({
    vehicle_id: vehicleId,
    art,
    erledigt_am: erledigtAm,
    naechste_faellig: naechste,
    notiz,
  });
  if (error) back("error", "Speichern fehlgeschlagen.");

  revalidatePath("/", "layout");
  back("message", `${fristArt(art).kurz} eingetragen.`);
}
