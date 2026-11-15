import Link from "next/link";
import { notFound } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SubmitButton from "@/components/ui/SubmitButton";
import ConfirmSubmitButton from "@/components/ui/ConfirmSubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isTester, isProjectManager } from "@/lib/auth/permissions";
import { deleteTestCase, executeTestCase } from "@/lib/actions/test-cases";
import { TEST_CASE_STATUS_LABELS } from "@/lib/validations/test-case";
import type { Role } from "@prisma/client";

export default async function ProjectTestingPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { projectId } = await params;
  const { error } = await searchParams;

  const { project, isMember, role } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;

  const isPm = isProjectManager(role as Role);
  const isTesterRole = isTester(role as Role);
  const canCreate = isTesterRole || isPm;

  const testCases = await prisma.testCase.findMany({
    where: { projectId },
    include: {
      createdBy: { select: { name: true } },
      requirement: { select: { title: true } },
      userStory: { select: { storyText: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    NOT_EXECUTED: "bg-gray-100 text-gray-600",
    PASS: "bg-green-100 text-green-700",
    FAIL: "bg-red-100 text-red-700",
    BLOCKED: "bg-yellow-100 text-yellow-700",
  };

  return (
    <PageContainer title="Test Cases">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          ← Back to Project
        </Link>
        {canCreate && (
          <Link href={`/projects/${projectId}/testing/new`}>
            <Button>+ New Test Case</Button>
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {testCases.length === 0 ? (
        <Card>
          <p className="font-medium text-gray-900">No test cases found.</p>
          {canCreate && (
            <p className="mt-1 text-sm text-gray-600">
              Create the first test case using the button above.
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {testCases.map((tc) => (
            <Card key={tc.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{tc.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tc.status] ?? ""}`}
                    >
                      {TEST_CASE_STATUS_LABELS[tc.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    by {tc.createdBy.name} · {tc.createdAt.toLocaleDateString()}
                    {tc.requirement && ` · Req: ${tc.requirement.title}`}
                  </p>
                </div>

                {/* Bug report button for FAIL status */}
                {tc.status === "FAIL" && (isTesterRole || isPm) && (
                  <Link
                    href={`/projects/${projectId}/bugs/new?testCaseId=${tc.id}`}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Report Bug
                  </Link>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Steps</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{tc.steps}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Expected Result</p>
                  <p className="mt-1 text-sm text-gray-700">{tc.expectedResult}</p>
                </div>
                {tc.actualResult && (
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">Actual Result</p>
                    <p className="mt-1 text-sm text-gray-700">{tc.actualResult}</p>
                  </div>
                )}
              </div>

              {/* Execute test case — Testers only */}
              {isTesterRole && (
                <form
                  action={executeTestCase.bind(null, projectId, tc.id)}
                  className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Actual Result
                    </label>
                    <input
                      name="actualResult"
                      type="text"
                      defaultValue={tc.actualResult ?? ""}
                      placeholder="Describe what actually happened"
                      className="mt-1 w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Result
                    </label>
                    <select
                      name="status"
                      defaultValue={tc.status !== "NOT_EXECUTED" ? tc.status : "PASS"}
                      className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
                    >
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                  <SubmitButton pendingText="Saving…" className="bg-indigo-700 hover:bg-indigo-600">
                    Execute
                  </SubmitButton>
                </form>
              )}

              {/* Delete — Tester or PM */}
              {canCreate && (
                <div className="mt-3">
                  <form action={deleteTestCase.bind(null, projectId, tc.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`Delete test case "${tc.title}"?`}
                      className="bg-red-600 hover:bg-red-500 text-xs py-1 px-2"
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
    </PageContainer>
  );
}
