import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Users, Calendar, Edit2, Loader2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import type { DepartmentDetail, DepartmentUser } from '@/types/dms';
import { format } from 'date-fns';

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dept, setDept] = useState<DepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = hasPermission(user, PERMISSIONS['departments.manage']);

  useEffect(() => {
    if (!id) return;
    const loadDepartment = async () => {
      try {
        setLoading(true);
        const data = await fetchData('DEPARTMENT_DETAIL', 'GET', { id });
        setDept(data);
      } catch (error) {
        console.error('Failed to load department:', error);
        toast.error('Could not load this department.');
        navigate('/admin/departments');
      } finally {
        setLoading(false);
      }
    };
    loadDepartment();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-10 w-10 animate-spin text-[#1e3c21]" />
      </div>
    );
  }

  if (!dept) return null;

  const head = dept.users?.find(u => u.id === dept.head_of_dept_id);
  const members = dept.users?.filter(u => u.id !== dept.head_of_dept_id) ?? [];

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), 'd MMM yyyy, HH:mm'); }
    catch { return dateStr; }
  };

  return (
    <div className="w-full space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/departments')}
          className="hover:text-[#1e3c21]"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Departments
        </Button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 font-medium">{dept.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-[#1e3c21] flex items-center justify-center shrink-0">
            <Building className="h-7 w-7 text-[#febb00]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dept.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                {dept.code}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {dept.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit redirects back to departments list with the modal opened via state */}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/departments', { state: { editId: dept.id } })}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Metadata card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            Department Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-500 font-medium">Description</dt>
              <dd className="text-gray-900 mt-0.5">{dept.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Department Head</dt>
              <dd className="text-gray-900 mt-0.5">
                {head ? `${head.first_name} ${head.last_name}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Created</dt>
              <dd className="text-gray-900 mt-0.5">{formatDate(dept.created_at)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Last Updated</dt>
              <dd className="text-gray-900 mt-0.5">{formatDate(dept.updated_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Assigned users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            Assigned Members ({(dept.users?.length ?? 0)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!dept.users || dept.users.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No members assigned to this department yet.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Department head gets a highlighted row */}
              {head && (
                <UserRow user={head} isHead />
              )}
              {members.map(m => <UserRow key={m.id} user={m} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserRow({ user, isHead = false }: { user: DepartmentUser; isHead?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${isHead ? 'bg-[#1e3c21]/5 border border-[#1e3c21]/10' : 'bg-gray-50'}`}>
      <UserCircle className={`h-8 w-8 shrink-0 ${isHead ? 'text-[#1e3c21]' : 'text-gray-400'}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {user.first_name} {user.last_name}
          {isHead && (
            <span className="ml-2 text-xs font-medium bg-[#febb00]/20 text-[#7a5c00] px-1.5 py-0.5 rounded">
              Dept Head
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
      {user.role && (
        <span className="text-xs text-gray-400 shrink-0">{user.role}</span>
      )}
    </div>
  );
}
