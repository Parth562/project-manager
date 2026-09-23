import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { STATUS_LABELS } from "@/lib/validations/project";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: true,
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
    },
  });

  if (!project) notFound();

  const isMember = project.members.some((member) => member.userId === session.user.id);
  if (!isMember) {
    return (
      <PageContainer title="Access denied">
        <Card>
          <p className="text-gray-600">You do not have access to this project.</p>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline"
          >
            Back to Projects
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const isCreator = project.createdById === session.user.id;

  return (
    <PageContainer title={project.name}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <dl className="space-y-2 text-sm text-gray-600">
            <p className="max-w-xl">{project.description}</p>
            <div>
              Status:{" "}
              <span className="font-medium text-gray-900">
                {STATUS_LABELS[project.status]}
              </span>
            </div>
            <div>Start: {project.startDate.toLocaleDateString()}</div>
            <div>End: {project.endDate.toLocaleDateString()}</div>
            <div>Created By: {project.createdBy.name}</div>
          </dl>
          {isCreator && (
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/edit`}>
                <Button>Edit Project</Button>
              </Link>
              <Link href={`/projects/${project.id}/team`}>
                <Button>Manage Team</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {project.members.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 text-gray-900">{member.user.name}</td>
                  <td className="py-2 text-gray-600">{ROLE_LABELS[member.user.role]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
