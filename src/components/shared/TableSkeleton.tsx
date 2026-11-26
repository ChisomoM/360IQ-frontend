/** Same-shape skeleton for tables, so the layout stays stable while loading. */
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="w-full">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-line px-4 py-3 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <div key={c} className="skeleton h-4 flex-1 rounded-xs" />
          ))}
        </div>
      ))}
    </div>
  )
}
