import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import SubmitButton from "@/components/ui/SubmitButton";
import AccessDenied from "@/components/requirements/AccessDenied";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { isTester, isProjectManager } from "@/lib/auth/permissions";
import { createTestCase } from "@/lib/actions/test-cases";
import type { Role } from "@prisma/client";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export default async function NewTestCasePage({
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
  if (!isTester(role as Role) && !isProjectManager(role as Role)) {
    redirect(`/projects/${projectId}/testing`);
  }

  const [requirements, approvedStories] = await Promise.all([
    prisma.requirement.findMany({
      where: { projectId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.userStory.findMany({
      where: { projectId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, storyText: true },
    }),
  ]);

  return (
    <PageContainer title="New Test Case">
      <Link
        href={`/projects/${projectId}/testing`}
        className="text-sm font-medium text-gray-900 hover:underline"
      >
        ← Back to Test Cases
      </Link>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <Card>
        <form action={createTestCase.bind(null, projectId)} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Test Case Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Verify User Login"
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="steps" className="block text-sm font-medium text-gray-700">
              Steps <span className="text-red-500">*</span>
            </label>
            <textarea
              id="steps"
              name="steps"
              rows={5}
              required
              placeholder="1. Open the login page.&#10;2. Enter valid email.&#10;3. Enter valid password.&#10;4. Click Login."
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="expectedResult" className="block text-sm font-medium text-gray-700">
              Expected Result <span className="text-red-500">*</span>
            </label>
            <textarea
              id="expectedResult"
              name="expectedResult"
              rows={2}
              required
              placeholder="User should successfully log in and reach the dashboard."
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="requirementId" className="block text-sm font-medium text-gray-700">
              Link Requirement (optional)
            </label>
            <select id="requirementId" name="requirementId" className={`mt-1 ${inputClass}`}>
              <option value="">— None —</option>
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="userStoryId" className="block text-sm font-medium text-gray-700">
              Link Approved User Story (optional)
            </label>
            <select id="userStoryId" name="userStoryId" className={`mt-1 ${inputClass}`}>
              <option value="">— None —</option>
              {approvedStories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storyText.length > 80 ? s.storyText.slice(0, 80) + "…" : s.storyText}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <SubmitButton pendingText="Creating…">Create Test Case</SubmitButton>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
