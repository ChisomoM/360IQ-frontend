import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
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
    const [selectedPerm, setSelectedPerm] = useState('');
    const [granted, setGranted] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!selectedPerm) return;
        setIsSubmitting(true);
        try {
            await post('USER_PERMISSIONS', { permissionId: selectedPerm, granted }, { id: userId });
            toast.success('Permission override added');
            onAssign(selectedPerm, granted);
            setSelectedPerm('');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add override');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevoke = async (permId: string) => {
        setIsSubmitting(true);
        try {
            await remove('USER_PERMISSIONS', { id: userId, permId });
            toast.success('Override removed');
            onRevoke(permId);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove override');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Current overrides table */}
            {userPermissions.length === 0 ? (
                <p className="text-sm text-gray-500">
                    No individual overrides. User inherits role permissions.
                </p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-gray-500 font-medium">Permission</th>
                            <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                            <th className="py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {userPermissions.map((override) => (
                            <tr key={String(override.id)} className="border-b border-gray-100">
                                <td className="py-2">
                                    {override.permission.resource}.{override.permission.action}
                                </td>
                                <td className="py-2">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${override.granted
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {override.granted ? 'Granted' : 'Denied'}
                                    </span>
                                </td>
                                <td className="py-2 text-right">
                                    <button
                                        title="Revoke override"
                                        onClick={() => handleRevoke(String(override.permission.id))}
                                        disabled={isSubmitting}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Add override form */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <select
                        title="Select permission"
                        value={selectedPerm}
                        onChange={(e) => setSelectedPerm(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-9 border border-gray-300 rounded-md px-3 text-sm"
                    >
                        <option value="">Select permission...</option>
                        {allPermissions.map((p) => (
                            <option key={String(p.id)} value={String(p.id)}>
                                {p.resource}.{p.action}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        title="Grant or deny"
                        value={granted ? 'grant' : 'deny'}
                        onChange={(e) => setGranted(e.target.value === 'grant')}
                        disabled={isSubmitting}
                        className="h-9 border border-gray-300 rounded-md px-3 text-sm"
                    >
                        <option value="grant">Grant</option>
                        <option value="deny">Deny</option>
                    </select>
                </div>
                <Button
                    onClick={handleAdd}
                    disabled={isSubmitting || !selectedPerm}
                    size="sm"
                >
                    {isSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Add
                </Button>
            </div>
        </div>
    );
}