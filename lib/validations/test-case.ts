import { z } from "zod";

export const testCaseStatusValues = [
  "NOT_EXECUTED",
  "PASS",
  "FAIL",
  "BLOCKED",
] as const;

export const TEST_CASE_STATUS_LABELS: Record<
  (typeof testCaseStatusValues)[number],
  string
> = {
  NOT_EXECUTED: "Not Executed",
  PASS: "Pass",
  FAIL: "Fail",
  BLOCKED: "Blocked",
};

export const testCaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must be under 150 characters"),
  steps: z
    .string()
    .trim()
    .min(1, "Steps are required")
    .max(3000, "Steps must be under 3000 characters"),
  expectedResult: z
    .string()
    .trim()
    .min(1, "Expected result is required")
    .max(1000, "Expected result must be under 1000 characters"),
  requirementId: z.string().optional(),
  userStoryId: z.string().optional(),
});

export const testCaseExecutionSchema = z.object({
  actualResult: z
    .string()
    .trim()
    .min(1, "Actual result is required")
    .max(1000, "Actual result must be under 1000 characters"),
  status: z.enum(["PASS", "FAIL", "BLOCKED"] as const, {
    error: "Select a valid status",
  }),
});

export type TestCaseInput = z.infer<typeof testCaseSchema>;
