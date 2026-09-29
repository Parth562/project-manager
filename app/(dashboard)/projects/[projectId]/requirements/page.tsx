import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { canManageRequirements } from "@/lib/auth/requirement-permissions";
import {
  PRIORITY_LABELS,
  REQUIREMENT_STATUS_LABELS,
  requirementPriorityValues,
  requirementStatusValues,
} from "@/lib/validations/requirement";

const inputClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export default async function RequirementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ q?: string; priority?: string; status?: string }>;
}) {
  const { projectId } = await params;
  const { q, priority, status } = await searchParams;

  const { project, isMember, role, isCreator } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;

  const canManage = canManageRequirements(role, isCreator);

  // Filters come from the URL, so only accept known enum values.
  const where: Prisma.RequirementWhereInput = { projectId };
  const search = q?.trim();
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (requirementPriorityValues.some((value) => value === priority)) {
    where.priority = priority as (typeof requirementPriorityValues)[number];
  }
  if (requirementStatusValues.some((value) => value === status)) {
    where.status = status as (typeof requirementStatusValues)[number];
  }
  const isFiltered = Object.keys(where).length > 1;

  const requirements = await prisma.requirement.findMany({
    where,
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer title={`${project.name} — Requirements`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          Back to Project
        </Link>
        {canManage && (
          <Link href={`/projects/${projectId}/requirements/new`}>
            <Button>+ New Requirement</Button>
          </Link>
        )}
      </div>

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-gray-700">
            Search
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Title"
              className={`mt-1 block ${inputClass}`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Priority
            <select
              name="priority"
              defaultValue={priority ?? ""}
              className={`mt-1 block ${inputClass}`}
            >
              <option value="">All</option>
              {requirementPriorityValues.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Status
            <select
              name="status"
              defaultValue={status ?? ""}
              className={`mt-1 block ${inputClass}`}
            >
              <option value="">All</option>
              {requirementStatusValues.map((value) => (
                <option key={value} value={value}>
                  {REQUIREMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Filter</Button>
          {isFiltered && (
            <Link
              href={`/projects/${projectId}/requirements`}
              className="text-sm text-gray-600 hover:underline"
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      {requirements.length === 0 ? (
        <Card>
          {isFiltered ? (
            <p className="text-gray-600">No requirements match your filters.</p>
          ) : (
            <>
              <p className="font-medium text-gray-900">No requirements found.</p>
              {canManage ? (
                <>
                  <p className="mt-1 text-sm text-gray-600">
                    Start by adding the first requirement.
                  </p>
                  <Link
                    href={`/projects/${projectId}/requirements/new`}
                    className="mt-4 inline-block"
                  >
                    <Button>+ Create Requirement</Button>
                  </Link>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-600">
                  The Project Manager has not added any requirements yet.
                </p>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Created By</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr
                    key={requirement.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-2 pr-4">
                      <Link
                        href={`/projects/${projectId}/requirements/${requirement.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {requirement.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {PRIORITY_LABELS[requirement.priority]}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {REQUIREMENT_STATUS_LABELS[requirement.status]}
                    </td>
                    <td className="py-2 text-gray-600">{requirement.createdBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
