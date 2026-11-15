import { z } from "zod";

export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const taskStatusValues = ["TODO", "IN_PROGRESS", "TESTING", "DONE"] as const;

export const TASK_PRIORITY_LABELS: Record<
  (typeof taskPriorityValues)[number],
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const TASK_STATUS_LABELS: Record<(typeof taskStatusValues)[number], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  TESTING: "Testing",
  DONE: "Done",
};

export const taskSchema = z.object({
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
  priority: z.enum(taskPriorityValues, { error: "Select a valid priority" }),
  status: z.enum(taskStatusValues, { error: "Select a valid status" }),
  dueDate: z.string().optional(),
  requirementId: z.string().optional(),
  userStoryId: z.string().optional(),
  assigneeId: z.string().optional(),
});

export const taskStatusUpdateSchema = z.object({
  status: z.enum(taskStatusValues, { error: "Select a valid status" }),
});

export type TaskInput = z.infer<typeof taskSchema>;
