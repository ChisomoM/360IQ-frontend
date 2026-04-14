import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserManagementEmptyStateProps {
  onCreateClick: () => void
  canCreate?: boolean
}

export function UserManagementEmptyState({
  onCreateClick,
  canCreate = true,
}: UserManagementEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 border border-gray-200 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="font-display font-semibold text-text-xl text-gray-900 mb-2">
        No users found
      </h3>

      <p className="font-sans text-text-md text-muted-foreground text-center mb-6 max-w-sm">
        Start by creating your first user to manage access and permissions across your organization.
      </p>

      {canCreate && (
        <Button
          onClick={onCreateClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Create Your First User
        </Button>
      )}
    </div>
  )
}
