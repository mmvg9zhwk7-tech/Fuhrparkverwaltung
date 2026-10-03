export const DOKUMENT_KATEGORIEN = {
  fahrzeugschein: "Fahrzeugschein / -brief",
  vertrag: "Leasing- / Kaufvertrag",
  versicherung: "Versicherung",
  rechnung: "Rechnung",
  pruefbericht: "Prüfbericht (HU, UVV)",
  sonstiges: "Sonstiges",
} as const;

export type DokumentKategorie = keyof typeof DOKUMENT_KATEGORIEN;

export function isKategorie(value: unknown): value is DokumentKategorie {
  return typeof value === "string" && value in DOKUMENT_KATEGORIEN;
}

export const DOKUMENT_BUCKET = "dokumente";
export const MAX_DOKUMENT_BYTES = 25 * 1024 * 1024;

// Pfad im Bucket: immer unter dem Fahrzeug, Dateiname zufällig (Umlaute und
// Leerzeichen im Originalnamen machen im Storage nur Ärger).
export function dokumentPfad(vehicleId: string, fileName: string, random: string) {
  const ext = fileName.match(/\.([a-z0-9]{1,6})$/i)?.[1]?.toLowerCase() ?? "bin";
  return `${vehicleId}/${random}.${ext}`;
}

export function isPfadFuer(vehicleId: string, pfad: string) {
  return new RegExp(`^${vehicleId.replace(/[^a-f0-9-]/gi, "")}/[a-z0-9-]+\\.[a-z0-9]{1,6}$`, "i").test(pfad);
}

export function formatGroesse(bytes: number | null) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
