import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { getServerSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  return (
    <div className="flex min-h-screen flex-col">
      <Header name={session.user.name} roleLabel={ROLE_LABELS[role]} />
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
