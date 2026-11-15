import { z } from "zod";

export const userStoryStatusValues = ["DRAFT", "APPROVED", "REJECTED"] as const;

export const USER_STORY_STATUS_LABELS: Record<
  (typeof userStoryStatusValues)[number],
  string
> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const userStorySchema = z.object({
  storyText: z
    .string()
    .trim()
    .min(10, "Story text must be at least 10 characters")
    .max(2000, "Story text must be under 2000 characters"),
  acceptanceCriteria: z
    .array(z.string().trim().min(1, "Acceptance criterion cannot be empty"))
    .min(1, "At least one acceptance criterion is required")
    .max(10, "Maximum 10 acceptance criteria allowed"),
});

export const aiGeneratedStorySchema = z.object({
  storyText: z.string().min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1).max(10),
});

export type UserStoryInput = z.infer<typeof userStorySchema>;
