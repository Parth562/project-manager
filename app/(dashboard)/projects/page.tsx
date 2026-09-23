import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { isProjectManager } from "@/lib/auth/permissions";
import { STATUS_LABELS } from "@/lib/validations/project";

export default async function ProjectsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const canCreate = isProjectManager(session.user.role as Role);

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer title="Projects">
      {canCreate && projects.length > 0 && (
        <div className="flex justify-end">
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        </div>
      )}

      {projects.length === 0 ? (
        <Card>
          {canCreate ? (
            <div className="text-center">
              <p className="text-gray-500">No projects yet.</p>
              <p className="mt-1 text-sm text-gray-500">
                Create your first project to get started.
              </p>
              <Link href="/projects/new" className="mt-4 inline-block">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <p className="text-center text-gray-500">
              You are not currently a member of any project.
            </p>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{project.description}</p>
              <dl className="mt-4 space-y-1 text-xs text-gray-500">
                <div>
                  Status:{" "}
                  <span className="font-medium text-gray-700">
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>
                <div>Start: {project.startDate.toLocaleDateString()}</div>
                <div>End: {project.endDate.toLocaleDateString()}</div>
              </dl>
              <Link href={`/projects/${project.id}`} className="mt-4 block">
                <Button className="w-full">View Project</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
