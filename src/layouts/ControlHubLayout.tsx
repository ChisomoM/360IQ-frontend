import { Outlet, useLocation, Navigate } from "react-router-dom"
import { useState } from "react"
import type { Document } from "@/types/dms"
import { LayoutDashboard, Building2, Loader2 } from "@/components/icons"
import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import { AppShell } from "@/components/layout/AppShell"
import type { NavEntry } from "@/components/layout/nav"
import { useAuth } from "@/lib/context/useAuth"

export type AdminLayoutContext = {
  analyzeDocument: (doc: Document) => void;
};

const NAV: NavEntry[] = [
  { to: "/controlhub/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    title: "360IQ ControlHub",
    icon: Building2,
    activePaths: ["/controlhub/tenants"],
    items: [
      {
        to: "/controlhub/tenants",
        label: "Tenants",
        icon: Building2,
        isActive: (path) => path === "/controlhub/tenants" || path.startsWith("/controlhub/tenants/"),
      },
    ],
  },
]

export default function ControlHubLayout() {

  const location = useLocation()
  const { isLoading, isAuthenticated, logout } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [pendingAnalysisDoc, setPendingAnalysisDoc] = useState<Document | null>(null)

  // Wait for session restore before redirecting
  if (isLoading) {
    return (
      <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center bg-surface-0">
        <Loader2 size={40} className="animate-spin text-signal-text" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/controlhub/login" replace state={{ from: location }} />
  }

  const analyzeDocument = (doc: Document) => {
    setPendingAnalysisDoc(doc)
    setIsChatOpen(true)
  }

  const handleLogout = () => logout()

  return (
    <>
      <AppShell
        className="controlhub-theme"
        nav={NAV}
        onLogout={handleLogout}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      >
        <Outlet context={{ analyzeDocument } as AdminLayoutContext} />
      </AppShell>

      <AIChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pendingDoc={pendingAnalysisDoc}
        onDocConsumed={() => setPendingAnalysisDoc(null)}
      />
    </>
  )
}
