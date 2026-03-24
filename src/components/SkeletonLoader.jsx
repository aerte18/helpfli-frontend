/**
 * Skeleton Loader Component
 * Wyświetla animowane placeholdery podczas ładowania danych
 */

export function OrderDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 bg-slate-200 rounded-lg w-64 mb-4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-48 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Progress Tracker Skeleton */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-10 h-10 bg-slate-200 rounded-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-20 mb-7 animate-pulse"></div>
                </div>
                {i < 5 && <div className="h-0.5 flex-1 mx-2 mb-7 bg-slate-200 animate-pulse"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded w-48 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded w-40 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-56 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Participants Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-px bg-slate-200 animate-pulse"></div>
                <div className="h-20 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OffersListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-48 mb-3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-slate-200 rounded-lg w-24 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagesListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
          <div className="w-9 h-9 bg-slate-200 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-24 mb-1 animate-pulse"></div>
            <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleSkeleton({ width = "w-full", height = "h-4", className = "" }) {
  return (
    <div className={`bg-slate-200 rounded animate-pulse ${width} ${height} ${className}`}></div>
  );
}
