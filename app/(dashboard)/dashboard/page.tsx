import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";

const stats = [
  { label: "Total Projects", value: 0 },
  { label: "Requirements", value: 0 },
  { label: "Tasks", value: 0 },
  { label: "Open Bugs", value: 0 },
];

export default function DashboardPage() {
  return (
    <PageContainer title="Dashboard">
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
