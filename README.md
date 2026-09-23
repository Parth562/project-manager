# AI-Assisted Software Project Management Platform

## Description

A project management platform that helps software teams manage
requirements, user stories, tasks, sprints, testing, and bugs, with AI
assistance for generating user stories from software requirements. This is a
college software engineering project built incrementally in phases.

## Technology Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Supabase
- Prisma
- Zod
- Better Auth

## Current Phase

**Phase 3 — Project & Team Management**

Authentication (Phase 2) and project/team management (Phase 3) are both
implemented. Requirements, user stories, tasks, sprints, testing, bugs, and
AI features are not implemented yet — their pages remain placeholders.

### Authentication (Phase 2)

- Email/password registration and login via [Better Auth](https://www.better-auth.com/).
- Secure, HTTP-only session cookies (no tokens in `localStorage`).
- Four system roles: `PROJECT_MANAGER`, `DEVELOPER`, `TESTER`, `FACULTY_CLIENT`,
  chosen at registration and stored on `User.role`.
- Protected routes (`/dashboard`, `/projects`, `/requirements`, `/tasks`,
  `/sprints`, `/testing`, `/bugs`) require a session, enforced both by
  `proxy.ts` (fast, cookie-presence check) and by `getServerSession()` in
  `app/(dashboard)/layout.tsx` (the real, database-backed authority).
- Role-based sidebar navigation (`lib/auth/permissions.ts`).
- Role helpers: `isProjectManager`, `isDeveloper`, `isTester`, `isFacultyClient`.

### Project & Team Management (Phase 3)

- Project Managers can create, view, edit, and delete projects
  (`/projects`, `/projects/new`, `/projects/[projectId]`,
  `/projects/[projectId]/edit`).
- The project creator is automatically added as a team member.
- Project Managers can add or remove team members from an existing,
  registered user (`/projects/[projectId]/team`); the project creator
  cannot be removed.
- Developers, Testers, and Faculty/Client users can view projects they are
  members of and the project's team, but cannot create projects or manage
  team membership.
- All create/edit/delete/team-membership operations are enforced
  server-side in `lib/actions/projects.ts` (Server Actions) using the
  authenticated session — never trusting role or membership data from the
  client. Visiting a project you are not a member of shows "Access denied";
  it is not just hidden from navigation.
- Validation via Zod (`lib/validations/project.ts`): required name/description,
  valid dates, end date not before start date.

## Database Models

- `User`, `Account`, `Session`, `Verification` — Better Auth (Phase 2).
- `Project`, `ProjectMember` — project/team management (Phase 3). A user's
  system-wide `Role` (on `User`) remains the single source of truth for
  permissions; `ProjectMember` only records membership.

## Installation

```bash
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Supabase PostgreSQL connection string.
3. Set `BETTER_AUTH_SECRET` to a long random string.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` (both `http://localhost:3000` in development).

```bash
cp .env.example .env
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Register an account (choosing a role) at `/register`, then log in at `/login`.

## Database (Prisma)

```bash
npx prisma validate      # validate schema.prisma
npx prisma generate      # generate Prisma Client
npx prisma migrate dev   # create/apply a development migration
```

## Testing Performed

Manual end-to-end testing was performed against the real Supabase database:
registration and login for all four roles, logout and session invalidation,
protected-route redirects for unauthenticated users, role-based sidebar
navigation for all four roles, project creation (with automatic creator
membership), adding a team member, server-side rejection of
`/projects/new` and `/projects/[projectId]/team` for non-Project-Managers,
"Access denied" when a member of one project requests another project's
URL directly, and a 404 for a non-existent project ID.

## Future Modules

- Requirements
- User Stories
- Tasks
- Kanban Board
- Sprints
- Test Cases
- Bugs
- Reports
- Dashboard (live metrics)
- AI integration

These modules currently exist only as placeholder pages and will be
implemented in later phases.
