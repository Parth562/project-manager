import Link from "next/link";
import { notFound } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ui/ConfirmSubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isProjectManager, isDeveloper } from "@/lib/auth/permissions";
import { deleteTask } from "@/lib/actions/tasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/validations/task";
import type { Role } from "@prisma/client";

export default async function ProjectTasksPage({
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

  const tasks = await prisma.task.findMany({
    where: isDev
      ? { projectId, assigneeId: session.user.id }
      : { projectId },
    include: {
      assignee: { select: { name: true } },
      requirement: { select: { title: true } },
      userStory: { select: { storyText: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    TESTING: "bg-yellow-100 text-yellow-800",
    DONE: "bg-green-100 text-green-800",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  return (
    <PageContainer title="Tasks">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          ← Back to Project
        </Link>
        <div className="flex gap-2">
          {isPm && (
            <>
              <Link href={`/projects/${projectId}/tasks/new`}>
                <Button>+ New Task</Button>
              </Link>
              <Link href={`/projects/${projectId}/kanban`}>
                <Button className="bg-indigo-700 hover:bg-indigo-600">Kanban Board</Button>
              </Link>
            </>
          )}
          {isDev && (
            <Link href={`/projects/${projectId}/kanban`}>
              <Button className="bg-indigo-700 hover:bg-indigo-600">Kanban Board</Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {tasks.length === 0 ? (
        <Card>
          <p className="font-medium text-gray-900">No tasks found.</p>
          {isPm && (
            <p className="mt-1 text-sm text-gray-600">
              Create the first task using the button above.
            </p>
          )}
          {isDev && (
            <p className="mt-1 text-sm text-gray-600">
              No tasks have been assigned to you yet.
            </p>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Assigned To</th>
                  <th className="py-2 pr-4">Due Date</th>
                  {isPm && <th className="py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      {task.requirement && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Req: {task.requirement.title}
                        </p>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority] ?? ""}`}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status] ?? ""}`}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {task.assignee?.name ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {task.dueDate ? task.dueDate.toLocaleDateString() : "—"}
                    </td>
                    {isPm && (
                      <td className="py-2">
                        <form action={deleteTask.bind(null, projectId, task.id)}>
                          <ConfirmSubmitButton
                            confirmMessage={`Delete task "${task.title}"?`}
                            className="bg-red-600 hover:bg-red-500 text-xs py-1 px-2"
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
