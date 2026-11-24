import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";

import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { list } from "@/lib/api/crud";
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/api/accounts";
import type { Account, LifecycleStage, StrategicTier, Status } from "@/types/account";

const LIFECYCLE_STAGES: LifecycleStage[] = ["LEAD", "PROSPECT", "CUSTOMER", "CHURNED"];
const STRATEGIC_TIERS: StrategicTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
const STATUS_OPTIONS: Status[] = ["ACTIVE", "INACTIVE"];

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
    if (!confirm(`Are you sure you want to soft-delete the account "${name}"?`)) return;
    try {
      await deleteAccount(id);
      toast.success("Account successfully deleted");
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
    }
  };

  // Handle Dialog Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Account Name is required");
      return;
    }
    if (!formRegNo.trim() && !formTaxNo.trim() && !formWebsite.trim() && !formEmail.trim() && !formPhone.trim()) {
      toast.error("At least one unique identifier (Reg No, Tax No, Website, Email, or Phone) must be filled");
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
        toast.success("Account updated successfully");
      } else {
        await createAccount(payload);
        toast.success("Account created successfully");
      }
      closeDialog();
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during submission");
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

  const getLifecycleColor = (stage: LifecycleStage) => {
    switch (stage) {
      case "CUSTOMER":
        return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "PROSPECT":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "LEAD":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "CHURNED":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTierColor = (tier: StrategicTier) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      case "GOLD":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "SILVER":
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
      case "BRONZE":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  // Stats calculation
  const totalCRMRevenue = accounts.reduce((acc, a) => acc + (a.annual_revenue || 0), 0);
  const strategicAccountsCount = accounts.filter((a) => a.is_strategic_account).length;
  const customersCount = accounts.filter((a) => a.lifecycle_stage === "CUSTOMER").length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-display-sm text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Accounts Directory
            </h1>
            <p className="text-slate-500 mt-1 font-sans text-text-md">
              Manage enterprise B2B customers, segments, and buying committee members
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={openCreate}
              className="h-10 px-5 rounded-xl bg-primary text-white hover:bg-primary/95 font-medium shadow-md shadow-primary/20 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Register Account
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardStat
            title="Total Accounts"
            value={total}
            icon={<Building2 className="h-5 w-5 text-indigo-600" />}
            color="indigo"
          />
          <CardStat
            title="Strategic (ABM)"
            value={strategicAccountsCount}
            icon={<Users className="h-5 w-5 text-purple-600" />}
            color="purple"
          />
          <CardStat
            title="Active Customers"
            value={customersCount}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            color="green"
          />
          <CardStat
            title="Pipeline Value"
            value={`$${totalCRMRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5 text-amber-600" />}
            color="amber"
          />
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, legal name, tax ID, email..."
                className="pl-10 h-11 border-slate-200 focus:ring-primary rounded-xl"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Lifecycle Stage */}
              <div className="w-[180px]">
                <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
                  <SelectTrigger className="h-11 border-slate-200 rounded-xl bg-white">
                    <SelectValue placeholder="Lifecycle Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stages</SelectItem>
                    {LIFECYCLE_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div className="w-[180px]">
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-11 border-slate-200 rounded-xl bg-white">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Industries</SelectItem>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner */}
              <div className="w-[180px]">
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger className="h-11 border-slate-200 rounded-xl bg-white">
                    <SelectValue placeholder="Account Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Managers</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}` : u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Table list */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-slate-500 font-sans text-sm">Loading accounts directory...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900">No accounts found</h3>
              <p className="text-slate-500 text-sm mt-1">
                Try modifying your search queries or register a new enterprise account to get started.
              </p>
              <Button onClick={openCreate} className="mt-4 bg-primary text-white rounded-xl h-10 px-5">
                Register Account
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Account Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Industry</TableHead>
                    <TableHead className="font-semibold text-slate-700">Stage</TableHead>
                    <TableHead className="font-semibold text-slate-700">ABM Grade</TableHead>
                    <TableHead className="font-semibold text-slate-700">Manager</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Annual Revenue</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex flex-col">
                          <Link
                            to={`/admin/accounts/${account.id}`}
                            className="hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            {account.name}
                            {account.is_strategic_account && (
                              <Badge className="bg-purple-500/10 text-purple-600 border-none font-semibold text-[10px] px-1.5 py-0 h-4">
                                Strategic
                              </Badge>
                            )}
                          </Link>
                          {account.legal_name && (
                            <span className="text-xs text-slate-400 font-sans">{account.legal_name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-sans text-sm">
                        {account.industry || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getLifecycleColor(account.lifecycle_stage)} font-semibold text-xs rounded-full px-2.5 py-0.5 shadow-none`}>
                          {account.lifecycle_stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTierColor(account.strategic_tier)} font-semibold text-xs rounded-full px-2.5 py-0.5 shadow-none`}>
                          {account.strategic_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 font-sans text-sm">
                        {account.owner_name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-right text-slate-900 font-medium">
                        {account.annual_revenue ? `$${account.annual_revenue.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === "ACTIVE" ? "default" : "secondary"} className="rounded-full shadow-none text-xs px-2">
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link to={`/admin/accounts/${account.id}`} title="View Details">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-950">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            onClick={() => openEdit(account)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-950"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(account.id, account.name)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && accounts.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="font-sans text-sm text-slate-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="h-9 px-3 text-xs bg-white rounded-lg"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={accounts.length < pageSize || page * pageSize >= total}
                  variant="outline"
                  className="h-9 px-3 text-xs bg-white rounded-lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog for Create/Edit */}
        <Dialog open={isCreateOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogHeader className="px-8 py-6 border-b border-slate-100">
              <DialogTitle className="font-display font-bold text-xl text-slate-900">
                {editingAccount ? `Edit Account: ${editingAccount.name}` : "Register B2B Account"}
              </DialogTitle>
              <p className="text-slate-500 text-xs mt-1">
                Enter legal identifiers, marketing alignment metrics, and physical addresses.
              </p>
            </DialogHeader>

            <form onSubmit={handleFormSubmit}>
              <div className="p-8 space-y-6 overflow-y-auto max-h-[65vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Account Name *</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="h-10 border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Legal Company Name</Label>
                    <Input
                      value={formLegalName}
                      onChange={(e) => setFormLegalName(e.target.value)}
                      placeholder="e.g. Acme Corporation LLC"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Identifiers */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Registration Number</Label>
                    <Input
                      value={formRegNo}
                      onChange={(e) => setFormRegNo(e.target.value)}
                      placeholder="Registration Number"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Tax Number (TIN)</Label>
                    <Input
                      value={formTaxNo}
                      onChange={(e) => setFormTaxNo(e.target.value)}
                      placeholder="Tax Identifier"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Website</Label>
                    <Input
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="https://acme.corp"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Industry and segment */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Industry / Sector</Label>
                    <Select value={formIndustry} onValueChange={setFormIndustry}>
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue placeholder="Select Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Sub-Sector</Label>
                    <Input
                      value={formSubSector}
                      onChange={(e) => setFormSubSector(e.target.value)}
                      placeholder="e.g. AI Platforms"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Employee Count</Label>
                    <Input
                      type="number"
                      value={formEmployeeCount}
                      onChange={(e) => setFormEmployeeCount(Number(e.target.value) || 0)}
                      placeholder="Number of Employees"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sales & Metrics */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Annual Revenue ($)</Label>
                    <Input
                      type="number"
                      value={formAnnualRevenue}
                      onChange={(e) => setFormAnnualRevenue(Number(e.target.value) || 0)}
                      placeholder="Annual Sales Revenue"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Account Manager (Owner)</Label>
                    <Select value={formOwnerId} onValueChange={setFormOwnerId}>
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue placeholder="Select Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}` : u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pipeline categorization */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Lifecycle Stage</Label>
                    <Select
                      value={formLifecycleStage}
                      onValueChange={(v) => setFormLifecycleStage(v as LifecycleStage)}
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIFECYCLE_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Strategic Tier (ABM)</Label>
                    <Select
                      value={formStrategicTier}
                      onValueChange={(v) => setFormStrategicTier(v as StrategicTier)}
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STRATEGIC_TIERS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Status</Label>
                    <Select
                      value={formStatus}
                      onValueChange={(v) => setFormStatus(v as Status)}
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="formIsStrategic"
                    checked={formIsStrategic}
                    onChange={(e) => setFormIsStrategic(e.target.checked)}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <Label htmlFor="formIsStrategic" className="cursor-pointer text-sm text-purple-900 font-semibold">
                    Mark as ABM Strategic Account (high-priority target)
                  </Label>
                </div>

                {/* Contact and address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Contact Phone</Label>
                    <Input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Contact Email</Label>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. info@acme.corp"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Street Address</Label>
                  <Input
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="123 Corporate Blvd Suite 100"
                    className="h-10 border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">District / City</Label>
                    <Input
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      placeholder="District"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Province / State</Label>
                    <Input
                      value={formProvince}
                      onChange={(e) => setFormProvince(e.target.value)}
                      placeholder="Province"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Country</Label>
                    <Input
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="Country"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Tags (comma-separated)</Label>
                  <Input
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="enterprise, saas, hot-lead, renewal"
                    className="h-10 border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Notes / Details</Label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Add background context, sizing info, competitor info, etc."
                    className="w-full min-h-[100px] border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
                  />
                </div>
              </div>

              <DialogFooter className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog} className="h-10 rounded-lg">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 bg-primary text-white hover:bg-primary/95 rounded-lg px-5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingAccount ? (
                    "Save Changes"
                  ) : (
                    "Create Account"
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

// Sub-component for stats card
interface CardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}
function CardStat({ title, value, icon, color }: CardStatProps) {
  const getColorClasses = (c: string) => {
    switch (c) {
      case "indigo":
        return "bg-indigo-50 border-indigo-100";
      case "purple":
        return "bg-purple-50 border-purple-100";
      case "green":
        return "bg-green-50 border-green-100";
      case "amber":
        return "bg-amber-50 border-amber-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between`}>
      <div className="space-y-1">
        <span className="text-slate-500 font-sans text-xs uppercase tracking-wider font-semibold">
          {title}
        </span>
        <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
          {value}
        </h3>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getColorClasses(color)}`}>
        {icon}
      </div>
    </div>
  );
}
