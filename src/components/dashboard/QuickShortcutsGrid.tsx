import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

export interface Shortcut {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  description?: string;
  allowedRoles?: string[];
}

interface QuickShortcutsGridProps {
  shortcuts?: Shortcut[];
  userRole?: string;
}

export function QuickShortcutsGrid({
  shortcuts = [],
  userRole,
}: QuickShortcutsGridProps) {
  const navigate = useNavigate();

  const filteredShortcuts = shortcuts.filter((shortcut) => {
    if (!shortcut.allowedRoles) return true;
    return shortcut.allowedRoles.includes(userRole || '');
  });

  if (filteredShortcuts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
      {filteredShortcuts.map((shortcut) => (
        <Button
          key={shortcut.id}
          variant="outline"
          className="h-auto flex-col gap-2 py-4 lg:py-6 px-2 lg:px-4 text-center hover:border-green-400 hover:bg-green-50 transition-all group"
          onClick={() => navigate(shortcut.href)}
          aria-label={shortcut.description || shortcut.label}
        >
          <div className="text-lg lg:text-2xl group-hover:scale-110 transition-transform">
            {shortcut.icon}
          </div>
          <span className="text-xs lg:text-sm font-medium text-gray-900 line-clamp-2">
            {shortcut.label}
          </span>
        </Button>
      ))}
    </div>
  );
}
