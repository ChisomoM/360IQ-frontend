import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserCog, Search, Loader2, Users, CheckCircle2 } from '@/components/icons';
import { useAuth } from '@/lib/context/useAuth';
import { PERMISSIONS, hasPermission } from '@/lib/permissions';
import { listStaffProfiles, createStaffProfile, searchUsersForHR } from '@/lib/api/hr';
import type {
  StaffProfile, CreateStaffProfileLinkedPayload, CreateStaffProfileOfflinePayload, EmploymentType, ProfileStatus
} from '@/types/hr';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { formatDate as formatDisplayDate } from '@/lib/format';
import type { Tone } from '@/lib/status';

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  part_time: 'Part time',
  probation: 'Probation',
};

const PROFILE_STATUS: Record<ProfileStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'positive' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  pending_account: { label: 'Pending account', tone: 'caution' },
};

function getDisplayName(p: StaffProfile): string {
  if (p.user) return `${p.user.first_name ?? ''} ${p.user.last_name ?? ''}`.trim();
  return p.full_name || 'N/A';
}

function getDisplayEmail(p: StaffProfile): string {
  return p.user?.email ?? p.email ?? 'N/A';
}

function formatDate(d?: string | null) {
  return formatDisplayDate(d) || 'N/A';
}

function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  return <StatusBadge tone={PROFILE_STATUS[status]?.tone} label={PROFILE_STATUS[status]?.label} status={status} />;
}

