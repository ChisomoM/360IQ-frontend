import { useNavigate } from 'react-router-dom';
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredShortcuts.map((shortcut) => (
        <button
          type="button"
          key={shortcut.id}
          onClick={() => navigate(shortcut.href)}
          className="flex min-w-0 flex-col items-start gap-2 rounded-lg border border-line bg-surface-1 p-4 text-left shadow-card transition-shadow hover:shadow-card-hover"
        >
          <span className="grid h-10 w-10 place-items-center rounded-sm bg-field text-text-secondary" aria-hidden="true">
            {shortcut.icon}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {shortcut.label}
          </span>
          {shortcut.description && (
            <span className="text-xs text-text-muted">
              {shortcut.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
