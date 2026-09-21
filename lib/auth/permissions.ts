import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer",
  TESTER: "Tester",
  FACULTY_CLIENT: "Faculty / Client",
};

// Navigation visibility per role for Phase 2. This only hides links in the UI —
// it is not a security boundary. Real enforcement of any future mutation must
// re-check the role server-side (e.g. via getServerSession()) before touching the database.
export const NAV_ACCESS: { label: string; href: string; roles: Role[] }[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["PROJECT_MANAGER", "DEVELOPER", "TESTER", "FACULTY_CLIENT"],
  },
  {
    label: "Projects",
    href: "/projects",
    roles: ["PROJECT_MANAGER", "DEVELOPER", "TESTER", "FACULTY_CLIENT"],
  },
  {
    label: "Requirements",
    href: "/requirements",
    roles: ["PROJECT_MANAGER", "FACULTY_CLIENT"],
  },
  { label: "Tasks", href: "/tasks", roles: ["PROJECT_MANAGER", "DEVELOPER"] },
  { label: "Sprints", href: "/sprints", roles: ["PROJECT_MANAGER"] },
  { label: "Testing", href: "/testing", roles: ["PROJECT_MANAGER", "TESTER"] },
  { label: "Bugs", href: "/bugs", roles: ["PROJECT_MANAGER", "TESTER"] },
];

export const isProjectManager = (role: Role) => role === "PROJECT_MANAGER";
export const isDeveloper = (role: Role) => role === "DEVELOPER";
export const isTester = (role: Role) => role === "TESTER";
export const isFacultyClient = (role: Role) => role === "FACULTY_CLIENT";
