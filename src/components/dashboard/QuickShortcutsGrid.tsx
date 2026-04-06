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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
      {filteredShortcuts.map((shortcut, idx) => (
        <button
          key={shortcut.id}
          onClick={() => navigate(shortcut.href)}
          aria-label={shortcut.description || shortcut.label}
          className="group relative h-auto flex flex-col items-center justify-center gap-3 py-6 lg:py-8 px-3 lg:px-4 rounded-xl bg-white border border-slate-200/50 shadow-premium-sm hover:shadow-premium-lg transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 active:translate-y-0"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {/* Background gradient on hover */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Icon wrapper */}
          <div className="relative text-3xl lg:text-4xl text-primary group-hover:scale-125 transition-transform duration-300">
            {shortcut.icon}
          </div>
          
          {/* Label */}
          <span className="relative text-xs lg:text-sm font-semibold text-slate-900 line-clamp-2 text-center group-hover:text-primary transition-colors">
            {shortcut.label}
          </span>
          
          {/* Description (optional, on hover) */}
          {shortcut.description && (
            <span className="relative text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center line-clamp-1">
              {shortcut.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
