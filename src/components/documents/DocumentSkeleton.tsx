import { motion } from 'framer-motion'

export function DocumentCardSkeleton() {
  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="p-4 space-y-3">
        {/* Icon + Badge */}
        <div className="flex items-start justify-between">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
        </div>

        {/* Description skeleton */}
        <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse" />

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Metadata skeleton */}
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function DocumentTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-200 bg-white hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex gap-2 items-center">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
      </td>
    </tr>
  )
}

interface DocumentSkeletonGridProps {
  count?: number
}

export function DocumentSkeletonGrid({ count = 6 }: DocumentSkeletonGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.05 },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <DocumentCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

export function DocumentSkeletonTable({ count = 5 }: { count?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="px-4 py-3 text-left">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </th>
          <th className="px-4 py-3 text-left">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </th>
          <th className="px-4 py-3 text-left">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </th>
          <th className="px-4 py-3 text-left">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </th>
          <th className="px-4 py-3 text-left">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </th>
          <th className="px-4 py-3 text-left">
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: count }).map((_, i) => (
          <DocumentTableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  )
}
