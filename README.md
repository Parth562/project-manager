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

## Current Phase

**Phase 1 — Project Setup**

Only the project foundation (layout, navigation, placeholder pages, and
database configuration) is implemented. No module has real functionality
yet, and authentication/AI features have not been added.

## Installation

```bash
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Supabase PostgreSQL connection string.

```bash
cp .env.example .env
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database (Prisma)

```bash
npx prisma validate   # validate schema.prisma
npx prisma generate   # generate Prisma Client
```

The schema currently contains only a minimal placeholder model. Real models
(Project, Requirement, UserStory, Task, Sprint, TestCase, Bug, ...) will be
added in later phases.

## Future Modules

- Dashboard (live metrics)
- Projects
- Team Members
- Requirements
- User Stories
- Tasks
- Kanban Board
- Sprints
- Test Cases
- Bugs
- Reports

These modules currently exist only as placeholder pages and will be
implemented in later phases, along with authentication (Phase 2) and AI
integration (later phase).
