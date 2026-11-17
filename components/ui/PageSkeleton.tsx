// Instant placeholder shown by loading.tsx while a page's server data streams in.
export default function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-gray-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
