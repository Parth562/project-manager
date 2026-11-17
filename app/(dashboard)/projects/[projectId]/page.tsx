import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
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
      _count: { select: { requirements: true, tasks: true, testCases: true, bugs: true } },
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

  const sections = [
    { label: "Requirements", href: "requirements", count: project._count.requirements, accent: "bg-gray-900" },
    { label: "Tasks", href: "tasks", count: project._count.tasks, accent: "bg-indigo-600" },
    { label: "Test Cases", href: "testing", count: project._count.testCases, accent: "bg-teal-600" },
    { label: "Bugs", href: "bugs", count: project._count.bugs, accent: "bg-red-600" },
  ];

  return (
    <PageContainer title={project.name}>
      <Card>
        <p className="max-w-2xl text-sm text-gray-600">{project.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase text-gray-500">Status</dt>
            <dd className="mt-1 font-medium text-gray-900">{STATUS_LABELS[project.status]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Start</dt>
            <dd className="mt-1 text-gray-900">{project.startDate.toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">End</dt>
            <dd className="mt-1 text-gray-900">{project.endDate.toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Created By</dt>
            <dd className="mt-1 text-gray-900">{project.createdBy.name}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={`/projects/${project.id}/${section.href}`}
            className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
          >
            <span className={`block h-1 w-8 rounded-full ${section.accent}`} />
            <p className="mt-3 text-2xl font-semibold text-gray-900">{section.count}</p>
            <p className="mt-1 flex items-center justify-between text-sm text-gray-600">
              {section.label}
              <span className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-900">
                →
              </span>
            </p>
          </Link>
        ))}
      </div>

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
