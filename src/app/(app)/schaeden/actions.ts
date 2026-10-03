"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { isSchadenStatus } from "@/lib/schaeden/schaeden";

const FLEET_ROLES = ["admin", "fuhrparkleiter"] as const;

// Status und Rückmeldung (sieht auch die meldende Person).
export async function updateSchaden(id: string, formData: FormData) {
  await requireRole(...FLEET_ROLES);
  const path = `/schaeden/${id}`;
  const status = formData.get("status");
  const rueckmeldung = String(formData.get("rueckmeldung") ?? "").trim() || null;
  if (!isSchadenStatus(status)) redirect(`${path}?error=${encodeURIComponent("Unbekannter Status.")}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("schaeden")
    .update({ status, rueckmeldung, fahrbereit: formData.get("fahrbereit") === "on" })
    .eq("id", id);
  if (error) redirect(`${path}?error=${encodeURIComponent("Speichern fehlgeschlagen.")}`);

  revalidatePath("/", "layout");
  redirect(`${path}?message=${encodeURIComponent("Gespeichert.")}`);
}

export async function deleteSchaden(id: string) {
  await requireRole(...FLEET_ROLES);
  const supabase = await createClient();
  const { error } = await supabase.from("schaeden").delete().eq("id", id);
  if (error) redirect(`/schaeden/${id}?error=${encodeURIComponent("Löschen fehlgeschlagen.")}`);

  revalidatePath("/", "layout");
  redirect(`/schaeden?message=${encodeURIComponent("Meldung gelöscht.")}`);
}
