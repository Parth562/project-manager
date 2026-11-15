import { notFound, redirect } from "next/navigation";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isProjectManager } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import AccessDenied from "@/components/requirements/AccessDenied";
import UserStoryEditForm from "@/components/user-stories/UserStoryEditForm";
import type { Role } from "@prisma/client";

export default async function EditUserStoryPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    requirementId: string;
    userStoryId: string;
  }>;
}) {
  const { projectId, requirementId, userStoryId } = await params;

  const { project, isMember, role } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;
  if (!isProjectManager(role as Role)) {
    redirect(`/projects/${projectId}/requirements/${requirementId}`);
  }

  const story = await prisma.userStory.findFirst({
    where: { id: userStoryId, projectId, requirementId },
    select: {
      id: true,
      storyText: true,
      acceptanceCriteria: true,
      status: true,
    },
  });
  if (!story) notFound();

  return (
    <UserStoryEditForm
      projectId={projectId}
      userStoryId={userStoryId}
      initialStoryText={story.storyText}
      initialCriteria={story.acceptanceCriteria}
      backHref={`/projects/${projectId}/requirements/${requirementId}`}
    />
  );
}
