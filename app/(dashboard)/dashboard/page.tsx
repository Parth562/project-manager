import Link from "next/link";
import type { BugStatus, Prisma, Role } from "@prisma/client";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";

// A bug counts as "open" until it has been verified or closed.
const OPEN_BUG_STATUSES: BugStatus[] = ["OPEN", "IN_PROGRESS", "FIXED"];

type Stat = { label: string; value: number; hint: string; href?: string };

async function getStats(userId: string, role: Role): Promise<Stat[]> {
  // Everything is scoped to projects the user is a member of.
  const inMyProjects = { project: { members: { some: { userId } } } };
  const myProjects: Prisma.ProjectWhereInput = { members: { some: { userId } } };
  const openBugs: Prisma.BugWhereInput = {
    ...inMyProjects,
    status: { in: OPEN_BUG_STATUSES },
  };

  // All counts run in parallel: one network round trip to the database.
  switch (role) {
    case "DEVELOPER": {
      const [projects, myTasks, myTasksInTesting, myBugs] = await Promise.all([
        prisma.project.count({ where: myProjects }),
        prisma.task.count({
          where: { ...inMyProjects, assigneeId: userId, status: { not: "DONE" } },
        }),
        prisma.task.count({ where: { ...inMyProjects, assigneeId: userId, status: "TESTING" } }),
        prisma.bug.count({ where: { ...openBugs, assigneeId: userId } }),
      ]);
      return [
        { label: "My Projects", value: projects, hint: "Projects you are a member of", href: "/projects" },
        { label: "My Open Tasks", value: myTasks, hint: "Assigned to you, not done", href: "/tasks" },
        { label: "In Testing", value: myTasksInTesting, hint: "Your tasks awaiting QA", href: "/tasks" },
        { label: "Bugs Assigned", value: myBugs, hint: "Open bugs assigned to you" },
      ];
    }

    case "TESTER": {
      const [projects, testCases, failedTests, bugs] = await Promise.all([
        prisma.project.count({ where: myProjects }),
        prisma.testCase.count({ where: inMyProjects }),
        prisma.testCase.count({ where: { ...inMyProjects, status: "FAIL" } }),
        prisma.bug.count({ where: openBugs }),
      ]);
      return [
        { label: "My Projects", value: projects, hint: "Projects you are a member of", href: "/projects" },
        { label: "Test Cases", value: testCases, hint: "Across your projects", href: "/testing" },
        { label: "Failed Tests", value: failedTests, hint: "Test cases marked FAIL", href: "/testing" },
        { label: "Open Bugs", value: bugs, hint: "Not yet verified or closed", href: "/bugs" },
      ];
    }

    case "PROJECT_MANAGER": {
      const [projects, requirements, tasks, bugs] = await Promise.all([
        prisma.project.count({ where: myProjects }),
        prisma.requirement.count({ where: inMyProjects }),
        prisma.task.count({ where: { ...inMyProjects, status: { not: "DONE" } } }),
        prisma.bug.count({ where: openBugs }),
      ]);
      return [
        { label: "Total Projects", value: projects, hint: "Projects you are a member of", href: "/projects" },
        { label: "Requirements", value: requirements, hint: "Across your projects", href: "/requirements" },
        { label: "Open Tasks", value: tasks, hint: "Not yet done", href: "/tasks" },
        { label: "Open Bugs", value: bugs, hint: "Not yet verified or closed", href: "/bugs" },
      ];
    }

    default: {
      // FACULTY_CLIENT: read-only overview of progress.
      const [projects, requirements, tasks, doneTasks] = await Promise.all([
        prisma.project.count({ where: myProjects }),
        prisma.requirement.count({ where: inMyProjects }),
        prisma.task.count({ where: inMyProjects }),
        prisma.task.count({ where: { ...inMyProjects, status: "DONE" } }),
      ]);
      return [
        { label: "Projects", value: projects, hint: "Projects you are a member of", href: "/projects" },
        { label: "Requirements", value: requirements, hint: "Across your projects", href: "/requirements" },
        { label: "Total Tasks", value: tasks, hint: "Across your projects" },
        { label: "Completed Tasks", value: doneTasks, hint: "Tasks marked done" },
      ];
    }
  }
}

export default async function DashboardPage() {
  // The (dashboard) layout already redirects unauthenticated requests to /login,
  // so a session is guaranteed here.
  const session = await getServerSession();
  const role = session!.user.role as Role;
  const stats = await getStats(session!.user.id, role);

  return (
    <PageContainer title="Dashboard">
      <div>
        <p className="text-gray-700">Welcome, {session!.user.name}</p>
        <p className="text-sm text-gray-500">Role: {ROLE_LABELS[role]}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const content = (
            <>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-400">{stat.hint}</p>
            </>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              {content}
            </Link>
          ) : (
            <Card key={stat.label}>{content}</Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
