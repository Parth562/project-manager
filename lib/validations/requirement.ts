import { z } from "zod";

export const requirementPriorityValues = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const requirementStatusValues = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const PRIORITY_LABELS: Record<(typeof requirementPriorityValues)[number], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const REQUIREMENT_STATUS_LABELS: Record<
  (typeof requirementStatusValues)[number],
  string
> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const statusField = z.enum(requirementStatusValues, {
  message: "Select a valid status",
});

export const requirementSchema = z.object({
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
  priority: z.enum(requirementPriorityValues, { message: "Select a valid priority" }),
  status: statusField,
});

// Developers/Testers may only change a requirement's status.
export const requirementStatusSchema = z.object({ status: statusField });

export type RequirementInput = z.infer<typeof requirementSchema>;
