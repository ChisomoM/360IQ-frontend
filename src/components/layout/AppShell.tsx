import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/lib/context/useAuth'
import { cn } from '@/lib/utils'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'
import { formatRoleName, getPageTitle, type NavEntry } from './nav'

/** Below this width the sidebar is a drawer. */
const DESKTOP_QUERY = '(min-width: 1024px)'

interface AppShellProps {
  nav: NavEntry[]
  pinnedNav?: NavEntry[]
  tenantLogo?: { src: string; alt: string }
  onLogout: () => void
  isChatOpen: boolean
  onToggleChat: () => void
  topBarActions?: ReactNode
  className?: string
  /** The routed page. */
  children: ReactNode
}

/** Sidebar, top bar and main area shared by the tenant app and ControlHub (design system 5.2). */
export function AppShell({
  nav,
  pinnedNav,
  tenantLogo,
  onLogout,
  isChatOpen,
  onToggleChat,
  topBarActions,
  className,
  children,
}: AppShellProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const [collapsedPref, setCollapsed] = useState(false)
  // phones and tablets get a slide-over menu instead of the fixed sidebar
  const [isDesktop, setIsDesktop] = useState(() => typeof window === 'undefined' || window.matchMedia(DESKTOP_QUERY).matches)
  const [mobileNav, setMobileNav] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const on = () => {
      setIsDesktop(mq.matches)
      if (mq.matches) setMobileNav(false)
    }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => setMobileNav(false), [pathname])

  const collapsed = collapsedPref && isDesktop
  const drawerOpen = mobileNav && !isDesktop
  const drawerHidden = !isDesktop && !mobileNav

  // move focus into the drawer when it opens, and back to the menu button when it closes
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  useEffect(() => {
    if (!drawerOpen) {
      if (wasOpen.current) menuButtonRef.current?.focus()
      wasOpen.current = false
      return
    }
    wasOpen.current = true
    closeButtonRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNav(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('flex h-dvh overflow-hidden bg-surface-0 text-text-primary', className)}>
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main')?.focus()
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface-1 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-primary focus:shadow-raised"
        >
          Skip to content
        </a>

        {drawerOpen && (
          <div className="fixed inset-0 z-30 bg-brand-ink/50" aria-hidden="true" onClick={() => setMobileNav(false)} />
        )}

        <aside
          id="main-navigation"
          inert={drawerHidden ? true : undefined}
          aria-hidden={drawerHidden ? true : undefined}
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-[224px] shrink-0 border-r border-white/[0.06] bg-[var(--sidebar-bg)] transition-[transform,width] duration-300 ease-spring motion-reduce:transition-none lg:static lg:translate-x-0',
            mobileNav ? 'translate-x-0' : '-translate-x-full',
            collapsed && 'lg:w-[64px]',
          )}
        >
          <AppSidebar
            nav={nav}
            pinnedNav={pinnedNav}
            tenantLogo={tenantLogo}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed(!collapsedPref)}
            onCloseDrawer={() => setMobileNav(false)}
            closeButtonRef={closeButtonRef}
            onLogout={onLogout}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col" inert={drawerOpen ? true : undefined}>
          <TopBar
            title={getPageTitle(pathname)}
            roleName={formatRoleName(user?.role || user?.roleSlug)}
            menuOpen={mobileNav}
            onOpenMenu={() => setMobileNav(true)}
            menuButtonRef={menuButtonRef}
            isChatOpen={isChatOpen}
            onToggleChat={onToggleChat}
            actions={topBarActions}
            onLogout={onLogout}
          />
          <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-auto focus-visible:outline-none">
            <div className="mx-auto w-full max-w-[1440px] px-6 py-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
