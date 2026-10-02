import { describe, expect, it } from "vitest";
import { berechneAussteuerung, kmPerDay } from "@/lib/vehicles/aussteuerung";

const SETTINGS = {
  aussteuern_max_km: 150000,
  aussteuern_max_alter_monate: 60,
  aussteuern_vorlauf_monate: 3,
};

describe("kmPerDay", () => {
  it("nutzt die Meldungen der letzten 12 Monate", () => {
    const rate = kmPerDay({}, [
      { km: 10000, datum: "2026-01-01" },
      { km: 12000, datum: "2026-03-02" },
      { km: 13650, datum: "2026-07-01" },
    ]);
    expect(Math.round(rate! * 365)).toBe(7360);
  });
  it("fällt auf Erstzulassung zurück", () => {
    const rate = kmPerDay({ erstzulassung: "2024-01-01", km_stand: 60000, km_stand_datum: "2026-01-01" });
    expect(Math.round(rate! * 365)).toBe(29959);
  });
});

describe("berechneAussteuerung", () => {
  it("km-Grenze kommt vor der Altersgrenze", () => {
    const r = berechneAussteuerung(
      { erstzulassung: "2024-01-01", km_stand: 120000, km_stand_datum: "2026-01-01" },
      SETTINGS,
      "2026-02-01",
    );
    expect(r.grund).toBe("km");
    expect(r.datum! < "2027-01-01").toBe(true);
    expect(r.ampel).toBe("ok");
  });

  it("alt genug = jetzt aussteuern (Beispiel aus der Excel-Liste)", () => {
    const r = berechneAussteuerung(
      { einkaufsdatum: "2015-09-14", km_stand: 94304, km_stand_datum: "2025-12-31" },
      SETTINGS,
      "2026-10-02",
    );
    expect(r.grund).toBe("alter");
    expect(r.datum).toBe("2020-09-14");
    expect(r.ampel).toBe("jetzt");
  });

  it("eigene Grenze je Fahrzeug und Vorwarnzeit", () => {
    const r = berechneAussteuerung(
      { erstzulassung: "2025-01-01", aussteuern_ab_datum: "2026-12-01" },
      SETTINGS,
      "2026-10-02",
    );
    expect(r.grund).toBe("festgelegt");
    expect(r.ampel).toBe("bald");
  });

  it("ohne Daten unbekannt", () => {
    expect(berechneAussteuerung({}, SETTINGS, "2026-10-02").ampel).toBe("unbekannt");
  });
});
