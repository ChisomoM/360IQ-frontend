import type { Ref } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Logo } from '@/components/brand/Logo'
import { LogOut, PanelLeft, X } from '@/components/icons'
import { cn } from '@/lib/utils'
import { CollapsibleSidebarSection } from './CollapsibleSidebarSection'
import { navRowClass, type NavEntry, type NavLink } from './nav'

function NavRow({ item, collapsed }: { item: NavLink; collapsed: boolean }) {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()
  const active = item.isActive ? item.isActive(pathname) : pathname === item.to
  const Icon = item.icon
  const count = item.badge ?? 0

  return (
    <li className="relative">
      <motion.div
        whileHover={reduceMotion ? undefined : { x: 3 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      >
        <Link
          to={item.to}
          aria-current={active ? 'page' : undefined}
          aria-label={item.ariaLabel ?? (collapsed ? item.label : undefined)}
          title={collapsed ? item.label : undefined}
          className={navRowClass(active, collapsed)}
        >
          <span className="relative flex shrink-0">
            <Icon size={18} className={active ? 'text-signal-text' : undefined} />
            {collapsed && count > 0 && <span className="absolute -right-1 -top-1 h-[8px] w-[8px] rounded-full bg-signal" />}
          </span>
          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
          {!collapsed && count > 0 && (
            <span className="rounded-pill bg-signal px-2 py-0.5 text-xs font-semibold leading-none text-on-signal">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      </motion.div>
      {active && (
        <motion.span
          aria-hidden="true"
          layoutId="sidebar-active-bar"
          className="pointer-events-none absolute left-0 top-[calc(50%-10px)] h-[20px] w-[4px] rounded-r-full bg-signal"
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </li>
  )
}

function NavEntries({ entries, collapsed }: { entries: NavEntry[]; collapsed: boolean }) {
  return entries
    .filter((entry) => entry.visible !== false)
    .map((entry) => {
      if (!('items' in entry)) return <NavRow key={entry.to} item={entry} collapsed={collapsed} />
      const GroupIcon = entry.icon
      return (
        <li key={entry.title}>
          <CollapsibleSidebarSection
            title={entry.title}
            icon={<GroupIcon size={18} />}
            collapsed={collapsed}
            activePaths={entry.activePaths}
          >
            {entry.items
              .filter((item) => item.visible !== false)
              .map((item) => <NavRow key={item.to} item={item} collapsed={collapsed} />)}
          </CollapsibleSidebarSection>
        </li>
      )
    })
}

interface AppSidebarProps {
  nav: NavEntry[]
  /** Entries pinned to the bottom of the sidebar. */
  pinnedNav?: NavEntry[]
  /** A tenant's own logo replaces the 360IQ logo. */
  tenantLogo?: { src: string; alt: string }
  collapsed: boolean
  onToggleCollapsed: () => void
  onCloseDrawer: () => void
  closeButtonRef?: Ref<HTMLButtonElement>
  onLogout: () => void
}

/** Dark in both themes: the background follows the page theme, the content is always ink. */
export function AppSidebar({
  nav,
  pinnedNav,
  tenantLogo,
  collapsed,
  onToggleCollapsed,
  onCloseDrawer,
  closeButtonRef,
  onLogout,
}: AppSidebarProps) {
  return (
    <div data-theme="ink" className="flex h-full min-h-0 flex-col text-text-secondary">
      <div
        className={cn(
          'flex h-[64px] shrink-0 items-center border-b border-white/[0.06]',
          collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4',
        )}
      >
        {tenantLogo ? (
          <img
            src={tenantLogo.src}
            alt={tenantLogo.alt}
            className={cn('w-auto object-contain', collapsed ? 'max-h-[40px] max-w-[44px]' : 'max-h-[40px] max-w-[160px]')}
          />
        ) : (
          <Logo size={collapsed ? 40 : 24} stacked={collapsed} />
        )}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onCloseDrawer}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-[var(--sidebar-hover)] hover:text-text-primary lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <motion.nav layoutScroll aria-label="Main" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
        <ul className="space-y-1">
          <NavEntries entries={nav} collapsed={collapsed} />
        </ul>
        {pinnedNav?.some((entry) => entry.visible !== false) && (
          <ul className="mt-auto space-y-1 border-t border-white/[0.06] pt-3">
            <NavEntries entries={pinnedNav} collapsed={collapsed} />
          </ul>
        )}
      </motion.nav>

      <div className="shrink-0 space-y-1 border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={onLogout}
          aria-label={collapsed ? 'Log out' : undefined}
          title={collapsed ? 'Log out' : undefined}
          className={navRowClass(false, collapsed)}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : undefined}
          title={collapsed ? 'Expand sidebar' : undefined}
          className={cn(navRowClass(false, collapsed), 'hidden lg:flex')}
        >
          <PanelLeft size={18} className="shrink-0" />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </div>
  )
}
