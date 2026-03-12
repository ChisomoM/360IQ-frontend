import Home from './(public)/home/home'
import Contact from './(public)/contact/contact-us'
import AboutPage from './(public)/about/AboutPage';
import BlogList from './(public)/blog/BlogList';
import BlogDetail from './(public)/blog/BlogDetail';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop'
import { Toaster } from 'sonner';
import Login from './components/Login';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import AdminLayout from './layouts/AdminLayout';
import { AdminDashboard } from './(admin)/admin/Admin';
// Join application removed after pivot
import Students from './(admin)/admin/students';
import StudentProfile from './(admin)/admin/StudentProfile';

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




function App() {
  return (
    <>
    <ScrollToTop/>
    <ChangePasswordModal />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      {/* Join page removed */}
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="*" element={<div>Page Not Found</div>} />


      {/* Student routes removed */}





      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* Join applications admin page removed */}
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
