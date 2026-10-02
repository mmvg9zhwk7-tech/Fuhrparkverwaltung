import { addDays, addMonths, daysBetween } from "@/lib/dates";
import type { Settings } from "@/lib/settings";

// Wann sollte ein Fahrzeug verkauft/ausgesteuert werden? Der früheste
// Zeitpunkt aus km-Grenze (hochgerechnet mit der bisherigen Fahrleistung),
// Altersgrenze, Leasingende und einem fest eingetragenen Datum gewinnt.

export type AussteuerungInput = {
  erstzulassung?: string | null;
  einkaufsdatum?: string | null;
  km_stand?: number | null;
  km_stand_datum?: string | null;
  ende_lf?: string | null;
  aussteuern_ab_km?: number | null;
  aussteuern_ab_datum?: string | null;
};

export type KmPoint = { km: number; datum: string };

export type Grund = "km" | "alter" | "leasing" | "festgelegt";

export const GRUND_LABELS: Record<Grund, string> = {
  km: "km-Grenze",
  alter: "Altersgrenze",
  leasing: "Leasingende",
  festgelegt: "festgelegtes Datum",
};

export type AussteuerungsAmpel = "jetzt" | "bald" | "ok" | "unbekannt";

export type Aussteuerung = {
  ampel: AussteuerungsAmpel;
  datum: string | null;
  grund: Grund | null;
  kmProJahr: number | null;
  maxKm: number;
  gruende: { grund: Grund; datum: string }[];
};

// km pro Tag: bevorzugt aus den Meldungen (mind. 60 Tage Abstand), sonst
// aus Gesamt-km seit Erstzulassung.
export function kmPerDay(input: AussteuerungInput, history: KmPoint[] = []): number | null {
  const sorted = [...history].sort((a, b) => a.datum.localeCompare(b.datum));
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1];
    // Nur das letzte Jahr, damit sich geänderte Nutzung schnell auswirkt.
    const windowStart = addDays(last.datum, -365);
    const first = sorted.find((p) => p.datum >= windowStart) ?? sorted[0];
    const days = daysBetween(first.datum, last.datum);
    if (days >= 60 && last.km >= first.km) return (last.km - first.km) / days;
  }
  const start = input.erstzulassung;
  if (start && input.km_stand != null && input.km_stand_datum) {
    const days = daysBetween(start, input.km_stand_datum);
    if (days >= 60) return input.km_stand / days;
  }
  return null;
}

export function berechneAussteuerung(
  input: AussteuerungInput,
  settings: Pick<Settings, "aussteuern_max_km" | "aussteuern_max_alter_monate" | "aussteuern_vorlauf_monate">,
  today: string,
  history: KmPoint[] = [],
): Aussteuerung {
  const maxKm = input.aussteuern_ab_km ?? settings.aussteuern_max_km;
  const rate = kmPerDay(input, history);
  const gruende: { grund: Grund; datum: string }[] = [];

  if (input.km_stand != null && input.km_stand_datum) {
    if (input.km_stand >= maxKm) {
      gruende.push({ grund: "km", datum: input.km_stand_datum });
    } else if (rate && rate > 0) {
      gruende.push({
        grund: "km",
        datum: addDays(input.km_stand_datum, (maxKm - input.km_stand) / rate),
      });
    }
  }

  const ageStart = input.erstzulassung ?? input.einkaufsdatum;
  if (ageStart) {
    gruende.push({ grund: "alter", datum: addMonths(ageStart, settings.aussteuern_max_alter_monate) });
  }
  if (input.ende_lf) gruende.push({ grund: "leasing", datum: input.ende_lf });
  if (input.aussteuern_ab_datum) gruende.push({ grund: "festgelegt", datum: input.aussteuern_ab_datum });

  gruende.sort((a, b) => a.datum.localeCompare(b.datum));
  const first = gruende[0];
  const kmProJahr = rate ? Math.round(rate * 365) : null;

  if (!first) return { ampel: "unbekannt", datum: null, grund: null, kmProJahr, maxKm, gruende };

  const ampel =
    first.datum <= today
      ? "jetzt"
      : first.datum <= addMonths(today, settings.aussteuern_vorlauf_monate)
        ? "bald"
        : "ok";

  return { ampel, datum: first.datum, grund: first.grund, kmProJahr, maxKm, gruende };
}
