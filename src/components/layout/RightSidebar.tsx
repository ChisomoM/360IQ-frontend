import { Sparkles, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/context/useAuth';
import { cn } from '@/lib/utils';
import { AccountMenu } from '@/components/account/AccountMenu';
import { useState } from 'react';

interface RightSidebarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  onToggleDocDetails?: () => void;
  onLogout: () => void;
  isDocDetailsOpen?: boolean;
}

export function RightSidebar({
  isChatOpen,
  onToggleChat,
  onToggleDocDetails,
  onLogout,
  isDocDetailsOpen = false,
}: RightSidebarProps) {
  const { user } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (user?.team_member) {
      return `${user.team_member.first_name} ${user.team_member.last_name}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'User';
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

  return (
    <>
      <div className="fixed top-0 right-0 h-screen w-20 bg-white border-l border-gray-100 z-40 flex flex-col items-center py-6 gap-4 shadow-sm">
        {/* Profile Picture - Top */}
        <button
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          className="group relative flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
          title="Account menu"
        >
          <Avatar className="h-12 w-12 ring-2 ring-[#1e3c21]/20 group-hover:ring-[#1e3c21]/40 transition-all">
            <AvatarImage src="" alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-[#1e3c21] to-[#2a5230] text-white font-semibold text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {/* Hover indicator */}
          <div className="absolute inset-0 rounded-full border-2 border-[#1e3c21]/0 group-hover:border-[#1e3c21]/40 transition-colors" />
        </button>

        {/* Separator */}
        <div className="w-8 h-px bg-gray-100" />

        {/* AI Assistant Icon */}
        <button
          onClick={onToggleChat}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200',
            isChatOpen
              ? 'bg-gradient-to-br from-[#D70F0E] to-[#E5600B] text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
          )}
          title={isChatOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        >
          <Sparkles className="h-5 w-5" />
        </button>

        {/* Document Details Icon */}
        <button
          onClick={onToggleDocDetails}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200',
            isDocDetailsOpen
              ? 'bg-[#1e3c21] text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
          )}
          title={isDocDetailsOpen ? 'Close document details' : 'Open document details'}
        >
          <FileText className="h-5 w-5" />
        </button>
      </div>

      {/* Account Menu Popup */}
      <AccountMenu
        isOpen={isAccountMenuOpen}
        onClose={() => setIsAccountMenuOpen(false)}
        onLogout={onLogout}
      />
    </>
  );
}
