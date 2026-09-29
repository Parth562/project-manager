import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/session";

// Loads the session and the caller's relationship to a project, entirely
// from the database. Unauthenticated callers are sent to /login (401).
// `project` is null when it does not exist (404) — callers decide how to react.
export async function getProjectAccess(projectId: string) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      createdById: true,
      members: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  return {
    session,
    role: session.user.role as Role,
    project,
    isMember: (project?.members.length ?? 0) > 0,
    isCreator: project?.createdById === session.user.id,
  };
}
