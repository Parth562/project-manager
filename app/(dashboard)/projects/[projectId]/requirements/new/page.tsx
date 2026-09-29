import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import AccessDenied from "@/components/requirements/AccessDenied";
import RequirementForm from "@/components/requirements/RequirementForm";
import { getProjectAccess } from "@/lib/auth/project-access";
import { canManageRequirements } from "@/lib/auth/requirement-permissions";
import { createRequirement } from "@/lib/actions/requirements";

export default async function NewRequirementPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { projectId } = await params;
  const { error } = await searchParams;

  const { project, isMember, role, isCreator } = await getProjectAccess(projectId);
  if (!project) notFound();
  if (!isMember) return <AccessDenied />;
  if (!canManageRequirements(role, isCreator)) {
    redirect(`/projects/${projectId}/requirements`);
  }

  return (
    <PageContainer title="New Requirement">
      <Card>
        <RequirementForm
          action={createRequirement.bind(null, projectId)}
          error={error}
          submitLabel="Create Requirement"
          pendingText="Creating requirement..."
        />
      </Card>
    </PageContainer>
  );
}
