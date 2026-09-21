import type { ReactNode } from "react";

export default function PageContainer({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {children}
    </div>
  );
}
