import { Users } from '@/components/icons'
import { EmptyState } from '@/components/shared/EmptyState'

interface UserManagementEmptyStateProps {
  onCreateClick: () => void
  canCreate?: boolean
}

export function UserManagementEmptyState({
  onCreateClick,
  canCreate = true,
}: UserManagementEmptyStateProps) {
  return (
    <EmptyState
      icon={<Users size={24} />}
      title="No users found"
      description="Users get access and permissions across your organisation. Create one to start."
      action={canCreate ? { label: 'Create user', onAction: onCreateClick } : undefined}
    />
  )
}
