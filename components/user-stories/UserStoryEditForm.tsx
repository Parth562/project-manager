"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { updateUserStory } from "@/lib/actions/user-stories";

interface Props {
  projectId: string;
  userStoryId: string;
  initialStoryText: string;
  initialCriteria: string[];
  backHref: string;
}

export default function UserStoryEditForm({
  projectId,
  userStoryId,
  initialStoryText,
  initialCriteria,
  backHref,
}: Props) {
  const [storyText, setStoryText] = useState(initialStoryText);
  const [criteria, setCriteria] = useState<string[]>(
    initialCriteria.length > 0 ? initialCriteria : [""],
  );
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const addCriterion = () => setCriteria((prev) => [...prev, ""]);
  const removeCriterion = (idx: number) =>
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
  const updateCriterion = (idx: number, value: string) =>
    setCriteria((prev) => prev.map((c, i) => (i === idx ? value : c)));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    if (!storyText.trim()) {
      setFormError("Story text is required.");
      return;
    }
    const filled = criteria.filter((c) => c.trim().length > 0);
    if (filled.length === 0) {
      setFormError("At least one acceptance criterion is required.");
      return;
    }

    const fd = new FormData();
    fd.append("storyText", storyText);
    filled.forEach((c, i) => fd.append(`criteria_${i}`, c));

    startTransition(() => {
      updateUserStory(projectId, userStoryId, fd);
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <Link href={backHref} className="w-fit text-sm font-medium text-gray-900 hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">Edit User Story</h1>

      {formError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{formError}</p>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User Story <span className="text-red-500">*</span>
            </label>
            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              rows={3}
              placeholder='As a [user], I want [feature], so that [benefit].'
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Acceptance Criteria
              </label>
              <Button type="button" onClick={addCriterion} className="px-2 py-1 text-xs">
                + Add
              </Button>
            </div>
            <div className="space-y-2">
              {criteria.map((criterion, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="shrink-0 text-xs text-gray-400">{idx + 1}.</span>
                  <input
                    type="text"
                    value={criterion}
                    onChange={(e) => updateCriterion(idx, e.target.value)}
                    placeholder={`Criterion ${idx + 1}`}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  />
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriterion(idx)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Link
              href={backHref}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
