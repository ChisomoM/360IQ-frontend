import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Plus, Search, Loader2, Building2, X, MoreVertical, ArrowUpDown, Users, Pencil, Trash2, Eye, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import type { Department } from '@/types/dms';
import { DepartmentAssignUsers } from './DepartmentAssignUsers';

// Field validation runs before any network call
interface FormErrors {
  name?: string;
  code?: string;
  description?: string;
  head_of_dept_id?: string;
}

// Shape of both create and edit forms
interface DeptFormData {
  name: string;
  code: string;
  description: string;
  head_of_dept_id?: string;
}

const EMPTY_FORM: DeptFormData = { name: '', code: '', description: '' };
const PAGE_SIZE = 10;

// Maps common backend error strings to messages a normal person can understand
function mapApiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
    return 'A department with that code already exists.';
  }
  if (msg.toLowerCase().includes('not found')) {
    return 'Department not found — it may have already been removed.';
  }
  if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  return msg || 'Something went wrong. Please try again.';
}

function validateForm(data: DeptFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) {
    errors.name = 'Department name is required.';
  }
  if (!data.code.trim()) {
    errors.code = 'Department code is required.';
  } else if (!/^[A-Z]{2,8}$/.test(data.code.trim())) {
    errors.code = 'Code must be 2–8 uppercase letters (e.g. CS, FIN, REGIS).';
  }
  if (data.description && data.description.length > 200) {
    errors.description = 'Description must be 200 characters or fewer.';
  }
  return errors;
}

