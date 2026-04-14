import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onAction: () => void
  }
}

/**
 * EmptyState — Reusable component for empty lists/tables
 * Used in Documents, and other list/grid views across the app
 */
export function EmptyState({
  title = 'No items found',
  description = 'Try adjusting your search or filters',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-12 text-center">
      <div className="flex justify-center mb-4">
        {icon || <FileText className="h-16 w-16 text-gray-300" />}
      </div>
      
      <h3 className="font-display font-semibold text-text-lg text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="font-sans text-text-sm text-gray-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>

      {action && (
        <Button 
          onClick={action.onAction}
          className="gap-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
