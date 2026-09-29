import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import AccessDenied from "@/components/requirements/AccessDenied";
import RequirementForm from "@/components/requirements/RequirementForm";
import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/auth/project-access";
import { canManageRequirements } from "@/lib/auth/requirement-permissions";
import { updateRequirement } from "@/lib/actions/requirements";

export default async function EditRequirementPage({
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
  });
  if (!requirement) notFound();

  if (!canManageRequirements(role, isCreator)) {
    redirect(`/projects/${projectId}/requirements/${requirementId}`);
  }

  return (
    <PageContainer title="Edit Requirement">
      <Card>
        <RequirementForm
          action={updateRequirement.bind(null, projectId, requirementId)}
          defaults={requirement}
          error={error}
          submitLabel="Save Changes"
          pendingText="Saving..."
        />
      </Card>
    </PageContainer>
  );
}
