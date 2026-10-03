import { VEHICLE_FIELDS, type FieldType, type VehicleValue } from "./fields";
import { formatValue } from "./format";

// CSV für deutsches Excel: Semikolon, Komma als Dezimalzeichen, BOM für
// Umlaute. Spalten wie im Import, damit die Datei wieder eingelesen werden kann.

function cell(type: FieldType, value: VehicleValue): string {
  if (value === null || value === undefined || value === "") return "";
  let text: string;
  if (type === "money") text = Number(value).toFixed(2).replace(".", ",");
  else if (type === "int") text = String(Math.round(Number(value)));
  else if (type === "date") text = formatValue("date", value);
  else {
    text = String(value);
    // Schutz gegen Formeln, die Excel beim Öffnen ausführen würde.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  }
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

type Person = { full_name: string | null; email: string | null } | null | undefined;

export function vehiclesToCsv(vehicles: Record<string, unknown>[]): string {
  const header = [...VEHICLE_FIELDS.map((f) => f.label), "Fahrer:in", "Pool"];
  const rows = vehicles.map((v) => [
    ...VEHICLE_FIELDS.map((f) => cell(f.type, v[f.key] as VehicleValue)),
    cell("text", (v.fahrer as Person)?.full_name ?? (v.fahrer as Person)?.email ?? null),
    v.ist_pool ? "ja" : "",
  ]);
  return "﻿" + [header.map((h) => cell("text", h)), ...rows].map((r) => r.join(";")).join("\r\n") + "\r\n";
}
