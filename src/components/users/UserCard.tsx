import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Key, MoreVertical, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

// Role-to-color mapping for avatar rings and badges
const roleColorMap: Record<string, { ring: string; bg: string; badgeBg: string; badgeText: string; badgeDot: string }> = {
    super_admin: { ring: 'from-ch-primary-500 to-ch-primary-600', bg: 'bg-ch-primary-50', badgeBg: 'bg-ch-primary/[0.12]', badgeText: 'text-ch-primary-700', badgeDot: 'bg-ch-primary-600' },
    admin: { ring: 'from-ch-secondary-500 to-ch-secondary-600', bg: 'bg-ch-secondary-50', badgeBg: 'bg-ch-secondary/[0.12]', badgeText: 'text-ch-secondary-700', badgeDot: 'bg-ch-secondary-600' },
    user: { ring: 'from-gray-400 to-gray-500', bg: 'bg-gray-50', badgeBg: 'bg-gray-600/[0.12]', badgeText: 'text-gray-700', badgeDot: 'bg-gray-600' },
};

// Helper function to format slug to readable text
const formatRoleSlug = (slug: string): string => {
    return slug
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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
    const displayName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';

    const roleSlug = typeof user.role === 'object' 
        ? user.role?.slug?.toLowerCase() || 'user'
        : typeof user.role === 'string'
          ? user.role.toLowerCase().replace(/\s+/g, '_')
          : 'user';
    
    const roleDisplay = formatRoleSlug(roleSlug);
    const roleColors = roleColorMap[roleSlug] || roleColorMap.user;

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
            className={`group relative bg-surface-1 rounded-lg border border-line overflow-hidden transition-colors duration-150`}
        >
            {/* Card Content */}
            <div className="p-4">
                {/* Header: Avatar + Name + Title + Actions */}
                <div className="flex gap-3 mb-3">
                    {/* Avatar with colored ring */}
                    <div className={`relative flex-shrink-0 ${roleSlug === 'user' ? 'bg-line-strong' : 'bg-signal'} p-0.5 rounded-full`}>
                        <Avatar className="h-12 w-12 bg-white border-2 border-white flex items-center justify-center">
                            <AvatarFallback className="bg-white text-gray-600 font-semibold text-sm">
                                <User className="h-6 w-6 text-gray-600" />
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Name, Email, Title */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-semibold text-sm text-gray-900 truncate">
                            {displayName}
                        </h3>
                        <p className="font-sans text-xs text-gray-500 truncate mt-0.5">
                            {user.email}
                        </p>
                        {user.title && (
                            <p className="font-sans text-xs text-gray-600 truncate mt-1">
                                {user.title}
                            </p>
                        )}
                    </div>

                    {/* Actions Menu */}
                    {(canEdit || canDelete || canManagePermissions) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-200/50 transition-colors"
                                    title="More actions"
                                    aria-label="More actions menu"
                                    variant="ghost"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {canEdit && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onEdit(user)}
                                            className="cursor-pointer font-sans"
                                        >
                                            <Pencil className="h-4 w-4 mr-2 text-primary" />
                                            Edit Profile
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canManagePermissions && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => onManagePermissions(user)}
                                            className="cursor-pointer font-sans"
                                        >
                                            <Key className="h-4 w-4 mr-2 text-primary" />
                                            Manage Permissions
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(user)}
                                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 font-sans"
                                    >
                                        <Trash className="h-4 w-4 mr-2" />
                                        Delete User
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Role & Department Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs font-medium ${roleColors.badgeBg} ${roleColors.badgeText} rounded-full flex items-center gap-1.5 px-3 py-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleColors.badgeDot}`} />
                        {roleDisplay}
                    </Badge>
                    {departmentsDisplay !== 'N/A' && (
                        <Badge className="text-xs bg-primary/[0.45] text-primary-700 font-medium line-clamp-1 rounded-full flex items-center gap-1.5 px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-ch-secondary-600" />
                            {departmentsDisplay}
                        </Badge>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
