import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Pencil, Trash, Key, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { list, remove } from '@/lib/api/crud';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { UserCreateDialog } from '@/components/users/UserCreateDialog';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { UserPermissionsSheet } from '@/components/rbac/UserPermissionsSheet';

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

    const renderRole = (u: User) => {
        if (typeof u.role === 'string') return u.role;
        return u.role?.name || 'N/A';
    };

    const renderDepartments = (u: User) => {
        if (typeof u.departments === 'string') return u.departments;
        if (Array.isArray(u.departments)) return u.departments.map(d => d.name).join(', ');
        return 'N/A';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center whitespace-nowrap overflow-auto mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0d173b]">Users Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage system administrators and user roles.</p>
                </div>
                {hasPermission(currentUser, PERMISSIONS['users.write']) && (
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Departments</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-48 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="mb-4">No users found.</p>
                                            {hasPermission(currentUser, PERMISSIONS['users.write']) && (
                                                <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                                                    Create User
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A'}
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell className="capitalize">{renderRole(u)}</TableCell>
                                        <TableCell>{u.title || 'N/A'}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={renderDepartments(u)}>
                                            {renderDepartments(u)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                u.status === 'active' || u.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {u.status === 'active' || u.status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                {/* Edit Button */}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setSelectedUserForEdit(u)}
                                                    title="Edit User"
                                                >
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>

                                                {/* Manage Permissions */}
                                                {hasPermission(currentUser, PERMISSIONS['roles.manage']) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => setSelectedUserForPerms(u)}
                                                        title="Manage Permissions"
                                                    >
                                                        <Key className="h-4 w-4 text-amber-600" />
                                                    </Button>
                                                )}

                                                {/* Delete Button */}
                                                {hasPermission(currentUser, PERMISSIONS['users.delete']) && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(u)}
                                                        title="Delete User"
                                                    >
                                                        <Trash className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {!isLoading && users.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t text-sm">
                        <div className="text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total || page * limit)} of {total || "many"} entries
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={users.length < limit && total <= page * limit} 
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

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
                <UserPermissionsSheet 
                    userId={selectedUserForPerms.id} 
                    isOpen={!!selectedUserForPerms} 
                    onClose={() => setSelectedUserForPerms(null)} 
                />
            )}
        </div>
    );
}
