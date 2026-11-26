import type { IconComponent } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface NavLink {
  to: string
  label: string
  icon: IconComponent
  /** Result of the permission check. `false` hides the row; leave unset for rows everyone sees. */
  visible?: boolean
  /** Defaults to an exact match on `to`. */
  isActive?: (pathname: string) => boolean
  /** Count shown at the end of the row (a dot when the sidebar is collapsed). */
  badge?: number
  ariaLabel?: string
}

export interface NavGroup {
  title: string
  icon: IconComponent
  /** The group opens itself when the current path starts with one of these. */
  activePaths: string[]
  visible?: boolean
  items: NavLink[]
}

export type NavEntry = NavLink | NavGroup

/** Shared look of every sidebar row (design system 5.2). */
export function navRowClass(active: boolean, collapsed = false) {
  return cn(
    'relative flex h-[3rem] w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-offset-[-2px]',
    active
      ? 'bg-[var(--sidebar-active)] font-semibold text-text-primary'
      : 'text-text-secondary hover:bg-[var(--sidebar-hover)] hover:text-text-primary',
    collapsed && 'justify-center px-0',
  )
}

const PAGE_TITLES: [RegExp, string][] = [
  [/^\/admin(\/(dashboard|newdashboard|demo-dashboard|legacy-dashboard))?$/, 'Dashboard'],
  [/^\/admin\/capture$/, 'Add lead'],
  [/^\/admin\/capture\/inbox$/, 'Lead inbox'],
  [/^\/admin\/capture\/[^/]+$/, 'Review lead'],
  [/^\/admin\/accounts$/, 'Accounts'],
  [/^\/admin\/accounts\/[^/]+$/, 'Account'],
  [/^\/admin\/people$/, 'People'],
  [/^\/admin\/people\/[^/]+$/, 'Person'],
  [/^\/admin\/companies$/, 'Companies'],
  [/^\/admin\/companies\/[^/]+$/, 'Company'],
  [/^\/admin\/documents$/, 'Documents'],
  [/^\/admin\/documents\/[^/]+$/, 'Document'],
  [/^\/admin\/signatures$/, 'My signatures'],
  [/^\/admin\/analytics$/, 'Analytics'],
  [/^\/admin\/reports$/, 'Reports builder'],
  [/^\/admin\/reports\/document-charts$/, 'Chart analysis'],
  [/^\/admin\/reports\/financial-charts$/, 'Financial charts'],
  [/^\/admin\/departments$/, 'Departments'],
  [/^\/admin\/departments\/[^/]+$/, 'Department'],
  [/^\/admin\/users$/, 'User management'],
  [/^\/admin\/audit-trails$/, 'Audit trails'],
  [/^\/admin\/roles$/, 'Roles'],
  [/^\/admin\/maker-checker$/, 'Maker-checker'],
  [/^\/admin\/workflows$/, 'Workflows'],
  [/^\/admin\/settings\/dashboard-config$/, 'Dashboard settings'],
  [/^\/admin\/hr\/dashboard$/, 'HR dashboard'],
  [/^\/admin\/hr\/staff$/, 'Staff directory'],
  [/^\/admin\/hr\/leave$/, 'Leave management'],
  [/^\/admin\/hr\/applications$/, 'Staff applications'],
  [/^\/controlhub(\/dashboard)?$/, 'Dashboard'],
  [/^\/controlhub\/tenants$/, 'Tenants'],
  [/^\/controlhub\/tenants\/[^/]+$/, 'Tenant'],
]

/** Top bar title, derived from the route. */
export function getPageTitle(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/'
  return PAGE_TITLES.find(([pattern]) => pattern.test(path))?.[1] ?? '360IQ'
}

/** The signed-in user's own role name; slugs such as `super_admin` read as "Super admin". */
export function formatRoleName(role: unknown) {
  if (typeof role !== 'string') return null
  const name = role.replace(/_+/g, ' ').trim()
  if (!name) return null
  return name === name.toLowerCase() ? name.charAt(0).toUpperCase() + name.slice(1) : name
}
