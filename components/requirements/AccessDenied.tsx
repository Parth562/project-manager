import Link from "next/link";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";

export default function AccessDenied() {
  return (
    <PageContainer title="Access denied">
      <Card>
        <p className="text-gray-600">You do not have access to this project.</p>
        <Link
          href="/projects"
          className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline"
        >
          Back to Projects
        </Link>
      </Card>
    </PageContainer>
  );
}
