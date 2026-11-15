import Link from "next/link";
import { notFound } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isProjectManager, isDeveloper } from "@/lib/auth/permissions";
import { updateTaskStatus } from "@/lib/actions/tasks";
import SubmitButton from "@/components/ui/SubmitButton";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, taskStatusValues } from "@/lib/validations/task";
import type { Role, TaskStatus } from "@prisma/client";

export default async function KanbanPage({
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
  const isDev = isDeveloper(role as Role);

  // PM sees all tasks; developer sees only assigned tasks
  const tasks = await prisma.task.findMany({
    where: isDev
      ? { projectId, assigneeId: session.user.id }
      : { projectId },
    include: {
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: "TODO", label: "To Do", color: "bg-gray-50 border-gray-200" },
    { status: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50 border-blue-200" },
    { status: "TESTING", label: "Testing", color: "bg-yellow-50 border-yellow-200" },
    { status: "DONE", label: "Done", color: "bg-green-50 border-green-200" },
  ];

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  // Status transition options per role
  function getTransitions(currentStatus: TaskStatus, taskAssigneeId: string | null): TaskStatus[] {
    if (isPm) {
      return taskStatusValues.filter((s) => s !== currentStatus) as TaskStatus[];
    }
    if (isDev && taskAssigneeId === session.user.id) {
      const flow: TaskStatus[] = ["TODO", "IN_PROGRESS", "TESTING", "DONE"];
      const idx = flow.indexOf(currentStatus);
      return idx < flow.length - 1 ? [flow[idx + 1]] : [];
    }
    return [];
  }

  return (
    <PageContainer title={`${project.name} — Kanban Board`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}/tasks`}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          ← Back to Tasks
        </Link>
        {isDev && (
          <p className="text-sm text-gray-500">Showing only your assigned tasks.</p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map(({ status, label, color }) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className={`rounded-lg border p-4 ${color}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">{label}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm">
                  {columnTasks.length}
                </span>
              </div>

              {columnTasks.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No tasks here.</p>
              ) : (
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const transitions = getTransitions(task.status, task.assigneeId);
                    return (
                      <div
                        key={task.id}
                        className="rounded-md border border-white bg-white p-3 shadow-sm"
                      >
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${priorityColors[task.priority] ?? ""}`}
                          >
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          {task.assignee && (
                            <span className="text-xs text-gray-500">
                              👤 {task.assignee.name}
                            </span>
                          )}
                        </div>

                        {transitions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {transitions.map((nextStatus) => (
                              <form
                                key={nextStatus}
                                action={updateTaskStatus.bind(null, projectId, task.id)}
                              >
                                <input type="hidden" name="status" value={nextStatus} />
                                <SubmitButton
                                  pendingText="Moving…"
                                  className="w-full text-xs py-1 px-2 bg-gray-800 hover:bg-gray-700"
                                >
                                  → {TASK_STATUS_LABELS[nextStatus]}
                                </SubmitButton>
                              </form>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
