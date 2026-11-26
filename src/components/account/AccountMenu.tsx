import { LogOut, User, Settings, Sun, Moon } from '@/components/icons';
import { useTheme } from '@/lib/theme';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/context/useAuth';

interface AccountMenuProps {
  onLogout: () => void;
}

const ITEM = 'h-[2.857rem] cursor-pointer gap-3 rounded-inner px-3 text-sm text-text-secondary focus:bg-surface-2 focus:text-text-primary';

/** Avatar button in the top bar that opens the account menu. */
export function AccountMenu({ onLogout }: AccountMenuProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useTheme();

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

  const avatar = (
    <Avatar className="h-[36px] w-[36px]">
      <AvatarImage src="" alt="" />
      <AvatarFallback className="bg-signal text-sm font-semibold text-on-signal">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" title="Account menu" className="flex shrink-0 rounded-full">
          {avatar}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[280px] rounded-md border border-line bg-surface-1 p-2 text-text-primary shadow-raised"
      >
        <div className="flex items-center gap-3 px-3 py-2">
          {avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{getUserDisplayName()}</p>
            {user?.email && <p className="truncate text-xs text-text-muted">{user.email}</p>}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-line" />

        <DropdownMenuItem className={ITEM}>
          <User size={18} />
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM}>
          <Settings size={18} />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => setTheme(theme === 'ink' ? 'paper' : 'ink')}>
          {theme === 'ink' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'ink' ? 'Switch to paper (light)' : 'Switch to ink (dark)'}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-line" />

        <DropdownMenuItem className={`${ITEM} text-risk focus:bg-risk-tint focus:text-risk`} onSelect={onLogout}>
          <LogOut size={18} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
