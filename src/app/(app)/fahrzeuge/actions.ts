"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { vehicleFromForm } from "@/lib/vehicles/parse";
import { buildImport } from "@/lib/vehicles/import";

const FLEET_ROLES = ["admin", "fuhrparkleiter"] as const;

function withParam(path: string, key: "error" | "message", text: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(text)}`);
}

function saveError(message: string) {
  return message.includes("vehicles_fin_unique")
    ? "Ein Fahrzeug mit dieser FIN gibt es schon."
    : "Speichern fehlgeschlagen.";
}

export async function createVehicle(formData: FormData) {
  await requireRole(...FLEET_ROLES);
  const { data, errors } = vehicleFromForm(formData);
  if (errors.length) withParam("/fahrzeuge/neu", "error", errors.join(" "));

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("vehicles")
    .insert(data)
    .select("id")
    .single();
  if (error || !created) withParam("/fahrzeuge/neu", "error", saveError(error?.message ?? ""));

  revalidatePath("/fahrzeuge");
  withParam(`/fahrzeuge/${created.id}`, "message", "Fahrzeug angelegt.");
}

export async function updateVehicle(id: string, formData: FormData) {
  await requireRole(...FLEET_ROLES);
  const path = `/fahrzeuge/${id}`;
  const { data, errors } = vehicleFromForm(formData);
  if (errors.length) withParam(path, "error", errors.join(" "));

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update(data).eq("id", id);
  if (error) withParam(path, "error", saveError(error.message));

  revalidatePath("/fahrzeuge");
  revalidatePath(path);
  withParam(path, "message", "Gespeichert.");
}

export async function deleteVehicle(id: string) {
  await requireRole(...FLEET_ROLES);
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) withParam(`/fahrzeuge/${id}`, "error", "Löschen fehlgeschlagen.");

  revalidatePath("/fahrzeuge");
  withParam("/fahrzeuge", "message", "Fahrzeug gelöscht.");
}

// Aus Excel eingefügte Zeilen übernehmen. Fahrzeuge mit bereits bekannter
// FIN werden aktualisiert, alle anderen neu angelegt.
export async function importVehicles(formData: FormData) {
  await requireRole(...FLEET_ROLES);
  const { vehicles } = buildImport(String(formData.get("table") ?? ""));
  if (!vehicles.length) withParam("/fahrzeuge/import", "error", "Keine Fahrzeuge gefunden.");

  const supabase = await createClient();
  const fins = vehicles.map((v) => v.fin).filter((f): f is string => typeof f === "string");
  const existing = new Map<string, string>();
  for (let i = 0; i < fins.length; i += 200) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, fin")
      .in("fin", fins.slice(i, i + 200));
    data?.forEach((row) => existing.set(row.fin, row.id));
  }

  // Doppelte FINs innerhalb der Liste: die letzte Zeile gewinnt.
  const byFin = new Map<string, (typeof vehicles)[number]>();
  const withoutFin: typeof vehicles = [];
  for (const v of vehicles) {
    if (typeof v.fin === "string") byFin.set(v.fin, v);
    else withoutFin.push(v);
  }

  const inserts = [...withoutFin, ...[...byFin.values()].filter((v) => !existing.has(v.fin as string))];
  const updates = [...byFin.values()].filter((v) => existing.has(v.fin as string));

  if (inserts.length) {
    const { error } = await supabase.from("vehicles").insert(inserts);
    if (error) withParam("/fahrzeuge/import", "error", `Import fehlgeschlagen: ${error.message}`);
  }
  for (const v of updates) {
    const { error } = await supabase
      .from("vehicles")
      .update(v)
      .eq("id", existing.get(v.fin as string)!);
    if (error) withParam("/fahrzeuge/import", "error", `Aktualisieren fehlgeschlagen: ${error.message}`);
  }

  revalidatePath("/fahrzeuge");
  withParam(
    "/fahrzeuge",
    "message",
    `Import fertig: ${inserts.length} neu, ${updates.length} aktualisiert.`,
  );
}
