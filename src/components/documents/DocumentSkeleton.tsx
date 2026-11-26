import { TableSkeleton } from '@/components/shared/TableSkeleton'

export function DocumentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card">
      <div className="flex items-center justify-center py-8">
        <div className="skeleton h-14 w-14 rounded-sm" />
      </div>
      <div className="space-y-2 border-t border-line px-4 py-3">
        <div className="skeleton h-4 w-full rounded-xs" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-20 rounded-xs" />
          <div className="skeleton h-3 w-10 rounded-xs" />
        </div>
      </div>
    </div>
  )
}

interface DocumentSkeletonGridProps {
  count?: number
}

export function DocumentSkeletonGrid({ count = 6 }: DocumentSkeletonGridProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DocumentSkeletonTable({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-1 shadow-card">
      <TableSkeleton rows={count} columns={6} />
    </div>
  )
}
