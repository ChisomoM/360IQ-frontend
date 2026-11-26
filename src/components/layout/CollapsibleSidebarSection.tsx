import { useState, useEffect, useId, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from '@/components/icons';
import { cn } from '@/lib/utils';
import { navRowClass } from './nav';

interface CollapsibleSidebarSectionProps {
  title: string;
  icon: ReactNode;
  /** Sidebar rows (`<li>` elements). */
  children: ReactNode;
  collapsed?: boolean;
  activePaths?: string[];
}

/**
 * A collapsible group of sidebar rows. It opens itself when a child route is active.
 * In the collapsed (icon only) sidebar the child rows show directly, so every page stays reachable.
 */
export function CollapsibleSidebarSection({
  title,
  icon,
  children,
  collapsed = false,
  activePaths = [],
}: CollapsibleSidebarSectionProps) {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const contentId = useId();
  const isChildActive = activePaths.some((path) => pathname === path || pathname.startsWith(path));
  const [isOpen, setIsOpen] = useState(isChildActive);

  // Smart expansion: follow the route
  useEffect(() => {
    setIsOpen(isChildActive);
  }, [pathname, isChildActive]);

  if (collapsed) {
    return (
      <ul aria-label={title} className="space-y-1 border-t border-white/[0.06] pt-1">
        {children}
      </ul>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        whileHover={reduceMotion ? undefined : { x: 3 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      >
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className={cn(navRowClass(false), isChildActive && 'text-text-primary')}
        >
          <span className="flex shrink-0">{icon}</span>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          <ChevronDown
            size={16}
            className={cn('shrink-0 transition-transform duration-300', isOpen && 'rotate-180')}
          />
        </button>
      </motion.div>

      <div
        id={contentId}
        inert={!isOpen}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-spring',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="ml-5 space-y-1 border-l border-white/[0.06] py-1 pl-2">{children}</ul>
      </div>
    </div>
  );
}
