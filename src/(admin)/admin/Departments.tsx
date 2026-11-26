// src/(admin)/admin/Departments.tsx
// Departments page — card grid layout with CRUD, search, and pagination.
// Set USE_MOCK = false once the backend /departments endpoint is live.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiTile } from '@/components/shared/KpiTile';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTablePagination } from '@/components/shared/DataTablePagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Plus, Search, Loader2, Building2, X,
  MoreVertical, Users, Pencil, Trash2, Eye, ArrowRight,
} from '@/components/icons';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import { PageTransition } from '@/components/PageTransition';
import { DepartmentAssignUsers } from './DepartmentAssignUsers';
import type { Department } from '@/types/dms';

// ─── Mock Data (remove when backend endpoint is live) ─────────────────────────
const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-001', name: 'Registry', code: 'REG', description: 'Handles student records and academic documentation.', is_active: true },
  { id: 'dept-002', name: 'Finance', code: 'FIN', description: 'Manages university finances, fees, and budgets.', is_active: true },
  { id: 'dept-003', name: 'Human Resources', code: 'HR', description: 'Handles staff recruitment, contracts, and welfare.', is_active: true },
  { id: 'dept-004', name: 'Information Technology', code: 'IT', description: 'Maintains systems, networks, and software infrastructure.', is_active: true },
  { id: 'dept-005', name: 'Library Services', code: 'LIB', description: 'Manages physical and digital library resources.', is_active: false },
  { id: 'dept-006', name: 'Student Affairs', code: 'SA', description: 'Supports student welfare, clubs, and extracurricular activities.', is_active: true },
  { id: 'dept-007', name: 'Examinations Board', code: 'EB', description: 'Coordinates university examinations and results processing.', is_active: true },
  { id: 'dept-008', name: 'Research & Innovation', code: 'RI', description: 'Manages research grants, publications, and partnerships.', is_active: false },
];

// Flip to false once the backend /departments endpoint is live
const USE_MOCK = true;

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string;
  code?: string;
  description?: string;
  head_of_dept_id?: string;
}

interface DeptFormData {
  name: string;
  code: string;
  description: string;
  head_of_dept_id?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM: DeptFormData = { name: '', code: '', description: '' };
const PAGE_SIZE = 12; // multiples of 3 fill the 3-col grid cleanly

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Translates raw backend errors into plain English for the user
function mapApiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists'))
    return 'A department with that code already exists.';
  if (msg.toLowerCase().includes('not found'))
    return 'Department not found. It may have already been removed.';
  if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden'))
    return 'You do not have permission to do this.';
  return msg || 'Something went wrong. Try again.';
}

// Validates form fields before any network call
function validateForm(data: DeptFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = 'Department name is required.';
  if (!data.code.trim()) {
    errors.code = 'Department code is required.';
  } else if (!/^[A-Z]{2,8}$/.test(data.code.trim())) {
    errors.code = 'Use 2 to 8 uppercase letters, like FIN or REGIS.';
  }
  if (data.description && data.description.length > 200)
    errors.description = 'Description must be 200 characters or fewer.';
  return errors;
}

// ─── Animation variants ───────────────────────────────────────────────────────
// Stagger: parent fires children 0.03s apart — fast enough to feel snappy
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

// Each card fades in and slides up slightly on enter
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Department Card ──────────────────────────────────────────────────────────
interface DeptCardProps {
  dept: Department;
  index: number;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignUsers: () => void;
}

