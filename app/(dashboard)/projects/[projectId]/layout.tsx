import { Suspense, type ReactNode } from "react";
import ProjectNav, { ProjectNavSkeleton } from "@/components/projects/ProjectNav";
import { getProjectAccess } from "@/lib/auth/project-access";

// Shared layout for every project sub-page. On client navigation between tabs
// (Tasks -> Kanban -> Bugs ...) Next.js keeps this layout mounted and only
// re-renders the page segment, so the nav never re-fetches.
async function ProjectNavLoader({ projectId }: { projectId: string }) {
  const { project, isMember, isCreator } = await getProjectAccess(projectId);
  if (!project || !isMember) return null;
  return <ProjectNav projectId={project.id} projectName={project.name} isCreator={isCreator} />;
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <>
      <Suspense fallback={<ProjectNavSkeleton />}>
        <ProjectNavLoader projectId={projectId} />
      </Suspense>
      {children}
    </>
  );
}
