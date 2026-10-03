export const SCHADEN_STATUS = ["gemeldet", "in_bearbeitung", "erledigt"] as const;

export type SchadenStatus = (typeof SCHADEN_STATUS)[number];

export const SCHADEN_STATUS_LABELS: Record<SchadenStatus, string> = {
  gemeldet: "Neu gemeldet",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
};

export function isSchadenStatus(value: unknown): value is SchadenStatus {
  return typeof value === "string" && (SCHADEN_STATUS as readonly string[]).includes(value);
}

export type Schaden = {
  id: string;
  vehicle_id: string;
  datum: string;
  ort: string | null;
  beschreibung: string;
  fotos: string[];
  fahrbereit: boolean;
  status: SchadenStatus;
  rueckmeldung: string | null;
  created_at: string;
  melder?: { full_name: string | null; email: string | null } | null;
  vehicle?: { kennzeichen: string | null; marke: string | null; typ: string | null } | null;
};

export const SCHADEN_COLUMNS =
  "id, vehicle_id, datum, ort, beschreibung, fotos, fahrbereit, status, rueckmeldung, created_at, melder:profiles!schaeden_created_by_fkey(full_name, email), vehicle:vehicles(kennzeichen, marke, typ)";

export const MAX_FOTOS = 5;
