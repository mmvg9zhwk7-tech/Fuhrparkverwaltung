import type { SupabaseClient } from "@supabase/supabase-js";
import { todayIso } from "@/lib/dates";
import type { Settings } from "@/lib/settings";
import { brauchtKontrolle, fuehrerscheinLage, type FsLage, type Kontrolle } from "./status";

export type FsPerson = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  klassen: string | null;
  gueltig_bis: string | null;
  letzte: Kontrolle | null;
  lage: FsLage;
};

const ORDER = { ueberfaellig: 0, bald: 1, ok: 2 };

// Alle aktiven Personen, die kontrolliert werden müssen, mit Status.
// Für Fuhrparkleitung/Admin und die Erinnerungs-Mails (Service-Client).
export async function loadFuehrerscheine(supabase: SupabaseClient, settings: Settings): Promise<FsPerson[]> {
  const today = todayIso();
  const [{ data: people }, { data: vehicles }, { data: scheine }, { data: kontrollen }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role").eq("is_active", true),
    supabase.from("vehicles").select("fahrer_id").eq("status", "Bestand").not("fahrer_id", "is", null),
    supabase.from("fuehrerscheine").select("profile_id, klassen, gueltig_bis"),
    supabase
      .from("fuehrerschein_kontrollen")
      .select("profile_id, kontrolliert_am, ergebnis")
      .order("kontrolliert_am", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const mitFahrzeug = new Set((vehicles ?? []).map((v) => v.fahrer_id as string));
  const scheinBy = new Map((scheine ?? []).map((s) => [s.profile_id as string, s]));
  const letzteBy = new Map<string, Kontrolle>();
  for (const k of kontrollen ?? []) {
    if (!letzteBy.has(k.profile_id)) letzteBy.set(k.profile_id, k as Kontrolle);
  }

  return (people ?? [])
    .filter((p) => brauchtKontrolle(p.role, mitFahrzeug.has(p.id)))
    .map((p) => {
      const schein = scheinBy.get(p.id);
      const letzte = letzteBy.get(p.id) ?? null;
      const gueltig_bis = (schein?.gueltig_bis as string | null) ?? null;
      return {
        ...p,
        klassen: (schein?.klassen as string | null) ?? null,
        gueltig_bis,
        letzte,
        lage: fuehrerscheinLage({ letzte, gueltigBis: gueltig_bis }, today, settings),
      };
    })
    .sort(
      (a, b) =>
        ORDER[a.lage.status] - ORDER[b.lage.status] ||
        (a.lage.naechste ?? "").localeCompare(b.lage.naechste ?? "") ||
        (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? ""),
    );
}

// Eigener Status für Übersicht und Konto-Seite (RLS: nur eigene Zeilen).
export async function loadMeinFuehrerschein(supabase: SupabaseClient, profileId: string, settings: Settings) {
  const [{ data: schein }, { data: letzte }] = await Promise.all([
    supabase.from("fuehrerscheine").select("klassen, gueltig_bis").eq("profile_id", profileId).maybeSingle(),
    supabase
      .from("fuehrerschein_kontrollen")
      .select("kontrolliert_am, ergebnis")
      .eq("profile_id", profileId)
      .order("kontrolliert_am", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const gueltigBis = (schein?.gueltig_bis as string | null) ?? null;
  return {
    klassen: (schein?.klassen as string | null) ?? null,
    gueltigBis,
    letzte: (letzte as Kontrolle | null) ?? null,
    lage: fuehrerscheinLage({ letzte: (letzte as Kontrolle | null) ?? null, gueltigBis }, todayIso(), settings),
  };
}
