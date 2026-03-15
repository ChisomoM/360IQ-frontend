import { Outlet, Link, useLocation } from "react-router-dom"
import { useState } from "react"

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
  Users,
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


                {/* DOCUMENTS */}
                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition">
                  Documents
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


                {/* SYSTEM */}
                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition">
                  System
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

                        <span className="opacity-0 group-hover:opacity-100 transition">
                          User Management
                        </span>

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

            <Outlet />

          </main>

        </div>

      </SidebarProvider>


      <AIChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />


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