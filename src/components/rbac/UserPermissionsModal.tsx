import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-display-sm text-gray-900">
                Manage Permissions
              </h1>
              <p className="font-sans text-text-sm text-gray-600 mt-1">
                Configure permission overrides for {userName}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
              >
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-red-700 text-sm font-semibold mb-2">Error Loading Permissions</p>
                <p className="text-red-600 text-text-sm mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="h-10"
                >
                  Retry
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-semibold">Permissions Override</p>
                  <p className="text-xs mt-1 text-blue-700">
                    Grant or deny specific permissions for {userName}. These overrides take precedence over role-based permissions.
                  </p>
                </div>

                {allPermissions.length === 0 ? (
                  <p className="text-sm text-gray-600">No permissions available</p>
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
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {resource}
                              </p>
                              <span className="text-xs text-gray-400">
                                {selectedCount} of {resourcePermsIds.length}
                              </span>
                            </div>
                            <Button
                              onClick={() => toggleAllInResource(resourcePermsIds)}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              disabled={isSubmitting}
                            >
                              {allSelectedInResource ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pl-2">
                            {perms.map((perm) => {
                              const permId = String(perm.id);
                              const isChecked = selectedPermissions.includes(permId);
                              return (
                                <label
                                  key={perm.id}
                                  className="flex items-start gap-2 text-sm cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(permId)}
                                    disabled={isSubmitting}
                                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                                  />
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-gray-700 font-medium leading-tight">
                                      {perm.action}
                                    </span>
                                    {perm.description && (
                                      <span className="text-gray-400 text-xs leading-tight">
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
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 mt-6">
                      💡 Tip: Override permissions are automatically saved and take precedence over role-based permissions.
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="flex gap-3 border-t border-gray-200 bg-gray-50 px-8 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 bg-primary text-primary-foreground hover:bg-primary-dark"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
