import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { list } from '@/lib/api/crud';
import { UserPermissionOverrides } from '@/components/rbac/UserPermissionOverrides';
import type { UserPermissionOverride, Permission } from '@/types/rbac';

interface UserPermissionsSheetProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserPermissionsSheet({ userId, isOpen, onClose }: UserPermissionsSheetProps) {
  const [overrides, setOverrides] = useState<UserPermissionOverride[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overridesData, permissionsData] = await Promise.all([
        list('USER_PERMISSIONS', { id: userId }),
        list('LIST_PERMISSIONS'),
      ]);
      setOverrides(overridesData ?? []);
      setAllPermissions(permissionsData ?? []);
    } catch (err) {
      setError('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sheet slides from right */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Manage Permissions</h3>
          <button title="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <UserPermissionOverrides
              userId={userId}
              userPermissions={overrides}
              allPermissions={allPermissions}
              onAssign={(permId, granted) => {
                const perm = allPermissions.find((p) => String(p.id) === permId);
                if (!perm) return;
                setOverrides((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    userId,
                    permission: perm,
                    granted,
                  },
                ]);
              }}
              onRevoke={(permId) => {
                setOverrides((prev) =>
                  prev.filter((o) => String(o.permission.id) !== permId)
                );
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}