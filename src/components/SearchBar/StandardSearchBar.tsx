import { motion, AnimatePresence } from 'framer-motion'
import { Search, ListFilter, LayoutGrid, List, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export type ViewMode = 'grid' | 'list'

interface StandardSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onFilterClick: () => void
  showFilterPanel: boolean
  filterCount: number
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  placeholder?: string
  isSearching?: boolean
}

export function StandardSearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  showFilterPanel,
  filterCount,
  viewMode,
  onViewModeChange,
  placeholder = 'Search...',
  isSearching = false,
}: StandardSearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait" initial={false}>
          {isSearching ? (
            <motion.span
              key="spinner"
              className="absolute left-4 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Search className="h-5 w-5 text-slate-400" />
            </motion.span>
          )}
        </AnimatePresence>
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value)
          }}
          className="h-12 pl-12 border-none bg-slate-50/50 rounded-2xl focus-visible:ring-1 focus-visible:ring-slate-200 text-slate-900 placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* View Toggle (optional) */}
      {viewMode && onViewModeChange && (
        <motion.div
          className="flex bg-slate-50/80 p-1 rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {(['grid', 'list'] as const).map((mode) => (
            <motion.button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`relative h-9 w-9 p-0 rounded-lg flex items-center justify-center transition-colors duration-150 outline-none ${
                viewMode === mode ? 'text-slate-900' : 'text-slate-400'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {viewMode === mode && (
                <motion.span
                  layoutId="viewToggleActivePill"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">
                {mode === 'grid' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Filter Button */}
      <motion.button
        onClick={onFilterClick}
        className={`relative flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium outline-none transition-colors duration-150 ${
          showFilterPanel
            ? 'bg-white shadow-sm text-slate-900'
            : 'bg-slate-50/80 text-slate-400 hover:text-slate-600'
        }`}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.span
          animate={{ rotate: showFilterPanel ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <ListFilter className="h-4 w-4" />
        </motion.span>
        <span>Filters</span>
        {filterCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="bg-ch-primary text-white rounded-full text-xs px-1.5 py-0.5 leading-none font-semibold"
          >
            {filterCount}
          </motion.span>
        )}
      </motion.button>
    </div>
  )
}
