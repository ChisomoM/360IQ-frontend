import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle } from '@/components/icons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { toast } from 'sonner';
import { list, post, remove } from '@/lib/api/crud';
import type { UserPermissionOverride, Permission } from '@/types/rbac';

interface UserPermissionsModalProps {
  userId: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserPermissionsModal({ userId, userName = 'User', isOpen, onClose }: UserPermissionsModalProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissionOverride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        list('USER_PERMISSIONS', { userId }),
        list('LIST_PERMISSIONS'),
      ]);
      setUserPermissions(overridesData ?? []);
      setAllPermissions(permissionsData ?? []);
      // Initialize selected permissions from user's overrides
      setSelectedPermissions((overridesData ?? []).map((o) => String(o.permission.id)));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(errorMsg);
      console.error('Error loading permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadData();
  };

  const togglePermission = async (permId: string) => {
    const newSelected = selectedPermissions.includes(permId)
      ? selectedPermissions.filter(id => id !== permId)
      : [...selectedPermissions, permId];
    
    setSelectedPermissions(newSelected);

    setIsSubmitting(true);
    try {
      if (newSelected.includes(permId)) {
        // Grant permission
        await post('USER_PERMISSIONS', { permissionId: permId, granted: true }, { userId });
        toast.success('Permission granted');
      } else {
        // Revoke permission
        await remove('USER_PERMISSIONS', { userId, permId });
        toast.success('Permission removed');
      }
    } catch (err) {
      // Revert on error
      setSelectedPermissions(selectedPermissions);
      toast.error(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAllInResource = (resourcePermsIds: string[]) => {
    const allSelectedInResource = resourcePermsIds.every(id => selectedPermissions.includes(id));
    
    if (allSelectedInResource) {
      // Deselect all in resource
      setSelectedPermissions(prev => 
        prev.filter(id => !resourcePermsIds.includes(id))
      );
    } else {
      // Select all in resource
      setSelectedPermissions(prev => [
        ...prev,
        ...resourcePermsIds.filter(id => !prev.includes(id))
      ]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage permissions</DialogTitle>
          <DialogDescription>Permission overrides for {userName}.</DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TableSkeleton rows={6} columns={2} />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                role="alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-8 text-center"
              >
                <AlertTriangle size={24} className="text-risk" />
                <p className="text-sm font-semibold text-text-primary">Could not load permissions</p>
                <p className="max-w-[44ch] text-sm text-text-secondary">{error}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRetry}
                >
                  Try again
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="rounded-md bg-field p-4 text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary">Overrides</p>
                  <p className="text-xs mt-1">
                    Grant or remove single permissions for {userName}. Changes save at once and take priority over role permissions.
                  </p>
                </div>

                {allPermissions.length === 0 ? (
                  <p className="text-sm text-text-muted">No permissions available.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(
                      allPermissions.reduce<Record<string, typeof allPermissions>>((acc, perm) => {
                        if (!acc[perm.resource]) acc[perm.resource] = [];
                        acc[perm.resource].push(perm);
                        return acc;
                      }, {})
                    ).map(([resource, perms]) => {
                      const resourcePermsIds = perms.map(p => String(p.id));
                      const allSelectedInResource = resourcePermsIds.length > 0 && resourcePermsIds.every(id => 
                        selectedPermissions.includes(id)
                      );
                      const selectedCount = resourcePermsIds.filter(id => selectedPermissions.includes(id)).length;

                      return (
                        <div key={resource}>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <p className="text-xs font-semibold text-text-muted uppercase tracking-[.04em]">
                                {resource}
                              </p>
                              <span className="font-mono text-xs text-text-muted">
                                {selectedCount} of {resourcePermsIds.length}
                              </span>
                            </div>
                            <Button
                              onClick={() => toggleAllInResource(resourcePermsIds)}
                              variant="ghost"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              {allSelectedInResource ? 'Clear all' : 'Select all'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                            {perms.map((perm) => {
                              const permId = String(perm.id);
                              const isChecked = selectedPermissions.includes(permId);
                              return (
                                <label
                                  key={perm.id}
                                  className="flex items-start gap-2 text-sm cursor-pointer group"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => togglePermission(permId)}
                                    disabled={isSubmitting}
                                    className="mt-0.5"
                                  />
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-text-primary font-medium leading-tight">
                                      {perm.action}
                                    </span>
                                    {perm.description && (
                                      <span className="text-text-muted text-xs leading-tight">
                                        {perm.description}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-3 border-t border-line pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            <ChevronLeft />
            Close
          </Button>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
