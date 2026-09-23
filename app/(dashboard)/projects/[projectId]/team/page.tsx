import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ui/ConfirmSubmitButton";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { addProjectMember, removeProjectMember } from "@/lib/actions/projects";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { projectId } = await params;
  const { error } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { include: { user: true }, orderBy: { joinedAt: "asc" } } },
  });
  if (!project) notFound();
  if (project.createdById !== session.user.id) redirect(`/projects/${projectId}`);

  const memberUserIds = project.members.map((member) => member.userId);
  const availableUsers = await prisma.user.findMany({
    where: { id: { notIn: memberUserIds } },
    orderBy: { name: "asc" },
  });

  const addMemberWithId = addProjectMember.bind(null, projectId);

  return (
    <PageContainer title={`Manage Team — ${project.name}`}>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <h2 className="text-base font-semibold text-gray-900">Current Team</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {project.members.map((member) => {
                const isCreator = member.userId === project.createdById;
                return (
                  <tr key={member.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 text-gray-900">{member.user.name}</td>
                    <td className="py-2 pr-4 text-gray-600">{member.user.email}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {ROLE_LABELS[member.user.role]}
                    </td>
                    <td className="py-2">
                      {isCreator ? (
                        <span className="text-xs text-gray-400">Project creator</span>
                      ) : (
                        <form action={removeProjectMember.bind(null, projectId, member.userId)}>
                          <ConfirmSubmitButton
                            confirmMessage={`Are you sure you want to remove ${member.user.name} from this project?`}
                            className="bg-red-600 px-3 py-1 text-xs hover:bg-red-500"
                          >
                            Remove
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-gray-900">Add Member</h2>
        {availableUsers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No other registered users available to add.
          </p>
        ) : (
          <form action={addMemberWithId} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <label htmlFor="userId" className="text-sm font-medium text-gray-700">
                Select User
              </label>
              <select
                id="userId"
                name="userId"
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email} — {ROLE_LABELS[user.role]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Add to Project</Button>
          </form>
        )}
      </Card>
    </PageContainer>
  );
}
