import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Plus, Search, Loader2, Building, Edit2, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
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
  // Renders the three fields shared by create and edit dialogs
  const renderFormFields = (
    data: DeptFormData,
    errors: FormErrors,
    onChange: (field: keyof DeptFormData, value: string) => void
  ) => (
    <div className="grid gap-4 py-4">
      <div className="space-y-1">
        <Label>Department Name <span className="text-red-500">*</span></Label>
        <Input
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="Registry, Finance, HR..."
          className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
      </div>
      <div className="space-y-1">
        <Label>Department Code <span className="text-red-500">*</span></Label>
        <Input
          value={data.code}
          onChange={e => onChange('code', e.target.value.toUpperCase())}
          placeholder="REG, FIN, HR..."
          maxLength={8}
          className={errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.code
          ? <p className="text-xs text-red-500 mt-0.5">{errors.code}</p>
          : <p className="text-xs text-gray-400 mt-0.5">2–8 uppercase letters.</p>
        }
      </div>
      <div className="space-y-1">
        <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Input
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Briefly describe this department..."
          maxLength={200}
          className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>}
        <p className="text-xs text-gray-400">{data.description.length}/200</p>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage university organizational units</p>
        </div>

        {/* Only admins with MANAGE_DEPARTMENTS see the Add button */}
        {canManage && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) { setFormData(EMPTY_FORM); setFormErrors({}); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#febb00] text-[#1e3c21] hover:bg-[#e8a900] font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new organizational unit within the university.
                </DialogDescription>
              </DialogHeader>
              {renderFormFields(formData, formErrors, (field, value) => {
                setFormData(prev => ({ ...prev, [field]: value }));
                // Clear error on change so it doesn't linger
                if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
              })}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreateDepartment}
                  className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Department
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Search Departments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or code..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-xl border-0 shadow-lg">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow>
                <TableHead className="text-white">Department Name</TableHead>
                <TableHead className="text-white">Code</TableHead>
                <TableHead className="text-white">Description</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#1e3c21]" />
                    <p className="mt-4 text-gray-500">Loading departments...</p>
                  </TableCell>
                </TableRow>
              ) : filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    {searchQuery
                      ? 'No departments match your search.'
                      : 'No departments yet. Add your first unit to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept) => (
                  <TableRow key={dept.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      {/* Name is a link to the detail page */}
                      <button
                        onClick={() => navigate(`/admin/departments/${dept.id}`)}
                        className="font-semibold text-gray-900 hover:text-[#1e3c21] hover:underline text-left"
                      >
                        {dept.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                        {dept.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {dept.description || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* View detail — available to everyone */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/departments/${dept.id}`)}
                          title="View details"
                          className="hover:text-[#1e3c21]"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Edit and Delete are gated on MANAGE_DEPARTMENTS */}
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(dept)}
                              title="Edit department"
                              className="hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(dept)}
                              title="Delete department"
                              className="hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} ({totalCount} departments)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) { setEditTarget(null); setEditFormErrors({}); }
      }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the details for <strong>{editTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields(editFormData, editFormErrors, (field, value) => {
            setEditFormData(prev => ({ ...prev, [field]: value }));
            if (editFormErrors[field]) setEditFormErrors(prev => ({ ...prev, [field]: undefined }));
          })}

          <div className="px-4">
            <DepartmentAssignUsers
              departmentId={editTarget?.id ?? null}
              currentHeadId={editFormData.head_of_dept_id ?? null}
              onHeadChange={(userId) => setEditFormData(prev => ({ ...prev, head_of_dept_id: userId }))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateDepartment}
              className="bg-[#1e3c21] hover:bg-[#2a5230] text-white"
              disabled={isEditSubmitting}
            >
              {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code}).
              Existing documents linked to this department will not be affected.
              This action can be reversed by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              disabled={isDeleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
