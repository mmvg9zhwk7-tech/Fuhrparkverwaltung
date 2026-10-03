export const UEBERGABE_ARTEN = { ausgabe: "Ausgabe", rueckgabe: "Rückgabe" } as const;
export type UebergabeArt = keyof typeof UEBERGABE_ARTEN;

export const TANK_STUFEN = ["leer", "1/4", "1/2", "3/4", "voll"] as const;
export type TankStufe = (typeof TANK_STUFEN)[number];

// Checkliste bei der Übergabe (frei erweiterbar, wird als Text gespeichert).
export const ZUBEHOER = [
  "Fahrzeugschein",
  "Tankkarte",
  "Ersatzschlüssel",
  "Warndreieck",
  "Verbandskasten",
  "Warnweste",
  "Ladekabel",
] as const;

export type Uebergabe = {
  id: string;
  vehicle_id: string;
  art: UebergabeArt;
  datum: string;
  person_id: string | null;
  person_name: string | null;
  km: number | null;
  tank: TankStufe | null;
  zubehoer: string[];
  sauber: boolean | null;
  maengel: string | null;
  fotos: string[];
  unterschrift_pfad: string | null;
  created_at: string;
  person?: { full_name: string | null; email: string | null } | null;
  ersteller?: { full_name: string | null; email: string | null } | null;
  vehicle?: { kennzeichen: string | null; marke: string | null; typ: string | null; fin: string | null } | null;
};

export const UEBERGABE_COLUMNS =
  "id, vehicle_id, art, datum, person_id, person_name, km, tank, zubehoer, sauber, maengel, fotos, unterschrift_pfad, created_at, person:profiles!uebergaben_person_id_fkey(full_name, email), ersteller:profiles!uebergaben_created_by_fkey(full_name, email)";

export function personName(u: Pick<Uebergabe, "person" | "person_name">) {
  return u.person?.full_name ?? u.person?.email ?? u.person_name ?? "–";
}

// "data:image/png;base64,..." aus dem Unterschriftenfeld -> PNG-Datei.
export function signatureFile(dataUrl: string): File | null {
  const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[1], "base64");
  // Leeres Feld oder unrealistisch groß: ignorieren.
  if (bytes.length < 100 || bytes.length > 1024 * 1024) return null;
  return new File([bytes], "unterschrift.png", { type: "image/png" });
}
