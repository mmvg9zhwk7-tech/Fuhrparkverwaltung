import { describe, expect, it } from "vitest";
import { sanitizeNextPath, withNext } from "@/lib/auth/next-path";

describe("sanitizeNextPath", () => {
  it("lässt relative Pfade durch", () => {
    expect(sanitizeNextPath("/fahrzeuge?id=1")).toBe("/fahrzeuge?id=1");
  });

  it("blockt Weiterleitungen auf fremde Seiten", () => {
    expect(sanitizeNextPath("//evil.example")).toBeNull();
    expect(sanitizeNextPath("https://evil.example")).toBeNull();
    expect(sanitizeNextPath("/\\evil.example")).toBeNull();
  });
});

describe("withNext", () => {
  it("hängt das Ziel an", () => {
    expect(withNext("/login", "/konto")).toBe("/login?next=%2Fkonto");
    expect(withNext("/login?error=x", "/konto")).toBe("/login?error=x&next=%2Fkonto");
    expect(withNext("/login", null)).toBe("/login");
  });
});