function DeptCard({ dept, canManage, onView, onEdit, onDelete, onAssignUsers }: DeptCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      // Cards lift on hover (y translation) per design system — never scale a content surface
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="group relative flex min-w-0 flex-col bg-surface-1 rounded-lg border border-line shadow-card hover:shadow-card-hover p-5 transition-shadow duration-200 cursor-pointer"
      onClick={onView}
    >
      {/* Top row: avatar + dropdown */}
      <div className="flex items-start justify-between mb-4">
        <Avatar className="h-11 w-11">
          <AvatarFallback className="bg-field font-mono text-sm font-medium text-text-secondary">
            {dept.code.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        {/* Actions dropdown — only visible on hover, only for manage-permission users */}
        {canManage && (
          <DropdownMenu>
            {/* stopPropagation prevents the card's onView click from firing */}
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${dept.name}`}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onView(); }}
                className="cursor-pointer gap-2 text-xs"
              >
                <Eye size={14} className="text-text-muted" />
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onAssignUsers(); }}
                className="cursor-pointer gap-2 text-xs"
              >
                <Users size={14} className="text-text-muted" />
                Assign users
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className="cursor-pointer gap-2 text-xs"
              >
                <Pencil size={14} className="text-text-muted" />
                Edit department
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="cursor-pointer gap-2 text-xs text-risk focus:bg-risk-tint focus:text-risk"
              >
                <Trash2 size={14} />
                Delete department
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Department name & code */}
      <h3 className="font-semibold text-sm text-text-primary truncate mb-1">
        {dept.name}
      </h3>
      <code className="self-start text-xs px-2 py-0.5 rounded-pill font-mono bg-field text-text-secondary mb-3">
        {dept.code}
      </code>

      {/* Description, capped at 2 lines */}
      {dept.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-3">
          {dept.description}
        </p>
      )}

      {/* Status + view link */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-line">
        <StatusBadge status={dept.is_active ? 'active' : 'inactive'} />
        <Button
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); onView(); }}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          View
          <ArrowRight />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
// Shown while data is loading — mirrors the real card's layout
function DeptCardSkeleton() {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-surface-1 rounded-lg border border-line shadow-card p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-11 w-11 rounded-pill" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-5 w-14 mb-3" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="pt-3 border-t border-line">
        <Skeleton className="h-3 w-12" />
      </div>
    </motion.div>
  );
}

// ─── Form Fields ──────────────────────────────────────────────────────────────
// Shared between Create and Edit dialogs to avoid duplicating JSX
function DeptFormFields({
  data,
  errors,
  onChange,
}: {
  data: DeptFormData;
  errors: FormErrors;
  onChange: (field: keyof DeptFormData, value: string) => void;
}) {
  return (
    <div className="grid gap-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label>Department name</Label>
        <Input
          aria-label="Department name"
          aria-invalid={!!errors.name}
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="Finance"
        />
        {errors.name && <p className="text-xs text-risk">{errors.name}</p>}
      </div>

      {/* Code */}
      <div className="space-y-1.5">
        <Label>Department code</Label>
        <Input
          aria-label="Department code"
          aria-invalid={!!errors.code}
          value={data.code}
          onChange={e => onChange('code', e.target.value.toUpperCase())}
          placeholder="FIN"
          maxLength={8}
          // font-mono + tracking-widest makes the code look like a proper identifier
          className="font-mono tracking-widest uppercase"
        />
        {errors.code
          ? <p className="text-xs text-risk">{errors.code}</p>
          : <p className="text-xs text-text-muted">2 to 8 uppercase letters.</p>
        }
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>
          Description{' '}
          <span className="text-text-muted font-normal text-xs">(optional)</span>
        </Label>
        <Input
          aria-label="Description"
          aria-invalid={!!errors.description}
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Budgets, fees and supplier payments"
          maxLength={200}
        />
        {errors.description && (
          <p className="text-xs text-risk">{errors.description}</p>
        )}
        <p className="font-mono text-xs text-text-muted text-right">{data.description.length}/200</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Departments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
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
  const activeCount = departments.filter(d => d.is_active).length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Client-side search filter — runs on the current page's loaded data
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Auto-open edit modal when navigated here from DepartmentDetailPage ──────
  // DepartmentDetailPage passes { state: { editId: dept.id } } when the user
  // clicks "Edit Department". Once departments are loaded we find the matching
  // one and open its edit dialog automatically.
  useEffect(() => {
    const editId = (location.state as { editId?: string } | null)?.editId;
    if (!editId || loading || departments.length === 0) return;

    const target = departments.find(d => d.id === editId);
    if (target) {
      openEditDialog(target);
      // Clear the state so refreshing the page doesn't re-open the modal
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, loading, departments]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);

      if (USE_MOCK) {
        const start = (page - 1) * PAGE_SIZE;
        const slice = MOCK_DEPARTMENTS.slice(start, start + PAGE_SIZE);
        setDepartments(slice);
        setTotalCount(MOCK_DEPARTMENTS.length);
        return;
      }

      const res = await fetchData('DEPARTMENTS', 'GET', {}, null, {
        page: String(page),
        limit: String(PAGE_SIZE),
      });
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
      toast.error(mapApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments(currentPage);
  }, [currentPage, fetchDepartments]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreateDepartment = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    try {
      setIsSubmitting(true);

      if (USE_MOCK) {
        const newDept: Department = {
          id: `dept-${Date.now()}`,
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || undefined,
          is_active: true,
        };
        MOCK_DEPARTMENTS.unshift(newDept);
        toast.success('Department created.');
        setIsAddDialogOpen(false);
        setFormData(EMPTY_FORM);
        setFormErrors({});
        fetchDepartments(currentPage);
        return;
      }

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

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEditDialog = (dept: Department) => {
    setEditTarget(dept);
    setEditFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description ?? '',
      head_of_dept_id: dept.head_of_dept_id,
    });
    setEditFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editTarget) return;
    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) { setEditFormErrors(errors); return; }

    try {
      setIsEditSubmitting(true);

      if (USE_MOCK) {
        const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === editTarget.id);
        if (idx !== -1) {
          MOCK_DEPARTMENTS[idx] = {
            ...MOCK_DEPARTMENTS[idx],
            name: editFormData.name.trim(),
            code: editFormData.code.trim(),
            description: editFormData.description.trim() || undefined,
            head_of_dept_id: editFormData.head_of_dept_id || undefined,
          };
        }
        toast.success('Department updated.');
        setIsEditDialogOpen(false);
        setEditTarget(null);
        fetchDepartments(currentPage);
        return;
      }

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

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteDepartment = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleteSubmitting(true);

      if (USE_MOCK) {
        const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === deleteTarget.id);
        if (idx !== -1) MOCK_DEPARTMENTS.splice(idx, 1);
        toast.success(`"${deleteTarget.name}" removed.`);
        setDeleteTarget(null);
        const remainingOnPage = departments.length - 1;
        const nextPage = remainingOnPage === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(nextPage);
        fetchDepartments(nextPage);
        return;
      }

      await fetchData('DEPARTMENT_DELETE', 'DELETE', { id: deleteTarget.id });
      toast.success(`"${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Page header: "Add department" only for users with manage permission */}
        <PageHeader
          title="Departments"
          description={loading
            ? 'Loading departments'
            : `${totalCount} ${totalCount === 1 ? 'department' : 'departments'}, ${activeCount} active`}
          actions={canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) { setFormData(EMPTY_FORM); setFormErrors({}); }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus />
                  Add department
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create department</DialogTitle>
                  <DialogDescription>
                    Add a department to your organisation.
                  </DialogDescription>
                </DialogHeader>
                <DeptFormFields
                  data={formData}
                  errors={formErrors}
                  onChange={(field, value) => {
                    setFormData(prev => ({ ...prev, [field]: value }));
                    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
                  }}
                />
                <DialogFooter className="gap-3">
                  <Button variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDepartment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Create department
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        />

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiTile label="Departments" value={loading ? 'N/A' : totalCount} icon={<Building2 size={18} />} />
          <KpiTile label="Active" value={loading ? 'N/A' : activeCount} />
          <KpiTile label="Inactive" value={loading ? 'N/A' : totalCount - activeCount} />
          <KpiTile label="Shown on this page" value={loading ? 'N/A' : filteredDepartments.length} />
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            aria-label="Search departments by name or code"
            placeholder="Search by name or code"
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {/* Clear button, only rendered when there's text in the search box */}
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Department Cards Grid */}
        {loading ? (
          // 6 skeleton cards while fetching
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <DeptCardSkeleton key={i} />
            ))}
          </motion.div>

        ) : filteredDepartments.length === 0 ? (
          // Empty state: message differs based on whether search is active
          <SectionCard padded={false}>
            <EmptyState
              icon={<Building2 size={24} />}
              title={searchQuery ? 'No departments found' : 'No departments yet'}
              description={searchQuery
                ? `No departments match "${searchQuery}". Change your search.`
                : 'Departments group your people and documents. Create the first one.'}
              action={searchQuery
                ? { label: 'Clear search', onAction: () => setSearchQuery('') }
                : canManage
                  ? { label: 'Create department', onAction: () => setIsAddDialogOpen(true) }
                  : undefined}
            />
          </SectionCard>

        ) : (
          // Actual department cards, staggered in
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredDepartments.map((dept, idx) => (
              <DeptCard
                key={dept.id}
                dept={dept}
                index={idx}
                canManage={canManage}
                onView={() => navigate(`/admin/departments/${dept.id}`)}
                onEdit={() => openEditDialog(dept)}
                onDelete={() => setDeleteTarget(dept)}
                onAssignUsers={() => {
                  setAssignUsersTarget(dept);
                  setIsAssignUsersOpen(true);
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Pagination, only shown when there's more than one page */}
        {!loading && totalPages > 1 && (
          <DataTablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={totalCount}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) { setEditTarget(null); setEditFormErrors({}); }
        }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit department</DialogTitle>
              <DialogDescription>
                Update <span className="font-semibold text-text-primary">{editTarget?.name}</span>.
              </DialogDescription>
            </DialogHeader>
            <DeptFormFields
              data={editFormData}
              errors={editFormErrors}
              onChange={(field, value) => {
                setEditFormData(prev => ({ ...prev, [field]: value }));
                if (editFormErrors[field]) setEditFormErrors(prev => ({ ...prev, [field]: undefined }));
              }}
            />
            {/* User picker for setting the department head */}
            <div className="px-0 pb-0">
              <DepartmentAssignUsers
                departmentId={editTarget?.id ?? null}
                currentHeadId={editFormData.head_of_dept_id ?? null}
                onHeadChange={(userId) =>
                  setEditFormData(prev => ({ ...prev, head_of_dept_id: userId }))
                }
              />
            </div>
            <DialogFooter className="gap-3">
              <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpdateDepartment}
                disabled={isEditSubmitting}
              >
                {isEditSubmitting && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this department?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate{' '}
                <span className="font-semibold text-text-primary">{deleteTarget?.name}</span>{' '}
                (<span className="font-mono">{deleteTarget?.code}</span>). Existing documents will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel disabled={isDeleteSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDepartment}
                disabled={isDeleteSubmitting}
                className={buttonVariants({ variant: 'destructive' })}
              >
                {isDeleteSubmitting && <Loader2 className="animate-spin" />}
                Delete department
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Users Modal */}
        <Dialog open={isAssignUsersOpen} onOpenChange={(open) => {
          setIsAssignUsersOpen(open);
          if (!open) setAssignUsersTarget(null);
        }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign users</DialogTitle>
              <DialogDescription>
                Set the department head for{' '}
                <span className="font-semibold text-text-primary">{assignUsersTarget?.name}</span>.
              </DialogDescription>
            </DialogHeader>
            {assignUsersTarget && (
              <DepartmentAssignUsers
                departmentId={assignUsersTarget.id}
                currentHeadId={assignUsersTarget.head_of_dept_id ?? null}
                onHeadChange={() => fetchDepartments(currentPage)}
              />
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsAssignUsersOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PageTransition>
  );
}