import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserCircle, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchData } from '@/lib/api/crud';
import { toast } from 'sonner';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DepartmentAssignUsersProps {
  departmentId: string | null;
  currentHeadId: string | null;
  onHeadChange: (userId: string | undefined) => void;
}

export function DepartmentAssignUsers({
  departmentId,
  currentHeadId,
  onHeadChange,
}: DepartmentAssignUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Added assigned members logic here since the user wants to add/remove members
  // along with setting the department head
  const [assignedMemberIds, setAssignedMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only fetch users when the component mounts
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        // Using the USERS endpoint from end_points.tsx
        const res = await fetchData('USERS', 'GET', {}, null, { limit: '100' });
        if (Array.isArray(res)) {
          setUsers(res);
        } else if (res?.data) {
          setUsers(res.data);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        toast.error('Could not load users list.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    // Fetch assigned users for this department
    if (!departmentId) return;

    const fetchAssigned = async () => {
      try {
        // We use DEPARTMENT_DETAIL to figure out who is already assigned
        const deptDetail = await fetchData('DEPARTMENT_DETAIL', 'GET', { id: departmentId });
        if (deptDetail?.users) {
          const ids = new Set<string>();
          deptDetail.users.forEach((u: any) => ids.add(u.id));
          setAssignedMemberIds(ids);
        }
      } catch (error) {
        console.error('Failed to load department users:', error);
      }
    };
    fetchAssigned();
  }, [departmentId]);

  const handleToggleMember = async (userId: string) => {
    if (!departmentId) return;
    
    const isCurrentlyAssigned = assignedMemberIds.has(userId);
    try {
      if (isCurrentlyAssigned) {
        // If they are the head, clear them first
        if (currentHeadId === userId) {
          onHeadChange(undefined);
        }
        await fetchData('DEPARTMENT_USERS', 'DELETE', { id: departmentId }, { user_id: userId });
        setAssignedMemberIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        toast.success('Member removed');
      } else {
        await fetchData('DEPARTMENT_USERS', 'POST', { id: departmentId }, { user_id: userId });
        setAssignedMemberIds(prev => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
        toast.success('Member added');
      }
    } catch (error) {
      toast.error('Failed to update membership');
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(search.toLowerCase()) || 
    u.last_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pt-4 border-t">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Assigned Members</h4>
        <p className="text-xs text-gray-500 mb-3">
          Manage who belongs to this department and select the department head.
        </p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search users to assign..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="border rounded-md max-h-[200px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map(user => {
                const isAssigned = assignedMemberIds.has(user.id);
                const isHead = currentHeadId === user.id;

                return (
                  <div key={user.id} className={`flex items-center justify-between p-3 ${isAssigned ? 'bg-green-50/50' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <UserCircle className={`h-8 w-8 shrink-0 ${isAssigned ? 'text-green-600' : 'text-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAssigned ? (
                        <>
                          <Button
                            size="sm"
                            type="button"
                            variant={isHead ? "default" : "outline"}
                            className={isHead ? "bg-[#febb00] text-[#1e3c21] hover:bg-[#e8a900] h-7 text-xs" : "h-7 text-xs"}
                            onClick={() => onHeadChange(isHead ? undefined : user.id)}
                            title={isHead ? "Currently the Department Head" : "Make Department Head"}
                          >
                            {isHead ? 'Dept Head' : 'Make Head'}
                          </Button>
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleToggleMember(user.id)}
                            title="Remove from department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => handleToggleMember(user.id)}
                        >
                          Add to Dept
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
