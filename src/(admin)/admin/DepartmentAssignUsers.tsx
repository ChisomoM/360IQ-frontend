import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserCircle, Search, Trash2, CheckCircle } from '@/components/icons';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
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
    <div className="space-y-4 pt-4 border-t border-line">
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-1">Members</h4>
        <p className="text-xs text-text-muted mb-3">
          Choose who belongs to this department and who leads it.
        </p>

        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            aria-label="Search users to assign"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border border-line rounded-md max-h-[200px] overflow-y-auto">
          {loading ? (
            <TableSkeleton rows={3} columns={2} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-xs text-text-muted">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredUsers.map(user => {
                const isAssigned = assignedMemberIds.has(user.id);
                const isHead = currentHeadId === user.id;

                return (
                  <div key={user.id} className={`flex items-center justify-between gap-2 p-3 ${isAssigned ? 'bg-surface-2' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <UserCircle size={28} className={`shrink-0 ${isAssigned ? 'text-signal-text' : 'text-text-muted'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAssigned ? (
                        <>
                          <Button
                            size="sm"
                            type="button"
                            variant={isHead ? "default" : "secondary"}
                            aria-pressed={isHead}
                            onClick={() => onHeadChange(isHead ? undefined : user.id)}
                            title={isHead ? "Currently the department head" : "Make department head"}
                          >
                            {isHead && <CheckCircle />}
                            {isHead ? 'Head' : 'Make head'}
                          </Button>
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 text-risk hover:text-risk hover:bg-risk-tint"
                            onClick={() => handleToggleMember(user.id)}
                            title="Remove from department"
                            aria-label="Remove from department"
                          >
                            <Trash2 />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => handleToggleMember(user.id)}
                        >
                          Add member
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
