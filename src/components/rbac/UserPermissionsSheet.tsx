import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SectionBody } from '@/components/shared/SectionBody';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Manage permissions</SheetTitle>
          <SheetDescription>Changes save as you make them.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <SectionBody
            loading={isLoading}
            error={error}
            onRetry={loadData}
            skeleton={<TableSkeleton rows={8} columns={1} />}
          >
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
          </SectionBody>
        </div>
      </SheetContent>
    </Sheet>
  );
}