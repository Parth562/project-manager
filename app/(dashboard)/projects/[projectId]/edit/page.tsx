import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ui/ConfirmSubmitButton";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { projectStatusValues, STATUS_LABELS } from "@/lib/validations/project";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditProjectPage({
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

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();
  if (project.createdById !== session.user.id) redirect(`/projects/${projectId}`);

  const updateProjectWithId = updateProject.bind(null, projectId);
  const deleteProjectWithId = deleteProject.bind(null, projectId);

  return (
    <PageContainer title="Edit Project">
      <Card>
        <form action={updateProjectWithId} className="flex max-w-xl flex-col gap-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={project.name}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              defaultValue={project.description}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                defaultValue={toDateInputValue(project.startDate)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                defaultValue={toDateInputValue(project.endDate)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={project.status}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              {projectStatusValues.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Save Changes</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-gray-900">Danger Zone</h2>
        <p className="mt-1 text-sm text-gray-500">
          Deleting a project removes it and its team memberships. This cannot be undone.
        </p>
        <form action={deleteProjectWithId} className="mt-4">
          <ConfirmSubmitButton
            confirmMessage={`Are you sure you want to delete "${project.name}"? This cannot be undone.`}
            className="bg-red-600 hover:bg-red-500"
          >
            Delete Project
          </ConfirmSubmitButton>
        </form>
      </Card>
    </PageContainer>
  );
}
