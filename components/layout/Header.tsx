import LogoutButton from "@/components/layout/LogoutButton";

export default function Header({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <span className="text-sm font-semibold text-gray-900 md:text-base">
        AI-Assisted Software Project Management Platform
      </span>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
          {initials}
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
