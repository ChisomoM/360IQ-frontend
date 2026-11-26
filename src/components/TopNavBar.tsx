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

    <header className="fixed top-0 right-0 left-0 lg:left-[224px] h-[64px] bg-surface-1 border-b border-line flex items-center justify-end px-4 lg:px-8 z-30">

      <div className="flex items-center gap-3">

        <div className="text-right">

          <p className="text-sm font-semibold text-text-primary">
            {getUserDisplayName()}
          </p>

          {user?.email && <p className="text-xs text-text-muted">{user.email}</p>}

        </div>

        <Avatar className="h-[36px] w-[36px]">

          <AvatarImage src="" alt={getUserDisplayName()} />

          <AvatarFallback className="bg-signal text-on-signal font-semibold text-sm">
            {getInitials()}
          </AvatarFallback>

        </Avatar>

      </div>

    </header>

  );
}
