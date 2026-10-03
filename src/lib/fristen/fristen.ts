import { addDays, addMonths, daysBetween } from "@/lib/dates";

// Wiederkehrende Fristen je Fahrzeug. Die Fälligkeit steht als Spalte am
// Fahrzeug (supabase/add_fristen.sql), "erledigt" setzt sie neu.

export type FristArt = "hu" | "uvv" | "inspektion";
export type FristColumn = "hu_faellig" | "uvv_faellig" | "inspektion_faellig";

export const FRIST_ARTEN: {
  art: FristArt;
  column: FristColumn;
  label: string;
  kurz: string;
  // Vorschlag für die nächste Fälligkeit nach "erledigt".
  intervallMonate: number;
}[] = [
  { art: "hu", column: "hu_faellig", label: "Hauptuntersuchung (HU/TÜV)", kurz: "HU", intervallMonate: 24 },
  { art: "uvv", column: "uvv_faellig", label: "UVV-Prüfung", kurz: "UVV", intervallMonate: 12 },
  { art: "inspektion", column: "inspektion_faellig", label: "Inspektion", kurz: "Inspektion", intervallMonate: 12 },
];

export const FRIST_COLUMNS = FRIST_ARTEN.map((f) => f.column);

export function isFristArt(value: unknown): value is FristArt {
  return FRIST_ARTEN.some((f) => f.art === value);
}

export function fristArt(art: FristArt) {
  return FRIST_ARTEN.find((f) => f.art === art)!;
}

export type FristStatus = "ueberfaellig" | "bald" | "ok" | "fehlt";

export function fristStatus(faellig: string | null | undefined, today: string, vorlaufTage: number): FristStatus {
  if (!faellig) return "fehlt";
  if (faellig < today) return "ueberfaellig";
  return faellig <= addDays(today, vorlaufTage) ? "bald" : "ok";
}

export type FristItem = {
  art: FristArt;
  label: string;
  kurz: string;
  faellig: string | null;
  status: FristStatus;
};

export function fristenOf(
  vehicle: Record<string, unknown>,
  today: string,
  vorlaufTage: number,
): FristItem[] {
  return FRIST_ARTEN.map(({ art, column, label, kurz }) => {
    const faellig = (vehicle[column] as string | null | undefined) ?? null;
    return { art, label, kurz, faellig, status: fristStatus(faellig, today, vorlaufTage) };
  });
}

export function naechsteFaelligkeit(art: FristArt, erledigtAm: string) {
  return addMonths(erledigtAm, fristArt(art).intervallMonate);
}

// "heute fällig", "in 12 Tagen", "seit 3 Tagen überfällig".
export function faelligText(faellig: string | null, today: string) {
  if (!faellig) return "kein Datum hinterlegt";
  const tage = daysBetween(today, faellig);
  if (tage === 0) return "heute fällig";
  if (tage === 1) return "morgen fällig";
  if (tage > 0) return `in ${tage} Tagen`;
  return tage === -1 ? "seit gestern überfällig" : `seit ${-tage} Tagen überfällig`;
}

const ORDER: Record<FristStatus, number> = { ueberfaellig: 0, bald: 1, ok: 2, fehlt: 3 };

// Überfällige zuerst, dann nach Datum, fehlende Daten ans Ende.
export function compareFristen(a: FristItem, b: FristItem) {
  return ORDER[a.status] - ORDER[b.status] || (a.faellig ?? "").localeCompare(b.faellig ?? "");
}
