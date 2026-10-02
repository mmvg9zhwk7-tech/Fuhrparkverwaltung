import { VEHICLE_FIELDS, type VehicleField, type VehicleInput } from "./fields";
import { normalizeFin, parseValue } from "./parse";

// Aus Excel kopierte Zeilen (Tab-getrennt) oder eine CSV-Datei
// (Semikolon-getrennt, deutsches Excel) in Zeilen und Zellen zerlegen.
// Beachtet Anführungszeichen, damit Zellen mit Trennzeichen/Umbrüchen
// heil bleiben.
export function parseTable(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");

// Spaltenüberschrift -> Feld. "KM-Stand 31.12.25" passt auf km_stand,
// das Datum darin wird als km_stand_datum übernommen.
export function matchHeader(header: string): VehicleField | null {
  const h = simplify(header);
  if (!h) return null;
  // "letzten 6 der FIN" wird aus der FIN berechnet, nicht importiert.
  if (h.startsWith("letzten6")) return null;
  for (const field of VEHICLE_FIELDS) {
    const names = [field.label, field.key, ...(field.aliases ?? [])].map(simplify);
    if (names.includes(h)) return field;
  }
  if (h.startsWith("kmstand")) return VEHICLE_FIELDS.find((f) => f.key === "km_stand") ?? null;
  return null;
}

export type ImportResult = {
  vehicles: VehicleInput[];
  mappedColumns: { header: string; field: string | null }[];
  warnings: string[];
};

export function buildImport(text: string): ImportResult {
  const rows = parseTable(text);
  const warnings: string[] = [];
  if (rows.length < 2) {
    return {
      vehicles: [],
      mappedColumns: [],
      warnings: ["Bitte die Überschriftenzeile und mindestens eine Datenzeile einfügen."],
    };
  }

  const [headerRow, ...dataRows] = rows;
  const fields = headerRow.map(matchHeader);
  const mappedColumns = headerRow.map((header, i) => ({
    header: header.trim(),
    field: fields[i]?.label ?? null,
  }));

  const kmHeader = headerRow.find((h) => simplify(h).startsWith("kmstand"));
  const kmDate = kmHeader?.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/)?.[0];
  const kmStandDatum = kmDate ? parseValue("date", kmDate) : null;

  const vehicles = dataRows.map((cells, rowIndex) => {
    const vehicle: VehicleInput = {};
    fields.forEach((field, i) => {
      if (!field) return;
      const raw = (cells[i] ?? "").trim();
      const value = parseValue(field.type, raw);
      if (raw && value === null) {
        warnings.push(`Zeile ${rowIndex + 2}, ${field.label}: „${raw}“ nicht erkannt, bleibt leer.`);
      }
      vehicle[field.key] = value;
    });
    vehicle.fin = normalizeFin(vehicle.fin);
    if (!vehicle.status) vehicle.status = "Bestand";
    if (kmStandDatum && vehicle.km_stand != null && !vehicle.km_stand_datum) {
      vehicle.km_stand_datum = kmStandDatum;
    }
    return vehicle;
  });

  return { vehicles, mappedColumns, warnings };
}
