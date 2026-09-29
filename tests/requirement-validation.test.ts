import { describe, expect, it } from "vitest";
import {
  requirementSchema,
  requirementStatusSchema,
} from "@/lib/validations/requirement";

const valid = {
  title: "User Login",
  description: "The system should allow registered users to securely log in.",
  priority: "HIGH",
  status: "TODO",
};

describe("requirementSchema", () => {
  it("accepts valid input", () => {
    expect(requirementSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(requirementSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects a whitespace-only title", () => {
    expect(requirementSchema.safeParse({ ...valid, title: "   " }).success).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(requirementSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("rejects an invalid priority", () => {
    expect(requirementSchema.safeParse({ ...valid, priority: "URGENT" }).success).toBe(false);
  });

  it("rejects an invalid status", () => {
    expect(requirementSchema.safeParse({ ...valid, status: "DONE" }).success).toBe(false);
  });

  it("rejects missing fields (null from FormData)", () => {
    expect(
      requirementSchema.safeParse({ ...valid, priority: null, status: null }).success,
    ).toBe(false);
  });

  it("trims the title", () => {
    const result = requirementSchema.parse({ ...valid, title: "  User Login  " });
    expect(result.title).toBe("User Login");
  });
});

describe("requirementStatusSchema", () => {
  it("accepts a valid status", () => {
    expect(requirementStatusSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(requirementStatusSchema.safeParse({ status: "BLOCKED" }).success).toBe(false);
  });
});
