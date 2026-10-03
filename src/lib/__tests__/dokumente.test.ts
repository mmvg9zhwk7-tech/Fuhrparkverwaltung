import { describe, expect, it } from "vitest";
import { dokumentPfad, formatGroesse, isPfadFuer } from "@/lib/dokumente/dokumente";

const V = "3f2b8c1e-0000-4000-8000-000000000001";

describe("Dokument-Pfade", () => {
  it("legt Dateien unter dem Fahrzeug ab, ohne Originalnamen", () => {
    expect(dokumentPfad(V, "Leasingvertrag Müller.PDF", "abc-123")).toBe(`${V}/abc-123.pdf`);
    expect(dokumentPfad(V, "ohne-endung", "x")).toBe(`${V}/x.bin`);
  });
  it("akzeptiert nur Pfade des eigenen Fahrzeugs", () => {
    expect(isPfadFuer(V, `${V}/abc-123.pdf`)).toBe(true);
    expect(isPfadFuer(V, `anderes/abc.pdf`)).toBe(false);
    expect(isPfadFuer(V, `${V}/../x.pdf`)).toBe(false);
    expect(isPfadFuer(V, `${V}/sub/x.pdf`)).toBe(false);
  });
  it("zeigt Größen lesbar", () => {
    expect(formatGroesse(250 * 1024)).toBe("250 KB");
    expect(formatGroesse(3.5 * 1024 * 1024)).toBe("3,5 MB");
  });
});
