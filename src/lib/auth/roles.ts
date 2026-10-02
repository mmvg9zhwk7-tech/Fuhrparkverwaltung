// Rollen der Fuhrparkverwaltung. Muss zum Enum public.user_role in
// supabase/schema.sql passen.
export const ROLES = ["admin", "fuhrparkleiter", "fahrer"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  fuhrparkleiter: "Fuhrparkleitung",
  fahrer: "Fahrer:in",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// Nutzer einladen, Rollen vergeben, Konten sperren.
export function canManageUsers(role: Role | null | undefined) {
  return role === "admin";
}

// Fahrzeuge, Termine und Zuweisungen pflegen.
export function canManageFleet(role: Role | null | undefined) {
  return role === "admin" || role === "fuhrparkleiter";
}
