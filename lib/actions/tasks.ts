"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isProjectManager, isDeveloper } from "@/lib/auth/permissions";
import { taskSchema, taskStatusUpdateSchema } from "@/lib/validations/task";
import type { Role } from "@prisma/client";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function listPath(projectId: string) {
  return `/projects/${projectId}/tasks`;
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

async function requireProjectMember(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access.project || !access.isMember) redirect("/projects");
  return access;
}

export async function createTask(projectId: string, formData: FormData) {
  const { session, role } = await requireProjectMember(projectId);
  if (!isProjectManager(role as Role)) {
    redirect(errorUrl(listPath(projectId), "Only Project Managers can create tasks."));
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: formData.get("status") || "TODO",
    dueDate: formData.get("dueDate") || undefined,
    requirementId: formData.get("requirementId") || undefined,
    userStoryId: formData.get("userStoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  };

  const result = taskSchema.safeParse(rawData);
  if (!result.success) {
    redirect(errorUrl(`${listPath(projectId)}/new`, result.error.issues[0].message));
  }

  const { title, description, priority, status, dueDate, requirementId, userStoryId, assigneeId } =
    result.data;

  // Validate assignee is a DEVELOPER who is a project member
  if (assigneeId) {
    const memberRecord = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
      include: { user: { select: { role: true } } },
    });
    if (!memberRecord) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Assignee is not a member of this project."));
    }
    if (!isDeveloper(memberRecord.user.role as Role)) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Assignee must have the Developer role."));
    }
  }

  // Validate requirement belongs to project
  if (requirementId) {
    const req = await prisma.requirement.findFirst({
      where: { id: requirementId, projectId },
    });
    if (!req) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Selected requirement does not belong to this project."));
    }
  }

  // Validate user story is APPROVED and belongs to project
  if (userStoryId) {
    const story = await prisma.userStory.findFirst({
      where: { id: userStoryId, projectId },
    });
    if (!story) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Selected user story does not belong to this project."));
    }
    if (story.status !== "APPROVED") {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Only approved user stories can be linked to tasks."));
    }
  }

  try {
    await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        requirementId: requirementId || null,
        userStoryId: userStoryId || null,
        assigneeId: assigneeId || null,
        createdById: session.user.id,
      },
    });
  } catch {
    redirect(errorUrl(`${listPath(projectId)}/new`, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  revalidatePath(`/projects/${projectId}/kanban`);
  redirect(listPath(projectId));
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  formData: FormData,
) {
  const { session, role } = await requireProjectMember(projectId);

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, assigneeId: true },
  });
  if (!task) redirect(listPath(projectId));

  // PM can update any task; developers can only update their own
  const isPm = isProjectManager(role as Role);
  const isAssignedDev =
    isDeveloper(role as Role) && task.assigneeId === session.user.id;
  if (!isPm && !isAssignedDev) {
    redirect(errorUrl(listPath(projectId), "You do not have permission to update this task."));
  }

  const result = taskStatusUpdateSchema.safeParse({ status: formData.get("status") });
  if (!result.success) {
    redirect(errorUrl(listPath(projectId), result.error.issues[0].message));
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: result.data.status },
    });
  } catch {
    redirect(errorUrl(listPath(projectId), GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  revalidatePath(`/projects/${projectId}/kanban`);
  redirect(`/projects/${projectId}/kanban`);
}

export async function deleteTask(projectId: string, taskId: string) {
  const { role } = await requireProjectMember(projectId);
  if (!isProjectManager(role as Role)) redirect(listPath(projectId));

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });
  if (!task) redirect(listPath(projectId));

  try {
    await prisma.task.delete({ where: { id: taskId } });
  } catch {
    redirect(errorUrl(listPath(projectId), GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  revalidatePath(`/projects/${projectId}/kanban`);
  redirect(listPath(projectId));
}
