/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, DollarSign, FileText, Clock, ArrowRight, AlertCircle, Building2, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/context/useAuth';
import type { ApprovalRequest } from '@/types/admin';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { USER_ROLES } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
    activeReferrals: 0,
  });

  const canViewApprovals = user?.role === USER_ROLES.PRESIDENT || 
                          user?.role === USER_ROLES.VICE_PRESIDENT ||
                          user?.role === USER_ROLES.SUPER_ADMIN;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Firebase integration removed; dashboard data not available from Firestore.
        console.warn('Firebase removed: Admin dashboard metrics are unavailable');
        setStats({
          totalMembers: 0,
          pendingApplications: 0,
          monthlyRevenue: 0,
          activeReferrals: 0,
        });
        setPendingApprovals([]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user, canViewApprovals]);

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
        date = (timestamp as { toDate: () => Date }).toDate();
      } else {
        date = new Date(timestamp as string | number | Date);
      }
      return dayjs(date).fromNow();
    } catch {
      return 'N/A';
    }
  };

  const getTypeLabel = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'member_batch': return 'Member Batch';
      case 'payment': return 'Payment';
      case 'delete_member': return 'Delete Member';
      case 'system_change': return 'System Change';
      case 'role_grant': return 'Role Grant';
      default: return type;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.firstName || 'Admin'}! ({user?.role?.replace('_', ' ').toUpperCase()})
        </p>
      </div>

      {/* Key Metrics - Refined for DMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents Stats can go here */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Documents</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalMembers > 0 ? stats.totalMembers : 0}</p>
                <p className="text-xs text-blue-600 mt-1">Stored in DMS</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Departments</p>
                <p className="text-2xl font-bold text-purple-900">{stats.activeReferrals > 0 ? stats.activeReferrals : 0}</p>
                <p className="text-xs text-purple-600 mt-1">Configured units</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Queue - Only for President/VP/Super Admin */}
      {canViewApprovals && pendingApprovals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/approvals')}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {getTypeLabel(request.type)}
                      </Badge>
                      <span className="text-sm font-medium">{request.requesterName}</span>
                    </div>
                    <p className="text-xs text-gray-600">{request.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/admin/approvals')}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/documents')}
            >
              <FileText className="h-6 w-6" />
              Documents
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/workflows')}
            >
              <ClipboardList className="h-6 w-6" />
              Workflow
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/departments')}
            >
              <Building2 className="h-6 w-6" />
              Departments
            </Button>
            {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/admin/user-management')}
              >
                <Users className="h-6 w-6" />
                Manage Team
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};