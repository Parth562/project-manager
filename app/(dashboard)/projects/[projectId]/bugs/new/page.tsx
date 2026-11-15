import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import SubmitButton from "@/components/ui/SubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isTester, isProjectManager } from "@/lib/auth/permissions";
import { createBug } from "@/lib/actions/bugs";
import { bugSeverityValues, bugPriorityValues, BUG_SEVERITY_LABELS, BUG_PRIORITY_LABELS } from "@/lib/validations/bug";
import type { Role } from "@prisma/client";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export default async function NewBugPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; testCaseId?: string }>;
}) {
  const { projectId } = await params;
  const { error, testCaseId } = await searchParams;

  const { project, isMember, role } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;
  if (!isTester(role as Role) && !isProjectManager(role as Role)) {
    redirect(`/projects/${projectId}/bugs`);
  }

  // Prefill test case if linked from testing page
  let linkedTestCase = null;
  if (testCaseId) {
    linkedTestCase = await prisma.testCase.findFirst({
      where: { id: testCaseId, projectId },
      select: { id: true, title: true },
    });
  }

  // All project test cases for manual linking
  const testCases = await prisma.testCase.findMany({
    where: { projectId, status: "FAIL" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  // Developers for optional assignment
  const developers = await prisma.projectMember.findMany({
    where: { projectId, user: { role: "DEVELOPER" } },
    include: { user: { select: { id: true, name: true } } },
  });

  return (
    <PageContainer title="Report Bug">
      <Link
        href={`/projects/${projectId}/bugs`}
        className="text-sm font-medium text-gray-900 hover:underline"
      >
        ← Back to Bugs
      </Link>

      {linkedTestCase && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Reporting bug for failed test case:{" "}
          <strong>{linkedTestCase.title}</strong>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Card>
        <form action={createBug.bind(null, projectId)} className="space-y-5">
          {/* Hidden pre-linked test case */}
          {linkedTestCase && (
            <input type="hidden" name="testCaseId" value={linkedTestCase.id} />
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Bug Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                Severity <span className="text-red-500">*</span>
              </label>
              <select id="severity" name="severity" defaultValue="MEDIUM" className={`mt-1 ${inputClass}`}>
                {bugSeverityValues.map((v) => (
                  <option key={v} value={v}>{BUG_SEVERITY_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority <span className="text-red-500">*</span>
              </label>
              <select id="priority" name="priority" defaultValue="MEDIUM" className={`mt-1 ${inputClass}`}>
                {bugPriorityValues.map((v) => (
                  <option key={v} value={v}>{BUG_PRIORITY_LABELS[v]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Only show test case picker if not pre-linked */}
          {!linkedTestCase && testCases.length > 0 && (
            <div>
              <label htmlFor="testCaseId" className="block text-sm font-medium text-gray-700">
                Link Failed Test Case (optional)
              </label>
              <select id="testCaseId" name="testCaseId" className={`mt-1 ${inputClass}`}>
                <option value="">— None —</option>
                {testCases.map((tc) => (
                  <option key={tc.id} value={tc.id}>{tc.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
              Assign to Developer (optional)
            </label>
            <select id="assigneeId" name="assigneeId" className={`mt-1 ${inputClass}`}>
              <option value="">— Unassigned —</option>
              {developers.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <SubmitButton pendingText="Reporting…">Report Bug</SubmitButton>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
