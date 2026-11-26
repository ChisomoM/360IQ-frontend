import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from '@/components/icons';
import { toast } from 'sonner';
import { post, remove } from '@/lib/api/crud';
import type { Permission, UserPermissionOverride } from '@/types/rbac';

interface UserPermissionOverridesProps {
    userId: string;
    userPermissions: UserPermissionOverride[];
    allPermissions: Permission[];
    onAssign: (permId: string, granted: boolean) => void;
    onRevoke: (permId: string) => void;
}

export function UserPermissionOverrides({
    userId,
    userPermissions,
    allPermissions,
    onAssign,
    onRevoke,
}: UserPermissionOverridesProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group permissions by resource
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        allPermissions.forEach((perm) => {
            if (!groups[perm.resource]) {
                groups[perm.resource] = [];
            }
            groups[perm.resource].push(perm);
        });
        return groups;
    }, [allPermissions]);

    // Track selected permissions
    const selectedPermIds = new Set(userPermissions.map((p) => String(p.permission.id)));

    const handleTogglePermission = async (permission: Permission) => {
        const permId = String(permission.id);
        const isCurrentlySelected = selectedPermIds.has(permId);

        setIsSubmitting(true);
        try {
            if (isCurrentlySelected) {
                // Remove override
                await remove('USER_PERMISSIONS', { userId, permId });
                toast.success('Permission removed');
                onRevoke(permId);
            } else {
                // Add override (grant by default)
                await post('USER_PERMISSIONS', { permissionId: permId, granted: true }, { userId });
                toast.success('Permission granted');
                onAssign(permId, true);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update permission');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resourceOrder = ['document', 'user', 'role', 'department', 'workflow', 'report', 'admin'];
    const sortedResources = Object.keys(groupedPermissions).sort((a, b) => {
        const aIndex = resourceOrder.indexOf(a.toLowerCase());
        const bIndex = resourceOrder.indexOf(b.toLowerCase());
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    return (
        <div className="space-y-6">
            {sortedResources.length === 0 ? (
                <p className="text-sm text-text-muted">No permissions available.</p>
            ) : (
                sortedResources.map((resource) => {
                    const permissions = groupedPermissions[resource];
                    return (
                        <div key={resource} className="space-y-3">
                            {/* Section Header */}
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-text-primary first-letter:uppercase">
                                    {resource}
                                </h3>
                                <span className="font-mono text-xs text-text-muted ml-auto">
                                    {permissions.filter((p) => selectedPermIds.has(String(p.id))).length} of{' '}
                                    {permissions.length}
                                </span>
                            </div>

                            {/* Permissions Grid */}
                            <div className="bg-field rounded-md p-2 space-y-1">
                                {permissions.map((permission) => {
                                    const isSelected = selectedPermIds.has(String(permission.id));
                                    return (
                                        <label
                                            key={String(permission.id)}
                                            className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-surface-2 transition-colors cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleTogglePermission(permission)}
                                                disabled={isSubmitting}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary">
                                                    {permission.action}
                                                </p>
                                                {permission.description && (
                                                    <p className="text-xs text-text-muted line-clamp-1">
                                                        {permission.description}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            {/* Info message */}
            {userPermissions.length > 0 && (
                <div className="flex items-center gap-2 bg-field rounded-md p-3 text-xs text-text-secondary">
                    <AlertCircle size={14} className="shrink-0" />
                    <p>Selected permissions override this person's role permissions.</p>
                </div>
            )}
        </div>
    );
}