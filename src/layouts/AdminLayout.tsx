import { Outlet, Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Document } from "@/types/dms"

export type AdminLayoutContext = {
  analyzeDocument: (doc: Document) => void;
  openChat: (doc: Document) => void;
  openAnalysis: (doc: Document) => void;
  sendChatMessage: (message: string) => void;
};

import {
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { CollapsibleSidebarSection } from "@/components/layout/CollapsibleSidebarSection"
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
  ShieldCheck,
  Settings,
} from "lucide-react"
import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { useAuth } from "@/lib/context/useAuth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { useTenantBranding, useTenantBrandingEffect } from "@/lib/hooks/useTenantBranding"

export default function AdminLayout() {

  const location = useLocation()
  const { user, logout } = useAuth()
  const { logo, logoUrl, tenantName } = useTenantBranding()

  // Apply tenant branding colors to CSS variables
  useTenantBrandingEffect()
  const [collapsed, setCollapsed] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDocDetailsOpen, setIsDocDetailsOpen] = useState(false)
  const [pendingAnalysisDoc, setPendingAnalysisDoc] = useState<Document | null>(null)
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(null)

  const analyzeDocument = (doc: Document) => {
    setPendingAnalysisDoc(doc)
    setIsChatOpen(true)
  }

  const sendChatMessage = (message: string) => {
    setPendingChatMessage(message)
    setIsChatOpen(true)
  }

  const isActive = (path: string) => location.pathname === path
  const toggleSidebar = () => setCollapsed(!collapsed)
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

  return (
    <div className="min-h-screen flex bg-surface-0">
      <SidebarProvider>
        <aside
          className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${collapsed ? "w-20" : "w-64"
            }`}
        >
          <div className="h-full flex flex-col bg-brand-ink bg-[image:var(--gradient-sidebar)] text-white shadow-xl">

            <div className="flex items-center justify-center py-6 border-b border-white/10">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    key="brand"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {logoUrl ? (
                      <img
                        src={logo}
                        alt={tenantName}
                        className="h-12 w-auto"
                      />
                    ) : (
                      <img
                        src="/logos/logo/360IQ-horizontal-transparent-for-dark.png"
                        alt={tenantName}
                        className="h-20 w-auto -my-4"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              onClick={toggleSidebar}
              className="absolute -right-3 top-24 bg-white text-primary rounded-full p-1 shadow-lg border border-primary/20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </motion.button>

            <div className="flex-1 overflow-y-auto p-4">
              <SidebarMenu className="space-y-3">

                {/* Dashboard */}
                <SidebarMenuItem>
                  {(isActive("/admin") || isActive("/admin/dashboard")) && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-md bg-secondary"
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/admin") || isActive("/admin/dashboard")}
                      className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                    >
                      <Link to="/admin/dashboard" className="flex items-center gap-3">
                        <LayoutDashboard className="h-5 w-5" />
                        {!collapsed && <span>Dashboard</span>}
                      </Link>
                    </SidebarMenuButton>
                  </motion.div>
                </SidebarMenuItem>

                {/* Financials Section */}
                {hasPermission(user, PERMISSIONS['payments.read']) && (
                  <CollapsibleSidebarSection
                    title="Financials"
                    icon={<Wallet className="h-5 w-5" />}
                    collapsed={collapsed}
                    activePaths={["/admin/finance"]}
                  >
                    <SidebarMenu className="space-y-2">
                      <SidebarMenuItem>
                        {isActive("/admin/finance/dashboard") && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-md bg-secondary"
                            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/finance/dashboard")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                          >
                            <Link to="/admin/finance/dashboard" className="flex items-center gap-3">
                              <Wallet className="h-5 w-5" />
                              {!collapsed && <span>Finance Dashboard</span>}
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        {isActive("/admin/finance/reports") && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-md bg-secondary"
                            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/finance/reports")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                          >
                            <Link to="/admin/finance/reports" className="flex items-center gap-3">
                              <PieChart className="h-5 w-5" />
                              {!collapsed && <span>Finance Reports</span>}
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleSidebarSection>
                )}

                {/* HR Section */}
                {/* {(hasPermission(user, PERMISSIONS['hr.staff.read']) ||
                  hasPermission(user, PERMISSIONS['hr.leave.read'])) && (
                    <CollapsibleSidebarSection
                      title="Human Resources"
                      icon={<BarChart3 className="h-5 w-5" />}
                      collapsed={collapsed}
                      activePaths={["/admin/hr"]}
                    >
                      <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/hr/dashboard")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors"
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
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors"
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
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors"
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
                              className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors"
                            >
                              <Link to="/admin/hr/applications" className="flex items-center gap-3">
                                <ClipboardCheck className="h-5 w-5" />
                                {!collapsed && <span>Staff Applications</span>}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                      </SidebarMenu>
                    </CollapsibleSidebarSection>
                  )} */}

                {/* Documents Section */}
                {hasPermission(user, PERMISSIONS['documents.read']) && (
                <CollapsibleSidebarSection
                  title="Documents"
                  icon={<FileText className="h-5 w-5" />}
                  collapsed={collapsed}
                  activePaths={["/admin/documents", "/admin/signatures"]}
                >
                  <SidebarMenu className="space-y-2">
                    <SidebarMenuItem>
                      {isActive("/admin/documents") && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-md bg-secondary"
                          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        />
                      )}
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                      >
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/admin/documents")}
                          className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                        >
                          <Link to="/admin/documents" className="flex items-center gap-3">
                            <FileText className="h-5 w-5" />
                            {!collapsed && <span>Documents</span>}
                          </Link>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                    {hasPermission(user, PERMISSIONS['documents.sign']) && (
                    <SidebarMenuItem>
                      {isActive("/admin/signatures") && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-md bg-secondary"
                          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        />
                      )}
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                      >
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/admin/signatures")}
                          className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                        >
                          <Link to="/admin/signatures" className="flex items-center gap-3">
                            <PenLine className="h-5 w-5" />
                            {!collapsed && <span>My Signatures</span>}
                          </Link>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </CollapsibleSidebarSection>
                )}

                {/* Reports & Analytics Section */}
                {hasPermission(user, PERMISSIONS['analytics.read']) && (
                  <CollapsibleSidebarSection
                    title="Reports & Analytics"
                    icon={<BarChart2 className="h-5 w-5" />}
                    collapsed={collapsed}
                    activePaths={["/admin/analytics", "/admin/reports"]}
                  >
                    <SidebarMenu className="space-y-2">
                      <SidebarMenuItem>
                        {isActive("/admin/analytics") && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-md bg-secondary"
                            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/analytics")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                          >
                            <Link to="/admin/analytics" className="flex items-center gap-3">
                              <BarChart2 className="h-5 w-5" />
                              {!collapsed && <span>Analytics</span>}
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        {isActive("/admin/reports") && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-md bg-secondary"
                            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/reports")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                          >
                            <Link to="/admin/reports" className="flex items-center gap-3">
                              <BarChart3 className="h-5 w-5" />
                              {!collapsed && <span>Reports Builder</span>}
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        {isActive("/admin/reports/document-charts") && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-md bg-secondary"
                            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/reports/document-charts")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                          >
                            <Link to="/admin/reports/document-charts" className="flex items-center gap-3">
                              <BarChart2 className="h-5 w-5" />
                              {!collapsed && <span>Chart Analysis</span>}
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleSidebarSection>
                )}

                {/* Departments Section */}
                {hasPermission(user, PERMISSIONS['departments.manage']) && (
                  <CollapsibleSidebarSection
                    title="Departments"
                    icon={<Building2 className="h-5 w-5" />}
                    collapsed={collapsed}
                    activePaths={["/admin/departments"]}
                  >
                    <SidebarMenu className="space-y-2">
                      <SidebarMenuItem>
                        {isActive("/admin/departments") && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 rounded-md bg-secondary"
                            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          />
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive("/admin/departments")}
                            className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                          >
                            <Link to="/admin/departments" className="flex items-center gap-3">
                              <Building2 className="h-5 w-5" />
                              {!collapsed && <span>Manage Departments</span>}
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleSidebarSection>
                )}

                {/* System Section */}
                {(hasPermission(user, PERMISSIONS['users.write']) ||
                  hasPermission(user, PERMISSIONS['users.read']) ||
                  hasPermission(user, PERMISSIONS['audit.read']) ||
                  hasPermission(user, PERMISSIONS['roles.manage']) ||
                  hasPermission(user, PERMISSIONS['maker_checker.manage'])) && (
                    <CollapsibleSidebarSection
                      title="System"
                      icon={<ShieldCheck className="h-5 w-5" />}
                      collapsed={collapsed}
                      activePaths={["/admin/users", "/admin/user-management", "/admin/audit-trails", "/admin/roles", "/admin/maker-checker"]}
                    >
                      <SidebarMenu className="space-y-2">
                        {hasPermission(user, PERMISSIONS['users.read']) && (
                          <SidebarMenuItem>
                            {isActive("/admin/user-management") && (
                              <motion.div
                                layoutId="sidebar-active-pill"
                                className="absolute inset-0 rounded-md bg-secondary"
                                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                              />
                            )}
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isActive("/admin/user-management")}
                                className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                              >
                                <Link to="/admin/users" className="flex items-center gap-3">
                                  <Users className="h-5 w-5" />
                                  {!collapsed && <span>User Management</span>}
                                </Link>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        )}
                        {hasPermission(user, PERMISSIONS['audit.read']) && (
                          <SidebarMenuItem>
                            {isActive("/admin/audit-trails") && (
                              <motion.div
                                layoutId="sidebar-active-pill"
                                className="absolute inset-0 rounded-md bg-secondary"
                                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                              />
                            )}
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isActive("/admin/audit-trails")}
                                className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                              >
                                <Link to="/admin/audit-trails" className="flex items-center gap-3">
                                  <History className="h-5 w-5" />
                                  {!collapsed && <span>Audit Trails</span>}
                                </Link>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        )}
                        {hasPermission(user, PERMISSIONS['roles.manage']) && (
                          <SidebarMenuItem>
                            {isActive("/admin/roles") && (
                              <motion.div
                                layoutId="sidebar-active-pill"
                                className="absolute inset-0 rounded-md bg-secondary"
                                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                              />
                            )}
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isActive("/admin/roles")}
                                className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                              >
                                <Link to="/admin/roles" className="flex items-center gap-3">
                                  <ShieldCheck className="h-5 w-5" />
                                  {!collapsed && <span>Roles</span>}
                                </Link>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        )}
                        {hasPermission(user, PERMISSIONS['maker_checker.manage']) && (
                          <SidebarMenuItem>
                            {isActive("/admin/maker-checker") && (
                              <motion.div
                                layoutId="sidebar-active-pill"
                                className="absolute inset-0 rounded-md bg-secondary"
                                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                              />
                            )}
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 10 }}
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isActive("/admin/maker-checker")}
                                className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors relative z-10"
                              >
                                <Link to="/admin/maker-checker" className="flex items-center gap-3">
                                  <ClipboardCheck className="h-5 w-5" />
                                  {!collapsed && <span>Maker-Checker</span>}
                                </Link>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        )}
                      </SidebarMenu>
                    </CollapsibleSidebarSection>
                  )}

                {/* Admin Settings Section */}
                {/* {hasPermission(user, PERMISSIONS['configure_dashboard_cards']) && (
                  <CollapsibleSidebarSection
                    title="Administration"
                    icon={<Settings className="h-5 w-5" />}
                    collapsed={collapsed}
                    activePaths={["/admin/settings"]}
                  >
                    <SidebarMenu className="space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/admin/settings/dashboard-config")}
                          className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md transition-colors"
                        >
                          <Link to="/admin/settings/dashboard-config" className="flex items-center gap-3">
                            <Settings className="h-5 w-5" />
                            {!collapsed && <span>Dashboard Config</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleSidebarSection>
                )} */}

                {/* ControlHub Section */}
                {/* <div className="px-3 pt-4 pb-1 text-xs text-yellow-200 uppercase tracking-wider">
                  {!collapsed && "360IQ ControlHub"}
                </div> 
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/controlhub/dashboard")}
                    className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md"
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
                    className="text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white data-[active=true]:shadow-[inset_3px_0_0_#19C3A6] rounded-md"
                  >
                    <Link to="/admin/controlhub/tenants" className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
                      {!collapsed && <span>Tenants</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem> */}

              </SidebarMenu>
            </div>

            <div className="p-4 border-t border-white/10">
              <SidebarMenu>
                <SidebarMenuItem>
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="rounded-md"
                  >
                    <SidebarMenuButton
                      onClick={handleLogout}
                      className="text-white hover:bg-white/10 rounded-md transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      {!collapsed && <span>Log Out</span>}
                    </SidebarMenuButton>
                  </motion.div>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

          </div>
        </aside>

        <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"} mr-20`}>
          <main className="px-10 py-10 min-h-screen">
            <Outlet context={{ analyzeDocument, openChat, openAnalysis, sendChatMessage } as AdminLayoutContext} />
          </main>
        </div>

      </SidebarProvider>

      <AIChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pendingDoc={pendingAnalysisDoc}
        onDocConsumed={() => setPendingAnalysisDoc(null)}
        pendingChatMessage={pendingChatMessage}
        onChatMessageConsumed={() => setPendingChatMessage(null)}
        initialTab={initialTab}
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