export default function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <span className="text-sm font-semibold text-gray-900 md:text-base">
        AI-Assisted Software Project Management Platform
      </span>
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-gray-500 sm:inline">Guest User</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
          GU
        </div>
      </div>
    </header>
  );
}
