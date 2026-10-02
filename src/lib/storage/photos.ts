import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "fotos";
const MAX_BYTES = 9 * 1024 * 1024;

// Foto in den eigenen Ordner <user-id>/<bereich>/ laden (siehe
// Storage-Regeln in supabase/add_drivers_mileage.sql). Gibt den Pfad
// zurück oder eine Fehlermeldung.
export async function uploadPhoto(
  supabase: SupabaseClient,
  userId: string,
  area: "km" | "schaden",
  file: File,
): Promise<{ path: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Bitte ein Foto auswählen." };
  if (file.size > MAX_BYTES) return { error: "Das Foto ist zu groß (max. 9 MB)." };

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/${area}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });
  return error ? { error: "Foto konnte nicht hochgeladen werden." } : { path };
}

// Kurzlebige Links zum Anzeigen privater Fotos.
export async function signedPhotoUrls(supabase: SupabaseClient, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, 60 * 60);
  return new Map(
    (data ?? [])
      .filter((d) => d.path && d.signedUrl)
      .map((d) => [d.path as string, d.signedUrl]),
  );
}
