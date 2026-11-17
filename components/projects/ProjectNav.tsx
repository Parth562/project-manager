"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName =
  | "overview"
  | "requirements"
  | "tasks"
  | "kanban"
  | "testing"
  | "bugs"
  | "edit"
  | "team";

// Minimal inline icons (stroke = currentColor) — no icon library needed.
const ICON_PATHS: Record<IconName, string> = {
  overview: "M3 12l9-8 9 8M5 10v10h14V10",
  requirements: "M9 4h6v3H9zM7 6H5v15h14V6h-2M9 12h6M9 16h4",
  tasks: "M4 6l2 2 3-3M4 13l2 2 3-3M12 7h8M12 14h8M4 20h16",
  kanban: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z",
  testing: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 14h9",
  bugs: "M8 8a4 4 0 018 0v6a4 4 0 01-8 0zM12 10v8M4 12h4M16 12h4M5 6l3 2M19 6l-3 2M5 19l3-2M19 19l-3-2",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  team: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M16 5a3 3 0 010 6M18 14a5 5 0 013 6",
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

type NavItem = { label: string; segment: string; icon: IconName };

const MAIN_ITEMS: NavItem[] = [
  { label: "Overview", segment: "", icon: "overview" },
  { label: "Requirements", segment: "requirements", icon: "requirements" },
  { label: "Tasks", segment: "tasks", icon: "tasks" },
  { label: "Kanban", segment: "kanban", icon: "kanban" },
  { label: "Testing", segment: "testing", icon: "testing" },
  { label: "Bugs", segment: "bugs", icon: "bugs" },
];

const OWNER_ITEMS: NavItem[] = [
  { label: "Edit Project", segment: "edit", icon: "edit" },
  { label: "Manage Team", segment: "team", icon: "team" },
];

export default function ProjectNav({
  projectId,
  projectName,
  isCreator,
}: {
  projectId: string;
  projectName: string;
  isCreator: boolean;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  function renderItem(item: NavItem, variant: "tab" | "owner") {
    const href = item.segment ? `${base}/${item.segment}` : base;
    const isActive = item.segment
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === base;

    const className =
      variant === "tab"
        ? `inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
            isActive
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900"
          }`
        : `inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            isActive
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`;

    return (
      <Link
        key={item.label}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={className}
      >
        <Icon name={item.icon} />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
        <Link
          href="/projects"
          className="min-w-0 truncate text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-900"
        >
          Projects / <span className="normal-case text-gray-900">{projectName}</span>
        </Link>
        {isCreator && (
          <div className="flex gap-2">
            {OWNER_ITEMS.map((item) => renderItem(item, "owner"))}
          </div>
        )}
      </div>
      <nav aria-label="Project sections" className="-mb-px flex gap-1 overflow-x-auto">
        {MAIN_ITEMS.map((item) => renderItem(item, "tab"))}
      </nav>
    </div>
  );
}

export function ProjectNavSkeleton() {
  return (
    <div className="border-b border-gray-200 bg-white px-4 md:px-8">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-200 mt-3" />
      <div className="flex gap-4 py-3">
        {MAIN_ITEMS.map((item) => (
          <div key={item.label} className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
