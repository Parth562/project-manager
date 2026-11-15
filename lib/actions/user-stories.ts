"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isProjectManager } from "@/lib/auth/permissions";
import { generateUserStory } from "@/lib/ai/generate-user-story";
import { userStorySchema } from "@/lib/validations/user-story";
import type { Role } from "@prisma/client";

const GENERIC_ERROR = "Something went wrong. Please try again.";

async function requirePmAccess(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access.project || !access.isMember) redirect("/projects");
  return access;
}

function requirementDetailPath(projectId: string, requirementId: string) {
  return `/projects/${projectId}/requirements/${requirementId}`;
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

// TC10 — Generate and save a user story with AI
export async function generateAndSaveUserStory(
  projectId: string,
  requirementId: string,
) {
  const { session, role } = await requirePmAccess(projectId);
  if (!isProjectManager(role as Role)) {
    redirect(errorUrl(requirementDetailPath(projectId, requirementId), "Only Project Managers can generate user stories."));
  }

  const requirement = await prisma.requirement.findFirst({
    where: { id: requirementId, projectId },
  });
  if (!requirement) redirect(`/projects/${projectId}/requirements`);

  // Generate via AI (or fallback)
  let generated;
  try {
    generated = await generateUserStory(requirement.title, requirement.description);
  } catch {
    redirect(errorUrl(requirementDetailPath(projectId, requirementId), GENERIC_ERROR));
  }

  try {
    await prisma.userStory.create({
      data: {
        projectId,
        requirementId,
        storyText: generated.storyText,
        acceptanceCriteria: generated.acceptanceCriteria,
        status: "DRAFT",
        isAiGenerated: generated.isAiGenerated,
        createdById: session.user.id,
      },
    });
  } catch {
    redirect(errorUrl(requirementDetailPath(projectId, requirementId), GENERIC_ERROR));
  }

  revalidatePath(requirementDetailPath(projectId, requirementId));
  redirect(requirementDetailPath(projectId, requirementId));
}

// TC11 — Update story text and acceptance criteria
export async function updateUserStory(
  projectId: string,
  userStoryId: string,
  formData: FormData,
) {
  const { role } = await requirePmAccess(projectId);
  if (!isProjectManager(role as Role)) redirect(`/projects/${projectId}`);

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, projectId },
    select: { id: true, requirementId: true },
  });
  if (!story) redirect(`/projects/${projectId}/requirements`);

  const detailPath = requirementDetailPath(projectId, story.requirementId);

  // Collect acceptance criteria: fields named "criteria_0", "criteria_1", …
  const rawCriteria: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("criteria_") && typeof value === "string") {
      rawCriteria.push(value);
    }
  }

  const result = userStorySchema.safeParse({
    storyText: formData.get("storyText"),
    acceptanceCriteria: rawCriteria,
  });

  if (!result.success) {
    redirect(errorUrl(detailPath, result.error.issues[0].message));
  }

  try {
    await prisma.userStory.update({
      where: { id: userStoryId },
      data: {
        storyText: result.data.storyText,
        acceptanceCriteria: result.data.acceptanceCriteria,
      },
    });
  } catch {
    redirect(errorUrl(detailPath, GENERIC_ERROR));
  }

  revalidatePath(detailPath);
  redirect(detailPath);
}

// TC11 — Approve a user story
export async function approveUserStory(
  projectId: string,
  userStoryId: string,
) {
  const { role } = await requirePmAccess(projectId);
  if (!isProjectManager(role as Role)) redirect(`/projects/${projectId}`);

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, projectId },
    select: { id: true, requirementId: true },
  });
  if (!story) redirect(`/projects/${projectId}/requirements`);

  const detailPath = requirementDetailPath(projectId, story.requirementId);

  try {
    await prisma.userStory.update({
      where: { id: userStoryId },
      data: { status: "APPROVED" },
    });
  } catch {
    redirect(errorUrl(detailPath, GENERIC_ERROR));
  }

  revalidatePath(detailPath);
  redirect(detailPath);
}

// TC11 — Reject a user story
export async function rejectUserStory(
  projectId: string,
  userStoryId: string,
) {
  const { role } = await requirePmAccess(projectId);
  if (!isProjectManager(role as Role)) redirect(`/projects/${projectId}`);

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, projectId },
    select: { id: true, requirementId: true },
  });
  if (!story) redirect(`/projects/${projectId}/requirements`);

  const detailPath = requirementDetailPath(projectId, story.requirementId);

  try {
    await prisma.userStory.update({
      where: { id: userStoryId },
      data: { status: "REJECTED" },
    });
  } catch {
    redirect(errorUrl(detailPath, GENERIC_ERROR));
  }

  revalidatePath(detailPath);
  redirect(detailPath);
}

// TC11 — Delete a user story (PM only)
export async function deleteUserStory(projectId: string, userStoryId: string) {
  const { role } = await requirePmAccess(projectId);
  if (!isProjectManager(role as Role)) redirect(`/projects/${projectId}`);

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, projectId },
    select: { id: true, requirementId: true },
  });
  if (!story) redirect(`/projects/${projectId}/requirements`);

  const detailPath = requirementDetailPath(projectId, story.requirementId);

  try {
    await prisma.userStory.delete({ where: { id: userStoryId } });
  } catch {
    redirect(errorUrl(detailPath, GENERIC_ERROR));
  }

  revalidatePath(detailPath);
  redirect(detailPath);
}
