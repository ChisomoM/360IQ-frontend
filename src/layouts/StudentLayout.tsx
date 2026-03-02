import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, CreditCard, User, LogOut, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { TopNavBar } from '@/components/TopNavBar';
import { useAuth } from '@/lib/context/useAuth';

export default function StudentLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Top Navigation Bar */}
      <TopNavBar />

      {/* Main Content Area with Sidebar */}
      <div className="pt-16">
        <SidebarProvider>
          {/* Vertical Sidebar */}
          <div 
            className={`fixed top-20 left-4 h-[calc(100vh-6rem)] z-40 transition-all duration-300 ${
              isCollapsed ? 'w-20' : 'w-64'
            }`}
          >
            <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col relative">
              {/* Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 bg-white text-[#172E70] rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors z-50 border border-gray-200"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>

              <div className="flex-1 overflow-y-auto">
                <SidebarMenu className="space-y-1">
                  {/* Dashboard */}
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive('/student/dashboard')}
                      className={`text-gray-600 hover:bg-blue-50 hover:text-[#172E70] data-[active=true]:bg-[#172E70] data-[active=true]:text-white rounded-lg transition-colors ${
                        isCollapsed ? 'justify-center px-2' : ''
                      }`}
                      title={isCollapsed ? 'Dashboard' : ''}
                    >
                      <Link to="/student/dashboard" className="flex items-center gap-3">
                        <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>Dashboard</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                   {/* My Application */}
                   <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive('/student/my-application')}
                      className={`text-gray-600 hover:bg-blue-50 hover:text-[#172E70] data-[active=true]:bg-[#172E70] data-[active=true]:text-white rounded-lg transition-colors ${
                        isCollapsed ? 'justify-center px-2' : ''
                      }`}
                      title={isCollapsed ? 'My Application' : ''}
                    >
                      <Link to="/student/my-application" className="flex items-center gap-3">
                        <FileText className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>My Application</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Payments */}
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive('/student/my-payments')}
                      className={`text-gray-600 hover:bg-blue-50 hover:text-[#172E70] data-[active=true]:bg-[#172E70] data-[active=true]:text-white rounded-lg transition-colors ${
                        isCollapsed ? 'justify-center px-2' : ''
                      }`}
                      title={isCollapsed ? 'Payments' : ''}
                    >
                      <Link to="/student/my-payments" className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>Payments</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Documents (Optional/Future) */}
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive('/student/documents')}
                      className={`text-gray-600 hover:bg-blue-50 hover:text-[#172E70] data-[active=true]:bg-[#172E70] data-[active=true]:text-white rounded-lg transition-colors ${
                        isCollapsed ? 'justify-center px-2' : ''
                      }`}
                      title={isCollapsed ? 'My Documents' : ''}
                    >
                      <Link to="/student/documents" className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>Documents</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                </SidebarMenu>
              </div>

               <div className="pt-4 border-t border-gray-200">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={handleLogout}
                      className={`text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors ${
                        isCollapsed ? 'justify-center px-2' : ''
                      }`}
                      title={isCollapsed ? 'Log Out' : ''}
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>Log Out</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

            </div>
          </div>

          {/* Main content area */}
          <div 
            className={`flex-1 transition-all duration-300 ${
              isCollapsed ? 'ml-28' : 'ml-72'
            }`}
          >
            <main className="p-8 min-h-[calc(100vh-4rem)]">
              <Outlet />
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
