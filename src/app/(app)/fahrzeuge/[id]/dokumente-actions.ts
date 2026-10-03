"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { DOKUMENT_BUCKET, isKategorie, isPfadFuer, MAX_DOKUMENT_BYTES } from "@/lib/dokumente/dokumente";

const FLEET_ROLES = ["admin", "fuhrparkleiter"] as const;

// Nach dem Hochladen im Browser: Eintrag anlegen.
export async function addDokument(
  vehicleId: string,
  input: { kategorie: string; name: string; pfad: string; groesse: number },
): Promise<{ error?: string }> {
  await requireRole(...FLEET_ROLES);
  const name = input.name.trim().slice(0, 200);
  if (!isKategorie(input.kategorie) || !name || !isPfadFuer(vehicleId, input.pfad)) {
    return { error: "Ungültige Angaben." };
  }
  if (input.groesse > MAX_DOKUMENT_BYTES) return { error: "Die Datei ist zu groß (max. 25 MB)." };

  const supabase = await createClient();
  const { error } = await supabase.from("fahrzeug_dokumente").insert({
    vehicle_id: vehicleId,
    kategorie: input.kategorie,
    name,
    pfad: input.pfad,
    groesse: Math.round(input.groesse),
  });
  if (error) {
    await supabase.storage.from(DOKUMENT_BUCKET).remove([input.pfad]);
    return { error: "Dokument konnte nicht gespeichert werden." };
  }
  revalidatePath(`/fahrzeuge/${vehicleId}`);
  return {};
}

export async function deleteDokument(vehicleId: string, id: string) {
  await requireRole(...FLEET_ROLES);
  const supabase = await createClient();
  const { data } = await supabase
    .from("fahrzeug_dokumente")
    .delete()
    .eq("id", id)
    .eq("vehicle_id", vehicleId)
    .select("pfad")
    .maybeSingle();
  if (data?.pfad) await supabase.storage.from(DOKUMENT_BUCKET).remove([data.pfad]);
  revalidatePath(`/fahrzeuge/${vehicleId}`);
}
