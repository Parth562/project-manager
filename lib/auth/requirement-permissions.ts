import type { Role } from "@prisma/client";
import { isDeveloper, isProjectManager, isTester } from "@/lib/auth/permissions";

// Pure permission rules for requirements. Callers must compute isMember /
// isCreator server-side from the database — never from client input.

export const canViewRequirements = (isMember: boolean) => isMember;

// Create, edit, delete and change priority: only the project's creator
// (who is always a Project Manager) — same rule as project edit/team.
export const canManageRequirements = (role: Role, isCreator: boolean) =>
  isProjectManager(role) && isCreator;

// Status-only updates: the creator PM, plus Developers and Testers who are
// members of the project. Faculty/Client and other PMs are view-only.
export const canUpdateRequirementStatus = (
  role: Role,
  isMember: boolean,
  isCreator: boolean,
) =>
  isMember &&
  (canManageRequirements(role, isCreator) || isDeveloper(role) || isTester(role));
