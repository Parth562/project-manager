import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import {
  canManageRequirements,
  canUpdateRequirementStatus,
  canViewRequirements,
} from "@/lib/auth/requirement-permissions";

const roles: Role[] = ["PROJECT_MANAGER", "DEVELOPER", "TESTER", "FACULTY_CLIENT"];

describe("canViewRequirements", () => {
  it("allows members and blocks non-members", () => {
    expect(canViewRequirements(true)).toBe(true);
    expect(canViewRequirements(false)).toBe(false);
  });
});

describe("canManageRequirements (create/edit/delete/priority)", () => {
  it("allows the creator Project Manager", () => {
    expect(canManageRequirements("PROJECT_MANAGER", true)).toBe(true);
  });

  it("blocks a Project Manager who is not the project creator", () => {
    expect(canManageRequirements("PROJECT_MANAGER", false)).toBe(false);
  });

  it("blocks Developer, Tester and Faculty/Client", () => {
    for (const role of ["DEVELOPER", "TESTER", "FACULTY_CLIENT"] as Role[]) {
      expect(canManageRequirements(role, false)).toBe(false);
    }
  });
});

describe("canUpdateRequirementStatus", () => {
  it("allows the creator Project Manager", () => {
    expect(canUpdateRequirementStatus("PROJECT_MANAGER", true, true)).toBe(true);
  });

  it("allows member Developers and Testers", () => {
    expect(canUpdateRequirementStatus("DEVELOPER", true, false)).toBe(true);
    expect(canUpdateRequirementStatus("TESTER", true, false)).toBe(true);
  });

  it("blocks Faculty/Client and non-creator Project Managers", () => {
    expect(canUpdateRequirementStatus("FACULTY_CLIENT", true, false)).toBe(false);
    expect(canUpdateRequirementStatus("PROJECT_MANAGER", true, false)).toBe(false);
  });

  it("blocks every role when not a project member", () => {
    for (const role of roles) {
      expect(canUpdateRequirementStatus(role, false, false)).toBe(false);
    }
  });
});
