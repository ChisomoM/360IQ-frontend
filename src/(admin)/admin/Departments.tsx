// src/(admin)/admin/Departments.tsx
// Departments page — card grid layout with CRUD, search, and pagination.
// Set USE_MOCK = false once the backend /departments endpoint is live.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
  MoreVertical, Users, Pencil, Trash2, Eye,
} from 'lucide-react';
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
    return 'Department not found — it may have already been removed.';
  if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden'))
    return 'You do not have permission to perform this action.';
  return msg || 'Something went wrong. Please try again.';
}

// Validates form fields before any network call
function validateForm(data: DeptFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = 'Department name is required.';
  if (!data.code.trim()) {
    errors.code = 'Department code is required.';
  } else if (!/^[A-Z]{2,8}$/.test(data.code.trim())) {
    errors.code = 'Code must be 2–8 uppercase letters (e.g. CS, FIN, REGIS).';
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
  // Pick one of four accent colours based on the first letter of the dept code.
  // Using charCodeAt keeps it consistent — same code always gets same colour.
  const colors = [
    { ring: 'from-ch-primary-600 to-ch-primary-600', bg: 'bg-ch-primary-50', badgeBg: 'bg-ch-primary/[0.12]', badgeText: 'text-ch-primary-700' },
    { ring: 'from-ch-secondary-600 to-ch-secondary-600', bg: 'bg-ch-secondary-50', badgeBg: 'bg-ch-secondary/[0.12]', badgeText: 'text-ch-secondary-700' },
    { ring: 'from-ch-tertiary-500 to-ch-tertiary-500', bg: 'bg-surface-2', badgeBg: 'bg-surface-2', badgeText: 'text-text-secondary' },
    { ring: 'from-caution to-caution', bg: 'bg-caution-tint', badgeBg: 'bg-caution-tint', badgeText: 'text-caution' },
  ];
  const color = colors[dept.code.charCodeAt(0) % colors.length];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      // Cards lift on hover (y translation) per design system — never scale a content surface
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="group relative bg-card rounded-xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onView}
    >
      {/* Top row: avatar + dropdown */}
      <div className="flex items-start justify-between mb-4">
        {/* Gradient ring around the code initials avatar */}
        <div className={`p-0.5 rounded-full bg-gradient-to-br ${color.ring}`}>
          <Avatar className={`h-11 w-11 ${color.bg}`}>
            <AvatarFallback className={`font-bold text-sm font-mono ${color.badgeText} bg-transparent`}>
              {dept.code.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Actions dropdown — only visible on hover, only for manage-permission users */}
        {canManage && (
          <DropdownMenu>
            {/* stopPropagation prevents the card's onView click from firing */}
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onView(); }}
                className="cursor-pointer gap-2 text-xs"
              >
                <Eye className="h-3.5 w-3.5 text-primary" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onAssignUsers(); }}
                className="cursor-pointer gap-2 text-xs"
              >
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Assign Users
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className="cursor-pointer gap-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-500" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Department name & code */}
      <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate mb-1">
        {dept.name}
      </h3>
      <code className={`inline-block text-xs px-2 py-0.5 rounded font-mono font-bold ${color.badgeBg} ${color.badgeText} mb-3`}>
        {dept.code}
      </code>

      {/* Description — capped at 2 lines */}
      {dept.description && (
        <p className="font-sans text-xs text-muted-foreground line-clamp-2 mb-3">
          {dept.description}
        </p>
      )}

      {/* Status dot + "View →" ghost link */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dept.is_active ? 'bg-positive' : 'bg-muted-foreground'}`} />
          <span className={`text-xs font-medium font-sans ${dept.is_active ? 'text-positive' : 'text-muted-foreground'}`}>
            {dept.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {/* "View →" only appears on hover */}
        <Button
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); onView(); }}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View →
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
// Shown while data is loading — mirrors the real card's layout
function DeptCardSkeleton() {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-card rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-5 w-14 mb-3" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="pt-3 border-t border-gray-200">
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
    <div className="grid gap-5 py-4">
      {/* Name */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Department Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="e.g., Registry, Finance, HR"
          className={errors.name ? 'border-destructive focus-visible:ring-destructive/50' : ''}
        />
        {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
      </div>

      {/* Code */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Department Code <span className="text-destructive">*</span>
        </Label>
        <Input
          value={data.code}
          onChange={e => onChange('code', e.target.value.toUpperCase())}
          placeholder="e.g., REG, FIN, HR"
          maxLength={8}
          // font-mono + tracking-widest makes the code look like a proper identifier
          className={`font-mono tracking-widest uppercase ${errors.code ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
        />
        {errors.code
          ? <p className="text-xs text-destructive font-medium">{errors.code}</p>
          : <p className="text-xs text-muted-foreground">2–8 uppercase letters</p>
        }
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Description{' '}
          <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <Input
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Brief description of the department..."
          maxLength={200}
          className={errors.description ? 'border-destructive focus-visible:ring-destructive/50' : ''}
        />
        {errors.description && (
          <p className="text-xs text-destructive font-medium">{errors.description}</p>
        )}
        <p className="text-xs text-muted-foreground text-right">{data.description.length}/200</p>
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

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-display-sm text-gray-900">
              Departments
            </h1>
            <p className="font-sans text-text-sm text-muted-foreground mt-1">
              {loading
                ? 'Loading departments...'
                : `${totalCount} organizational ${totalCount === 1 ? 'unit' : 'units'} · ${activeCount} active`}
            </p>
          </div>

          {/* Add Department — only shown to users with manage permission */}
          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) { setFormData(EMPTY_FORM); setFormErrors({}); }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="font-display font-bold text-lg text-foreground">
                    Create Department
                  </DialogTitle>
                  <DialogDescription className="font-sans text-text-sm text-muted-foreground">
                    Add a new organizational unit to the system.
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
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDepartment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
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

        {/* Stat Cards */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Departments', value: loading ? '—' : totalCount, color: 'text-ch-primary-600', bg: 'bg-ch-primary/[0.08]' },
            { label: 'Active', value: loading ? '—' : activeCount, color: 'text-positive', bg: 'bg-positive-tint' },
            { label: 'Inactive', value: loading ? '—' : totalCount - activeCount, color: 'text-muted-foreground', bg: 'bg-muted' },
            { label: 'This Page', value: loading ? '—' : filteredDepartments.length, color: 'text-ch-secondary-600', bg: 'bg-ch-secondary/[0.08]' },
          ].map(({ label, value, color, bg }) => (
            <motion.div
              key={label}
              variants={cardVariants}
              className="bg-card rounded-xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div className={`p-2.5 rounded-lg ${bg}`}>
                <Building2 className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="font-sans text-text-xs text-muted-foreground">{label}</p>
                <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {/* Clear button — only rendered when there's text in the search box */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
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
          // Empty state — message differs based on whether search is active
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border-2 border-dashed border-gray-200 bg-muted/30">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              {searchQuery ? 'No departments found' : 'No departments yet'}
            </h3>
            <p className="font-sans text-text-sm text-muted-foreground mb-6 max-w-sm">
              {searchQuery
                ? `No departments match "${searchQuery}". Try adjusting your search.`
                : 'Create your first department to start organizing your institution.'}
            </p>
            <div className="flex gap-3">
              {!searchQuery && canManage && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
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

        {/* Pagination — only shown when there's more than one page */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200"
          >
            <p className="font-sans text-text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
              <span className="font-semibold text-foreground">{totalPages}</span> · {totalCount} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) { setEditTarget(null); setEditFormErrors({}); }
        }}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-lg text-foreground">
                Edit Department
              </DialogTitle>
              <DialogDescription className="font-sans text-text-sm text-muted-foreground">
                Update <span className="font-semibold text-foreground">{editTarget?.name}</span>.
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
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpdateDepartment}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={isEditSubmitting}
              >
                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display font-bold text-foreground">
                Delete Department?
              </AlertDialogTitle>
              <AlertDialogDescription className="font-sans text-text-sm text-muted-foreground">
                This will deactivate{' '}
                <span className="font-semibold text-foreground">{deleteTarget?.name}</span>{' '}
                ({deleteTarget?.code}). Existing documents will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={isDeleteSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDepartment}
                disabled={isDeleteSubmitting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              >
                {isDeleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Users Modal */}
        <Dialog open={isAssignUsersOpen} onOpenChange={(open) => {
          setIsAssignUsersOpen(open);
          if (!open) setAssignUsersTarget(null);
        }}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-lg text-foreground">
                Assign Users
              </DialogTitle>
              <DialogDescription className="font-sans text-text-sm text-muted-foreground">
                Set the department head for{' '}
                <span className="font-semibold text-foreground">{assignUsersTarget?.name}</span>.
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
              <Button variant="outline" onClick={() => setIsAssignUsersOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PageTransition>
  );
}