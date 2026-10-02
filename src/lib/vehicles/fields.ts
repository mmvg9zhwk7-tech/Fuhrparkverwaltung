// Alle Felder eines Fahrzeugs, in der Reihenfolge der bisherigen
// Excel-Liste. Formular, Detailansicht und Import richten sich danach -
// ein neues Feld hier und in supabase/add_*.sql ergänzen, fertig.

export type FieldType = "text" | "money" | "date" | "int";

export type VehicleField = {
  key: string;
  label: string;
  type: FieldType;
  // Spaltenüberschriften, unter denen das Feld beim Excel-Import erkannt
  // wird (Vergleich ohne Groß-/Kleinschreibung, Leer- und Satzzeichen).
  aliases?: string[];
  // Vorschläge im Formular (frei überschreibbar).
  suggestions?: string[];
  group: "fahrzeug" | "zuordnung" | "finanzen" | "status";
};

export const VEHICLE_FIELDS: VehicleField[] = [
  { key: "vorgang", label: "Vorgang", type: "text", group: "fahrzeug" },
  { key: "vertrag_lf", label: "Vertrag LF", type: "text", group: "finanzen", aliases: ["Vertrag Leasing"] },
  { key: "marke", label: "Marke", type: "text", group: "fahrzeug" },
  { key: "typ", label: "Typ", type: "text", group: "fahrzeug", aliases: ["Modell"] },
  { key: "kennzeichen", label: "Kennzeichen", type: "text", group: "fahrzeug" },
  { key: "fin", label: "Fahrgestellnummer (FIN)", type: "text", group: "fahrzeug", aliases: ["Fahrgestellnummer", "FIN"] },
  { key: "erstzulassung", label: "Erstzulassung", type: "date", group: "fahrzeug", aliases: ["EZ"] },
  {
    key: "art",
    label: "Art",
    type: "text",
    group: "zuordnung",
    suggestions: ["Eigen", "Leasing", "Miete", "Finanzierung"],
  },
  { key: "mandant", label: "Mandant", type: "text", group: "zuordnung" },
  { key: "filiale", label: "Filiale", type: "text", group: "zuordnung" },
  { key: "kostenstelle", label: "Kostenstelle", type: "text", group: "zuordnung" },
  { key: "nutzer", label: "Nutzer", type: "text", group: "zuordnung" },
  { key: "miete", label: "Miete", type: "text", group: "zuordnung", suggestions: ["intern", "extern"] },
  { key: "leasingbelastung", label: "Leasingbelastung", type: "money", group: "finanzen", aliases: ["Leasingbel", "Leasingbel."] },
  { key: "pauschale", label: "Pauschale", type: "money", group: "finanzen" },
  { key: "ende_lf", label: "Ende LF", type: "date", group: "finanzen", aliases: ["Ende Leasing", "Laufzeitende"] },
  { key: "kaufpreis", label: "Kaufpreis", type: "money", group: "finanzen" },
  { key: "einkaufsdatum", label: "Einkaufsdatum", type: "date", group: "finanzen" },
  { key: "berechnung", label: "Berechnung", type: "money", group: "finanzen" },
  {
    key: "status",
    label: "Status",
    type: "text",
    group: "status",
    suggestions: ["Bestand", "Verkauft", "Abgemeldet", "Zurückgegeben"],
  },
  { key: "verkaufsdatum", label: "Verkaufsdatum", type: "date", group: "status" },
  { key: "rg_nummer", label: "RG-Nummer", type: "text", group: "status", aliases: ["Rechnungsnummer", "RG Nr"] },
  { key: "km_stand", label: "KM-Stand", type: "int", group: "status", aliases: ["KM-Stand 31.12.25", "Kilometerstand"] },
  { key: "km_stand_datum", label: "KM-Stand vom", type: "date", group: "status" },
  { key: "bestandswert", label: "Bestandswert", type: "money", group: "status" },
  { key: "thg", label: "THG", type: "text", group: "status", aliases: ["THG-Quote"] },
];

export const FIELD_GROUPS: { key: VehicleField["group"]; label: string }[] = [
  { key: "fahrzeug", label: "Fahrzeug" },
  { key: "zuordnung", label: "Zuordnung" },
  { key: "finanzen", label: "Vertrag & Finanzen" },
  { key: "status", label: "Status & Bestand" },
];

export type VehicleValue = string | number | boolean | null;
export type VehicleInput = Record<string, VehicleValue>;
export type Vehicle = VehicleInput & { id: string; fin_kurz: string | null };

// Felder außerhalb der Excel-Liste (Zuordnung, eigene Grenzen).
export const EXTRA_COLUMNS = ["fahrer_id", "ist_pool", "aussteuern_ab_km", "aussteuern_ab_datum"];

export const VEHICLE_COLUMNS = ["id", "fin_kurz", ...VEHICLE_FIELDS.map((f) => f.key), ...EXTRA_COLUMNS].join(", ");
