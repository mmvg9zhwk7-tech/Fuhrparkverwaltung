import { describe, expect, it } from "vitest";
import { fristenOf } from "@/lib/fristen/fristen";
import { planReminders, type ReminderVehicle } from "@/lib/reminders/plan";

const TODAY = "2026-10-08";
const people = [
  { id: "chef", email: "chef@firma.de", full_name: "Anna Admin", role: "admin" },
  { id: "max", email: "max@firma.de", full_name: "Max Mustermann", role: "fahrer" },
  { id: "ohne", email: null, full_name: "Ohne Mail", role: "fahrer" },
];
const golf: ReminderVehicle = {
  id: "v1",
  kennzeichen: "M-AB 1234",
  marke: "VW",
  typ: "Golf",
  fahrer_id: "max",
  km: "offen",
  km_stand_datum: "2026-09-08",
  fristen: fristenOf({ hu_faellig: "2026-10-20", uvv_faellig: "2027-05-01" }, TODAY, 30),
};
const base = {
  today: TODAY,
  kmFaelligTag: 10,
  appUrl: "https://fuhrpark.example",
  vehicles: [golf],
  fuehrerscheine: [
    { id: "max", full_name: "Max Mustermann", email: "max@firma.de", lage: { status: "ueberfaellig" as const, naechste: null, grund: "Noch nie kontrolliert" } },
  ],
  people,
  sent: new Set<string>(),
};

describe("planReminders", () => {
  it("Sammel-Mail für die Fuhrparkleitung, Erinnerung für Fahrer:in", () => {
    const mails = planReminders(base);
    expect(mails.map((m) => m.to)).toEqual(["chef@firma.de", "max@firma.de"]);

    const chef = mails[0];
    expect(chef.subject).toBe("Fuhrpark: 2 Punkte zu erledigen");
    expect(chef.text).toContain("M-AB 1234 · VW Golf: HU 20.10.2026 (in 12 Tagen)");
    expect(chef.text).toContain("Max Mustermann: Noch nie kontrolliert");
    expect(chef.text).toContain("https://fuhrpark.example/fristen");

    const max = mails[1];
    expect(max.text).toMatch(/^Hallo Max,/);
    expect(max.text).toContain("Bitte melde bis zum 10. den KM-Stand");
    expect(max.text).toContain("Führerschein so bald wie möglich");
  });

  it("schickt nichts doppelt", () => {
    const first = planReminders(base);
    const sent = new Set(first.flatMap((m) => m.keys));
    expect(planReminders({ ...base, sent })).toEqual([]);
  });

  it("neuer Anlass (überfällig statt bald) kommt erneut", () => {
    const sent = new Set(planReminders(base).flatMap((m) => m.keys));
    const later = {
      ...base,
      today: "2026-10-21",
      sent,
      vehicles: [{ ...golf, km: "gemeldet" as const, fristen: fristenOf({ hu_faellig: "2026-10-20" }, "2026-10-21", 30) }],
    };
    const mails = planReminders(later);
    expect(mails).toHaveLength(1);
    expect(mails[0].text).toContain("seit gestern überfällig");
  });

  it("KM-Erinnerung erst 3 Tage vor dem Meldetag", () => {
    const early = planReminders({ ...base, today: "2026-10-02", fuehrerscheine: [], vehicles: [{ ...golf, fristen: [] }] });
    expect(early).toEqual([]);
    const overdue = planReminders({ ...base, today: "2026-10-12", fuehrerscheine: [], vehicles: [{ ...golf, km: "ueberfaellig", fristen: [] }] });
    expect(overdue.find((m) => m.to === "max@firma.de")?.subject).toBe("Erinnerung: KM-Stand melden");
    expect(overdue.find((m) => m.to === "chef@firma.de")?.text).toContain("KM-Meldung überfällig");
  });
});