function EmploymentTag({ type }: { type: EmploymentType }) {
  return <StatusBadge tone="neutral" label={EMPLOYMENT_LABELS[type]} />;
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words font-medium text-text-primary ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

interface EmergencyContact { name?: string; phone?: string; relation?: string; }
function parseEC(raw?: string): EmergencyContact | null {
  if (!raw || raw === '{}') return null;
  try { return JSON.parse(raw) as EmergencyContact; } catch { return null; }
}

export default function StaffDirectory() {
  const { user } = useAuth();
  const canManage = hasPermission(user, PERMISSIONS.HR_STAFF_MANAGE);

  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<StaffProfile | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createTab, setCreateTab] = useState<'linked' | 'offline'>('linked');

  const [linkedForm, setLinkedForm] = useState<Partial<CreateStaffProfileLinkedPayload>>({
    employment_type: 'permanent',
  });
  const [offlineForm, setOfflineForm] = useState<Partial<CreateStaffProfileOfflinePayload>>({
    employment_type: 'permanent',
  });
  const [saving, setSaving] = useState(false);

  // User search for linked tab
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; first_name: string; last_name: string; email: string }>>([]);
  const [selectedUserLabel, setSelectedUserLabel] = useState('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const userSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserQueryChange = (val: string) => {
    setUserQuery(val);
    setSelectedUserLabel('');
    setLinkedForm(f => ({ ...f, user_id: undefined }));
    if (userSearchTimer.current) clearTimeout(userSearchTimer.current);
    if (val.length < 2) { setUserResults([]); setUserSearchOpen(false); return; }
    userSearchTimer.current = setTimeout(() => {
      searchUsersForHR(val)
        .then(r => { setUserResults(r); setUserSearchOpen(r.length > 0); })
        .catch(() => {});
    }, 300);
  };

  const selectUser = (u: { id: string; first_name: string; last_name: string; email: string }) => {
    setLinkedForm(f => ({ ...f, user_id: u.id }));
    setSelectedUserLabel(`${u.first_name} ${u.last_name}, ${u.email}`);
    setUserQuery(`${u.first_name} ${u.last_name}`);
    setUserSearchOpen(false);
    setUserResults([]);
  };

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (empTypeFilter !== 'all') params.employment_type = empTypeFilter;
    listStaffProfiles(params)
      .then(setProfiles)
      .catch(() => toast.error('Failed to load staff profiles'))
      .finally(() => setLoading(false));
  }, [empTypeFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = profiles.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getDisplayName(p).toLowerCase().includes(q) ||
      getDisplayEmail(p).toLowerCase().includes(q) ||
      (p.user?.position ?? '').toLowerCase().includes(q) ||
      (p.user?.department?.name ?? '').toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      if (createTab === 'linked') {
        if (!linkedForm.user_id || !linkedForm.employment_type) {
          toast.error('Choose a user and an employment type.');
          return;
        }
        await createStaffProfile(linkedForm as CreateStaffProfileLinkedPayload);
      } else {
        if (!offlineForm.full_name || !offlineForm.employment_type) {
          toast.error('Enter a full name and an employment type.');
          return;
        }
        await createStaffProfile(offlineForm as CreateStaffProfileOfflinePayload);
      }
      toast.success('Staff profile created');
      setShowCreate(false);
      setLinkedForm({ employment_type: 'permanent' });
      setOfflineForm({ employment_type: 'permanent' });
      setUserQuery('');
      setSelectedUserLabel('');
      setUserResults([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create staff profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Staff directory"
        description="Staff profiles and employment records."
        actions={canManage && (
          <Button onClick={() => setShowCreate(true)}>
            <UserCog /> Add staff profile
          </Button>
        )}
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap gap-3 items-center p-4 border-b border-line">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              className="pl-9"
              aria-label="Search staff"
              placeholder="Search by name, email or position"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={empTypeFilter} onValueChange={setEmpTypeFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Employment type">
              <SelectValue placeholder="Employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map(k => (
                <SelectItem key={k} value={k}>{EMPLOYMENT_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No staff profiles found"
            description="Change your search or filter to see more."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Position</TableHead>
                <TableHead scope="col">Department</TableHead>
                <TableHead scope="col">Type</TableHead>
                <TableHead scope="col">Account</TableHead>
                <TableHead scope="col">Contract end</TableHead>
                <TableHead scope="col">Onboarded</TableHead>
                <TableHead scope="col"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer"
                  onClick={() => setSelected(p)}>
                  <TableCell>
                    <p className="font-semibold text-text-primary">{getDisplayName(p)}</p>
                    <p className="text-xs text-text-muted">{getDisplayEmail(p)}</p>
                  </TableCell>
                  <TableCell className="text-text-secondary">{p.user?.position ?? p.position ?? 'N/A'}</TableCell>
                  <TableCell className="text-text-secondary">{p.user?.department?.name ?? 'N/A'}</TableCell>
                  <TableCell>
                    <EmploymentTag type={p.employment_type} />
                  </TableCell>
                  <TableCell>
                    <ProfileStatusBadge status={p.profile_status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{formatDate(p.contract_end_date)}</TableCell>
                  <TableCell>
                    {p.is_onboarded ? (
                      <StatusBadge tone="positive" label="Yes" />
                    ) : (
                      <StatusBadge tone="neutral" label="No" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"
                      onClick={e => { e.stopPropagation(); setSelected(p); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {/* Profile Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{getDisplayName(selected)}</SheetTitle>
                <p className="text-sm text-text-secondary">
                  {selected.user?.position ?? selected.position ?? (selected.full_name ? 'Offline profile' : '')}
                </p>
                <ProfileStatusBadge status={selected.profile_status} />
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                {!selected.user_id && (
                  <div className="rounded-md bg-caution-tint p-3 text-xs text-caution">
                    This offline profile has no system account yet. Approve the onboarding
                    application to create one.
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-4">
                  <Detail label="Email" value={getDisplayEmail(selected)} />
                  <Detail label="Contact" mono value={selected.user?.contact_number ?? selected.contact_number ?? 'N/A'} />
                  <Detail label="Employment number" mono value={selected.employment_number ?? 'N/A'} />
                  <Detail label="Employment type" value={<EmploymentTag type={selected.employment_type} />} />
                  <Detail label="Contract start" mono value={formatDate(selected.contract_start_date)} />
                  <Detail label="Contract end" mono value={formatDate(selected.contract_end_date)} />
                  <Detail label="Date of birth" mono value={formatDate(selected.date_of_birth)} />
                  <Detail label="Gender" value={<span className="capitalize">{selected.gender ?? 'N/A'}</span>} />
                  <Detail label="National ID" mono value={selected.national_id ?? 'N/A'} />
                  <Detail label="Salary scale" mono value={selected.salary_scale ?? 'N/A'} />
                  <Detail label="Onboarded" value={selected.is_onboarded ? 'Yes' : 'No'} />
                </dl>
                {(() => {
                  const ec = parseEC(selected.emergency_contact);
                  return ec ? (
                    <div className="border-t border-line pt-4">
                      <p className="font-semibold text-text-primary mb-2">Emergency contact</p>
                      <dl className="grid grid-cols-2 gap-3">
                        <Detail label="Name" value={ec.name ?? 'N/A'} />
                        <Detail label="Phone" mono value={ec.phone ?? 'N/A'} />
                        <Detail label="Relationship" value={ec.relation ?? 'N/A'} />
                      </dl>
                    </div>
                  ) : null;
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Staff Profile Dialog */}
      <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setUserQuery(''); setSelectedUserLabel(''); setUserResults([]); setUserSearchOpen(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add staff profile</DialogTitle>
          </DialogHeader>
          <Tabs value={createTab} onValueChange={v => setCreateTab(v as 'linked' | 'offline')}>
            <TabsList className="w-full">
              <TabsTrigger value="linked" className="flex-1">Linked account</TabsTrigger>
              <TabsTrigger value="offline" className="flex-1">No account</TabsTrigger>
            </TabsList>

            {/* Linked: for staff who already have a user account */}
            <TabsContent value="linked" className="space-y-4 pt-2">
              <p className="text-xs text-text-muted">For staff who already have a system account. Search by name or email.</p>
              <div className="space-y-1.5">
                <Label>Search users</Label>
                <div className="relative">
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      className="pl-9"
                      aria-label="Search users"
                      placeholder="Name or email"
                      value={userQuery}
                      onChange={e => handleUserQueryChange(e.target.value)}
                      onFocus={() => userResults.length > 0 && setUserSearchOpen(true)}
                    />
                  </div>
                  {userSearchOpen && userResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-surface-1 border border-line rounded-md shadow-raised max-h-48 overflow-y-auto p-1">
                      {userResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-inner hover:bg-surface-2 flex items-center gap-2"
                          onClick={() => selectUser(u)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-text-primary truncate">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-text-muted truncate">{u.email}</p>
                          </div>
                          {linkedForm.user_id === u.id && <CheckCircle2 size={16} className="text-signal-text shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUserLabel && (
                  <p className="text-xs text-positive flex items-center gap-1">
                    <CheckCircle2 size={14} /> {selectedUserLabel}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <Select
                  value={linkedForm.employment_type}
                  onValueChange={v => setLinkedForm(f => ({ ...f, employment_type: v as EmploymentType }))}>
                  <SelectTrigger aria-label="Employment type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(EMPLOYMENT_LABELS) as [EmploymentType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contract start</Label>
                  <Input type="date" aria-label="Contract start"
                    value={linkedForm.contract_start_date ?? ''}
                    onChange={e => setLinkedForm(f => ({ ...f, contract_start_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contract end</Label>
                  <Input type="date" aria-label="Contract end"
                    value={linkedForm.contract_end_date ?? ''}
                    onChange={e => setLinkedForm(f => ({ ...f, contract_end_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Employment number</Label>
                <Input placeholder="EMP-2024-001" aria-label="Employment number" className="font-mono"
                  value={linkedForm.employment_number ?? ''}
                  onChange={e => setLinkedForm(f => ({ ...f, employment_number: e.target.value }))} />
              </div>
            </TabsContent>

            {/* Offline: for staff without any system account */}
            <TabsContent value="offline" className="space-y-4 pt-2">
              <p className="text-xs text-text-muted">For staff without a system account. They can apply through onboarding later.</p>
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input placeholder="Joseph Phiri" aria-label="Full name"
                  value={offlineForm.full_name ?? ''}
                  onChange={e => setOfflineForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="name@company.co.zm" aria-label="Email"
                    value={offlineForm.email ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact number</Label>
                  <Input placeholder="+260 97 123 4567" aria-label="Contact number"
                    value={offlineForm.contact_number ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, contact_number: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Input placeholder="Depot manager" aria-label="Position"
                    value={offlineForm.position ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, position: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Employment type</Label>
                  <Select
                    value={offlineForm.employment_type}
                    onValueChange={v => setOfflineForm(f => ({ ...f, employment_type: v as EmploymentType }))}>
                    <SelectTrigger aria-label="Employment type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(EMPLOYMENT_LABELS) as [EmploymentType, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Employment number</Label>
                  <Input placeholder="EMP-2024-001" aria-label="Employment number" className="font-mono"
                    value={offlineForm.employment_number ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, employment_number: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Salary scale</Label>
                  <Input placeholder="SS-7" aria-label="Salary scale" className="font-mono"
                    value={offlineForm.salary_scale ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, salary_scale: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Create profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
