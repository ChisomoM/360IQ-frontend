import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Key, MoreVertical, User } from '@/components/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/shared/StatusBadge';

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

interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onManagePermissions: (user: User) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    canManagePermissions?: boolean;
}

// Helper function to format slug to readable text (sentence case)
const formatRoleSlug = (slug: string): string => {
    const words = slug.split('_').join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
};

export function UserCard({
    user,
    onEdit,
    onDelete,
    onManagePermissions,
    canEdit = true,
    canDelete = true,
    canManagePermissions = true,
}: UserCardProps) {
    const displayName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown user';

    const roleSlug = typeof user.role === 'object'
        ? user.role?.slug?.toLowerCase() || 'user'
        : typeof user.role === 'string'
          ? user.role.toLowerCase().replace(/\s+/g, '_')
          : 'user';

    const roleDisplay = formatRoleSlug(roleSlug);

    const departmentsDisplay =
        typeof user.departments === 'string'
            ? user.departments
            : Array.isArray(user.departments)
              ? user.departments.map((d) => d.name).join(', ')
              : 'N/A';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="group relative min-w-0 bg-surface-1 rounded-lg border border-line shadow-card hover:shadow-card-hover transition-shadow"
        >
            {/* Card Content */}
            <div className="p-4">
                {/* Header: Avatar + Name + Title + Actions */}
                <div className="flex gap-3 mb-3">
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-field text-text-secondary">
                            <User size={20} />
                        </AvatarFallback>
                    </Avatar>

                    {/* Name, Email, Title */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-text-primary truncate">
                            {displayName}
                        </h3>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                            {user.email}
                        </p>
                        {user.title && (
                            <p className="text-xs text-text-secondary truncate mt-1">
                                {user.title}
                            </p>
                        )}
                    </div>

                    {/* Actions Menu */}
                    {(canEdit || canDelete || canManagePermissions) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    title="More actions"
                                    aria-label="More actions"
                                    variant="ghost"
                                >
                                    <MoreVertical />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {canEdit && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onEdit(user)}
                                            className="cursor-pointer"
                                        >
                                            <Pencil size={16} className="mr-2 text-text-muted" />
                                            Edit profile
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canManagePermissions && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onManagePermissions(user)}
                                            className="cursor-pointer"
                                        >
                                            <Key size={16} className="mr-2 text-text-muted" />
                                            Manage permissions
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(user)}
                                        className="cursor-pointer text-risk focus:text-risk focus:bg-risk-tint"
                                    >
                                        <Trash size={16} className="mr-2" />
                                        Delete user
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Role & Department Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge tone="neutral" label={roleDisplay} />
                    {departmentsDisplay !== 'N/A' && departmentsDisplay && (
                        <span className="inline-flex max-w-full items-center h-[1.572rem] px-2.5 rounded-pill bg-field text-xs font-medium text-text-secondary">
                            <span className="truncate">{departmentsDisplay}</span>
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
