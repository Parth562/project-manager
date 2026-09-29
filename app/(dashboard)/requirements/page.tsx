import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";

// Requirements are project-scoped, so this page only lets the user pick
// one of their projects; the list itself lives under /projects/[projectId].
export default async function RequirementsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: session.user.id } } },
    select: { id: true, name: true, _count: { select: { requirements: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <PageContainer title="Requirements">
      {projects.length === 0 ? (
        <Card>
          <p className="text-gray-600">
            You are not a member of any project yet. Requirements are managed per
            project.
          </p>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-600">Select a project to view its requirements.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <h2 className="text-base font-semibold text-gray-900">{project.name}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {project._count.requirements} requirement
                  {project._count.requirements === 1 ? "" : "s"}
                </p>
                <Link href={`/projects/${project.id}/requirements`} className="mt-4 inline-block">
                  <Button>View Requirements</Button>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
