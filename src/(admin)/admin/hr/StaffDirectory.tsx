import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { UserCog, Search, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  part_time: 'Part Time',
  probation: 'Probation',
};

const EMPLOYMENT_BADGE: Record<EmploymentType, string> = {
  permanent: 'bg-green-100 text-green-800',
  contract: 'bg-blue-100 text-blue-800',
  part_time: 'bg-purple-100 text-purple-800',
  probation: 'bg-yellow-100 text-yellow-800',
};

const PROFILE_STATUS_BADGE: Record<ProfileStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  pending_account: 'bg-orange-100 text-orange-700',
};

const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending_account: 'Pending Account',
};

function getDisplayName(p: StaffProfile): string {
  if (p.user) return `${p.user.first_name ?? ''} ${p.user.last_name ?? ''}`.trim();
  return p.full_name || '—';
}

function getDisplayEmail(p: StaffProfile): string {
  return p.user?.email ?? p.email ?? '—';
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZM', { year: 'numeric', month: 'short', day: 'numeric' });
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
    setSelectedUserLabel(`${u.first_name} ${u.last_name} — ${u.email}`);
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
          toast.error('User ID and Employment Type are required');
          return;
        }
        await createStaffProfile(linkedForm as CreateStaffProfileLinkedPayload);
      } else {
        if (!offlineForm.full_name || !offlineForm.employment_type) {
          toast.error('Full name and Employment Type are required');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-gray-600 mt-1">All staff profiles and employment records</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} className="bg-[#1e5631] hover:bg-[#1e5631]/90">
            <UserCog className="mr-2 h-4 w-4" /> Add Staff Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Search by name, email, position..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={empTypeFilter} onValueChange={setEmpTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map(k => (
                  <SelectItem key={k} value={k}>{EMPLOYMENT_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#7c69ff]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No staff profiles found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Contract End</TableHead>
                  <TableHead>Onboarded</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelected(p)}>
                    <TableCell>
                      <p className="font-medium text-gray-900">{getDisplayName(p)}</p>
                      <p className="text-xs text-gray-500">{getDisplayEmail(p)}</p>
                    </TableCell>
                    <TableCell>{p.user?.position ?? p.position ?? '—'}</TableCell>
                    <TableCell>{p.user?.department?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge className={EMPLOYMENT_BADGE[p.employment_type]}>
                        {EMPLOYMENT_LABELS[p.employment_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PROFILE_STATUS_BADGE[p.profile_status]}>
                        {PROFILE_STATUS_LABEL[p.profile_status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.contract_end_date)}</TableCell>
                    <TableCell>
                      {p.is_onboarded ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
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
        </CardContent>
      </Card>

      {/* Profile Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{getDisplayName(selected)}</SheetTitle>
                <p className="text-sm text-gray-500">
                  {selected.user?.position ?? selected.position ?? (selected.full_name ? 'Offline Profile' : '')}
                </p>
                <Badge className={PROFILE_STATUS_BADGE[selected.profile_status]}>
                  {PROFILE_STATUS_LABEL[selected.profile_status]}
                </Badge>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                {!selected.user_id && (
                  <div className="rounded bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
                    This is an offline staff profile — no system account is linked yet.
                    Approve their onboarding application to create an account automatically.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{getDisplayEmail(selected)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact</p>
                    <p className="font-medium">{selected.user?.contact_number ?? selected.contact_number ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Employment No.</p>
                    <p className="font-medium">{selected.employment_number ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Employment Type</p>
                    <Badge className={EMPLOYMENT_BADGE[selected.employment_type]}>
                      {EMPLOYMENT_LABELS[selected.employment_type]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Contract Start</p>
                    <p className="font-medium">{formatDate(selected.contract_start_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contract End</p>
                    <p className="font-medium">{formatDate(selected.contract_end_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDate(selected.date_of_birth)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{selected.gender ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">National ID</p>
                    <p className="font-medium">{selected.national_id ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Salary Scale</p>
                    <p className="font-medium">{selected.salary_scale ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Onboarded</p>
                    <p className="font-medium">{selected.is_onboarded ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {(() => {
                  const ec = parseEC(selected.emergency_contact);
                  return ec ? (
                    <div className="border-t pt-4">
                      <p className="font-semibold text-gray-700 mb-2">Emergency Contact</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><p className="text-gray-500">Name</p>
                          <p className="font-medium">{ec.name ?? '—'}</p></div>
                        <div><p className="text-gray-500">Phone</p>
                          <p className="font-medium">{ec.phone ?? '—'}</p></div>
                        <div><p className="text-gray-500">Relationship</p>
                          <p className="font-medium">{ec.relation ?? '—'}</p></div>
                      </div>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Staff Profile</DialogTitle>
          </DialogHeader>
          <Tabs value={createTab} onValueChange={v => setCreateTab(v as 'linked' | 'offline')}>
            <TabsList className="w-full">
              <TabsTrigger value="linked" className="flex-1">Linked Account</TabsTrigger>
              <TabsTrigger value="offline" className="flex-1">No Account</TabsTrigger>
            </TabsList>

            {/* Linked: for staff who already have a user account */}
            <TabsContent value="linked" className="space-y-4 pt-2">
              <p className="text-xs text-gray-500">Use this when the staff member already has a system account. Type their name or email to find them.</p>
              <div className="space-y-1">
                <Label>Search User <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="Type name or email..."
                      value={userQuery}
                      onChange={e => handleUserQueryChange(e.target.value)}
                      onFocus={() => userResults.length > 0 && setUserSearchOpen(true)}
                    />
                  </div>
                  {userSearchOpen && userResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {userResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => selectUser(u)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          {linkedForm.user_id === u.id && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUserLabel && (
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {selectedUserLabel}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Employment Type <span className="text-red-500">*</span></Label>
                <Select
                  value={linkedForm.employment_type}
                  onValueChange={v => setLinkedForm(f => ({ ...f, employment_type: v as EmploymentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(EMPLOYMENT_LABELS) as [EmploymentType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Contract Start</Label>
                  <Input type="date"
                    value={linkedForm.contract_start_date ?? ''}
                    onChange={e => setLinkedForm(f => ({ ...f, contract_start_date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Contract End</Label>
                  <Input type="date"
                    value={linkedForm.contract_end_date ?? ''}
                    onChange={e => setLinkedForm(f => ({ ...f, contract_end_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Employment Number</Label>
                <Input placeholder="e.g. EMP-2024-001"
                  value={linkedForm.employment_number ?? ''}
                  onChange={e => setLinkedForm(f => ({ ...f, employment_number: e.target.value }))} />
              </div>
            </TabsContent>

            {/* Offline: for staff without any system account */}
            <TabsContent value="offline" className="space-y-4 pt-2">
              <p className="text-xs text-gray-500">Use this to record staff who do not have a system account. They can apply via the onboarding portal later.</p>
              <div className="space-y-1">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. John Banda"
                  value={offlineForm.full_name ?? ''}
                  onChange={e => setOfflineForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com"
                    value={offlineForm.email ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Contact Number</Label>
                  <Input placeholder="+260 97x ..."
                    value={offlineForm.contact_number ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, contact_number: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Position</Label>
                  <Input placeholder="e.g. Lecturer"
                    value={offlineForm.position ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, position: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Employment Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={offlineForm.employment_type}
                    onValueChange={v => setOfflineForm(f => ({ ...f, employment_type: v as EmploymentType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(EMPLOYMENT_LABELS) as [EmploymentType, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Employment Number</Label>
                  <Input placeholder="e.g. EMP-2024-001"
                    value={offlineForm.employment_number ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, employment_number: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Salary Scale</Label>
                  <Input placeholder="e.g. SS-7"
                    value={offlineForm.salary_scale ?? ''}
                    onChange={e => setOfflineForm(f => ({ ...f, salary_scale: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-[#7c69ff] hover:bg-[#6b5ae6]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
