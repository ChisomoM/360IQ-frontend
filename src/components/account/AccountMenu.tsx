import { LogOut, User, Settings, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/context/useAuth';
import { cn } from '@/lib/utils';

interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function AccountMenu({ isOpen, onClose, onLogout }: AccountMenuProps) {
  const { user } = useAuth();

  const getUserDisplayName = () => {
    if (user?.team_member) {
      return `${user.team_member.first_name} ${user.team_member.last_name}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  const getInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed top-20 right-[100px] w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Account</h3>
          <button
            onClick={onClose}
            aria-label="Close account menu"
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-[#1e3c21]/10 flex-shrink-0">
            <AvatarImage src="" alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-[#1e3c21] to-[#2a5230] text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-gray-500 truncate">{getUserEmail()}</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="h-4 w-4 text-gray-400" />
            <span>View Profile</span>
          </button>

          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 text-gray-400" />
            <span>Account Settings</span>
          </button>

          <div className="my-1 border-t border-gray-100" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
