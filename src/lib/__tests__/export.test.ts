import { describe, expect, it } from "vitest";
import { vehiclesToCsv } from "@/lib/vehicles/export";
import { buildImport } from "@/lib/vehicles/import";

const vehicle = {
  kennzeichen: "M-AB 1234",
  marke: "VW",
  typ: 'Golf "8"; Variant',
  fin: "WVWZZZ1KZ00000001",
  kaufpreis: 19449.58,
  einkaufsdatum: "2015-09-14",
  km_stand: 94304,
  hu_faellig: "2027-03-31",
  nutzer: "=HYPERLINK(\"x\")",
  status: "Bestand",
  ist_pool: true,
  fahrer: { full_name: "Max Mustermann", email: null },
};

describe("Excel-Export", () => {
  it("schreibt deutsches CSV mit BOM", () => {
    const csv = vehiclesToCsv([vehicle]);
    expect(csv.startsWith("﻿Vorgang;")).toBe(true);
    expect(csv).toContain(";19449,58;");
    expect(csv).toContain(";14.09.2015;");
    expect(csv).toContain('"Golf ""8""; Variant"');
    expect(csv).toContain("'=HYPERLINK");
    expect(csv.trimEnd().endsWith(";Max Mustermann;ja")).toBe(true);
  });

  it("lässt sich wieder importieren", () => {
    const { vehicles, warnings } = buildImport(vehiclesToCsv([vehicle]).slice(1));
    expect(warnings).toEqual([]);
    expect(vehicles[0]).toMatchObject({
      kennzeichen: "M-AB 1234",
      typ: 'Golf "8"; Variant',
      kaufpreis: 19449.58,
      einkaufsdatum: "2015-09-14",
      km_stand: 94304,
      hu_faellig: "2027-03-31",
    });
  });
});
