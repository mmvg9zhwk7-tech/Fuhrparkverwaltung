import { describe, expect, it } from "vitest";
import { personName, signatureFile } from "@/lib/uebergaben/uebergaben";

describe("signatureFile", () => {
  it("macht aus der data URL eine PNG-Datei", () => {
    const png = Buffer.alloc(500, 1).toString("base64");
    const file = signatureFile(`data:image/png;base64,${png}`);
    expect(file?.type).toBe("image/png");
    expect(file?.size).toBe(500);
  });
  it("ignoriert leere oder fremde Daten", () => {
    expect(signatureFile("")).toBeNull();
    expect(signatureFile("data:image/png;base64,AAAA")).toBeNull();
    expect(signatureFile("data:text/html;base64,PGgxPg==")).toBeNull();
  });
});

describe("personName", () => {
  it("Konto vor freiem Namen", () => {
    expect(personName({ person: { full_name: "Max", email: null }, person_name: null })).toBe("Max");
    expect(personName({ person: null, person_name: "Autohaus Meier" })).toBe("Autohaus Meier");
  });
});
