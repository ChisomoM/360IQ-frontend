import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Sparkles, CheckCircle, X } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string // Legacy field, not shown: AI content is marked with the IqGlyph
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
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
          <Sparkles size={18} className="text-signal-text" />
          Smart collections
        </h3>
        {activeCollectionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectCollection(null)}
          >
            <X />
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

          return (
            <motion.button
              key={collection.id}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                onSelectCollection(isActive ? null : collection.id)
              }
              className={cn(
                'rounded-lg p-4 text-left shadow-card transition-shadow iq-grad-border [--surface-1:var(--signal-tint)] hover:shadow-card-hover',
                isActive && 'ring-2 ring-focus ring-offset-2',
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-text-primary">
                  {collection.name}
                </h4>
                <span className="font-mono text-xs text-text-secondary">
                  {collection.documentCount}
                </span>
              </div>

              {/* Description */}
              <p className="mb-3 line-clamp-2 text-xs text-text-secondary">
                {collection.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1">
                {collection.tags.slice(0, 2).map((tag) => (
                  <StatusBadge key={tag} tone="neutral">
                    {tag}
                  </StatusBadge>
                ))}
                {collection.tags.length > 2 && (
                  <span className="text-xs text-text-muted">
                    +{collection.tags.length - 2}
                  </span>
                )}
                {/* Active Indicator */}
                {isActive && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-signal-text">
                    <CheckCircle size={14} />Selected
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
