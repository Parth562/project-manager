import Link from "next/link";
import { notFound } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ui/ConfirmSubmitButton";
import SubmitButton from "@/components/ui/SubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import {
  canManageRequirements,
  canUpdateRequirementStatus,
} from "@/lib/auth/requirement-permissions";
import {
  deleteRequirement,
  updateRequirementStatus,
} from "@/lib/actions/requirements";
import {
  PRIORITY_LABELS,
  REQUIREMENT_STATUS_LABELS,
  requirementStatusValues,
} from "@/lib/validations/requirement";

export default async function RequirementDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string; requirementId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { projectId, requirementId } = await params;
  const { error } = await searchParams;

  const { project, isMember, role, isCreator } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;

  // Scoping by projectId stops a requirement from another project being
  // opened just by changing the URL.
  const requirement = await prisma.requirement.findFirst({
    where: { id: requirementId, projectId },
    include: { createdBy: { select: { name: true } } },
  });
  if (!requirement) notFound();

  const canManage = canManageRequirements(role, isCreator);
  const canChangeStatus = canUpdateRequirementStatus(role, isMember, isCreator);

  return (
    <PageContainer title="Requirement Details">
      <Link
        href={`/projects/${projectId}/requirements`}
        className="text-sm font-medium text-gray-900 hover:underline"
      >
        Back to Requirements
      </Link>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs uppercase text-gray-500">Title</dt>
            <dd className="mt-1 text-base font-medium text-gray-900">
              {requirement.title}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-gray-700">
              {requirement.description}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Priority</dt>
            <dd className="mt-1 text-gray-900">{PRIORITY_LABELS[requirement.priority]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Status</dt>
            <dd className="mt-1 text-gray-900">
              {REQUIREMENT_STATUS_LABELS[requirement.status]}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Created By</dt>
            <dd className="mt-1 text-gray-900">{requirement.createdBy.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Created At</dt>
            <dd className="mt-1 text-gray-900">
              {requirement.createdAt.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Updated At</dt>
            <dd className="mt-1 text-gray-900">
              {requirement.updatedAt.toLocaleString()}
            </dd>
          </div>
        </dl>

        {canManage && (
          <div className="mt-6 flex gap-2">
            <Link href={`/projects/${projectId}/requirements/${requirementId}/edit`}>
              <Button>Edit</Button>
            </Link>
            <form action={deleteRequirement.bind(null, projectId, requirementId)}>
              <ConfirmSubmitButton
                confirmMessage="Are you sure you want to delete this requirement?"
                className="bg-red-600 hover:bg-red-500"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </Card>

      {canChangeStatus && !canManage && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900">Update Status</h2>
          <form
            action={updateRequirementStatus.bind(null, projectId, requirementId)}
            className="mt-4 flex items-end gap-3"
          >
            <select
              name="status"
              defaultValue={requirement.status}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            >
              {requirementStatusValues.map((value) => (
                <option key={value} value={value}>
                  {REQUIREMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <SubmitButton pendingText="Updating...">Update Status</SubmitButton>
          </form>
        </Card>
      )}
    </PageContainer>
  );
}
