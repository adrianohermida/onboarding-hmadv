export default function PublicacaoSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
            <div className="h-3 bg-muted rounded w-4/6" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-muted rounded-full" />
            <div className="h-5 w-24 bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicacaoPanelSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
