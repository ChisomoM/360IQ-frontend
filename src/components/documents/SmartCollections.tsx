import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string // Emoji or lucide icon name
  color: 'emerald' | 'amber' | 'blue' | 'purple' | 'cyan' | 'rose'
  documentCount: number
  documentIds: string[]
  tags: string[]
}

interface SmartCollectionsProps {
  collections: SmartCollection[]
  activeCollectionId: string | null
  onSelectCollection: (collectionId: string | null) => void
}

// Color to Tailwind classname mapping
const colorMap: Record<string, string> = {
  emerald: 'bg-signal-tint border-line hover:border-line-strong',
  amber: 'bg-caution-tint border-line hover:border-line-strong',
  blue: 'bg-positive-tint border-line hover:border-line-strong',
  purple: 'bg-surface-2 border-line hover:border-line-strong',
  cyan: 'bg-surface-2 border-line hover:border-line-strong',
  rose: 'bg-risk-tint border-line hover:border-line-strong',
}

const badgeColorMap: Record<string, string> = {
  emerald: 'bg-signal-tint text-signal-text',
  amber: 'bg-caution-tint text-caution',
  blue: 'bg-positive-tint text-positive',
  purple: 'bg-surface-2 text-text-secondary',
  cyan: 'bg-surface-2 text-text-secondary',
  rose: 'bg-risk-tint text-risk',
}

/**
 * SmartCollections — AI-powered document groupings
 * Displays collections of documents organized by AI analysis
 */
export function SmartCollections({
  collections,
  activeCollectionId,
  onSelectCollection,
}: SmartCollectionsProps) {
  if (collections.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-text-md text-gray-900">
          🤖 Smart Collections
        </h3>
        {activeCollectionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectCollection(null)}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Collection Cards Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.05 },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {collections.map((collection) => {
          const isActive = activeCollectionId === collection.id
          const bgColor = colorMap[collection.color]
          const badgeColor = badgeColorMap[collection.color]

          return (
            <motion.button
              key={collection.id}
              onClick={() =>
                onSelectCollection(isActive ? null : collection.id)
              }
              className={`relative p-4 border-2 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${bgColor} ring-2 ring-offset-2 ring-${collection.color}-300`
                  : `${bgColor} hover:shadow-md`
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon & Title */}
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{collection.icon}</div>
                <Badge className={`${badgeColor} border-0`} variant="secondary">
                  {collection.documentCount}
                </Badge>
              </div>

              {/* Collection Name */}
              <h4 className="font-sans font-semibold text-text-sm text-gray-900 mb-1">
                {collection.name}
              </h4>

              {/* Description */}
              <p className="font-sans text-text-xs text-gray-600 line-clamp-2 mb-3">
                {collection.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {collection.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-text-xs font-sans"
                  >
                    {tag}
                  </Badge>
                ))}
                {collection.tags.length > 2 && (
                  <span className="text-text-xs text-gray-500">
                    +{collection.tags.length - 2}
                  </span>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg pointer-events-none">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-transparent opacity-0" />
                  <div className="absolute bottom-2 right-2 text-xs font-sans font-medium text-gray-600">
                    Selected
                  </div>
                </div>
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
