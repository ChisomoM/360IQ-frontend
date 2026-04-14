import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
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
                <p className="text-sm text-gray-500">No permissions available</p>
            ) : (
                sortedResources.map((resource) => {
                    const permissions = groupedPermissions[resource];
                    return (
                        <div key={resource} className="space-y-3">
                            {/* Section Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-1 w-6 bg-primary rounded-full"></div>
                                <h3 className="text-sm font-semibold text-gray-900 capitalize">
                                    {resource}
                                </h3>
                                <span className="text-xs text-gray-500 ml-auto">
                                    {permissions.filter((p) => selectedPermIds.has(String(p.id))).length} of{' '}
                                    {permissions.length}
                                </span>
                            </div>

                            {/* Permissions Grid */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                {permissions.map((permission) => {
                                    const isSelected = selectedPermIds.has(String(permission.id));
                                    return (
                                        <label
                                            key={String(permission.id)}
                                            className="flex items-center gap-3 p-2.5 rounded-md hover:bg-white transition-colors cursor-pointer group"
                                        >
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleTogglePermission(permission)}
                                                    disabled={isSubmitting}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`w-5 h-5 rounded border-2 transition-all ${
                                                        isSelected
                                                            ? 'bg-primary border-primary'
                                                            : 'border-gray-300 bg-white group-hover:border-primary'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-white absolute top-0.5 left-0.5" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {permission.action}
                                                </p>
                                                {permission.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">
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
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-700">
                        ✓ Selected permissions override the user's role permissions
                    </p>
                </div>
            )}
        </div>
    );
}