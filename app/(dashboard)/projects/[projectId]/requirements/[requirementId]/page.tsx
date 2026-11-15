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
  generateAndSaveUserStory,
  approveUserStory,
  rejectUserStory,
  deleteUserStory,
} from "@/lib/actions/user-stories";
import {
  PRIORITY_LABELS,
  REQUIREMENT_STATUS_LABELS,
  requirementStatusValues,
} from "@/lib/validations/requirement";
import { USER_STORY_STATUS_LABELS } from "@/lib/validations/user-story";
import { isProjectManager } from "@/lib/auth/permissions";
import type { Role } from "@prisma/client";

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

  const requirement = await prisma.requirement.findFirst({
    where: { id: requirementId, projectId },
    include: { createdBy: { select: { name: true } } },
  });
  if (!requirement) notFound();

  const userStories = await prisma.userStory.findMany({
    where: { requirementId, projectId },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const canManage = canManageRequirements(role, isCreator);
  const canChangeStatus = canUpdateRequirementStatus(role, isMember, isCreator);
  const isPm = isProjectManager(role as Role);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <PageContainer title="Requirement Details">
      <Link
        href={`/projects/${projectId}/requirements`}
        className="text-sm font-medium text-gray-900 hover:underline"
      >
        ← Back to Requirements
      </Link>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Requirement Details */}
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

      {/* Status update for Devs/Testers */}
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

      {/* TC10 — AI User Story Generation */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">User Stories</h2>
          {isPm && (
            <form action={generateAndSaveUserStory.bind(null, projectId, requirementId)}>
              <SubmitButton pendingText="Generating…" className="bg-indigo-700 hover:bg-indigo-600">
                ✨ Generate User Story with AI
              </SubmitButton>
            </form>
          )}
        </div>

        {userStories.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">
              No user stories yet.{" "}
              {isPm
                ? 'Click "Generate User Story with AI" to create one.'
                : "The Project Manager can generate user stories from this requirement."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {userStories.map((story) => (
              <Card key={story.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[story.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {USER_STORY_STATUS_LABELS[story.status]}
                    </span>
                    {story.isAiGenerated ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        AI Generated
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Fallback
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    by {story.createdBy.name} · {story.createdAt.toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">User Story</p>
                  <p className="mt-1 text-sm text-gray-900 italic">{story.storyText}</p>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Acceptance Criteria</p>
                  <ul className="mt-1 space-y-1">
                    {story.acceptanceCriteria.map((criterion, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-700">
                        <span className="mt-0.5 shrink-0 text-gray-400">{idx + 1}.</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* TC11 — PM review actions */}
                {isPm && story.status === "DRAFT" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${projectId}/requirements/${requirementId}/user-stories/${story.id}/edit`}
                    >
                      <Button className="bg-gray-700 hover:bg-gray-600">Edit</Button>
                    </Link>
                    <form action={approveUserStory.bind(null, projectId, story.id)}>
                      <SubmitButton
                        pendingText="Approving…"
                        className="bg-green-700 hover:bg-green-600"
                      >
                        Approve
                      </SubmitButton>
                    </form>
                    <form action={rejectUserStory.bind(null, projectId, story.id)}>
                      <SubmitButton
                        pendingText="Rejecting…"
                        className="bg-red-600 hover:bg-red-500"
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                )}

                {isPm && story.status !== "DRAFT" && (
                  <div className="mt-4 flex gap-2">
                    <form action={deleteUserStory.bind(null, projectId, story.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="Delete this user story?"
                        className="bg-red-600 hover:bg-red-500"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
