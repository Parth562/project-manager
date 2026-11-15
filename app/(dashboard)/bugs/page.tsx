import Link from "next/link";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDeveloper } from "@/lib/auth/permissions";
import type { Role } from "@prisma/client";

export default async function BugsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const isDevRole = isDeveloper(session.user.role as Role);

  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      _count: { select: { bugs: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <PageContainer title="Bugs">
      <p className="text-sm text-gray-500">
        {isDevRole
          ? "Select a project to view bugs assigned to you."
          : "Select a project to view and manage its bugs."}
      </p>

      {projects.length === 0 ? (
        <Card>
          <p className="text-gray-600">You are not a member of any project.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-xs text-gray-500">
                    {project._count.bugs} bug{project._count.bugs !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  href={`/projects/${project.id}/bugs`}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  View Bugs
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
