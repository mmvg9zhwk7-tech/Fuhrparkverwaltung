import { addMonths } from "@/lib/dates";
import { fristStatus } from "@/lib/fristen/fristen";
import { formatValue } from "@/lib/vehicles/format";

// Führerscheinkontrolle: Nach jeder Kontrolle ist die nächste nach dem
// eingestellten Intervall fällig. Nie kontrolliert, beanstandet oder
// abgelaufen heißt: sofort handeln.

export type FsStatus = "ueberfaellig" | "bald" | "ok";

export type Kontrolle = { kontrolliert_am: string; ergebnis: "ok" | "beanstandet" };

export type FsLage = {
  status: FsStatus;
  // Bis wann die nächste Kontrolle erledigt sein muss (null = sofort).
  naechste: string | null;
  grund: string;
};

export const ART_LABELS = { vorlage: "Original vorgelegt", foto: "Per Foto geprüft" } as const;
export const ERGEBNIS_LABELS = { ok: "In Ordnung", beanstandet: "Beanstandet" } as const;

export function fuehrerscheinLage(
  input: { letzte: Kontrolle | null; gueltigBis: string | null },
  today: string,
  settings: { fs_kontrolle_intervall_monate: number; fristen_vorlauf_tage: number },
): FsLage {
  const { letzte, gueltigBis } = input;
  const vorlauf = settings.fristen_vorlauf_tage;

  if (gueltigBis && gueltigBis < today) {
    return { status: "ueberfaellig", naechste: null, grund: `Führerschein abgelaufen am ${formatValue("date", gueltigBis)}` };
  }
  if (!letzte) return { status: "ueberfaellig", naechste: null, grund: "Noch nie kontrolliert" };
  if (letzte.ergebnis === "beanstandet") {
    return { status: "ueberfaellig", naechste: null, grund: "Letzte Kontrolle beanstandet" };
  }

  const naechste = addMonths(letzte.kontrolliert_am, settings.fs_kontrolle_intervall_monate);
  const status = fristStatus(naechste, today, vorlauf) as FsStatus;
  if (status === "ueberfaellig") {
    return { status, naechste, grund: `Kontrolle war fällig am ${formatValue("date", naechste)}` };
  }
  if (gueltigBis && fristStatus(gueltigBis, today, vorlauf) === "bald") {
    return { status: "bald", naechste, grund: `Führerschein läuft ab am ${formatValue("date", gueltigBis)}` };
  }
  return { status, naechste, grund: `Nächste Kontrolle bis ${formatValue("date", naechste)}` };
}

// Wer muss kontrolliert werden? Alle Fahrer:innen und alle anderen mit
// fest zugeordnetem Fahrzeug.
export function brauchtKontrolle(role: string, hatFahrzeug: boolean) {
  return role === "fahrer" || hatFahrzeug;
}
