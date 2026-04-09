import { useState } from 'react';
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
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
            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="font-display font-bold text-display-sm text-gray-900">
                        Users Management
                    </h1>
                    <p className="font-sans text-text-md text-muted-foreground mt-1">
                        Manage system administrators and user roles. Create and configure user access.
                    </p>
                </div>
                {canCreate && (
                    <Button
                        onClick={onCreateClick}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap h-10"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create User
                    </Button>
                )}
            </motion.div>

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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-10 font-sans"
                        aria-label="Search users by name or email"
                    />
                </div>

                {onRoleFilterChange && (
                    <Select onValueChange={onRoleFilterChange} defaultValue="all">
                        <SelectTrigger className="w-full sm:w-40 h-10 font-sans">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {onStatusFilterChange && (
                    <Select onValueChange={onStatusFilterChange} defaultValue="all">
                        <SelectTrigger className="w-full sm:w-40 h-10 font-sans">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
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
