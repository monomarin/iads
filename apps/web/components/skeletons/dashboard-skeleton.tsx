import { Skeleton } from "@raemonorepo/ui";

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 border-r border-border p-4 lg:block">
          <nav className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <Skeleton className="mb-4 h-6 w-40" />
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
