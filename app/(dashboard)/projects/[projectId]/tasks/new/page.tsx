import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import SubmitButton from "@/components/ui/SubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isProjectManager } from "@/lib/auth/permissions";
import { createTask } from "@/lib/actions/tasks";
import {
  taskPriorityValues,
  taskStatusValues,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/validations/task";
import type { Role } from "@prisma/client";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export default async function NewTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { projectId } = await params;
  const { error } = await searchParams;

  const { project, isMember, role } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;
  if (!isProjectManager(role as Role)) redirect(`/projects/${projectId}/tasks`);

  const [developers, requirements, userStories] = await Promise.all([
    // Developers for assignment dropdown
    prisma.projectMember.findMany({
      where: {
        projectId,
        user: { role: "DEVELOPER" },
      },
      include: { user: { select: { id: true, name: true } } },
    }),
    // Requirements for linking
    prisma.requirement.findMany({
      where: { projectId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    // Only approved user stories can be linked
    prisma.userStory.findMany({
      where: { projectId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, storyText: true },
    }),
  ]);

  return (
    <PageContainer title="New Task">
      <Link
        href={`/projects/${projectId}/tasks`}
        className="text-sm font-medium text-gray-900 hover:underline"
      >
        ← Back to Tasks
      </Link>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Card>
        <form action={createTask.bind(null, projectId)} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority <span className="text-red-500">*</span>
              </label>
              <select id="priority" name="priority" defaultValue="MEDIUM" className={`mt-1 ${inputClass}`}>
                {taskPriorityValues.map((v) => (
                  <option key={v} value={v}>{TASK_PRIORITY_LABELS[v]}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select id="status" name="status" defaultValue="TODO" className={`mt-1 ${inputClass}`}>
                {taskStatusValues.map((v) => (
                  <option key={v} value={v}>{TASK_STATUS_LABELS[v]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input id="dueDate" name="dueDate" type="date" className={`mt-1 ${inputClass}`} />
          </div>

          <div>
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
              Assign to Developer
            </label>
            {developers.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">
                No developers are members of this project yet. Add developers via{" "}
                <Link href={`/projects/${projectId}/team`} className="font-medium underline">
                  Manage Team
                </Link>
                .
              </p>
            ) : (
              <select id="assigneeId" name="assigneeId" className={`mt-1 ${inputClass}`}>
                <option value="">— Unassigned —</option>
                {developers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="requirementId" className="block text-sm font-medium text-gray-700">
              Link Requirement (optional)
            </label>
            <select id="requirementId" name="requirementId" className={`mt-1 ${inputClass}`}>
              <option value="">— None —</option>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="userStoryId" className="block text-sm font-medium text-gray-700">
              Link Approved User Story (optional)
            </label>
            {userStories.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">
                No approved user stories in this project yet.
              </p>
            ) : (
              <select id="userStoryId" name="userStoryId" className={`mt-1 ${inputClass}`}>
                <option value="">— None —</option>
                {userStories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storyText.length > 80 ? s.storyText.slice(0, 80) + "…" : s.storyText}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-2">
            <SubmitButton pendingText="Creating…">Create Task</SubmitButton>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
