import { describe, expect, it } from "vitest";
import { parseDate, parseInteger, parseMoney } from "@/lib/vehicles/parse";
import { buildImport, matchHeader, parseTable } from "@/lib/vehicles/import";
import { formatValue, inputValue } from "@/lib/vehicles/format";

describe("Werte aus Excel", () => {
  it("liest Euro-Beträge", () => {
    expect(parseMoney(" 19.449,58 € ")).toBe(19449.58);
    expect(parseMoney("400,00 €")).toBe(400);
    expect(parseMoney("1,00 €")).toBe(1);
    expect(parseMoney("1.250")).toBe(1250);
    expect(parseMoney("12.5")).toBe(12.5);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });

  it("liest Daten", () => {
    expect(parseDate("14.09.15")).toBe("2015-09-14");
    expect(parseDate("1.2.2026")).toBe("2026-02-01");
    expect(parseDate("31.12.99")).toBe("1999-12-31");
    expect(parseDate("2015-09-14")).toBe("2015-09-14");
    expect(parseDate("31.02.25")).toBeNull();
    expect(parseDate("")).toBeNull();
  });

  it("liest Kilometer", () => {
    expect(parseInteger("94304")).toBe(94304);
    expect(parseInteger("94.304 km")).toBe(94304);
    expect(parseInteger("")).toBeNull();
  });
});

describe("Spaltenüberschriften", () => {
  it("erkennt die Spalten der Excel-Liste", () => {
    expect(matchHeader("Fahrgestellnummer")?.key).toBe("fin");
    expect(matchHeader(" Leasingbel. ")?.key).toBe("leasingbelastung");
    expect(matchHeader("TYP")?.key).toBe("typ");
    expect(matchHeader(" KM-Stand 31.12.25 ")?.key).toBe("km_stand");
    expect(matchHeader(" RG-Nummer ")?.key).toBe("rg_nummer");
    expect(matchHeader("letzten 6 der FIN")).toBeNull();
    expect(matchHeader("Irgendwas")).toBeNull();
  });
});

const HEADER =
  "Vorgang\tVertrag LF\tMarke\tTYP\tKennzeichen\tFahrgestellnummer\tletzten 6 der FIN\tArt\tMandant\tFiliale\tKostenstelle\tNutzer\tMiete\t Leasingbel. \t Pauschale \tEnde LF\t Kaufpreis \tEinkaufsdatum\t Berechnung \t Status \tVerkaufsdatum\t RG-Nummer \t KM-Stand 31.12.25 \t Bestandswert \t THG ";
const ROW =
  "1225523\t\tMB\t316 CDI Ka\tVEC-AT 264\tWDB9066331S669172\t669172\tEigen\tAHA\t07 - Damme\t020000 - RAA Service\tAllgemein\tintern\t\t\t\t 19.449,58 € \t14.09.15\t 400,00 € \t Bestand \t\t\t94304\t 1,00 € \t";

describe("Excel-Import", () => {
  it("übernimmt eine aus Excel kopierte Zeile", () => {
    const { vehicles, warnings, mappedColumns } = buildImport(`${HEADER}\n${ROW}\n`);
    expect(warnings).toEqual([]);
    expect(mappedColumns.filter((c) => !c.field).map((c) => c.header)).toEqual([
      "letzten 6 der FIN",
    ]);
    expect(vehicles).toHaveLength(1);
    expect(vehicles[0]).toMatchObject({
      vorgang: "1225523",
      vertrag_lf: null,
      marke: "MB",
      typ: "316 CDI Ka",
      kennzeichen: "VEC-AT 264",
      fin: "WDB9066331S669172",
      art: "Eigen",
      filiale: "07 - Damme",
      kostenstelle: "020000 - RAA Service",
      miete: "intern",
      kaufpreis: 19449.58,
      einkaufsdatum: "2015-09-14",
      berechnung: 400,
      status: "Bestand",
      km_stand: 94304,
      km_stand_datum: "2025-12-31",
      bestandswert: 1,
      thg: null,
    });
  });

  it("liest Semikolon-CSV mit Anführungszeichen", () => {
    expect(parseTable('Marke;Typ\n"MB";"316; CDI"\n')).toEqual([
      ["Marke", "Typ"],
      ["MB", "316; CDI"],
    ]);
  });

  it("meldet unlesbare Werte", () => {
    const { warnings } = buildImport("Kennzeichen\tKaufpreis\nAB-C 1\tviel\n");
    expect(warnings[0]).toContain("Kaufpreis");
  });
});

describe("Anzeige", () => {
  it("formatiert deutsch", () => {
    expect(formatValue("money", 19449.58)).toMatch(/19\.449,58\s€/);
    expect(formatValue("date", "2015-09-14")).toBe("14.09.2015");
    expect(formatValue("int", 94304)).toBe("94.304");
    expect(formatValue("text", null)).toBe("–");
    expect(inputValue("money", 19449.58)).toBe("19449,58");
  });
});
