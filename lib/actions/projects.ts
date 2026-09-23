"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ProjectStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { isProjectManager } from "@/lib/auth/permissions";
import { projectSchema } from "@/lib/validations/project";

async function requireProjectManager() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!isProjectManager(session.user.role as Role)) redirect("/projects");
  return session;
}

// Only the project's creator (always a Project Manager) may manage it.
async function requireProjectCreator(projectId: string) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.createdById !== session.user.id) {
    redirect("/projects");
  }

  return { session, project };
}

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });
}

export async function createProject(formData: FormData) {
  const session = await requireProjectManager();

  const result = parseProjectForm(formData);
  if (!result.success) {
    redirect(`/projects/new?error=${encodeURIComponent(result.error.issues[0].message)}`);
  }

  const project = await prisma.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      status: result.data.status as ProjectStatus,
      startDate: new Date(result.data.startDate),
      endDate: new Date(result.data.endDate),
      createdById: session.user.id,
      members: { create: { userId: session.user.id } },
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  await requireProjectCreator(projectId);

  const result = parseProjectForm(formData);
  if (!result.success) {
    redirect(
      `/projects/${projectId}/edit?error=${encodeURIComponent(result.error.issues[0].message)}`
    );
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: result.data.name,
      description: result.data.description,
      status: result.data.status as ProjectStatus,
      startDate: new Date(result.data.startDate),
      endDate: new Date(result.data.endDate),
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await requireProjectCreator(projectId);

  // ProjectMember rows cascade-delete with the project (see schema); no User rows are touched.
  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function addProjectMember(projectId: string, formData: FormData) {
  await requireProjectCreator(projectId);

  const userId = formData.get("userId");
  if (typeof userId !== "string" || userId.length === 0) {
    redirect(
      `/projects/${projectId}/team?error=${encodeURIComponent("Select a user to add.")}`
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    redirect(
      `/projects/${projectId}/team?error=${encodeURIComponent("Selected user was not found.")}`
    );
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) {
    redirect(
      `/projects/${projectId}/team?error=${encodeURIComponent(
        "This user is already a member of the project."
      )}`
    );
  }

  await prisma.projectMember.create({ data: { projectId, userId } });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/team`);
}

export async function removeProjectMember(projectId: string, memberUserId: string) {
  const { project } = await requireProjectCreator(projectId);

  if (memberUserId === project.createdById) {
    redirect(
      `/projects/${projectId}/team?error=${encodeURIComponent(
        "The project creator cannot be removed from this project."
      )}`
    );
  }

  await prisma.projectMember.deleteMany({ where: { projectId, userId: memberUserId } });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/team`);
}
