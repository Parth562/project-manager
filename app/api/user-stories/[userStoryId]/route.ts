import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userStoryId: string }> },
) {
  const { userStoryId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const story = await prisma.userStory.findUnique({
    where: { id: userStoryId },
    select: {
      id: true,
      projectId: true,
      storyText: true,
      acceptanceCriteria: true,
      status: true,
      project: {
        select: {
          members: {
            where: { userId: session.user.id },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!story) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (story.project.members.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: story.id,
    storyText: story.storyText,
    acceptanceCriteria: story.acceptanceCriteria,
    status: story.status,
  });
}
