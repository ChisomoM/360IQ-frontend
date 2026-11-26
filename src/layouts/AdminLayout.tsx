import { Outlet, Link, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import type { Document } from "@/types/dms"
import { retrieve } from "@/lib/api/crud"
import GatedDashboard from "@/(admin)/onboarding/GatedDashboard"
import {
  LayoutDashboard,
  FileText,
  PieChart,
  Building2,
  Briefcase,
  GitBranch,
  History,
  Wallet,
  BarChart2,
  BarChart3,
  LineChart,
  Users,
  UserCog,
  ClipboardCheck,
  PenLine,
  ShieldCheck,
  UserPlus,
  Inbox,
  Loader2,
} from "@/components/icons"
import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import { AppShell } from "@/components/layout/AppShell"
import type { NavEntry } from "@/components/layout/nav"
import { useAuth } from "@/lib/context/useAuth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { useTenantBranding, useTenantBrandingEffect } from "@/lib/hooks/useTenantBranding"
import { useInboxCount } from "@/lib/hooks/useCaptureInbox"

export type AdminLayoutContext = {
  analyzeDocument: (doc: Document) => void;
  openChat: (doc: Document) => void;
  openAnalysis: (doc: Document) => void;
  sendChatMessage: (message: string) => void;
};

export default function AdminLayout() {

  const { user, logout } = useAuth()
  const { logo, logoUrl, tenantName } = useTenantBranding()

  // Apply tenant branding colors to CSS variables
  useTenantBrandingEffect()
  const canCapture = hasPermission(user, PERMISSIONS['capture.create'])
  const canReviewLeads = hasPermission(user, PERMISSIONS['capture.review'])
  const inboxCount = useInboxCount(canCapture || canReviewLeads)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [pendingAnalysisDoc, setPendingAnalysisDoc] = useState<Document | null>(null)
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)

  const [onboardingState, setOnboardingState] = useState<string>("ACTIVE")
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (!user || user.accountType === "controlhub_admin") {
      setCheckingOnboarding(false)
      return
    }

    const checkOnboardingStatus = async () => {
      try {
        const res: any = await retrieve("ONBOARDING_STATUS")
        if (res && res.state) {
          setOnboardingState(res.state)
        }
      } catch (err) {
        console.error("Failed to fetch onboarding status:", err)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user])

  const analyzeDocument = (doc: Document) => {
    setPendingAnalysisDoc(doc)
    setIsChatOpen(true)
  }

  const sendChatMessage = (message: string) => {
    setPendingChatMessage(message)
    setIsChatOpen(true)
  }

  const handleLogout = () => logout()

  const [initialTab, setInitialTab] = useState<'chat' | 'analyze'>('analyze');

  const openChat = (doc: Document) => {
    setPendingAnalysisDoc(doc);
    setInitialTab('chat');
    setIsChatOpen(true);
  };

  const openAnalysis = (doc: Document) => {
    setPendingAnalysisDoc(doc);
    setInitialTab('analyze');
    setIsChatOpen(true);
  };

  if (checkingOnboarding) {
    return (
      <div role="status" aria-label="Loading" className="flex min-h-screen w-full items-center justify-center bg-surface-0">
        <Loader2 size={40} className="animate-spin text-signal-text" />
      </div>
    )
  }

  if (onboardingState !== "ACTIVE") {
    if (onboardingState === "REGISTERED") {
      return <Navigate to="/onboarding/wizard" replace />
    }
    return <GatedDashboard />
  }

  const inboxLabel = inboxCount > 0 ? `Lead inbox, ${inboxCount} to review` : "Lead inbox"

  // HR, dashboard settings and ControlHub entries are not in the menu; their routes are unchanged.
  const nav: NavEntry[] = [
    {
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: (path) => path === "/admin" || path === "/admin/dashboard",
    },
    // CaptureIQ: Add lead, Lead inbox
    { to: "/admin/capture", label: "Add lead", icon: UserPlus, visible: canCapture },
    {
      to: "/admin/capture/inbox",
      label: "Lead inbox",
      icon: Inbox,
      visible: canCapture || canReviewLeads,
      isActive: (path) => path.startsWith("/admin/capture/") && path !== "/admin/capture",
      badge: inboxCount,
      ariaLabel: inboxLabel,
    },
    // CRM
    {
      to: "/admin/accounts",
      label: "Accounts",
      icon: Building2,
      isActive: (path) => path === "/admin/accounts" || path.startsWith("/admin/accounts"),
    },
    // ProfileIQ: People, Companies
    {
      to: "/admin/people",
      label: "People",
      icon: Users,
      visible: hasPermission(user, PERMISSIONS['profiles.view']),
      isActive: (path) => path.startsWith("/admin/people"),
    },
    {
      to: "/admin/companies",
      label: "Companies",
      icon: Briefcase,
      visible: hasPermission(user, PERMISSIONS['profiles.view']),
      isActive: (path) => path.startsWith("/admin/companies"),
    },
    {
      title: "Documents",
      icon: FileText,
      visible: hasPermission(user, PERMISSIONS['documents.read']),
      activePaths: ["/admin/documents", "/admin/signatures"],
      items: [
        { to: "/admin/documents", label: "Documents", icon: FileText },
        {
          to: "/admin/signatures",
          label: "My signatures",
          icon: PenLine,
          visible: hasPermission(user, PERMISSIONS['documents.sign']),
        },
      ],
    },
    {
      title: "Reports and analytics",
      icon: BarChart2,
      visible: hasPermission(user, PERMISSIONS['analytics.read']),
      activePaths: ["/admin/analytics", "/admin/reports"],
      items: [
        { to: "/admin/analytics", label: "Analytics", icon: LineChart },
        { to: "/admin/reports", label: "Reports builder", icon: BarChart3 },
        { to: "/admin/reports/document-charts", label: "Chart analysis", icon: PieChart },
      ],
    },
    {
      title: "Departments",
      icon: GitBranch,
      visible: hasPermission(user, PERMISSIONS['departments.manage']),
      activePaths: ["/admin/departments"],
      items: [
        { to: "/admin/departments", label: "Manage departments", icon: GitBranch },
      ],
    },
    {
      title: "Financials",
      icon: Wallet,
      visible: hasPermission(user, PERMISSIONS['payments.read']),
      activePaths: ["/admin/finance"],
      items: [
        { to: "/admin/finance/dashboard", label: "Finance dashboard", icon: Wallet },
        { to: "/admin/finance/reports", label: "Finance reports", icon: PieChart },
      ],
    },
  ]

  // Access and system settings stay pinned at the bottom
  const pinnedNav: NavEntry[] = [
    {
      title: "System",
      icon: ShieldCheck,
      visible: hasPermission(user, PERMISSIONS['users.write']) ||
        hasPermission(user, PERMISSIONS['users.read']) ||
        hasPermission(user, PERMISSIONS['audit.read']) ||
        hasPermission(user, PERMISSIONS['roles.manage']) ||
        hasPermission(user, PERMISSIONS['maker_checker.manage']),
      activePaths: ["/admin/users", "/admin/user-management", "/admin/audit-trails", "/admin/roles", "/admin/maker-checker"],
      items: [
        {
          to: "/admin/users",
          label: "User management",
          icon: UserCog,
          visible: hasPermission(user, PERMISSIONS['users.read']),
          isActive: (path) => path === "/admin/users" || path === "/admin/user-management",
        },
        { to: "/admin/audit-trails", label: "Audit trails", icon: History, visible: hasPermission(user, PERMISSIONS['audit.read']) },
        { to: "/admin/roles", label: "Roles", icon: ShieldCheck, visible: hasPermission(user, PERMISSIONS['roles.manage']) },
        { to: "/admin/maker-checker", label: "Maker-checker", icon: ClipboardCheck, visible: hasPermission(user, PERMISSIONS['maker_checker.manage']) },
      ],
    },
  ]

  // phone and tablet shortcuts: the lead inbox and the Add lead entry point
  const captureShortcuts = (
    <>
      {canReviewLeads && (
        <Link
          to="/admin/capture/inbox"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-primary hover:bg-surface-2 lg:hidden"
          aria-label={inboxLabel}
        >
          <Inbox size={20} />
          {inboxCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-pill bg-signal px-1 text-center text-xs font-semibold leading-5 text-on-signal">{inboxCount > 99 ? "99+" : inboxCount}</span>
          )}
        </Link>
      )}
      {canCapture && (
        <Link
          to="/admin/capture"
          aria-label="Add lead"
          className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-signal text-sm font-semibold text-on-signal hover:bg-signal-hover sm:px-4 lg:hidden"
        >
          <UserPlus size={18} />
          <span className="hidden sm:inline">Add lead</span>
        </Link>
      )}
    </>
  )

  return (
    <>
      <AppShell
        nav={nav}
        pinnedNav={pinnedNav}
        tenantLogo={logoUrl ? { src: logo, alt: tenantName } : undefined}
        onLogout={handleLogout}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        topBarActions={captureShortcuts}
      >
        <Outlet context={{ analyzeDocument, openChat, openAnalysis, sendChatMessage } as AdminLayoutContext} />
      </AppShell>

      <AIChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pendingDoc={pendingAnalysisDoc}
        onDocConsumed={() => setPendingAnalysisDoc(null)}
        pendingChatMessage={pendingChatMessage}
        onChatMessageConsumed={() => setPendingChatMessage(null)}
        initialTab={initialTab}
      />
    </>
  )
}
