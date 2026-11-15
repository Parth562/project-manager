"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isTester, isProjectManager, isDeveloper } from "@/lib/auth/permissions";
import { bugSchema, bugStatusUpdateSchema } from "@/lib/validations/bug";
import type { Role, BugStatus } from "@prisma/client";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function listPath(projectId: string) {
  return `/projects/${projectId}/bugs`;
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

async function requireProjectMember(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access.project || !access.isMember) redirect("/projects");
  return access;
}

export async function createBug(projectId: string, formData: FormData) {
  const { session, role } = await requireProjectMember(projectId);
  if (!isTester(role as Role) && !isProjectManager(role as Role)) {
    redirect(errorUrl(listPath(projectId), "Only Testers and Project Managers can report bugs."));
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    priority: formData.get("priority"),
    testCaseId: formData.get("testCaseId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  };

  const result = bugSchema.safeParse(rawData);
  if (!result.success) {
    const testCaseId = typeof rawData.testCaseId === "string" ? rawData.testCaseId : "";
    const backUrl = testCaseId
      ? `${listPath(projectId)}/new?testCaseId=${testCaseId}`
      : `${listPath(projectId)}/new`;
    redirect(errorUrl(backUrl, result.error.issues[0].message));
  }

  const { title, description, severity, priority, testCaseId, assigneeId } = result.data;

  // Verify test case belongs to this project
  if (testCaseId) {
    const tc = await prisma.testCase.findFirst({ where: { id: testCaseId, projectId } });
    if (!tc) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Test case does not belong to this project."));
    }
  }

  // Validate assignee is a DEVELOPER who is a project member
  if (assigneeId) {
    const memberRecord = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
      include: { user: { select: { role: true } } },
    });
    if (!memberRecord || !isDeveloper(memberRecord.user.role as Role)) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Assignee must be a Developer in this project."));
    }
  }

  try {
    await prisma.bug.create({
      data: {
        projectId,
        title,
        description,
        severity,
        priority,
        testCaseId: testCaseId || null,
        assigneeId: assigneeId || null,
        reporterId: session.user.id,
        status: "OPEN",
      },
    });
  } catch {
    redirect(errorUrl(`${listPath(projectId)}/new`, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}

// Bug lifecycle transition rules (server-enforced)
function getAllowedTransitions(role: Role, bug: { status: BugStatus; assigneeId: string | null }, userId: string): BugStatus[] {
  if (isProjectManager(role)) {
    // PM can view all, but let's keep transitions consistent with the lifecycle
    return ["OPEN", "IN_PROGRESS", "FIXED", "VERIFIED", "CLOSED"];
  }
  if (isDeveloper(role) && bug.assigneeId === userId) {
    if (bug.status === "OPEN") return ["IN_PROGRESS"];
    if (bug.status === "IN_PROGRESS") return ["FIXED"];
    return [];
  }
  if (isTester(role)) {
    if (bug.status === "FIXED") return ["VERIFIED"];
    if (bug.status === "VERIFIED") return ["CLOSED"];
    return [];
  }
  return [];
}

export async function updateBugStatus(
  projectId: string,
  bugId: string,
  formData: FormData,
) {
  const { session, role } = await requireProjectMember(projectId);

  const bug = await prisma.bug.findFirst({
    where: { id: bugId, projectId },
    select: { id: true, status: true, assigneeId: true },
  });
  if (!bug) redirect(listPath(projectId));

  const result = bugStatusUpdateSchema.safeParse({ status: formData.get("status") });
  if (!result.success) {
    redirect(errorUrl(listPath(projectId), result.error.issues[0].message));
  }

  const allowedTransitions = getAllowedTransitions(role as Role, bug, session.user.id);
  if (!allowedTransitions.includes(result.data.status as BugStatus)) {
    redirect(errorUrl(listPath(projectId), "You are not permitted to make this status transition."));
  }

  try {
    await prisma.bug.update({
      where: { id: bugId },
      data: { status: result.data.status },
    });
  } catch {
    redirect(errorUrl(listPath(projectId), GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}

export async function assignBug(
  projectId: string,
  bugId: string,
  formData: FormData,
) {
  const { role } = await requireProjectMember(projectId);
  if (!isProjectManager(role as Role)) {
    redirect(errorUrl(listPath(projectId), "Only Project Managers can assign bugs."));
  }

  const bug = await prisma.bug.findFirst({
    where: { id: bugId, projectId },
    select: { id: true },
  });
  if (!bug) redirect(listPath(projectId));

  const assigneeId = formData.get("assigneeId");
  if (typeof assigneeId !== "string" || assigneeId.length === 0) {
    redirect(errorUrl(listPath(projectId), "Select a developer to assign."));
  }

  const memberRecord = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    include: { user: { select: { role: true } } },
  });
  if (!memberRecord || !isDeveloper(memberRecord.user.role as Role)) {
    redirect(errorUrl(listPath(projectId), "Assignee must be a Developer in this project."));
  }

  try {
    await prisma.bug.update({
      where: { id: bugId },
      data: { assigneeId },
    });
  } catch {
    redirect(errorUrl(listPath(projectId), GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}
