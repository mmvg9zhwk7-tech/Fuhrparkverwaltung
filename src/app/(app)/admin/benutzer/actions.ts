"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { isRole } from "@/lib/auth/roles";
import { translateAuthError } from "@/lib/auth/error-messages";
import { getRequestOrigin } from "@/lib/site";

const PAGE = "/admin/benutzer";

function done(kind: "error" | "message", text: string): never {
  revalidatePath(PAGE);
  redirect(`${PAGE}?${kind}=${encodeURIComponent(text)}`);
}

// Neue Person per E-Mail einladen. Supabase schickt die Mail, der Link
// führt über auth/confirm zu /update-password (eigenes Passwort setzen).
export async function inviteUser(formData: FormData) {
  await requireRole("admin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = formData.get("role");
  if (!email || !isRole(role)) done("error", "Bitte E-Mail und Rolle angeben.");

  const admin = createAdminClient();
  const origin = await getRequestOrigin();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${origin}/auth/confirm?next=/update-password`,
  });
  if (error || !data.user) {
    done("error", error ? translateAuthError(error.message) : "Einladung fehlgeschlagen.");
  }

  // Das Profil hat der Trigger (supabase/schema.sql) schon angelegt, mit
  // Rolle "fahrer" - jetzt die gewählte Rolle setzen.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role, full_name: fullName || null })
    .eq("id", data.user.id);
  if (roleError) done("error", "Eingeladen, aber die Rolle konnte nicht gesetzt werden.");

  done("message", `Einladung an ${email} verschickt.`);
}

// Rolle ändern oder Konto (de)aktivieren.
export async function updateUser(formData: FormData) {
  const me = await requireRole("admin");

  const id = String(formData.get("id") ?? "");
  const role = formData.get("role");
  const isActive = formData.get("is_active") === "on";
  if (!id || !isRole(role)) done("error", "Ungültige Eingabe.");

  // Sich selbst aussperren geht nicht - sonst gäbe es ggf. keinen Admin mehr.
  if (id === me.id && (role !== "admin" || !isActive)) {
    done("error", "Du kannst dir selbst die Admin-Rolle nicht entziehen.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, is_active: isActive })
    .eq("id", id);
  if (error) done("error", "Speichern fehlgeschlagen.");

  // Deaktivierte können sich auch nicht mehr einloggen (Sperre in Supabase
  // Auth), nicht nur keine Seiten mehr sehen.
  const { error: banError } = await createAdminClient().auth.admin.updateUserById(id, {
    ban_duration: isActive ? "none" : "876000h",
  });
  if (banError) done("error", "Gespeichert, aber die Login-Sperre konnte nicht gesetzt werden.");

  done("message", "Gespeichert.");
}
