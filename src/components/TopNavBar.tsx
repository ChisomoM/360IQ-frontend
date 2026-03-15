import { useAuth } from '@/lib/context/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function TopNavBar() {

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

  return (

    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 shadow-sm z-30">

      <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-full px-6 py-2">

        <div className="text-right">

          <p className="text-sm font-semibold text-gray-900">
            {getUserDisplayName()}
          </p>

          <p className="text-xs text-gray-500">
            {getUserEmail()}
          </p>

        </div>

        <Avatar className="h-10 w-10">

          <AvatarImage src="" alt={getUserDisplayName()} />

          <AvatarFallback className="bg-[#1e5631] text-white font-semibold text-sm">
            {getInitials()}
          </AvatarFallback>

        </Avatar>

      </div>

    </header>

  );
}