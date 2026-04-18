import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSidebarSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  activePaths?: string[];
}

/**
 * CollapsibleSidebarSection
 * 
 * A smart collapsible section for sidebar menus that:
 * - Auto-expands when a child route is active
 * - Smoothly slides open/closed with animations
 * - Respects parent sidebar collapsed state (icon-only mode)
 * - Works on desktop and mobile
 */
export function CollapsibleSidebarSection({
  title,
  icon,
  children,
  collapsed = false,
  activePaths = [],
}: CollapsibleSidebarSectionProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Smart expansion: auto-open if any active path matches
  useEffect(() => {
    const isChildActive = activePaths.some((path) =>
      location.pathname === path || location.pathname.startsWith(path)
    );
    setIsOpen(isChildActive);
  }, [location.pathname, activePaths]);

  const toggleOpen = () => setIsOpen(!isOpen);

  // When parent sidebar is collapsed, don't show the dropdown
  if (collapsed) {
    return (
      <div className="flex items-center justify-center p-2" title={title}>
        {icon}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Section Header - Clickable to toggle */}
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 350, damping: 10 }}
      >
        <button
          onClick={toggleOpen}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2",
            "text-xs uppercase tracking-wider font-bold",
            "text-white/50 hover:text-white/70 transition-colors duration-200",
            "hover:bg-white/3 rounded-sm",
            isOpen && "text-white/80 bg-white/5"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 h-4 w-4 flex items-center justify-center opacity-70">{icon}</span>
            <span className="truncate text-xs">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-3 w-3 flex-shrink-0 transition-transform duration-300 opacity-60",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      </motion.div>

      {/* Collapsible Content - Slide animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-1 pl-4 space-y-2 pt-2 pb-2 border-l border-white/10">{children}</div>
      </div>
    </div>
  );
}
