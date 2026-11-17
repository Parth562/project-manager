import type { ReactNode } from "react";
import { Spinner } from "@/components/auth/icons";

export default function AuthSubmitButton({
  pending,
  pendingText,
  children,
}: {
  pending: boolean;
  pendingText: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}
