import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Users, Search, Plus, Trash2, Edit2, Eye, DollarSign, TrendingUp, Loader2 } from "@/components/icons";

import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { KpiTile } from "@/components/shared/KpiTile";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Field } from "@/components/profiles/formParts";
import { list } from "@/lib/api/crud";
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/api/accounts";
import { money } from "@/lib/format";
import type { Account, LifecycleStage, StrategicTier, Status } from "@/types/account";
import { GradeChip, RecordStatusBadge, StageBadge, enumLabel } from "./accountUi";

const LIFECYCLE_STAGES: LifecycleStage[] = ["LEAD", "PROSPECT", "CUSTOMER", "CHURNED"];
const STRATEGIC_TIERS: StrategicTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
const STATUS_OPTIONS: Status[] = ["ACTIVE", "INACTIVE"];
// A select item cannot have an empty value, so "unassigned" uses a placeholder value that maps back to "".
const UNASSIGNED = "__none";

const INDUSTRIES = [
  "Technology & Software",
  "Telecommunications",
  "Finance & Banking",
  "Healthcare & Medical",
  "Retail & E-commerce",
  "Manufacturing & Industrial",
  "Energy & Utilities",
  "Professional Services",
  "Other",
];

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState<string>("ALL");
  const [industry, setIndustry] = useState<string>("ALL");
  const [ownerId, setOwnerId] = useState<string>("ALL");

  // CRM Users/Managers (for owner select)
  const [users, setUsers] = useState<any[]>([]);

  // Dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create/Edit form state
  const [formName, setFormName] = useState("");
  const [formLegalName, setFormLegalName] = useState("");
  const [formRegNo, setFormRegNo] = useState("");
  const [formTaxNo, setFormTaxNo] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formIndustry, setFormIndustry] = useState("");
  const [formSubSector, setFormSubSector] = useState("");
  const [formEmployeeCount, setFormEmployeeCount] = useState(0);
  const [formAnnualRevenue, setFormAnnualRevenue] = useState(0);
  const [formLifecycleStage, setFormLifecycleStage] = useState<LifecycleStage>("LEAD");
  const [formStrategicTier, setFormStrategicTier] = useState<StrategicTier>("BRONZE");
  const [formIsStrategic, setFormIsStrategic] = useState(false);
  const [formOwnerId, setFormOwnerId] = useState<string>("");
  const [formParentAccountId, setFormParentAccountId] = useState<string>("");
  const [formAddress, setFormAddress] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<Status>("ACTIVE");

  // Search debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load accounts
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await listAccounts({
        search: debouncedSearch,
        lifecycle_stage: lifecycleStage === "ALL" ? undefined : lifecycleStage,
        industry: industry === "ALL" ? undefined : industry,
        owner_id: ownerId === "ALL" ? undefined : ownerId,
        page,
        page_size: pageSize,
      });
      setAccounts(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error("Failed to load accounts:", err);
      toast.error(err?.message || "Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  // Load managers/owners
  const fetchUsers = async () => {
    try {
      const res: any = await list("USERS");
      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res?.items) {
        setUsers(res.items);
      }
    } catch (err) {
      console.error("Failed to load user directories:", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, debouncedSearch, lifecycleStage, industry, ownerId]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete the account "${name}"? This is a soft delete.`)) return;
    try {
      await deleteAccount(id);
      toast.success("Account deleted");
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
    }
  };

  // Handle Dialog Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Enter the account name.");
      return;
    }
    if (!formRegNo.trim() && !formTaxNo.trim() && !formWebsite.trim() && !formEmail.trim() && !formPhone.trim()) {
      toast.error("Fill in at least one identifier: registration number, tax number, website, email or phone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");

      const payload = {
        name: formName.trim(),
        legal_name: formLegalName.trim(),
        registration_number: formRegNo.trim(),
        tax_number: formTaxNo.trim(),
        website: formWebsite.trim(),
        industry: formIndustry,
        sub_sector: formSubSector.trim(),
        employee_count: Number(formEmployeeCount) || 0,
        annual_revenue: Number(formAnnualRevenue) || 0.0,
        lifecycle_stage: formLifecycleStage,
        strategic_tier: formStrategicTier,
        is_strategic_account: formIsStrategic,
        owner_id: formOwnerId || null,
        parent_account_id: formParentAccountId || null,
        address: formAddress.trim(),
        district: formDistrict.trim(),
        province: formProvince.trim(),
        country: formCountry.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        tags: tagsArray,
        notes: formNotes.trim(),
        status: formStatus,
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, payload);
        toast.success("Account updated");
      } else {
        await createAccount(payload);
        toast.success("Account added");
      }
      closeDialog();
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Could not save the account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreate = () => {
    setEditingAccount(null);
    clearForm();
    setIsCreateOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setFormName(account.name || "");
    setFormLegalName(account.legal_name || "");
    setFormRegNo(account.registration_number || "");
    setFormTaxNo(account.tax_number || "");
    setFormWebsite(account.website || "");
    setFormIndustry(account.industry || "");
    setFormSubSector(account.sub_sector || "");
    setFormEmployeeCount(account.employee_count || 0);
    setFormAnnualRevenue(account.annual_revenue || 0);
    setFormLifecycleStage(account.lifecycle_stage || "LEAD");
    setFormStrategicTier(account.strategic_tier || "BRONZE");
    setFormIsStrategic(account.is_strategic_account || false);
    setFormOwnerId(account.owner_id || "");
    setFormParentAccountId(account.parent_account_id || "");
    setFormAddress(account.address || "");
    setFormDistrict(account.district || "");
    setFormProvince(account.province || "");
    setFormCountry(account.country || "");
    setFormPhone(account.phone || "");
    setFormEmail(account.email || "");
    setFormTags(account.tags ? account.tags.join(", ") : "");
    setFormNotes(account.notes || "");
    setFormStatus(account.status || "ACTIVE");
    setIsCreateOpen(true);
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingAccount(null);
    clearForm();
  };

  const clearForm = () => {
    setFormName("");
    setFormLegalName("");
    setFormRegNo("");
    setFormTaxNo("");
    setFormWebsite("");
    setFormIndustry("");
    setFormSubSector("");
    setFormEmployeeCount(0);
    setFormAnnualRevenue(0);
    setFormLifecycleStage("LEAD");
    setFormStrategicTier("BRONZE");
    setFormIsStrategic(false);
    setFormOwnerId("");
    setFormParentAccountId("");
    setFormAddress("");
    setFormDistrict("");
    setFormProvince("");
    setFormCountry("");
    setFormPhone("");
    setFormEmail("");
    setFormTags("");
    setFormNotes("");
    setFormStatus("ACTIVE");
  };

  // Stats calculation
  const totalCRMRevenue = accounts.reduce((acc, a) => acc + (a.annual_revenue || 0), 0);
  const strategicAccountsCount = accounts.filter((a) => a.is_strategic_account).length;
  const customersCount = accounts.filter((a) => a.lifecycle_stage === "CUSTOMER").length;

  const userName = (u: any) => (u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}` : u.email);

  return (
    <PageTransition>
      <div className="flex w-full min-w-0 flex-col gap-5">
        <PageHeader
          title="Accounts"
          description="Your business customers, their segments and buying committees."
          actions={
            <Button onClick={openCreate}>
              <Plus />
              Add account
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile label="Total accounts" value={total} icon={<Building2 size={18} />} />
          <KpiTile label="Strategic accounts" value={strategicAccountsCount} hint="On this page" icon={<Users size={18} />} />
          <KpiTile label="Active customers" value={customersCount} hint="On this page" icon={<TrendingUp size={18} />} />
          <KpiTile
            label="Pipeline value"
            unit="USD"
            value={new Intl.NumberFormat("en-ZM", { notation: "compact", maximumFractionDigits: 1 }).format(totalCRMRevenue)}
            hint="Annual revenue, accounts on this page"
            icon={<DollarSign size={18} />}
          />
        </div>

        <SectionCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-[1fr_12rem_15rem_14rem]">
            <Field label="Search" htmlFor="account-search" className="sm:col-span-3 xl:col-span-1">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  id="account-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, legal name, tax number or email"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Lifecycle stage" htmlFor="filter-stage">
              <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
                <SelectTrigger id="filter-stage">
                  <SelectValue placeholder="Lifecycle stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All stages</SelectItem>
                  {LIFECYCLE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {enumLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Industry" htmlFor="filter-industry">
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger id="filter-industry">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All industries</SelectItem>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Account manager" htmlFor="filter-owner">
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger id="filter-owner">
                  <SelectValue placeholder="Account manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All managers</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {userName(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard padded={false}>
          <SectionBody
            loading={isLoading}
            skeleton={<TableSkeleton rows={8} columns={5} />}
            isEmpty={accounts.length === 0}
            empty={
              <EmptyState
                icon={<Building2 size={24} />}
                title="No accounts found"
                description="Change your search or filters, or add an account."
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="hidden lg:table-cell">Industry</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden sm:table-cell">Tier</TableHead>
                  <TableHead className="hidden xl:table-cell">Account manager</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Annual revenue</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col items-start gap-1">
                        <Link to={`/admin/accounts/${account.id}`} className="break-words font-semibold text-text-primary hover:text-signal-text">
                          {account.name}
                        </Link>
                        {account.legal_name && <span className="break-words text-xs font-normal text-text-muted">{account.legal_name}</span>}
                        {account.is_strategic_account && <StatusBadge tone="neutral">Strategic</StatusBadge>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-text-secondary lg:table-cell">
                      {account.industry || <span className="text-text-muted">Not recorded</span>}
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={account.lifecycle_stage} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <GradeChip tier={account.strategic_tier} />
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-text-secondary xl:table-cell">
                      {account.owner_name || <span className="text-text-muted">Unassigned</span>}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-right font-mono text-xs text-text-primary md:table-cell">
                      {account.annual_revenue ? money(account.annual_revenue, "USD") : <span className="text-text-muted">Not recorded</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <RecordStatusBadge status={account.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                          <Link to={`/admin/accounts/${account.id}`} aria-label={`View ${account.name}`} title="View details">
                            <Eye />
                          </Link>
                        </Button>
                        <Button onClick={() => openEdit(account)} variant="ghost" size="icon" aria-label={`Edit ${account.name}`} title="Edit">
                          <Edit2 />
                        </Button>
                        <Button
                          onClick={() => handleDelete(account.id, account.name)}
                          variant="ghost"
                          size="icon"
                          className="text-risk"
                          aria-label={`Delete ${account.name}`}
                          title="Delete"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionBody>

          {!isLoading && accounts.length > 0 && (
            <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          )}
        </SectionCard>

        {/* Dialog for Create/Edit */}
        <Dialog open={isCreateOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingAccount ? `Edit ${editingAccount.name}` : "Add an account"}</DialogTitle>
              <DialogDescription>Fill in the name and at least one identifier: registration number, tax number, website, email or phone.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Account name (required)" htmlFor="acc-name">
                  <Input id="acc-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Zambezi Logistics" required />
                </Field>
                <Field label="Legal company name" htmlFor="acc-legal">
                  <Input id="acc-legal" value={formLegalName} onChange={(e) => setFormLegalName(e.target.value)} placeholder="Zambezi Logistics Ltd" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Registration number" htmlFor="acc-reg">
                  <Input id="acc-reg" value={formRegNo} onChange={(e) => setFormRegNo(e.target.value)} className="font-mono" />
                </Field>
                <Field label="Tax number (TPIN)" htmlFor="acc-tax">
                  <Input id="acc-tax" value={formTaxNo} onChange={(e) => setFormTaxNo(e.target.value)} className="font-mono" />
                </Field>
                <Field label="Website" htmlFor="acc-web">
                  <Input id="acc-web" value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} placeholder="https://company.co.zm" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Industry" htmlFor="acc-industry">
                  <Select value={formIndustry} onValueChange={setFormIndustry}>
                    <SelectTrigger id="acc-industry">
                      <SelectValue placeholder="Choose an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sub-sector" htmlFor="acc-sub">
                  <Input id="acc-sub" value={formSubSector} onChange={(e) => setFormSubSector(e.target.value)} placeholder="Freight and haulage" />
                </Field>
                <Field label="Employee count" htmlFor="acc-employees">
                  <Input id="acc-employees" type="number" value={formEmployeeCount} onChange={(e) => setFormEmployeeCount(Number(e.target.value) || 0)} className="font-mono" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Annual revenue (USD)" htmlFor="acc-revenue">
                  <Input id="acc-revenue" type="number" value={formAnnualRevenue} onChange={(e) => setFormAnnualRevenue(Number(e.target.value) || 0)} className="font-mono" />
                </Field>
                <Field label="Account manager" htmlFor="acc-owner">
                  <Select value={formOwnerId || UNASSIGNED} onValueChange={(v) => setFormOwnerId(v === UNASSIGNED ? "" : v)}>
                    <SelectTrigger id="acc-owner">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {userName(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Lifecycle stage" htmlFor="acc-stage">
                  <Select value={formLifecycleStage} onValueChange={(v) => setFormLifecycleStage(v as LifecycleStage)}>
                    <SelectTrigger id="acc-stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIFECYCLE_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {enumLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Strategic tier" htmlFor="acc-tier">
                  <Select value={formStrategicTier} onValueChange={(v) => setFormStrategicTier(v as StrategicTier)}>
                    <SelectTrigger id="acc-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIC_TIERS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {enumLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status" htmlFor="acc-status">
                  <Select value={formStatus} onValueChange={(v) => setFormStatus(v as Status)}>
                    <SelectTrigger id="acc-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {enumLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-field p-3">
                <Checkbox id="formIsStrategic" checked={formIsStrategic} onCheckedChange={(v) => setFormIsStrategic(v === true)} />
                <Label htmlFor="formIsStrategic" className="cursor-pointer text-sm font-semibold text-text-primary">
                  Mark as a strategic account (high-priority target)
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Contact phone" htmlFor="acc-phone">
                  <Input id="acc-phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+260 97 123 4567" />
                </Field>
                <Field label="Contact email" htmlFor="acc-email">
                  <Input id="acc-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="info@company.co.zm" />
                </Field>
              </div>

              <Field label="Street address" htmlFor="acc-address">
                <Input id="acc-address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Great East Road" />
              </Field>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="District or city" htmlFor="acc-district">
                  <Input id="acc-district" value={formDistrict} onChange={(e) => setFormDistrict(e.target.value)} placeholder="Ndola" />
                </Field>
                <Field label="Province" htmlFor="acc-province">
                  <Input id="acc-province" value={formProvince} onChange={(e) => setFormProvince(e.target.value)} placeholder="Copperbelt" />
                </Field>
                <Field label="Country" htmlFor="acc-country">
                  <Input id="acc-country" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} placeholder="Zambia" />
                </Field>
              </div>

              <Field label="Tags (comma separated)" htmlFor="acc-tags">
                <Input id="acc-tags" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="enterprise, renewal" />
              </Field>

              <Field label="Notes" htmlFor="acc-notes">
                <Textarea
                  id="acc-notes"
                  rows={4}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Background, sizing and competitors"
                />
              </Field>

              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving…
                    </>
                  ) : editingAccount ? (
                    "Save changes"
                  ) : (
                    "Add account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
