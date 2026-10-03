"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { parseInteger } from "@/lib/vehicles/parse";

const PAGE = "/admin/einstellungen";

export async function saveSettings(formData: FormData) {
  await requireRole("admin");
  const num = (key: string) => parseInteger(String(formData.get(key) ?? ""));

  const values = {
    km_faellig_tag: num("km_faellig_tag"),
    km_foto_pflicht: formData.get("km_foto_pflicht") === "on",
    aussteuern_max_km: num("aussteuern_max_km"),
    aussteuern_max_alter_monate: num("aussteuern_max_alter_monate"),
    aussteuern_vorlauf_monate: num("aussteuern_vorlauf_monate"),
    fristen_vorlauf_tage: num("fristen_vorlauf_tage"),
    fs_kontrolle_intervall_monate: num("fs_kontrolle_intervall_monate"),
    updated_at: new Date().toISOString(),
  };
  const invalid =
    values.km_faellig_tag === null ||
    values.km_faellig_tag < 1 ||
    values.km_faellig_tag > 28 ||
    !values.aussteuern_max_km ||
    !values.aussteuern_max_alter_monate ||
    values.aussteuern_vorlauf_monate === null ||
    values.fristen_vorlauf_tage === null ||
    values.fristen_vorlauf_tage < 0 ||
    values.fristen_vorlauf_tage > 365 ||
    values.fs_kontrolle_intervall_monate === null ||
    values.fs_kontrolle_intervall_monate < 1 ||
    values.fs_kontrolle_intervall_monate > 24;
  if (invalid) redirect(`${PAGE}?error=${encodeURIComponent("Bitte alle Werte prüfen (Fälligkeitstag 1–28, Vorwarnung 0–365 Tage, Kontrolle alle 1–24 Monate).")}`);

  const supabase = await createClient();
  const { error } = await supabase.from("settings").update(values).eq("id", 1);
  if (error) redirect(`${PAGE}?error=${encodeURIComponent("Speichern fehlgeschlagen.")}`);

  revalidatePath("/", "layout");
  redirect(`${PAGE}?message=${encodeURIComponent("Gespeichert.")}`);
}
