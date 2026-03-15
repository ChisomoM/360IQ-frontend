import { Outlet, Link, useLocation } from "react-router-dom"
import { useState } from "react"

import {
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"

import {
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileText,
  DollarSign,
  Building2,
  History
} from "lucide-react"

import { BarChart3 } from "lucide-react"
import { TopNavBar } from "@/components/TopNavBar"
import { useAuth } from "@/lib/context/useAuth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export default function AdminLayout() {

  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const toggleSidebar = () => setCollapsed(!collapsed)

  const handleLogout = () => logout()

  return (

    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100">

      <SidebarProvider>

        <aside
          className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >

          <div className="h-full flex flex-col bg-gradient-to-b from-[#1e5631] to-[#184626] text-white shadow-xl">

            <div className="flex items-center justify-center py-6 border-b border-green-800">

              <img
                src="/logos/unilus-logo-3.png"
                alt="UNILUS"
                className={`transition-all duration-300 ${
                  collapsed ? "h-8" : "h-14"
                }`}
              />

            </div>

            <button
              onClick={toggleSidebar}
              className="absolute -right-3 top-24 bg-white text-[#1e5631] rounded-full p-1 shadow-lg"
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
                    isActive={isActive("/admin") || isActive("/admin/dashboard")}
                    className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                  >

                    <Link to="/admin/dashboard" className="flex items-center gap-3">

                      <LayoutDashboard className="h-5 w-5"/>

                      {!collapsed && <span>Dashboard</span>}

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>

                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "Student Management"}
                </div>

                <SidebarMenuItem>

                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/students")}
                    className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                  >

                    <Link to="/admin/students" className="flex items-center gap-3">

                      <GraduationCap className="h-5 w-5"/>

                      {!collapsed && <span>Students</span>}

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>

                <SidebarMenuItem>

                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/payments")}
                    className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                  >

                    <Link to="/admin/payments" className="flex items-center gap-3">

                      <DollarSign className="h-5 w-5"/>

                      {!collapsed && <span>Payments</span>}

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>

                {(hasPermission(user, PERMISSIONS.VIEW_ANALYTICS) ||
                  hasPermission(user, PERMISSIONS.VIEW_ENROLLMENT_ANALYTICS) ||
                  hasPermission(user, PERMISSIONS.VIEW_APPLICATION_ANALYTICS) ||
                  hasPermission(user, PERMISSIONS.VIEW_PROGRAM_ANALYTICS)) && (

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

                )}

                <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "System"}
                </div>

                <SidebarMenuItem>

                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/documents")}
                    className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                  >

                    <Link to="/admin/documents" className="flex items-center gap-3">

                      <FileText className="h-5 w-5"/>

                      {!collapsed && <span>Documents</span>}

                    </Link>

                  </SidebarMenuButton>

                </SidebarMenuItem>

                {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (

                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/departments")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >

                      <Link to="/admin/departments" className="flex items-center gap-3">

                        <Building2 className="h-5 w-5"/>

                        {!collapsed && <span>Departments</span>}

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                )}

                {hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS) && (

                  <SidebarMenuItem>

                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin/audit-trails")}
                      className="text-white hover:bg-green-700 data-[active=true]:bg-[#febb00] data-[active=true]:text-black rounded-md"
                    >

                      <Link to="/admin/audit-trails" className="flex items-center gap-3">

                        <History className="h-5 w-5"/>

                        {!collapsed && <span>Audit Trails</span>}

                      </Link>

                    </SidebarMenuButton>

                  </SidebarMenuItem>

                )}

              </SidebarMenu>

            </div>

            <div className="p-4 border-t border-green-800">

              <SidebarMenu>

                <SidebarMenuItem>

                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="text-white hover:bg-green-700 rounded-md"
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
          }`}
        >

          <TopNavBar />

          <main className="pt-24 px-10 pb-10 min-h-screen">

            <Outlet />

          </main>

        </div>

      </SidebarProvider>

    </div>

  )

}