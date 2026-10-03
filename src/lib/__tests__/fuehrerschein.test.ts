import { describe, expect, it } from "vitest";
import { brauchtKontrolle, fuehrerscheinLage } from "@/lib/fuehrerschein/status";

const SETTINGS = { fs_kontrolle_intervall_monate: 6, fristen_vorlauf_tage: 30 };
const TODAY = "2026-10-02";

describe("fuehrerscheinLage", () => {
  it("nie kontrolliert = sofort fällig", () => {
    const l = fuehrerscheinLage({ letzte: null, gueltigBis: null }, TODAY, SETTINGS);
    expect(l).toMatchObject({ status: "ueberfaellig", naechste: null, grund: "Noch nie kontrolliert" });
  });

  it("nächste Kontrolle nach dem Intervall", () => {
    const l = fuehrerscheinLage({ letzte: { kontrolliert_am: "2026-06-15", ergebnis: "ok" }, gueltigBis: null }, TODAY, SETTINGS);
    expect(l).toMatchObject({ status: "ok", naechste: "2026-12-15" });
  });

  it("bald und überfällig", () => {
    expect(
      fuehrerscheinLage({ letzte: { kontrolliert_am: "2026-04-20", ergebnis: "ok" }, gueltigBis: null }, TODAY, SETTINGS).status,
    ).toBe("bald");
    expect(
      fuehrerscheinLage({ letzte: { kontrolliert_am: "2026-03-01", ergebnis: "ok" }, gueltigBis: null }, TODAY, SETTINGS).status,
    ).toBe("ueberfaellig");
  });

  it("beanstandet oder abgelaufen ist immer rot", () => {
    const fresh = { kontrolliert_am: "2026-09-30", ergebnis: "ok" as const };
    expect(
      fuehrerscheinLage({ letzte: { ...fresh, ergebnis: "beanstandet" }, gueltigBis: null }, TODAY, SETTINGS).grund,
    ).toBe("Letzte Kontrolle beanstandet");
    expect(fuehrerscheinLage({ letzte: fresh, gueltigBis: "2026-10-01" }, TODAY, SETTINGS)).toMatchObject({
      status: "ueberfaellig",
      grund: "Führerschein abgelaufen am 01.10.2026",
    });
  });

  it("warnt, wenn der Führerschein bald abläuft", () => {
    const l = fuehrerscheinLage(
      { letzte: { kontrolliert_am: "2026-09-30", ergebnis: "ok" }, gueltigBis: "2026-10-20" },
      TODAY,
      SETTINGS,
    );
    expect(l).toMatchObject({ status: "bald", grund: "Führerschein läuft ab am 20.10.2026" });
  });
});

describe("brauchtKontrolle", () => {
  it("Fahrer:innen und alle mit eigenem Fahrzeug", () => {
    expect(brauchtKontrolle("fahrer", false)).toBe(true);
    expect(brauchtKontrolle("admin", false)).toBe(false);
    expect(brauchtKontrolle("fuhrparkleiter", true)).toBe(true);
  });
});
