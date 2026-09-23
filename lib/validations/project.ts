import { z } from "zod";

export const projectStatusValues = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ON_HOLD",
] as const;

export const STATUS_LABELS: Record<(typeof projectStatusValues)[number], string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export const projectSchema = z
  .object({
    name: z.string().min(3, "Project name must be at least 3 characters").max(150),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be under 2000 characters"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.enum(projectStatusValues, { message: "Select a valid status" }),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });

export type ProjectInput = z.infer<typeof projectSchema>;
