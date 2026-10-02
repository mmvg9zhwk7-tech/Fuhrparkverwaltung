// Monatliche KM-Meldung: Jeden Kalendermonat muss mindestens einmal
// gemeldet werden, spätestens bis zum eingestellten Tag.

export type MileageStatus = "gemeldet" | "offen" | "ueberfaellig";

export const MILEAGE_STATUS_LABELS: Record<MileageStatus, string> = {
  gemeldet: "Gemeldet",
  offen: "Diesen Monat offen",
  ueberfaellig: "Überfällig",
};

export function mileageStatus(
  lastReport: string | null | undefined,
  today: string,
  dueDay: number,
): MileageStatus {
  if (lastReport && lastReport.slice(0, 7) === today.slice(0, 7)) return "gemeldet";
  return Number(today.slice(8, 10)) > dueDay ? "ueberfaellig" : "offen";
}

// Neuer Stand darf nicht unter dem bisherigen liegen (Tippfehler-Schutz).
export function checkNewKm(km: number, current: number | null | undefined): string | null {
  if (!Number.isInteger(km) || km < 0) return "Bitte einen gültigen Kilometerstand eingeben.";
  if (current != null && km < current) {
    return `Der Stand ist kleiner als der zuletzt gemeldete (${current.toLocaleString("de-DE")} km).`;
  }
  if (current != null && km - current > 20000) {
    return "Das sind über 20.000 km mehr als beim letzten Mal. Bitte prüfen - bei Bedarf meldet die Fuhrparkleitung den Stand.";
  }
  return null;
}
