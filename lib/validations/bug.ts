import { z } from "zod";

export const bugSeverityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const bugPriorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const bugStatusValues = [
  "OPEN",
  "IN_PROGRESS",
  "FIXED",
  "VERIFIED",
  "CLOSED",
] as const;

export const BUG_SEVERITY_LABELS: Record<
  (typeof bugSeverityValues)[number],
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const BUG_PRIORITY_LABELS: Record<
  (typeof bugPriorityValues)[number],
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const BUG_STATUS_LABELS: Record<(typeof bugStatusValues)[number], string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  FIXED: "Fixed",
  VERIFIED: "Verified",
  CLOSED: "Closed",
};

export const bugSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must be under 150 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Description must be under 2000 characters"),
  severity: z.enum(bugSeverityValues, { error: "Select a valid severity" }),
  priority: z.enum(bugPriorityValues, { error: "Select a valid priority" }),
  testCaseId: z.string().optional(),
  assigneeId: z.string().optional(),
});

export const bugStatusUpdateSchema = z.object({
  status: z.enum(bugStatusValues, { error: "Select a valid status" }),
});

export type BugInput = z.infer<typeof bugSchema>;
