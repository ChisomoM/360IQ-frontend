import Home from './(public)/home/home'
import Contact from './(public)/contact/contact-us'
import AboutPage from './(public)/about/AboutPage';
import EcosPage from './(public)/ecos/EcosPage';
import BlogList from './(public)/blog/BlogList';
import BlogDetail from './(public)/blog/BlogDetail';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop'
import { Toaster } from 'sonner';
import Login from './components/Login';
import JoinPage from './(public)/join/JoinPage';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import AdminLayout from './layouts/AdminLayout';
import { AdminDashboard } from './(admin)/admin/Admin';
import JoinApplications from './(admin)/admin/JoinApplications';
import Students from './(admin)/admin/students';
import StudentProfile from './(admin)/admin/StudentProfile';
import MyApplication from './(student)/student/my-application';
import MyPayments from './(student)/student/my-payments';

import TeamManagement from './(admin)/admin/TeamManagement';
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
import Workflows from './(admin)/admin/Workflows';
import AuditTrails from './(admin)/admin/AuditTrails';
import FinanceDashboard from './(admin)/finance/FinanceDashboard';
import PaymentManagement from './(admin)/finance/PaymentManagement';
import FinanceReports from './(admin)/finance/FinanceReports';
import TeacherLayout from './layouts/TeacherLayout';
import AffiliatesPage from './(teacher)/dashboard/AffiliatesPage';


import TeacherDashboard from './(teacher)/dashboard/TeacherDashboard';
import FinancesPage from './(teacher)/dashboard/FinancesPage';
import PartnershipsPage from './(teacher)/dashboard/PartnershipsPage';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './(student)/student/dashboard';


function App() {
  return (
    <>
    <ScrollToTop/>
    <ChangePasswordModal />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/ecos" element={<EcosPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="*" element={<div>Page Not Found</div>} />

      {/* Teacher Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <TeacherLayout />
        </ProtectedRoute>
      }>
        <Route index element={<TeacherDashboard />} />
        <Route path="finances" element={<FinancesPage />} />
        <Route path="affiliates" element={<AffiliatesPage />} />
        <Route path="partnerships" element={<PartnershipsPage />} />
        <Route path="partnerships" element={<PartnershipsPage />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="my-application" element={<MyApplication />} />
        <Route path="my-payments" element={<MyPayments />} />
      </Route>





      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="join-applications" element={<JoinApplications />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="regions" element={<RegionManagement />} />
        <Route path="user-management" element={<TeamManagement />} />
        <Route path="teacher-management" element={<TeacherManagement />} />
        <Route path="financials" element={<FinancialsPage />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="reports" element={<AnalyticsDashboard />} />
        <Route path="partnerships" element={<PartnershipPage />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="departments" element={<Departments />} />
        <Route path="documents" element={<Documents />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="audit-trails" element={<AuditTrails />} />
        
        {/* Finance Routes */}
        <Route path="finance/dashboard" element={<FinanceDashboard />} />
        <Route path="finance/payments" element={<PaymentManagement />} />
        <Route path="finance/reports" element={<FinanceReports />} />
      </Route>
    </Routes>
    <Toaster position="top-right" richColors />
    </>
  );
}

export default App
