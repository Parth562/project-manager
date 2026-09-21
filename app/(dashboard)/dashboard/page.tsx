import type { Role } from "@prisma/client";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { getServerSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";

const stats = [
  { label: "Total Projects", value: 0 },
  { label: "Requirements", value: 0 },
  { label: "Tasks", value: 0 },
  { label: "Open Bugs", value: 0 },
];

export default async function DashboardPage() {
  // The (dashboard) layout already redirects unauthenticated requests to /login,
  // so a session is guaranteed here.
  const session = await getServerSession();
  const role = session!.user.role as Role;

  return (
    <PageContainer title="Dashboard">
      <div>
        <p className="text-gray-700">Welcome, {session!.user.name}</p>
        <p className="text-sm text-gray-500">Role: {ROLE_LABELS[role]}</p>
        <p className="mt-2 text-gray-500">
          Your project management workspace is ready.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
