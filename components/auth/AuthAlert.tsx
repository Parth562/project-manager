import { AlertIcon } from "@/components/auth/icons";

export default function AuthAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
    >
      <AlertIcon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
