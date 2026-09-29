"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import {
  canManageRequirements,
  canUpdateRequirementStatus,
} from "@/lib/auth/requirement-permissions";
import {
  requirementSchema,
  requirementStatusSchema,
} from "@/lib/validations/requirement";

const GENERIC_ERROR = "Something went wrong. Please try again.";

const listPath = (projectId: string) => `/projects/${projectId}/requirements`;
const errorUrl = (path: string, message: string) =>
  `${path}?error=${encodeURIComponent(message)}`;

// Every action re-checks authentication, project existence, membership and
// (for existing requirements) that the requirement belongs to the project,
// using the database — never role/membership data from the client.
async function requireRequirementAccess(projectId: string, requirementId?: string) {
  const access = await getProjectAccess(projectId);
  if (!access.project || !access.isMember) redirect("/projects");

  if (!requirementId) return { ...access, requirement: null };

  const requirement = await prisma.requirement.findFirst({
    where: { id: requirementId, projectId },
    select: { id: true },
  });
  if (!requirement) redirect(listPath(projectId));

  return { ...access, requirement };
}

function parseRequirementForm(formData: FormData) {
  return requirementSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  });
}

export async function createRequirement(projectId: string, formData: FormData) {
  const { session, role, isCreator } = await requireRequirementAccess(projectId);
  if (!canManageRequirements(role, isCreator)) redirect(listPath(projectId));

  const result = parseRequirementForm(formData);
  if (!result.success) {
    redirect(errorUrl(`${listPath(projectId)}/new`, result.error.issues[0].message));
  }

  let requirementId: string;
  try {
    const requirement = await prisma.requirement.create({
      data: { ...result.data, projectId, createdById: session.user.id },
    });
    requirementId = requirement.id;
  } catch {
    redirect(errorUrl(`${listPath(projectId)}/new`, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(`${listPath(projectId)}/${requirementId}`);
}

export async function updateRequirement(
  projectId: string,
  requirementId: string,
  formData: FormData,
) {
  const { role, isCreator } = await requireRequirementAccess(projectId, requirementId);
  const detailPath = `${listPath(projectId)}/${requirementId}`;
  if (!canManageRequirements(role, isCreator)) redirect(detailPath);

  const result = parseRequirementForm(formData);
  if (!result.success) {
    redirect(errorUrl(`${detailPath}/edit`, result.error.issues[0].message));
  }

  try {
    // Only editable fields are written; id, projectId, createdById and
    // createdAt can never change. updatedAt is maintained by Prisma.
    await prisma.requirement.update({
      where: { id: requirementId },
      data: result.data,
    });
  } catch {
    redirect(errorUrl(`${detailPath}/edit`, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  revalidatePath(detailPath);
  redirect(detailPath);
}

export async function updateRequirementStatus(
  projectId: string,
  requirementId: string,
  formData: FormData,
) {
  const { role, isMember, isCreator } = await requireRequirementAccess(
    projectId,
    requirementId,
  );
  const detailPath = `${listPath(projectId)}/${requirementId}`;
  if (!canUpdateRequirementStatus(role, isMember, isCreator)) redirect(detailPath);

  const result = requirementStatusSchema.safeParse({ status: formData.get("status") });
  if (!result.success) {
    redirect(errorUrl(detailPath, result.error.issues[0].message));
  }

  try {
    await prisma.requirement.update({
      where: { id: requirementId },
      data: { status: result.data.status },
    });
  } catch {
    redirect(errorUrl(detailPath, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  revalidatePath(detailPath);
  redirect(detailPath);
}

export async function deleteRequirement(projectId: string, requirementId: string) {
  const { role, isCreator } = await requireRequirementAccess(projectId, requirementId);
  const detailPath = `${listPath(projectId)}/${requirementId}`;
  if (!canManageRequirements(role, isCreator)) redirect(detailPath);

  try {
    await prisma.requirement.delete({ where: { id: requirementId } });
  } catch {
    redirect(errorUrl(detailPath, GENERIC_ERROR));
  }

  revalidatePath(listPath(projectId));
  redirect(listPath(projectId));
}
