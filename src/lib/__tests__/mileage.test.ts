import { describe, expect, it } from "vitest";
import { checkNewKm, mileageStatus } from "@/lib/mileage/status";
import { addMonths, daysBetween } from "@/lib/dates";

describe("mileageStatus", () => {
  it("gemeldet, wenn im laufenden Monat gemeldet", () => {
    expect(mileageStatus("2026-10-01", "2026-10-20", 10)).toBe("gemeldet");
  });
  it("offen bis zum Fälligkeitstag", () => {
    expect(mileageStatus("2026-09-30", "2026-10-10", 10)).toBe("offen");
    expect(mileageStatus(null, "2026-10-02", 10)).toBe("offen");
  });
  it("überfällig danach", () => {
    expect(mileageStatus("2026-09-30", "2026-10-11", 10)).toBe("ueberfaellig");
    expect(mileageStatus("2025-10-15", "2026-10-15", 10)).toBe("ueberfaellig");
  });
});

describe("checkNewKm", () => {
  it("akzeptiert plausible Stände", () => {
    expect(checkNewKm(95000, 94304)).toBeNull();
    expect(checkNewKm(10, null)).toBeNull();
  });
  it("lehnt kleinere und unplausible Stände ab", () => {
    expect(checkNewKm(90000, 94304)).toContain("kleiner");
    expect(checkNewKm(150000, 94304)).toContain("20.000");
    expect(checkNewKm(-1, null)).toContain("gültigen");
  });
});

describe("Datumsrechnung", () => {
  it("rechnet Monate und Tage", () => {
    expect(addMonths("2021-01-31", 1)).toBe("2021-02-28");
    expect(addMonths("2015-09-14", 60)).toBe("2020-09-14");
    expect(daysBetween("2026-01-01", "2026-12-31")).toBe(364);
  });
});
