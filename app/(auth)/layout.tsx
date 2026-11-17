import type { ReactNode } from "react";
import { ClipboardIcon, LogoIcon, ShieldCheckIcon, UsersIcon } from "@/components/auth/icons";

const PLATFORM_TITLE = "AI-Assisted Software Project Management Platform";

const FEATURES = [
  {
    icon: ClipboardIcon,
    title: "Structured Requirements & Tasks",
    text: "Track project scope from planning to Kanban delivery.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Quality Assurance & Bug Lifecycle",
    text: "Execute test cases and resolve defects in one workflow.",
  },
  {
    icon: UsersIcon,
    title: "Role-Based Team Collaboration",
    text: "Dedicated access for Project Managers, Developers, Testers, and Faculty/Clients.",
  },
];

const ROLES = ["Project Manager", "Developer", "Tester", "Faculty / Client"];

// Shared split-screen shell for /login and /register: brand panel on the left
// (lg and up), form panel on the right. Each page renders only its card.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Subtle grid + radial glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/40">
              <LogoIcon className="h-6 w-6 text-indigo-300" />
            </span>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-200">
              SDLC Workspace • v1.0
            </span>
          </div>
          <h1 className="mt-8 max-w-lg text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            {PLATFORM_TITLE}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            Centralized requirements, agile sprint tracking, test execution, and bug lifecycle
            management for software engineering teams.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-indigo-300" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Workspace roles
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <span
                key={role}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
        {/* Compact branding below lg, where the brand panel is hidden */}
        <div className="mb-6 flex w-full max-w-md items-center gap-3 lg:hidden">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
            <LogoIcon className="h-5 w-5 text-white" />
          </span>
          <p className="text-sm font-semibold leading-snug text-slate-900">{PLATFORM_TITLE}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
