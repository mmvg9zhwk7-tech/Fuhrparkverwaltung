import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/lib/auth/roles";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  is_active: boolean;
};

// Eingeloggte Person samt Rolle. Pro Anfrage nur einmal abgefragt (cache),
// auch wenn Layout, Seite und Header es jeweils aufrufen. getUser() statt
// getSession(), weil darauf Berechtigungen beruhen.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !isRole(data.role)) return null;
  return data as Profile;
});

// Für jede geschützte Seite und Server Action: ohne gültiges, aktives
// Profil geht es zurück zum Login.
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent("Dein Konto ist deaktiviert. Bitte wende dich an die Fuhrparkleitung.")}`,
    );
  }
  return profile;
}

// Wie requireProfile, aber nur für bestimmte Rollen. Andere landen auf der
// Startseite. Die Datenbank (RLS) lehnt unerlaubte Zugriffe unabhängig
// davon ab - das hier sorgt für eine klare Seite statt eines Fehlers.
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}
