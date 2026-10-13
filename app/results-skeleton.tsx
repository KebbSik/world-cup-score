export function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading results</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-4 w-56 rounded-full bg-zinc-700" />
        <div className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row">
          <div className="h-10 flex-1 rounded-full bg-zinc-700" />
          <div className="h-10 flex-1 rounded-full bg-zinc-700" />
        </div>
        <div className="h-12 w-28 rounded-full bg-zinc-700" />
      </div>
      <div className="relative min-h-64 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 md:min-h-96">
        <div className="skeleton-sheen" />
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-4 w-8 rounded-full bg-zinc-700" />
              <div className="h-4 w-40 rounded-full bg-zinc-700" />
              <div className="h-4 flex-1 rounded-full bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
