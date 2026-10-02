import { describe, expect, it } from "vitest";
import { canManageFleet, canManageUsers, isRole } from "@/lib/auth/roles";

describe("isRole", () => {
  it("erkennt gültige Rollen", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("fuhrparkleiter")).toBe(true);
    expect(isRole("fahrer")).toBe(true);
  });

  it("lehnt alles andere ab", () => {
    expect(isRole("superadmin")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole(null)).toBe(false);
  });
});

describe("Berechtigungen", () => {
  it("nur Admins verwalten Nutzer", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("fuhrparkleiter")).toBe(false);
    expect(canManageUsers("fahrer")).toBe(false);
    expect(canManageUsers(null)).toBe(false);
  });

  it("Admins und Fuhrparkleitung verwalten den Fuhrpark", () => {
    expect(canManageFleet("admin")).toBe(true);
    expect(canManageFleet("fuhrparkleiter")).toBe(true);
    expect(canManageFleet("fahrer")).toBe(false);
  });
});
