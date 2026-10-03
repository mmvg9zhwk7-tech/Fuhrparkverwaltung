import { VEHICLE_FIELDS, type FieldType, type VehicleInput, type VehicleValue } from "./fields";

// Liest Werte so, wie sie aus einer deutschen Excel-Liste kommen:
// "19.449,58 €", "14.09.15", "94304", leere Zellen.

export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[€\s ]/g, "");
  if (!cleaned || cleaned === "-") return null;
  // Deutsches Format: Punkt = Tausender, Komma = Dezimal.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/\.(?=\d{3}(\D|$))/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

export function parseInteger(raw: string): number | null {
  const cleaned = raw.replace(/[.\s ]|km/gi, "");
  if (!cleaned) return null;
  const value = Number(cleaned.replace(",", "."));
  return Number.isFinite(value) ? Math.round(value) : null;
}

// "14.09.15", "14.09.2015" oder "2015-09-14" -> "2015-09-14".
export function parseDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return isValidDate(+iso[1], +iso[2], +iso[3]) ? iso[0].slice(0, 10) : null;

  // Nur Monat/Jahr wie auf der HU-Plakette ("03/2027") -> Monatsende.
  const monthOnly = value.match(/^(\d{1,2})[./](\d{4})$/);
  if (monthOnly) {
    const month = +monthOnly[1];
    if (month < 1 || month > 12) return null;
    const lastDay = new Date(Date.UTC(+monthOnly[2], month, 0)).getUTCDate();
    return `${monthOnly[2]}-${String(month).padStart(2, "0")}-${lastDay}`;
  }

  const de = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (!de) return null;
  const day = +de[1];
  const month = +de[2];
  let year = +de[3];
  // Zweistellige Jahre: 00-69 -> 2000er, 70-99 -> 1900er (wie Excel).
  if (de[3].length === 2) year += year < 70 ? 2000 : 1900;
  if (!isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidDate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function parseValue(type: FieldType, raw: string): VehicleValue {
  const value = raw.trim();
  switch (type) {
    case "money":
      return parseMoney(value);
    case "int":
      return parseInteger(value);
    case "date":
      return parseDate(value);
    default:
      return value || null;
  }
}

// FIN immer ohne Leerzeichen und in Großbuchstaben speichern, damit der
// Import Duplikate zuverlässig erkennt.
export function normalizeFin(fin: VehicleValue): string | null {
  if (typeof fin !== "string") return null;
  const cleaned = fin.replace(/\s/g, "").toUpperCase();
  return cleaned || null;
}

// Formulardaten -> Fahrzeug. Unbrauchbare Zahlen/Daten werden als Fehler
// gemeldet statt still verworfen.
export function vehicleFromForm(formData: FormData): { data: VehicleInput; errors: string[] } {
  const data: VehicleInput = {};
  const errors: string[] = [];
  for (const field of VEHICLE_FIELDS) {
    const raw = String(formData.get(field.key) ?? "").trim();
    const value = parseValue(field.type, raw);
    if (raw && value === null) errors.push(`${field.label}: „${raw}“ ist ungültig.`);
    data[field.key] = value;
  }
  data.fin = normalizeFin(data.fin);
  if (!data.status) data.status = "Bestand";
  return { data, errors };
}
