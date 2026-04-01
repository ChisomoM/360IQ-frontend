import { Outlet, Link, useLocation } from "react-router-dom"
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
  FileText,
  PieChart,
  Building2,
  History,
  Wallet,
  BarChart3,
  BarChart2,
  Users,
  UserCog,
  ClipboardList,
  ClipboardCheck,
  PenLine,
} from "lucide-react"
import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { useAuth } from "@/lib/context/useAuth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export default function AdminLayout() {

  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDocDetailsOpen, setIsDocDetailsOpen] = useState(false)
  const [pendingAnalysisDoc, setPendingAnalysisDoc] = useState<Document | null>(null)

  const analyzeDocument = (doc: Document) => {
    setPendingAnalysisDoc(doc)
    setIsChatOpen(true)
  }

  const isActive = (path: string) => location.pathname === path
  const toggleSidebar = () => setCollapsed(!collapsed)
  const handleLogout = () => logout()

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <SidebarProvider>
        <aside
          className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${collapsed ? "w-20" : "w-64"
            }`}
        >
          <div className="h-full flex flex-col bg-[#0d173b] text-white shadow-xl">

            <div className="flex items-center justify-center py-6 border-b border-green-800">
              <img
                src={location.pathname.startsWith("/admin/controlhub") ? "/logos/avec-logo-light.png" : "/logos/unilus-logo-3.png"}
                alt="Logo"
                className={`transition-all duration-300 ${collapsed ? "h-8 w-8" : "h-12 w-auto"}`}
              />
            </div>

            <button
              onClick={toggleSidebar}
              className="absolute -right-3 top-24 bg-white text-[#7c69ff] rounded-full p-1 shadow-lg"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="flex-1 overflow-y-auto p-4">
              <SidebarMenu className="space-y-1">

                {/* Dashboard */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin") || isActive("/admin/dashboard")}
                    className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                  >
                    <Link to="/admin/dashboard" className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5" />
                      {!collapsed && <span>Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Financials Section */}
                {hasPermission(user, PERMISSIONS['payments.read']) && (<>
                  <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                    {!collapsed && "Financials"}
                  </div>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/finance/dashboard")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/finance/dashboard" className="flex items-center gap-3">
                        <Wallet className="h-5 w-5" />
                        {!collapsed && <span>Finance Dashboard</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/finance/reports")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/finance/reports" className="flex items-center gap-3">
                        <PieChart className="h-5 w-5" />
                        {!collapsed && <span>Finance Reports</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>)}

                {/* HR Section */}
                {(hasPermission(user, PERMISSIONS['hr.staff.read']) ||
                  hasPermission(user, PERMISSIONS['hr.leave.read'])) && (<>
                    <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                      {!collapsed && "Human Resources"}
                    </div>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive("/admin/hr/dashboard")}
                        className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                      >
                        <Link to="/admin/hr/dashboard" className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5" />
                          {!collapsed && <span>HR Dashboard</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive("/admin/hr/staff")}
                        className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                      >
                        <Link to="/admin/hr/staff" className="flex items-center gap-3">
                          <UserCog className="h-5 w-5" />
                          {!collapsed && <span>Staff Directory</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive("/admin/hr/leave")}
                        className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                      >
                        <Link to="/admin/hr/leave" className="flex items-center gap-3">
                          <ClipboardList className="h-5 w-5" />
                          {!collapsed && <span>Leave Management</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {hasPermission(user, PERMISSIONS['hr.staff.read']) && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/admin/hr/applications")}
                          className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                        >
                          <Link to="/admin/hr/applications" className="flex items-center gap-3">
                            <ClipboardCheck className="h-5 w-5" />
                            {!collapsed && <span>Staff Applications</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </>)}

                {/* Documents Section */}
                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "Documents"}
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/documents")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-[#7c69ff] data-[active=true]:text-white rounded-md"
                  >
                    <Link to="/admin/documents" className="flex items-center gap-3">
                      <FileText className="h-5 w-5" />
                      {!collapsed && <span>Documents</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/signatures")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-[#7c69ff] data-[active=true]:text-white rounded-md"
                  >
                    <Link to="/admin/signatures" className="flex items-center gap-3">
                      <PenLine className="h-5 w-5" />
                      {!collapsed && <span>My Signatures</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Reports & Analytics Section */}
                {hasPermission(user, PERMISSIONS['analytics.read']) && (<>
                  <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                    {!collapsed && "Reports & Analytics"}
                  </div>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/reports")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/reports" className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5" />
                        {!collapsed && <span>Reports</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/reports/document-charts")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/reports/document-charts" className="flex items-center gap-3">
                        <BarChart2 className="h-5 w-5" />
                        {!collapsed && <span>Chart Analysis</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>)}

                {/* System Section */}
                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "System"}
                </div>
                {hasPermission(user, PERMISSIONS['users.write']) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/departments")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/departments" className="flex items-center gap-3">
                        <Building2 className="h-5 w-5" />
                        {!collapsed && <span>Departments</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {hasPermission(user, PERMISSIONS['users.write']) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/user-management")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/user-management" className="flex items-center gap-3">
                        <Users className="h-5 w-5" />
                        {!collapsed && <span>Administrators</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {hasPermission(user, PERMISSIONS['audit.read']) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/audit-trails")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >
                      <Link to="/admin/audit-trails" className="flex items-center gap-3">
                        <History className="h-5 w-5" />
                        {!collapsed && <span>Audit Trails</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* ControlHub Section */}
                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "Avec ControlHub"}
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/controlhub/dashboard")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-[#7c69ff] data-[active=true]:text-white rounded-md"
                  >
                    <Link to="/admin/controlhub/dashboard" className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5" />
                      {!collapsed && <span>CH Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/controlhub/tenants") || location.pathname.startsWith("/admin/controlhub/tenants/")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-[#7c69ff] data-[active=true]:text-white rounded-md"
                  >
                    <Link to="/admin/controlhub/tenants" className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
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
                    className="text-white hover:bg-green-700 rounded-md"
                  >
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span>Log Out</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

          </div>
        </aside>

        <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"} mr-20`}>
          <main className="px-10 py-10 min-h-screen">
            <Outlet context={{ analyzeDocument } as AdminLayoutContext} />
          </main>
        </div>

      </SidebarProvider>

      <AIChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pendingDoc={pendingAnalysisDoc}
        onDocConsumed={() => setPendingAnalysisDoc(null)}
      />

      <RightSidebar
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleDocDetails={() => setIsDocDetailsOpen(!isDocDetailsOpen)}
        isDocDetailsOpen={isDocDetailsOpen}
        onLogout={handleLogout}
      />

    </div>
  )
}