import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop'
import { Toaster } from './components/ui/sonner';
import Login from './components/Login';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import AdminLayout from './layouts/AdminLayout';

import { AdminDashboard } from './(admin)/admin/Admin';
import DynamicDashboard from './(admin)/admin/DynamicDashboard';
import RoleAwareDashboard from './(admin)/admin/RoleAwareDashboard';
import DashboardConfiguration from './(admin)/admin/DashboardConfiguration';


import ManageUsers from './(admin)/admin/ManageUsers'; // New User management page
import { AnalyticsDashboard } from './(admin)/admin/AnalyticsDashboard';
import ReportsPage from './(admin)/admin/ReportsPage';
import Departments from './(admin)/admin/Departments';
// import Documents from './(admin)/admin/Documents';
import DocumentDetail from './(admin)/admin/DocumentDetail';
import DocumentCharts from './(admin)/admin/DocumentCharts';
import FinancialCharts from './(admin)/admin/FinancialCharts';
import Workflows from './(admin)/admin/Workflows';
import AuditTrails from './(admin)/admin/AuditTrails';
import HRDashboard from './(admin)/admin/hr/HRDashboard';
import StaffDirectory from './(admin)/admin/hr/StaffDirectory';
import LeaveManagement from './(admin)/admin/hr/LeaveManagement';
import StaffApplications from './(admin)/admin/hr/StaffApplications';
import MySignatures from './(admin)/admin/MySignatures';
import StaffOnboarding from './(public)/staff-onboarding/StaffOnboarding';
import LogoExploration from './(public)/logo-exploration/LogoExploration';
import ClaimInvitation from './(public)/onboarding/ClaimInvitation';
import OnboardingWizard from './(public)/onboarding/OnboardingWizard';
import DepartmentDetailPage from './(admin)/admin/DepartmentDetailPage';
import { AccountsList } from './(admin)/admin/accounts/AccountsList';
import { AccountDetail } from './(admin)/admin/accounts/AccountDetail';
import { PeopleList } from './(admin)/admin/profiles/PeopleList';
import { PersonDetail } from './(admin)/admin/profiles/PersonDetail';
import { CompaniesList } from './(admin)/admin/profiles/CompaniesList';
import { CompanyDetail } from './(admin)/admin/profiles/CompanyDetail';
import { AddLead } from './(admin)/admin/captures/AddLead';
import { Inbox as LeadInbox } from './(admin)/admin/captures/Inbox';
import { CaptureReview } from './(admin)/admin/captures/CaptureReview';
// RBAC — Roles & Maker-Checker Pages
import RolesManagement from './(admin)/admin/RolesManagement';
import MakerCheckerPage from './(admin)/admin/MakerCheckerPage';
import DocumentsV2 from './(admin)/admin/DocumentsV2';
// import DocumentsPremium from './(admin)/admin/DocumentsPremium';
import DemoDashboard from './(admin)/admin/Dashboard';

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

        <Route path="/onboarding/claim" element={<ClaimInvitation />} />
        <Route path="/onboarding/wizard" element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        } />

        <Route path="/staff-onboarding" element={<StaffOnboarding />} />
        <Route path="/logo-exploration" element={<LogoExploration />} />
        <Route path="*" element={<div>Page Not Found</div>} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DemoDashboard />} />
          <Route path="newdashboard" element={<RoleAwareDashboard />} />
          <Route path="demo-dashboard" element={<DemoDashboard />} />
          <Route path="legacy-dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/document-charts" element={<DocumentCharts />} />
          <Route path="reports/financial-charts" element={<FinancialCharts />} />
          <Route path="departments" element={<Departments />} />
          <Route path="departments/:id" element={<DepartmentDetailPage />} />
          <Route path="accounts" element={<AccountsList />} />
          <Route path="accounts/:id" element={<AccountDetail />} />
          <Route path="people" element={<PeopleList />} />
          <Route path="people/:id" element={<PersonDetail />} />
          <Route path="companies" element={<CompaniesList />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="capture" element={<AddLead />} />
          <Route path="capture/inbox" element={<LeadInbox />} />
          <Route path="capture/:id" element={<CaptureReview />} />
          <Route path="documents" element={<DocumentsV2 />} />
          {/* <Route path="documents-premium" element={<DocumentsPremium />} /> */}
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="audit-trails" element={<AuditTrails />} />
          <Route path="settings/dashboard-config" element={<DashboardConfiguration />} />

          {/* RBAC Routes */}
          <Route path="roles" element={<RolesManagement />} />
          <Route path="maker-checker" element={<MakerCheckerPage />} />
{/* Finance Routes */}
          {/* <Route path="finance/dashboard" element={<FinanceDashboard />} />
          <Route path="finance/payments" element={<PaymentManagement />} />
          <Route path="finance/reports" element={<FinanceReports />} /> */}
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
      <Toaster position="top-right" />
    </>
  );
}

export default App
