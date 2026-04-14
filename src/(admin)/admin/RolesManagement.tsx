import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { list } from '@/lib/api/crud';
import { useRbac } from '@/lib/context/RbacContext';
import { RolePermissionsPanel } from '@/components/rbac/RolePermissionsPanel';
import type { Role, Permission } from '@/types/rbac';

export default function RolesManagement() {
    const { loadRoles } = useRbac();
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rolesData, permsData] = await Promise.all([
                list('ADMIN_ROLES'),
                list('ADMIN_PERMISSIONS'),
            ]);
            setRoles(rolesData ?? []);
            setAllPermissions(permsData ?? []);
        } catch (err) {
            toast.error('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    const openPanel = (role: Role) => {
        setSelectedRole(role);
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setSelectedRole(null);
        setIsPanelOpen(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetchData();
            await loadRoles();
            toast.success('Permissions updated');
            closePanel();
        } catch (err) {
            toast.error('Failed to refresh roles');
        } finally {
            setIsSaving(false);
        }
    };

    const ROLE_DESCRIPTIONS: Record<string, string> = {
        super_admin: 'Full access to all system features and settings',
        admin: 'Manage users, departments and most system features',
        user: 'Standard access to documents and personal features',
    };

    const ROLE_COLORS: Record<string, string> = {
        super_admin: 'bg-purple-100 text-purple-800',
        admin: 'bg-blue-100 text-blue-800',
        user: 'bg-green-100 text-green-800',
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
                    <p className="text-gray-600 mt-1">
                        Configure permissions for each role in the system
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-4 text-gray-500">Loading roles...</p>
                </div>
            ) : roles.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-20 text-gray-500">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No roles found.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Role Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roles.map((role) => (
                            <Card
                                key={String(role.id)}
                                className="border-2 border-gray-200 hover:border-gray-300 transition-all"
                            >
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <ShieldCheck className="h-8 w-8 text-primary" />
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[role.slug] ?? 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {role.slug}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{role.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {ROLE_DESCRIPTIONS[role.slug] ?? role.description ?? ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">
                                            {role.permissions.length} permissions
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => openPanel(role)}
                                            variant="tenantPrimary"
                                        >
                                            <Edit2 className="h-3 w-3 mr-1" />
                                            Edit Permissions
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Permissions Modal */}
                    <RolePermissionsPanel
                        role={selectedRole}
                        allPermissions={allPermissions}
                        onSave={handleSave}
                        isSaving={isSaving}
                        isOpen={isPanelOpen}
                        onOpenChange={setIsPanelOpen}
                    />
                </>
            )}
        </div>
    );
}