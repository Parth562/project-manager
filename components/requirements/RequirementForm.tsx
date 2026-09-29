import SubmitButton from "@/components/ui/SubmitButton";
import {
  PRIORITY_LABELS,
  REQUIREMENT_STATUS_LABELS,
  requirementPriorityValues,
  requirementStatusValues,
} from "@/lib/validations/requirement";

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";
const labelClass = "text-sm font-medium text-gray-700";

type Defaults = {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
};

export default function RequirementForm({
  action,
  defaults = {},
  error,
  submitLabel,
  pendingText,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  error?: string;
  submitLabel: string;
  pendingText: string;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <label className={labelClass}>
        Requirement Title
        <input
          name="title"
          type="text"
          required
          maxLength={150}
          defaultValue={defaults.title}
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Description
        <textarea
          name="description"
          required
          rows={5}
          maxLength={2000}
          defaultValue={defaults.description}
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Priority
        <select
          name="priority"
          defaultValue={defaults.priority ?? "MEDIUM"}
          className={inputClass}
        >
          {requirementPriorityValues.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Status
        <select
          name="status"
          defaultValue={defaults.status ?? "TODO"}
          className={inputClass}
        >
          {requirementStatusValues.map((value) => (
            <option key={value} value={value}>
              {REQUIREMENT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <SubmitButton pendingText={pendingText}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
