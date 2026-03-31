import { Dashboard } from '@/components/dashboard/Dashboard';

export const AdminDashboard = () => {
  // Mock departments and categories - replace with real API calls
  const departments = [
    { id: 'finance', name: 'Finance' },
    { id: 'hr', name: 'HR' },
    { id: 'legal', name: 'Legal' },
    { id: 'marketing', name: 'Marketing' },
  ];

  const categories = [
    { id: 'financial', name: 'Financial' },
    { id: 'payroll', name: 'Payroll' },
    { id: 'policy', name: 'Policy' },
    { id: 'contract', name: 'Contract' },
  ];

  return <Dashboard departments={departments} categories={categories} />;
};