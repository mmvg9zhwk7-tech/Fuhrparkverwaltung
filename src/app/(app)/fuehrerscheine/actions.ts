"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { todayIso } from "@/lib/dates";
import { uploadPhoto } from "@/lib/storage/photos";
import { parseDate } from "@/lib/vehicles/parse";

const FLEET_ROLES = ["admin", "fuhrparkleiter"] as const;

function back(profileId: string, key: "error" | "message", text: string): never {
  redirect(`/fuehrerscheine/${profileId}?${key}=${encodeURIComponent(text)}`);
}

// Klassen und (falls befristet) Ablaufdatum.
export async function saveFuehrerschein(profileId: string, formData: FormData) {
  await requireRole(...FLEET_ROLES);
  const klassen = String(formData.get("klassen") ?? "").trim() || null;
  const gueltigRaw = String(formData.get("gueltig_bis") ?? "").trim();
  const gueltigBis = gueltigRaw ? parseDate(gueltigRaw) : null;
  if (gueltigRaw && !gueltigBis) back(profileId, "error", "Bitte ein gültiges Datum angeben.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("fuehrerscheine")
    .upsert({ profile_id: profileId, klassen, gueltig_bis: gueltigBis });
  if (error) back(profileId, "error", "Speichern fehlgeschlagen.");

  revalidatePath("/", "layout");
  back(profileId, "message", "Führerscheindaten gespeichert.");
}

export async function addKontrolle(profileId: string, formData: FormData) {
  const me = await requireRole(...FLEET_ROLES);
  const today = todayIso();
  const datumRaw = String(formData.get("kontrolliert_am") ?? "").trim();
  const datum = datumRaw ? parseDate(datumRaw) : today;
  const art = formData.get("art") === "foto" ? "foto" : "vorlage";
  const ergebnis = formData.get("ergebnis") === "beanstandet" ? "beanstandet" : "ok";
  const notiz = String(formData.get("notiz") ?? "").trim() || null;
  const foto = formData.get("foto");

  if (!datum || datum > today) back(profileId, "error", "Bitte ein gültiges Datum (nicht in der Zukunft) angeben.");
  if (ergebnis === "beanstandet" && !notiz) back(profileId, "error", "Bitte bei einer Beanstandung kurz notieren, was nicht passt.");

  const supabase = await createClient();
  let fotoPfad: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    const upload = await uploadPhoto(supabase, me.id, "fuehrerschein", foto);
    if ("error" in upload) back(profileId, "error", upload.error);
    fotoPfad = upload.path;
  }

  const { error } = await supabase.from("fuehrerschein_kontrollen").insert({
    profile_id: profileId,
    kontrolliert_am: datum,
    art,
    ergebnis,
    foto_pfad: fotoPfad,
    notiz,
  });
  if (error) back(profileId, "error", "Kontrolle konnte nicht gespeichert werden.");

  revalidatePath("/", "layout");
  back(profileId, "message", "Kontrolle eingetragen.");
}

// Für Tippfehler: falsch erfasste Kontrolle entfernen.
export async function deleteKontrolle(profileId: string, kontrolleId: string) {
  await requireRole(...FLEET_ROLES);
  const supabase = await createClient();
  const { error } = await supabase
    .from("fuehrerschein_kontrollen")
    .delete()
    .eq("id", kontrolleId)
    .eq("profile_id", profileId);
  if (error) back(profileId, "error", "Löschen fehlgeschlagen.");

  revalidatePath("/", "layout");
  back(profileId, "message", "Kontrolle gelöscht.");
}
