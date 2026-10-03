import { describe, expect, it } from "vitest";
import { compareFristen, faelligText, fristenOf, fristStatus, naechsteFaelligkeit } from "@/lib/fristen/fristen";
import { parseDate } from "@/lib/vehicles/parse";
import { matchHeader } from "@/lib/vehicles/import";

describe("fristStatus", () => {
  it("überfällig, bald, ok, fehlt", () => {
    expect(fristStatus("2026-10-01", "2026-10-02", 30)).toBe("ueberfaellig");
    expect(fristStatus("2026-10-02", "2026-10-02", 30)).toBe("bald");
    expect(fristStatus("2026-11-01", "2026-10-02", 30)).toBe("bald");
    expect(fristStatus("2026-11-02", "2026-10-02", 30)).toBe("ok");
    expect(fristStatus(null, "2026-10-02", 30)).toBe("fehlt");
  });
});

describe("fristenOf", () => {
  it("liefert HU, UVV und Inspektion und sortiert Dringendes nach vorn", () => {
    const items = fristenOf(
      { hu_faellig: "2027-03-31", uvv_faellig: "2026-09-01", inspektion_faellig: null },
      "2026-10-02",
      30,
    );
    expect(items.map((i) => [i.art, i.status])).toEqual([
      ["hu", "ok"],
      ["uvv", "ueberfaellig"],
      ["inspektion", "fehlt"],
    ]);
    expect([...items].sort(compareFristen).map((i) => i.art)).toEqual(["uvv", "hu", "inspektion"]);
  });
});

describe("naechsteFaelligkeit", () => {
  it("HU alle 24, UVV alle 12 Monate", () => {
    expect(naechsteFaelligkeit("hu", "2026-10-02")).toBe("2028-10-02");
    expect(naechsteFaelligkeit("uvv", "2026-10-02")).toBe("2027-10-02");
  });
});

describe("faelligText", () => {
  it("formuliert verständlich", () => {
    expect(faelligText("2026-10-02", "2026-10-02")).toBe("heute fällig");
    expect(faelligText("2026-10-14", "2026-10-02")).toBe("in 12 Tagen");
    expect(faelligText("2026-09-29", "2026-10-02")).toBe("seit 3 Tagen überfällig");
    expect(faelligText(null, "2026-10-02")).toBe("kein Datum hinterlegt");
  });
});

describe("Fristen im Excel-Import", () => {
  it("versteht Monat/Jahr wie auf der HU-Plakette", () => {
    expect(parseDate("03/2027")).toBe("2027-03-31");
    expect(parseDate("2.2028")).toBe("2028-02-29");
    expect(parseDate("13/2027")).toBeNull();
  });
  it("erkennt die Spalten", () => {
    expect(matchHeader("TÜV")?.key).toBe("hu_faellig");
    expect(matchHeader("UVV-Prüfung")?.key).toBe("uvv_faellig");
    expect(matchHeader("nächste Inspektion")?.key).toBe("inspektion_faellig");
  });
});
