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
        if (!confirm(`Are you sure you want to delete ${user.email}?`)) return;
        
        try {
            await remove('USERS', { id: user.id });
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete user');
        }
    };

    const activeUsersCount = users.filter((u) => u.status === 'active' || u.status === 1).length;

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header with title and create button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display font-bold text-display-sm text-gray-900">
                            User Management
                        </h1>
                        <p className="text-gray-600 mt-1 font-sans text-text-md">
                            Manage users, roles, and permissions
                        </p>
                    </div>
                    {hasPermission(currentUser, PERMISSIONS['users.write']) && (
                        <motion.button
                            onClick={() => setIsCreateOpen(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="h-10 px-4 rounded-xl bg-primary text-primary-fg hover:bg-primary-hover font-medium text-sm flex items-center gap-2"
                        >
                            + Create User
                        </motion.button>
                    )}
                </div>

                {/* Search & Filter Toolbar */}
                <StandardSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search by name, email, or department..."
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
                            className="bg-card rounded-lg border border-border p-4"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border-t border-border bg-white shadow-sm"
                >
                    <div className="font-sans text-text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total || page * limit)} of{' '}
                        {total || 'many'} entries
                    </div>
                    <div className="flex gap-2">
                        <motion.button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            whileHover={page === 1 ? {} : { scale: 1.04 }}
                            whileTap={page === 1 ? {} : { scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="h-9 px-3 text-xs font-medium rounded-lg border border-border text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                        >
                            Previous
                        </motion.button>
                        <motion.button
                            onClick={() => setPage(page + 1)}
                            disabled={users.length < limit && total <= page * limit}
                            whileHover={users.length < limit && total <= page * limit ? {} : { scale: 1.04 }}
                            whileTap={users.length < limit && total <= page * limit ? {} : { scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="h-9 px-3 text-xs font-medium rounded-lg border border-border text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                        >
                            Next
                        </motion.button>
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
