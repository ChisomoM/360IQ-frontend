import { Outlet, Link, useLocation, Navigate } from "react-router-dom"
import { useState } from "react"
import type { Document } from "@/types/dms"

export type AdminLayoutContext = {
  analyzeDocument: (doc: Document) => void;
};

import {
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react"
import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { useControlHubAuth } from "@/lib/context/useControlHubAuth"

export default function ControlHubLayout() {

  const location = useLocation()
  const { user, tokens, isLoading, logout } = useControlHubAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDocDetailsOpen, setIsDocDetailsOpen] = useState(false)
  const [pendingAnalysisDoc, setPendingAnalysisDoc] = useState<Document | null>(null)

  // Wait for session restore before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d173b]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c69ff]" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user || !tokens) {
    return <Navigate to="/controlhub/login" replace state={{ from: location }} />
  }

  const analyzeDocument = (doc: Document) => {
    setPendingAnalysisDoc(doc)
    setIsChatOpen(true)
  }

  const isActive = (path: string) => location.pathname === path

  const toggleSidebar = () => setCollapsed(!collapsed)

  const handleLogout = () => logout()

  return (

    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100 controlhub-theme">

      <SidebarProvider>

        <aside
          className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >

          <div className="h-full flex flex-col bg-[#0d173b] text-white shadow-xl">

            <div className="flex items-center justify-center py-6 border-b border-[#7c69ff]/20">
              <img
                src="/logos/avec-logo-light.png"
                alt="Avec Logo"
                className={`transition-all duration-300 ${collapsed ? "h-8 w-8" : "h-12 w-auto"}`}
              />
            </div>

            <button
              onClick={toggleSidebar}
              className="absolute -right-3 top-24 bg-white text-[#7c69ff] rounded-full p-1 shadow-lg"
            >
              {collapsed
                ? <ChevronRight className="h-4 w-4"/>
                : <ChevronLeft className="h-4 w-4"/>
              }
            </button>

            <div className="flex-1 overflow-y-auto p-4">

              <SidebarMenu className="space-y-1">

                <SidebarMenuItem>

                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/controlhub/dashboard")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-[#7c69ff] data-[active=true]:text-white rounded-md"
                  >

                    <Link to="/controlhub/dashboard" className="flex items-center gap-3">

                      <LayoutDashboard className="h-5 w-5"/>

                      {!collapsed && <span>Dashboard</span>}

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>

                {/* Avec ControlHub Section */}
                <div className="px-3 pt-4 pb-1 text-xs text-[#03d8fd] uppercase tracking-wider">
                  {!collapsed && "Avec ControlHub"}
                </div>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/controlhub/tenants") || location.pathname.startsWith("/controlhub/tenants/")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-[#7c69ff] data-[active=true]:text-white rounded-md"
                  >
                    <Link to="/controlhub/tenants" className="flex items-center gap-3">
                      <Building2 className="h-5 w-5"/>
                      {!collapsed && <span>Tenants</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              </SidebarMenu>

            </div>

            <div className="p-4 border-t border-white/10">

              <SidebarMenu>

                <SidebarMenuItem>

                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="text-white hover:bg-white/10 rounded-md"
                  >

                    <LogOut className="h-5 w-5"/>

                    {!collapsed && <span>Log Out</span>}

                  </SidebarMenuButton>

                </SidebarMenuItem>

              </SidebarMenu>

            </div>

          </div>

        </aside>

        <div
          className={`flex-1 transition-all duration-300 ${
            collapsed ? "ml-20" : "ml-64"
          } mr-20`}
        >

          <main className="px-10 py-10 min-h-screen">

            <Outlet context={{ analyzeDocument } as AdminLayoutContext} />

          </main>

        </div>

      </SidebarProvider>

      <AIChatSidebar
        variant="avec"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pendingDoc={pendingAnalysisDoc}
        onDocConsumed={() => setPendingAnalysisDoc(null)}
      />

      <RightSidebar
        variant="avec"
        user={user}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleDocDetails={() => setIsDocDetailsOpen(!isDocDetailsOpen)}
        isDocDetailsOpen={isDocDetailsOpen}
        onLogout={handleLogout}
      />

    </div>

  )

}
