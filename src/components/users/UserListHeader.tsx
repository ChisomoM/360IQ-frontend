import { useState } from 'react';
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from '@/components/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AdvancedFilterBuilder } from './AdvancedFilterBuilder';

interface UserListHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    totalUsers: number;
    activeUsers: number;
    onCreateClick: () => void;
    canCreate?: boolean;
    onStatusFilterChange?: (status: string) => void;
    onRoleFilterChange?: (role: string) => void;
}

export function UserListHeader({
    searchQuery,
    onSearchChange,
    totalUsers,
    activeUsers,
    onCreateClick,
    canCreate = true,
    onStatusFilterChange,
    onRoleFilterChange,
}: UserListHeaderProps) {
    const inactiveUsers = totalUsers - activeUsers;
    const [advancedFiltersActive, setAdvancedFiltersActive] = useState(false);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Users"
                description="Create accounts and set what each person can access."
                actions={canCreate && (
                    <Button onClick={onCreateClick}>
                        <UserPlus />
                        Create user
                    </Button>
                )}
            />

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                }}
                className="flex flex-col sm:flex-row gap-3"
            >
                <div className="flex-1 relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                        aria-label="Search users by name or email"
                    />
                </div>

                {onRoleFilterChange && (
                    <Select onValueChange={onRoleFilterChange} defaultValue="all">
                        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by role">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="super_admin">Super admin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {onStatusFilterChange && (
                    <Select onValueChange={onStatusFilterChange} defaultValue="all">
                        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <AdvancedFilterBuilder
                    onApply={() => setAdvancedFiltersActive(true)}
                    onReset={() => setAdvancedFiltersActive(false)}
                    hasActiveFilters={advancedFiltersActive}
                />
            </motion.div>
        </div>
    );
}
