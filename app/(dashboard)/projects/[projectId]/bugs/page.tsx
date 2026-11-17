import Link from "next/link";
import { notFound } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SubmitButton from "@/components/ui/SubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isTester, isProjectManager, isDeveloper } from "@/lib/auth/permissions";
import { updateBugStatus, assignBug } from "@/lib/actions/bugs";
import {
  BUG_STATUS_LABELS,
  BUG_SEVERITY_LABELS,
  BUG_PRIORITY_LABELS,
} from "@/lib/validations/bug";
import type { Role, BugStatus } from "@prisma/client";

export default async function ProjectBugsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { projectId } = await params;
  const { error } = await searchParams;

  const { project, isMember, role, session } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;

  const isPm = isProjectManager(role as Role);
  const isTesterRole = isTester(role as Role);
  const isDevRole = isDeveloper(role as Role);

  const [bugs, developers] = await Promise.all([
    prisma.bug.findMany({
      where: isDevRole
        ? { projectId, assigneeId: session.user.id }
        : { projectId },
      include: {
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
        testCase: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Developers available for assignment (PM feature)
    isPm
      ? prisma.projectMember.findMany({
          where: { projectId, user: { role: "DEVELOPER" } },
          include: { user: { select: { id: true, name: true } } },
        })
      : [],
  ]);

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    FIXED: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-purple-100 text-purple-800",
    CLOSED: "bg-green-100 text-green-800",
  };

  const severityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  // Allowed next statuses for each role + current status
  function getNextStatuses(bug: { status: BugStatus; assigneeId: string | null }): BugStatus[] {
    if (isPm) return [];  // PM uses assign; can observe lifecycle
    if (isDevRole && bug.assigneeId === session.user.id) {
      if (bug.status === "OPEN") return ["IN_PROGRESS"];
      if (bug.status === "IN_PROGRESS") return ["FIXED"];
      return [];
    }
    if (isTesterRole) {
      if (bug.status === "FIXED") return ["VERIFIED"];
      if (bug.status === "VERIFIED") return ["CLOSED"];
      return [];
    }
    return [];
  }

  return (
    <PageContainer title="Bugs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          ← Back to Project
        </Link>
        {(isTesterRole || isPm) && (
          <Link href={`/projects/${projectId}/bugs/new`}>
            <Button>+ Report Bug</Button>
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {bugs.length === 0 ? (
        <Card>
          <p className="font-medium text-gray-900">No bugs reported.</p>
          {isDevRole && (
            <p className="mt-1 text-sm text-gray-600">No bugs are assigned to you.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => {
            const nextStatuses = getNextStatuses(bug);
            return (
              <Card key={bug.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{bug.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[bug.status] ?? ""}`}
                      >
                        {BUG_STATUS_LABELS[bug.status]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[bug.severity] ?? ""}`}
                      >
                        {BUG_SEVERITY_LABELS[bug.severity]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Reported by {bug.reporter.name} · {bug.createdAt.toLocaleDateString()}
                      {bug.testCase && ` · Test: ${bug.testCase.title}`}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-700">{bug.description}</p>

                <dl className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  <div>
                    <dt className="font-medium uppercase">Severity</dt>
                    <dd>{BUG_SEVERITY_LABELS[bug.severity]}</dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase">Priority</dt>
                    <dd>{BUG_PRIORITY_LABELS[bug.priority]}</dd>
                  </div>
                  <div>
                    <dt className="font-medium uppercase">Assigned To</dt>
                    <dd>{bug.assignee?.name ?? "Unassigned"}</dd>
                  </div>
                </dl>

                {/* Developer status transitions */}
                {nextStatuses.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    {nextStatuses.map((ns) => (
                      <form
                        key={ns}
                        action={updateBugStatus.bind(null, projectId, bug.id)}
                      >
                        <input type="hidden" name="status" value={ns} />
                        <SubmitButton
                          pendingText="Updating…"
                          className={
                            ns === "IN_PROGRESS"
                              ? "bg-blue-700 hover:bg-blue-600"
                              : ns === "FIXED"
                                ? "bg-yellow-600 hover:bg-yellow-500"
                                : ns === "VERIFIED"
                                  ? "bg-purple-700 hover:bg-purple-600"
                                  : "bg-green-700 hover:bg-green-600"
                          }
                        >
                          Mark as {BUG_STATUS_LABELS[ns]}
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                )}

                {/* PM assign bug */}
                {isPm && developers.length > 0 && (
                  <form
                    action={assignBug.bind(null, projectId, bug.id)}
                    className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Assign to Developer
                      </label>
                      <select
                        name="assigneeId"
                        defaultValue={bug.assigneeId ?? ""}
                        className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
                      >
                        <option value="">— Unassigned —</option>
                        {developers.map((m) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <SubmitButton pendingText="Assigning…">Assign</SubmitButton>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
