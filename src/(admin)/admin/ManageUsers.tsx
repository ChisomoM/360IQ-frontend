import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { list, remove } from '@/lib/api/crud';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';

import { PageTransition } from '@/components/PageTransition'
import { StandardSearchBar } from '@/components/SearchBar/StandardSearchBar';
import { UserCreateDialog } from '@/components/users/UserCreateDialog';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { UserPermissionsModal } from '@/components/rbac/UserPermissionsModal';
import { UserCard } from '@/components/users/UserCard';
import { UserManagementEmptyState } from '@/components/users/UserManagementEmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { ChevronLeft, ChevronRight, Plus } from '@/components/icons';

interface User {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email: string;
    role?: { name: string; slug: string } | string;
    title?: string;
    departments?: Array<{ id: string; name: string }> | string;
    status?: string | number;
    created_at?: string;
    permissions?: string[];
}

export default function ManageUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination & Search
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch users
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data: any = await list('USERS', {}, { page: page.toString(), limit: limit.toString(), search: debouncedSearch });
            // Standardizing response depending on structure (usually data.items or data directly)
            if (data?.items) {
                setUsers(data.items);
                setTotal(data.total || 0);
            } else if (Array.isArray(data)) {
                setUsers(data);
                setTotal(data.length);
            } else if (data?.data && Array.isArray(data.data)) {
                setUsers(data.data);
                setTotal(data.total || data.data.length);
            } else {
                setUsers([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const handleDelete = async (user: User) => {
        if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;

        try {
            await remove('USERS', { id: user.id });
            toast.success('User deleted');
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete user');
        }
    };

    const activeUsersCount = users.filter((u) => u.status === 'active' || u.status === 1).length;

    return (
        <PageTransition>
            <div className="flex flex-col gap-5">
                <PageHeader
                    title="Users"
                    description="Manage accounts, roles and permissions."
                    actions={hasPermission(currentUser, PERMISSIONS['users.write']) && (
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus />
                            Create user
                        </Button>
                    )}
                />

                {/* Search & Filter Toolbar */}
                <StandardSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search by name, email or department"
                    onFilterClick={() => setShowFilterPanel(!showFilterPanel)}
                    showFilterPanel={showFilterPanel}
                    filterCount={Object.keys({}).length}
                />

            {/* User Cards Grid - Staggered Animation */}
            {isLoading ? (
                <motion.div
                    variants={{
                        hidden: {},
                        visible: {
                            transition: { staggerChildren: 0.06 },
                        },
                    }}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                            key={i}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                                },
                            }}
                            className="bg-surface-1 rounded-lg border border-line shadow-card p-4"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <Skeleton className="h-10 w-10 rounded-pill" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-3 w-16 mb-4" />
                            <Skeleton className="h-20 w-full" />
                        </motion.div>
                    ))}
                </motion.div>
            ) : users.length === 0 ? (
                <UserManagementEmptyState
                    onCreateClick={() => setIsCreateOpen(true)}
                    canCreate={hasPermission(currentUser, PERMISSIONS['users.write'])}
                />
            ) : (
                <motion.div
                    variants={{
                        hidden: {},
                        visible: {
                            transition: { staggerChildren: 0.06 },
                        },
                    }}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {users.map((u) => (
                        <UserCard
                            key={u.id}
                            user={u}
                            onEdit={() => setSelectedUserForEdit(u)}
                            onDelete={handleDelete}
                            onManagePermissions={() => setSelectedUserForPerms(u)}
                            canEdit={hasPermission(currentUser, PERMISSIONS['users.write'])}
                            canDelete={hasPermission(currentUser, PERMISSIONS['users.delete'])}
                            canManagePermissions={hasPermission(
                                currentUser,
                                PERMISSIONS['roles.manage']
                            )}
                        />
                    ))}
                </motion.div>
            )}

            {/* Pagination Controls */}
            {!isLoading && users.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-line bg-surface-1 shadow-card"
                >
                    <p className="text-xs text-text-muted">
                        <span className="font-mono">{(page - 1) * limit + 1} to {Math.min(page * limit, total || page * limit)}</span> of{' '}
                        <span className="font-mono">{total || 'many'}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft />
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPage(page + 1)}
                            disabled={users.length < limit && total <= page * limit}
                        >
                            Next
                            <ChevronRight />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Dialogs */}
            {isCreateOpen && (
                <UserCreateDialog
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={() => fetchUsers()}
                />
            )}

            {selectedUserForEdit && (
                <UserEditDialog
                    user={selectedUserForEdit as any}
                    isOpen={!!selectedUserForEdit}
                    onClose={() => setSelectedUserForEdit(null)}
                    onSubmit={() => fetchUsers()}
                />
            )}

            {selectedUserForPerms && (
                <UserPermissionsModal 
                    userId={selectedUserForPerms.id}
                    userName={`${selectedUserForPerms.first_name || ''} ${selectedUserForPerms.last_name || ''}`.trim() || selectedUserForPerms.email}
                    isOpen={!!selectedUserForPerms} 
                    onClose={() => setSelectedUserForPerms(null)} 
                />
            )}
            </div>
        </PageTransition>
    );
}
