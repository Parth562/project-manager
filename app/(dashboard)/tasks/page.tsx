import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isProjectManager, isDeveloper } from "@/lib/auth/permissions";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/validations/task";
import type { Role } from "@prisma/client";

export default async function TasksPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const role = session.user.role as Role;
  const isPm = isProjectManager(role);
  const isDev = isDeveloper(role);

  // Show tasks relevant to the user
  const tasks = await prisma.task.findMany({
    where: isDev
      ? { assigneeId: session.user.id }
      : isPm
        ? {
            project: {
              members: { some: { userId: session.user.id } },
            },
          }
        : { assigneeId: session.user.id },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    TESTING: "bg-yellow-100 text-yellow-800",
    DONE: "bg-green-100 text-green-800",
  };

  return (
    <PageContainer title="Tasks">
      <p className="text-sm text-gray-500">
        {isDev ? "Tasks assigned to you across all projects." : "All tasks across your projects."}
      </p>

      {tasks.length === 0 ? (
        <Card>
          <p className="text-gray-600">No tasks found.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Project</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  {isPm && <th className="py-2">Assignee</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">{task.title}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/projects/${task.project.id}/tasks`}
                        className="text-gray-600 hover:underline"
                      >
                        {task.project.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status] ?? ""}`}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    {isPm && (
                      <td className="py-2 text-gray-600">
                        {task.assignee?.name ?? "—"}
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
