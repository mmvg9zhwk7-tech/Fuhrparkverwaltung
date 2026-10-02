// Reine Datumsrechnung auf "YYYY-MM-DD"-Strings (UTC), damit Zeitzonen
// keine Tage verschieben.

const DAY = 24 * 60 * 60 * 1000;

export function toDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayIso() {
  // Deutsche Zeit, damit kurz nach Mitternacht schon der neue Tag gilt.
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
}

export function daysBetween(from: string, to: string) {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY);
}

export function addDays(iso: string, days: number) {
  return toIso(new Date(toDate(iso).getTime() + Math.round(days) * DAY));
}

export function addMonths(iso: string, months: number) {
  const d = toDate(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toIso(d);
}