export default function Departments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Create dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DeptFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [editFormData, setEditFormData] = useState<DeptFormData>(EMPTY_FORM);
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Assign users modal
  const [isAssignUsersOpen, setIsAssignUsersOpen] = useState(false);
  const [assignUsersTarget, setAssignUsersTarget] = useState<Department | null>(null);

  const canManage = hasPermission(user, PERMISSIONS['departments.manage']);

  const fetchDepartments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      // Server handles pagination — pass page and limit as query params
      const res = await fetchData('DEPARTMENTS', 'GET', {}, null, {
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      // Backend may return { data: [], total: N } or just an array
      if (Array.isArray(res)) {
        setDepartments(res);
        setTotalCount(res.length);
      } else if (res?.data) {
        setDepartments(res.data);
        setTotalCount(res.total ?? res.data.length);
      } else {
        setDepartments([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error(mapApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments(currentPage);
  }, [currentPage, fetchDepartments]);

  // ─────── CREATE ───────
  const handleCreateDepartment = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchData('DEPARTMENTS', 'POST', {}, {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
      });
      toast.success('Department created.');
      setIsAddDialogOpen(false);
      setFormData(EMPTY_FORM);
      setFormErrors({});
      fetchDepartments(currentPage);
    } catch (error) {
      toast.error(mapApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────── EDIT ───────
  const openEditDialog = (dept: Department) => {
    setEditTarget(dept);
    setEditFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description ?? '',
      head_of_dept_id: dept.head_of_dept_id
    });
    setEditFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editTarget) return;

    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    try {
      setIsEditSubmitting(true);
      await fetchData('DEPARTMENT_UPDATE', 'PUT', { id: editTarget.id }, {
        name: editFormData.name.trim(),
        code: editFormData.code.trim(),
        description: editFormData.description.trim() || undefined,
        head_of_dept_id: editFormData.head_of_dept_id || undefined,
      });
      toast.success('Department updated.');
      setIsEditDialogOpen(false);
      setEditTarget(null);
      fetchDepartments(currentPage);
    } catch (error) {
      toast.error(mapApiError(error));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // ─────── DELETE ───────
  const handleDeleteDepartment = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleteSubmitting(true);
      await fetchData('DEPARTMENT_DELETE', 'DELETE', { id: deleteTarget.id });
      toast.success(`"${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
      // If we just deleted the last item on the page, go back one page
      const remainingOnPage = departments.length - 1;
      const nextPage = remainingOnPage === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      fetchDepartments(nextPage);
    } catch (error) {
      toast.error(mapApiError(error));
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // Client-side search filter on the current page's data only
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ─────── SHARED FORM FIELDS ───────
  const renderFormFields = (
    data: DeptFormData,
    errors: FormErrors,
    onChange: (field: keyof DeptFormData, value: string) => void
  ) => (
    <div className="grid gap-6 py-6">
      <div className="space-y-2.5">
        <Label className="text-sm font-bold text-slate-900">
          Department Name <span className="text-red-500">*</span>
        </Label>
        <Input
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="e.g., Registry, Finance, HR"
          className={`h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm transition-all ${
            errors.name ? 'border-red-300 focus-visible:ring-red-500/50' : 'focus-visible:ring-primary/50'
          }`}
        />
        {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-bold text-slate-900">
          Department Code <span className="text-red-500">*</span>
        </Label>
        <Input
          value={data.code}
          onChange={e => onChange('code', e.target.value.toUpperCase())}
          placeholder="e.g., REG, FIN, HR"
          maxLength={8}
          className={`h-10 font-mono tracking-widest uppercase border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm transition-all ${
            errors.code ? 'border-red-300 focus-visible:ring-red-500/50' : 'focus-visible:ring-primary/50'
          }`}
        />
        {errors.code ? (
          <p className="text-xs text-red-600 font-medium">{errors.code}</p>
        ) : (
          <p className="text-xs text-slate-500">2–8 uppercase letters</p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-bold text-slate-900">
          Description <span className="text-slate-500 font-normal text-xs">(optional)</span>
        </Label>
        <Input
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Brief description of the department..."
          maxLength={200}
          className={`h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 shadow-sm transition-all ${
            errors.description ? 'border-red-300 focus-visible:ring-red-500/50' : 'focus-visible:ring-primary/50'
          }`}
        />
        {errors.description && <p className="text-xs text-red-600 font-medium">{errors.description}</p>}
        <p className="text-xs text-slate-500 text-right">{data.description.length}/200</p>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* ───── HEADER & ACTIONS ───── */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Departments</h1>
            <p className="text-base text-slate-600 mt-2 font-normal">
              {loading ? 'Loading departments...' : `${totalCount} organizational ${totalCount === 1 ? 'unit' : 'units'}`}
            </p>
          </div>

          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setFormData(EMPTY_FORM);
                setFormErrors({});
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md hover:shadow-lg transition-all h-10 px-5">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-900">Create Department</DialogTitle>
                  <DialogDescription className="text-slate-600">Add a new organizational unit.</DialogDescription>
                </DialogHeader>
                {renderFormFields(formData, formErrors, (field, value) => {
                  setFormData(prev => ({ ...prev, [field]: value }));
                  if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
                })}
                <DialogFooter className="gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreateDepartment}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ───── SEARCH BAR ───── */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or code..."
            className="pl-10 pr-10 h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus-visible:ring-primary/50 transition-all shadow-sm rounded-lg"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ───── LIST VIEW ───── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 border border-slate-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <div className="rounded-full bg-slate-200 p-6 mb-4">
            <Building2 className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {searchQuery ? 'No departments found' : 'No departments yet'}
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-sm">
            {searchQuery
              ? `No departments match "${searchQuery}". Try adjusting your search.`
              : 'Create your first department to organize your institution.'}
          </p>
          <div className="flex gap-3">
            {!searchQuery && canManage && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Department
              </Button>
            )}
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDepartments.map((dept, idx) => (
            <div
              key={dept.id}
              className="group flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/75 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/admin/departments/${dept.id}`)}
            >
              {/* Leading Index */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 group-hover:bg-primary/10 text-slate-600 group-hover:text-primary text-xs font-bold transition-colors">
                {idx + 1}
              </div>

              {/* Icon + Name + Code */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/8 group-hover:bg-primary/12 transition-colors">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
                    {dept.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold border border-slate-200">
                      {dept.code}
                    </code>
                    {dept.description && (
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {dept.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge - Right side */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border transition-all ${
                    dept.is_active
                      ? 'bg-emerald-50/60 text-emerald-700 border-emerald-200/50'
                      : 'bg-slate-50/60 text-slate-600 border-slate-200/50'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${dept.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {dept.is_active ? 'Active' : 'Inactive'}
                </Badge>

                {/* View Button + Menu */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/admin/departments/${dept.id}`);
                    }}
                    className="h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-primary hover:bg-primary/8 transition-all"
                  >
                    View
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/admin/departments/${dept.id}`);
                          }}
                          className="cursor-pointer gap-2 text-xs"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            setAssignUsersTarget(dept);
                            setIsAssignUsersOpen(true);
                          }}
                          className="cursor-pointer gap-2 text-xs"
                        >
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>Assign Users</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            openEditDialog(dept);
                          }}
                          className="cursor-pointer gap-2 text-xs"
                        >
                          <Pencil className="h-4 w-4 text-amber-500" />
                          <span>Edit</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            setDeleteTarget(dept);
                          }}
                          className="cursor-pointer gap-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───── PAGINATION ───── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600 font-medium">
            Page <span className="text-slate-900 font-bold">{currentPage}</span> of{' '}
            <span className="text-slate-900 font-bold">{totalPages}</span> • {totalCount} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ───── EDIT DIALOG ───── */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditTarget(null);
          setEditFormErrors({});
        }
      }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Department</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update <span className="font-semibold text-slate-900">{editTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields(editFormData, editFormErrors, (field, value) => {
            setEditFormData(prev => ({ ...prev, [field]: value }));
            if (editFormErrors[field]) setEditFormErrors(prev => ({ ...prev, [field]: undefined }));
          })}

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateDepartment}
              className="bg-primary hover:bg-primary/90 text-white font-semibold"
              disabled={isEditSubmitting}
            >
              {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── DELETE DIALOG ───── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">Delete Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-sm">
              This will deactivate <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>. This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel disabled={isDeleteSubmitting} className="border-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              disabled={isDeleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ───── ASSIGN USERS MODAL ───── */}
      <Dialog open={isAssignUsersOpen} onOpenChange={(open) => {
        setIsAssignUsersOpen(open);
        if (!open) {
          setAssignUsersTarget(null);
        }
      }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Assign Users</DialogTitle>
            <DialogDescription className="text-slate-600">
              Set the department head for <span className="font-semibold text-slate-900">{assignUsersTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {assignUsersTarget && (
            <DepartmentAssignUsers
              departmentId={assignUsersTarget.id}
              currentHeadId={assignUsersTarget.head_of_dept_id ?? null}
              onHeadChange={() => {
                // Refresh departments to update UI
                fetchDepartments(currentPage);
              }}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignUsersOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
