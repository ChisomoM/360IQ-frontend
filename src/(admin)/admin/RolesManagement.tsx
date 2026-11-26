import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Edit2 } from '@/components/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
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
        super_admin: 'Full access to all system features and settings.',
        admin: 'Manage users, departments and most system features.',
        user: 'Standard access to documents and personal features.',
    };

    return (
        <div className="w-full flex flex-col gap-5">
            <PageHeader
                title="Roles"
                description="Set the permissions for each role."
            />

            {isLoading ? (
                <SectionCard padded={false}>
                    <TableSkeleton rows={4} columns={3} />
                </SectionCard>
            ) : roles.length === 0 ? (
                <SectionCard padded={false}>
                    <EmptyState
                        icon={<ShieldCheck size={24} />}
                        title="No roles yet"
                        description="Roles appear here once they are set up for your organisation."
                    />
                </SectionCard>
            ) : (
                <>
                    {/* Role Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {roles.map((role) => (
                            <section
                                key={String(role.id)}
                                className="flex min-w-0 flex-col gap-4 rounded-lg border border-line bg-surface-1 p-6 shadow-card"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <ShieldCheck size={24} className="text-text-muted" />
                                    <code className="rounded-pill bg-field px-2 py-0.5 font-mono text-xs text-text-secondary">
                                        {role.slug}
                                    </code>
                                </div>

                                <div className="flex-1">
                                    <h2 className="font-semibold text-base text-text-primary">{role.name}</h2>
                                    <p className="text-sm text-text-secondary mt-1">
                                        {ROLE_DESCRIPTIONS[role.slug] ?? role.description ?? ''}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                                    <span className="text-xs text-text-muted">
                                        <span className="font-mono">{role.permissions.length}</span> permissions
                                    </span>
                                    <Button
                                        size="sm"
                                        onClick={() => openPanel(role)}
                                        variant="secondary"
                                    >
                                        <Edit2 />
                                        Edit permissions
                                    </Button>
                                </div>
                            </section>
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