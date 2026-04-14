import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Search,
  Loader2,
  Building2,
  X,
  MoreVertical,
  Users,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuth } from '@/lib/context/useAuth';
import { PageTransition } from '@/components/PageTransition';
import { DepartmentAssignUsers } from './DepartmentAssignUsers';
import type { Department } from '@/types/dms';

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
const PAGE_SIZE = 12; // 3-col grid looks better with multiples of 3

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Stagger animation variants (matches ManageUsers pattern) ─────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

// Motion-enhanced shadcn Button — preserves all variants + adds spring props
const MotionButton = motion(Button);

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
  // Pick a consistent color from the code initials
  const colors = [
    { ring: 'from-ch-primary-500 to-ch-primary-600', bg: 'bg-ch-primary-50', badgeBg: 'bg-ch-primary/[0.12]', badgeText: 'text-ch-primary-700', dot: 'bg-ch-primary-600' },
    { ring: 'from-ch-secondary-500 to-ch-secondary-600', bg: 'bg-ch-secondary-50', badgeBg: 'bg-ch-secondary/[0.12]', badgeText: 'text-ch-secondary-700', dot: 'bg-ch-secondary-600' },
    { ring: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-50', badgeBg: 'bg-emerald-500/[0.12]', badgeText: 'text-emerald-700', dot: 'bg-emerald-500' },
    { ring: 'from-amber-400 to-amber-500', bg: 'bg-amber-50', badgeBg: 'bg-amber-500/[0.12]', badgeText: 'text-amber-700', dot: 'bg-amber-500' },
  ];
  const color = colors[dept.code.charCodeAt(0) % colors.length];

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="group relative bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onView}
    >
      {/* Top row: Avatar + Actions menu */}
      <div className="flex items-start justify-between mb-4">
        {/* Avatar with gradient ring */}
        <div className={`p-0.5 rounded-full bg-gradient-to-br ${color.ring}`}>
          <Avatar className={`h-11 w-11 ${color.bg}`}>
            <AvatarFallback className={`font-bold text-sm font-mono ${color.badgeText} bg-transparent`}>
              {dept.code.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Actions dropdown */}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="h-8 w-8 rounded-md inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </motion.button>
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

      {/* Name & Code */}
      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate mb-1">
        {dept.name}
      </h3>
      <code className={`inline-block text-xs px-2 py-0.5 rounded font-mono font-bold ${color.badgeBg} ${color.badgeText} mb-3`}>
        {dept.code}
      </code>

      {/* Description */}
      {dept.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {dept.description}
        </p>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dept.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
          <span className={`text-xs font-medium ${dept.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
            {dept.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          onClick={e => { e.stopPropagation(); onView(); }}
          className="h-6 px-2 rounded text-xs font-medium text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function DeptCardSkeleton() {
  return (
    <motion.div variants={cardVariants} className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-5 w-14 mb-3" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="pt-3 border-t border-border">
        <Skeleton className="h-3 w-12" />
      </div>
    </motion.div>
  );
}

// ─── Form Fields ──────────────────────────────────────────────────────────────
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
  const activeCount = departments.filter(d => d.is_active).length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
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

  // ─── Create ───────────────────────────────────────────────────────────────
  const handleCreateDepartment = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
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

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const openEditDialog = (dept: Department) => {
    setEditTarget(dept);
    setEditFormData({ name: dept.name, code: dept.code, description: dept.description ?? '', head_of_dept_id: dept.head_of_dept_id });
    setEditFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editTarget) return;
    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) { setEditFormErrors(errors); return; }
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

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteDepartment = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleteSubmitting(true);
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

  // Client-side search filter
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="space-y-6">

        {/* ── Page Header ── */}
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

          {/* Add Department button */}
          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) { setFormData(EMPTY_FORM); setFormErrors({}); }
            }}>
              <DialogTrigger asChild>
                <MotionButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </MotionButton>
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
                  <MotionButton
                    variant="outline"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </MotionButton>
                  <MotionButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    onClick={handleCreateDepartment}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </MotionButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ── Stat Cards ── */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Departments', value: loading ? '—' : totalCount, icon: Building2, color: 'text-ch-primary-600', bg: 'bg-ch-primary/[0.08]' },
            { label: 'Active', value: loading ? '—' : activeCount, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-500/[0.08]' },
            { label: 'Inactive', value: loading ? '—' : totalCount - activeCount, icon: Building2, color: 'text-muted-foreground', bg: 'bg-muted' },
            { label: 'This Page', value: loading ? '—' : filteredDepartments.length, icon: Building2, color: 'text-ch-secondary-600', bg: 'bg-ch-secondary/[0.08]' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div
              key={label}
              variants={cardVariants}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow duration-200"
            >
              <div className={`p-2.5 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="font-sans text-text-xs text-muted-foreground">{label}</p>
                <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Search Bar ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 600, damping: 32 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* ── Department Cards Grid ── */}
        {loading ? (
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
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border-2 border-dashed border-border bg-muted/30">
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
                <MotionButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Department
                </MotionButton>
              )}
              {searchQuery && (
                <MotionButton
                  variant="outline"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </MotionButton>
              )}
            </div>
          </div>
        ) : (
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

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border"
          >
            <p className="font-sans text-text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
              <span className="font-semibold text-foreground">{totalPages}</span> · {totalCount} total
            </p>
            <div className="flex gap-2">
              <MotionButton
                variant="outline"
                size="sm"
                whileHover={currentPage !== 1 ? { scale: 1.02 } : {}}
                whileTap={currentPage !== 1 ? { scale: 0.97 } : {}}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </MotionButton>
              <MotionButton
                variant="outline"
                size="sm"
                whileHover={currentPage !== totalPages ? { scale: 1.02 } : {}}
                whileTap={currentPage !== totalPages ? { scale: 0.97 } : {}}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </MotionButton>
            </div>
          </motion.div>
        )}

        {/* ── Edit Dialog ── */}
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
            <div className="px-0 pb-0">
              <DepartmentAssignUsers
                departmentId={editTarget?.id ?? null}
                currentHeadId={editFormData.head_of_dept_id ?? null}
                onHeadChange={(userId) => setEditFormData(prev => ({ ...prev, head_of_dept_id: userId }))}
              />
            </div>
            <DialogFooter className="gap-2">
              <MotionButton
                variant="outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </MotionButton>
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                onClick={handleUpdateDepartment}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={isEditSubmitting}
              >
                {isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </MotionButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Dialog ── */}
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

        {/* ── Assign Users Modal ── */}
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
              <MotionButton
                variant="outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                onClick={() => setIsAssignUsersOpen(false)}
              >
                Close
              </MotionButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PageTransition>
  );
}