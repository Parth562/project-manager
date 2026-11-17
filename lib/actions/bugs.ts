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

// Picks a developer for a bug when the reporter leaves "Assign to" empty:
// 1. The developer who owns a task for the same user story / requirement as the
//    linked test case (they built the feature that failed).
// 2. Otherwise the project developer with the fewest open bugs.
// Returns null when the project has no developers.
async function pickAutoAssignee(
  projectId: string,
  testCase: { requirementId: string | null; userStoryId: string | null } | null,
): Promise<string | null> {
  const developerIds = (
    await prisma.projectMember.findMany({
      where: { projectId, user: { role: "DEVELOPER" } },
      select: { userId: true },
    })
  ).map((member) => member.userId);
  if (developerIds.length === 0) return null;

  const featureLinks = [
    testCase?.userStoryId ? { userStoryId: testCase.userStoryId } : null,
    testCase?.requirementId ? { requirementId: testCase.requirementId } : null,
  ].filter((link) => link !== null);

  if (featureLinks.length > 0) {
    const tasks = await prisma.task.findMany({
      where: { projectId, assigneeId: { in: developerIds }, OR: featureLinks },
      select: { assigneeId: true, userStoryId: true },
      orderBy: { createdAt: "desc" },
    });
    // Prefer a task on the exact user story over one on the broader requirement.
    const owner =
      tasks.find((task) => testCase?.userStoryId && task.userStoryId === testCase.userStoryId) ??
      tasks[0];
    if (owner?.assigneeId) return owner.assigneeId;
  }

  const openBugCounts = await prisma.bug.groupBy({
    by: ["assigneeId"],
    where: {
      projectId,
      assigneeId: { in: developerIds },
      status: { in: ["OPEN", "IN_PROGRESS", "FIXED"] },
    },
    _count: { _all: true },
  });
  const load = new Map(openBugCounts.map((row) => [row.assigneeId, row._count._all]));
  return developerIds.reduce((best, id) =>
    (load.get(id) ?? 0) < (load.get(best) ?? 0) ? id : best
  );
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

  const { title, description, severity, priority, testCaseId } = result.data;
  let assigneeId = result.data.assigneeId;

  // Verify test case belongs to this project
  let linkedTestCase: { requirementId: string | null; userStoryId: string | null } | null = null;
  if (testCaseId) {
    linkedTestCase = await prisma.testCase.findFirst({
      where: { id: testCaseId, projectId },
      select: { requirementId: true, userStoryId: true },
    });
    if (!linkedTestCase) {
      redirect(errorUrl(`${listPath(projectId)}/new`, "Test case does not belong to this project."));
    }
  }

  // No developer chosen: auto-assign one (see pickAutoAssignee).
  if (!assigneeId) {
    assigneeId = (await pickAutoAssignee(projectId, linkedTestCase)) ?? undefined;
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
