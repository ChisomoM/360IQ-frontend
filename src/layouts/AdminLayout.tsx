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
  FileText,
  CreditCard,
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
} from "lucide-react"

import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { useAuth } from "@/lib/context/useAuth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export default function AdminLayout() {

  const location = useLocation()
  const { user, logout } = useAuth()

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDocDetailsOpen, setIsDocDetailsOpen] = useState(false)
  const [pendingAnalysisDoc, setPendingAnalysisDoc] = useState<Document | null>(null)

  const analyzeDocument = (doc: Document) => {
    setPendingAnalysisDoc(doc)
    setIsChatOpen(true)
  }

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => logout()

  return (

    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100">

      <SidebarProvider>

        {/* SIDEBAR */}
        <aside className="group fixed left-0 top-0 h-screen w-20 hover:w-64 transition-all duration-300 z-40">

          <div className="h-full flex flex-col bg-gradient-to-b from-[#1e5631] to-[#184626] text-white shadow-xl">

            {/* LOGO */}
            <div className="flex items-center justify-center py-6 border-b border-green-800">

              <img
                src="/logos/unilus-logo-3.png"
                alt="UNILUS"
                className="h-10 group-hover:h-14 transition-all duration-300"
              />

            </div>


            <div className="flex-1 overflow-y-auto p-3">

              <SidebarMenu className="space-y-1">


                {/* DASHBOARD */}
                <SidebarMenuItem>

                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin") || isActive("/admin/dashboard")}
                    className="relative flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                  >

                    <Link to="/admin/dashboard">

                      <LayoutDashboard className="h-5 w-5"/>

                      <span className="opacity-0 group-hover:opacity-100 transition">
                        Dashboard
                      </span>

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>


                {/* FINANCIALS */}
                {hasPermission(user, PERMISSIONS.VIEW_ALL_FINANCIALS) && (<>

                  <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition">
                    Financials
                  </div>

                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/finance/dashboard")}
                      className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                    >

                      <Link to="/admin/finance/dashboard">

                        <Wallet className="h-5 w-5"/>

                        <span className="opacity-0 group-hover:opacity-100 transition">
                          Finance Dashboard
                        </span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>


                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/finance/payments")}
                      className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                    >

                      <Link to="/admin/finance/payments">

                        <CreditCard className="h-5 w-5"/>

                        <span className="opacity-0 group-hover:opacity-100 transition">
                          Payments
                        </span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>


                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/finance/reports")}
                      className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                    >

                      <Link to="/admin/finance/reports">

                        <PieChart className="h-5 w-5"/>

                        <span className="opacity-0 group-hover:opacity-100 transition">
                          Finance Reports
                        </span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                </>)}

                {/* HR Section */}
                {(hasPermission(user, PERMISSIONS.HR_STAFF_VIEW) ||
                  hasPermission(user, PERMISSIONS.HR_LEAVE_VIEW)) && (<>

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
                        <BarChart3 className="h-5 w-5"/>
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
                        <UserCog className="h-5 w-5"/>
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
                        <ClipboardList className="h-5 w-5"/>
                        {!collapsed && <span>Leave Management</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {hasPermission(user, PERMISSIONS.HR_APPLICATIONS_VIEW) && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive("/admin/hr/applications")}
                        className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                      >
                        <Link to="/admin/hr/applications" className="flex items-center gap-3">
                          <ClipboardCheck className="h-5 w-5"/>
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
                    className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                  >

                    <Link to="/admin/documents">

                      <FileText className="h-5 w-5"/>

                      <span className="opacity-0 group-hover:opacity-100 transition">
                        Documents
                      </span>

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>

                {/* Reports & Analytics Section */}
                {(hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) ||
                  hasPermission(user, PERMISSIONS.VIEW_ENROLLMENT_ANALYTICS) ||
                  hasPermission(user, PERMISSIONS.VIEW_APPLICATION_ANALYTICS) ||
                  hasPermission(user, PERMISSIONS.VIEW_PROGRAM_ANALYTICS)) && (<>

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

                        <BarChart3 className="h-5 w-5"/>

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

                        <BarChart2 className="h-5 w-5"/>

                        {!collapsed && <span>Chart Analysis</span>}

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                </>)}

                {/* System Section */}
                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "System"}
                </div>


                {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (

                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/departments")}
                      className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                    >

                      <Link to="/admin/departments">

                        <Building2 className="h-5 w-5"/>

                        <span className="opacity-0 group-hover:opacity-100 transition">
                          Departments
                        </span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                )}


                {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (

                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/user-management")}
                      className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                    >

                      <Link to="/admin/user-management">

                        <Users className="h-5 w-5"/>

                        {!collapsed && <span>Administrators</span>}

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                )}


                {hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS) && (

                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/audit-trails")}
                      className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2 transition-all hover:shadow-[0_0_10px_rgba(254,187,0,0.6)] data-[active=true]:bg-[#febb00] data-[active=true]:text-black"
                    >

                      <Link to="/admin/audit-trails">

                        <History className="h-5 w-5"/>

                        <span className="opacity-0 group-hover:opacity-100 transition">
                          Audit Trails
                        </span>

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                )}

              </SidebarMenu>

            </div>


            {/* LOGOUT */}
            <div className="p-4 border-t border-green-800">

              <SidebarMenu>

                <SidebarMenuItem>

                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-white hover:bg-green-700 rounded-md px-3 py-2"
                  >

                    <LogOut className="h-5 w-5"/>

                    <span className="opacity-0 group-hover:opacity-100 transition">
                      Log Out
                    </span>

                  </SidebarMenuButton>

                </SidebarMenuItem>

              </SidebarMenu>

            </div>

          </div>

        </aside>


        {/* MAIN CONTENT */}
        <div className="flex-1 ml-20">

          <main className="px-10 py-10 min-h-screen">

            <Outlet context={{ analyzeDocument } as AdminLayoutContext} />

          </main>

        </div>

      </SidebarProvider>

      {/* AI Chat Floating Panel */}
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