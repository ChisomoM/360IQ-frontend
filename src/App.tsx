import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop'
import { Toaster } from 'sonner';
import Login from './components/Login';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import AdminLayout from './layouts/AdminLayout';

import { AdminDashboard } from './(admin)/admin/Admin';
import DynamicDashboard from './(admin)/admin/DynamicDashboard';
import RoleAwareDashboard from './(admin)/admin/RoleAwareDashboard';
import DashboardConfiguration from './(admin)/admin/DashboardConfiguration';

// Keeping this import just in case we need to roll back to the old user management
// import TeamManagement from './(admin)/admin/TeamManagement';
import ManageUsers from './(admin)/admin/ManageUsers'; // New User management page
import TeacherManagement from './(admin)/admin/TeacherManagement';
import Referrals from './(admin)/admin/Referrals';
import FinancialsPage from './(admin)/admin/FinancialsPage';
import { AnalyticsDashboard } from './(admin)/admin/AnalyticsDashboard';
import ApprovalsPage from './(admin)/admin/ApprovalsPage';
import RegionManagement from './(admin)/admin/RegionManagement';
import PartnershipPage from './(admin)/admin/PartnershipPage';
import BlogPage from './(admin)/admin/BlogPage';
import Departments from './(admin)/admin/Departments';
import Documents from './(admin)/admin/Documents';
import DocumentDetail from './(admin)/admin/DocumentDetail';
import DocumentCharts from './(admin)/admin/DocumentCharts';
import Workflows from './(admin)/admin/Workflows';
import AuditTrails from './(admin)/admin/AuditTrails';
import HRDashboard from './(admin)/admin/hr/HRDashboard';
import StaffDirectory from './(admin)/admin/hr/StaffDirectory';
import LeaveManagement from './(admin)/admin/hr/LeaveManagement';
import StaffApplications from './(admin)/admin/hr/StaffApplications';
import MySignatures from './(admin)/admin/MySignatures';
import StaffOnboarding from './(public)/staff-onboarding/StaffOnboarding';
import DepartmentDetailPage from './(admin)/admin/DepartmentDetailPage';
// RBAC — Roles & Maker-Checker Pages
import RolesManagement from './(admin)/admin/RolesManagement';
import MakerCheckerPage from './(admin)/admin/MakerCheckerPage';

// ControlHub
import ControlHubLayout from './layouts/ControlHubLayout';
import ControlHubLoginPage from './(controlhub)/ControlHubLoginPage';
import ControlHubDashboard from './(controlhub)/Dashboard';
import TenantsList from './(controlhub)/TenantsList';
import TenantDetail from './(controlhub)/TenantDetail';




function App() {
  return (
    <>
      <ScrollToTop />
      <ChangePasswordModal />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route path="/staff-onboarding" element={<StaffOnboarding />} />
        <Route path="*" element={<div>Page Not Found</div>} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<RoleAwareDashboard />} />
          <Route path="newdashboard" element={<RoleAwareDashboard />} />
          <Route path="legacy-dashboard" element={<AdminDashboard />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="regions" element={<RegionManagement />} />
          {/* We are replacing the old user-management with our shiny new 'users' route, 
              but leaving this commented out just in case we need to roll back. */}
          {/* <Route path="user-management" element={<TeamManagement />} /> */}
          <Route path="users" element={<ManageUsers />} />
          <Route path="teacher-management" element={<TeacherManagement />} />
          <Route path="financials" element={<FinancialsPage />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="reports" element={<AnalyticsDashboard />} />
          <Route path="reports/document-charts" element={<DocumentCharts />} />
          <Route path="partnerships" element={<PartnershipPage />} />
          <Route path="blogs" element={<BlogPage />} />
          <Route path="departments" element={<Departments />} />
          <Route path="departments/:id" element={<DepartmentDetailPage />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="audit-trails" element={<AuditTrails />} />
          <Route path="settings/dashboard-config" element={<DashboardConfiguration />} />

          {/* RBAC Routes */}
          <Route path="roles" element={<RolesManagement />} />
          <Route path="maker-checker" element={<MakerCheckerPage />} />

          {/* HR Routes */}
          <Route path="hr/dashboard" element={<HRDashboard />} />
          <Route path="hr/staff" element={<StaffDirectory />} />
          <Route path="hr/leave" element={<LeaveManagement />} />
          <Route path="hr/applications" element={<StaffApplications />} />
          <Route path="signatures" element={<MySignatures />} />
        </Route>

        {/* ControlHub Routes */}
        <Route path="/controlhub/login" element={<ControlHubLoginPage />} />
        <Route path="/controlhub" element={<ControlHubLayout />}>
          <Route index element={<Navigate to="/controlhub/dashboard" replace />} />
          <Route path="dashboard" element={<ControlHubDashboard />} />
          <Route path="tenants" element={<TenantsList />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App
