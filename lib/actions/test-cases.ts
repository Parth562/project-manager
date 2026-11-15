"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isTester, isProjectManager } from "@/lib/auth/permissions";
import { testCaseSchema, testCaseExecutionSchema } from "@/lib/validations/test-case";
import type { Role } from "@prisma/client";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function listPath(projectId: string) {
  return `/projects/${projectId}/testing`;
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

async function requireProjectMember(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access.project || !access.isMember) redirect("/projects");
  return access;
}

export async function createTestCase(projectId: string, formData: FormData) {
  const { session, role } = await requireProjectMember(projectId);
  if (!isTester(role as Role) && !isProjectManager(role as Role)) {
    redirect(errorUrl(listPath(projectId), "Only Testers and Project Managers can create test cases."));
  }

  const rawData = {
    title: formData.get("title"),
    steps: formData.get("steps"),
    expectedResult: formData.get("expectedResult"),
    requirementId: formData.get("requirementId") || undefined,
    userStoryId: formData.get("userStoryId") || undefined,
  };

  const result = testCaseSchema.safeParse(rawData);
  if (!result.success) {
    redirect(errorUrl(`${listPath(projectId)}/new`, result.error.issues[0].message));
  }

  const { title, steps, expectedResult, requirementId, userStoryId } = result.data;

  // Verify linked items belong to this project
  if (requirementId) {
    const req = await prisma.requirement.findFirst({ where: { id: requirementId, projectId } });
    if (!req) redirect(errorUrl(`${listPath(projectId)}/new`, "Selected requirement does not belong to this project."));
  }
  if (userStoryId) {
    const story = await prisma.userStory.findFirst({ where: { id: userStoryId, projectId } });
    if (!story) redirect(errorUrl(`${listPath(projectId)}/new`, "Selected user story does not belong to this project."));
  }

  try {
    await prisma.testCase.create({
      data: {
        projectId,
        title,
        steps,
        expectedResult,
        requirementId: requirementId || null,
        userStoryId: userStoryId || null,
        createdById: session.user.id,
        status: "NOT_EXECUTED",
      },
    });
  } catch {
    redirect(errorUrl(`${listPath(projectId)}/new`, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}

export async function executeTestCase(
  projectId: string,
  testCaseId: string,
  formData: FormData,
) {
  const { role } = await requireProjectMember(projectId);
  if (!isTester(role as Role)) {
    redirect(errorUrl(listPath(projectId), "Only Testers can execute test cases."));
  }

  const testCase = await prisma.testCase.findFirst({
    where: { id: testCaseId, projectId },
    select: { id: true },
  });
  if (!testCase) redirect(listPath(projectId));

  const result = testCaseExecutionSchema.safeParse({
    actualResult: formData.get("actualResult"),
    status: formData.get("status"),
  });
  if (!result.success) {
    redirect(errorUrl(listPath(projectId), result.error.issues[0].message));
  }

  try {
    await prisma.testCase.update({
      where: { id: testCaseId },
      data: {
        actualResult: result.data.actualResult,
        status: result.data.status,
      },
    });
  } catch {
    redirect(errorUrl(listPath(projectId), GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}

export async function deleteTestCase(projectId: string, testCaseId: string) {
  const { role } = await requireProjectMember(projectId);
  if (!isTester(role as Role) && !isProjectManager(role as Role)) {
    redirect(listPath(projectId));
  }

  const testCase = await prisma.testCase.findFirst({
    where: { id: testCaseId, projectId },
    select: { id: true },
  });
  if (!testCase) redirect(listPath(projectId));

  try {
    await prisma.testCase.delete({ where: { id: testCaseId } });
  } catch {
    redirect(errorUrl(listPath(projectId), GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}
