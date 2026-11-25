import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Briefcase,
  Globe,
  Mail,
  Phone,
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  MapPin,
  UserCheck,
  Building,
  Clock,
  ExternalLink,
} from "lucide-react";

import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAccount,
  createContact,
  updateContact,
  deleteContact,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
} from "@/lib/api/accounts";
import type {
  Account,
  Contact,
  BusinessUnit,
  LifecycleStage,
  StrategicTier,
  Seniority,
  BuyingRole,
  Status,
} from "@/types/account";

const SENIORITIES: Seniority[] = ["C_LEVEL", "VP", "DIRECTOR", "MANAGER", "STAFF"];
const BUYING_ROLES: BuyingRole[] = [
  "DECISION_MAKER",
  "ECONOMIC_BUYER",
  "CHAMPION",
  "INFLUENCER",
  "GATEKEEPER",
  "USER",
];
const STATUS_OPTIONS: Status[] = ["ACTIVE", "INACTIVE"];

export function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal forms states
  const [activeTab, setActiveTab] = useState("overview");

  // Contact Dialog State
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactJob, setContactJob] = useState("");
  const [contactDept, setContactDept] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [contactLinkedIn, setContactLinkedIn] = useState("");
  const [contactSeniority, setContactSeniority] = useState<Seniority>("STAFF");
  const [contactBuyingRole, setContactBuyingRole] = useState<BuyingRole>("USER");
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [contactNotes, setContactNotes] = useState("");
  const [contactStatus, setContactStatus] = useState<Status>("ACTIVE");

  // Business Unit Dialog State
  const [isBUOpen, setIsBUOpen] = useState(false);
  const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);
  const [isBUSubmitting, setIsBUSubmitting] = useState(false);

  const [buName, setBuName] = useState("");
  const [buDescription, setBuDescription] = useState("");
  const [buRegion, setBuRegion] = useState("");
  const [buHeadContactId, setBuHeadContactId] = useState<string>("");

  const fetchAccountDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await getAccount(id);
      setAccount(res);
    } catch (err: any) {
      console.error("Failed to load account:", err);
      toast.error(err?.message || "Failed to load account details");
      navigate("/admin/accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetail();
  }, [id]);

  // Contact Actions
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!contactFirst.trim() && !contactLast.trim()) {
      toast.error("First Name or Last Name is required");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsContactSubmitting(true);
    try {
      const payload = {
        first_name: contactFirst.trim(),
        last_name: contactLast.trim(),
        job_title: contactJob.trim(),
        department: contactDept.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        mobile: contactMobile.trim(),
        linkedin_url: contactLinkedIn.trim(),
        seniority: contactSeniority,
        buying_role: contactBuyingRole,
        is_primary: contactIsPrimary,
        notes: contactNotes.trim(),
        status: contactStatus,
      };

      if (editingContact) {
        await updateContact(editingContact.id, payload);
        toast.success("Contact updated successfully");
      } else {
        await createContact(id, payload);
        toast.success("Contact created successfully");
      }
      setIsContactOpen(false);
      fetchAccountDetail();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save contact");
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const openCreateContact = () => {
    setEditingContact(null);
    clearContactForm();
    setIsContactOpen(true);
  };

  const openEditContact = (c: Contact) => {
    setEditingContact(c);
    setContactFirst(c.first_name || "");
    setContactLast(c.last_name || "");
    setContactJob(c.job_title || "");
    setContactDept(c.department || "");
    setContactEmail(c.email || "");
    setContactPhone(c.phone || "");
    setContactMobile(c.mobile || "");
    setContactLinkedIn(c.linkedin_url || "");
    setContactSeniority(c.seniority || "STAFF");
    setContactBuyingRole(c.buying_role || "USER");
    setContactIsPrimary(c.is_primary || false);
    setContactNotes(c.notes || "");
    setContactStatus(c.status || "ACTIVE");
    setIsContactOpen(true);
  };

  const handleDeleteContact = async (contactId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the contact "${name}"?`)) return;
    try {
      await deleteContact(contactId);
      toast.success("Contact deleted successfully");
      fetchAccountDetail();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete contact");
    }
  };

  const clearContactForm = () => {
    setContactFirst("");
    setContactLast("");
    setContactJob("");
    setContactDept("");
    setContactEmail("");
    setContactPhone("");
    setContactMobile("");
    setContactLinkedIn("");
    setContactSeniority("STAFF");
    setContactBuyingRole("USER");
    setContactIsPrimary(false);
    setContactNotes("");
    setContactStatus("ACTIVE");
  };

  // Business Unit Actions
  const handleBUSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!buName.trim()) {
      toast.error("Business Unit Name is required");
      return;
    }

    setIsBUSubmitting(true);
    try {
      const payload = {
        name: buName.trim(),
        description: buDescription.trim(),
        region: buRegion.trim(),
        head_contact_id: buHeadContactId || null,
      };

      if (editingBU) {
        await updateBusinessUnit(editingBU.id, payload);
        toast.success("Business Unit updated successfully");
      } else {
        await createBusinessUnit(id, payload);
        toast.success("Business Unit registered successfully");
      }
      setIsBUOpen(false);
      fetchAccountDetail();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save business unit");
    } finally {
      setIsBUSubmitting(false);
    }
  };

  const openCreateBU = () => {
    setEditingBU(null);
    clearBUForm();
    setIsBUOpen(true);
  };

  const openEditBU = (bu: BusinessUnit) => {
    setEditingBU(bu);
    setBuName(bu.name || "");
    setBuDescription(bu.description || "");
    setBuRegion(bu.region || "");
    setBuHeadContactId(bu.head_contact_id || "");
    setIsBUOpen(true);
  };

  const handleDeleteBU = async (buId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the business unit "${name}"?`)) return;
    try {
      await deleteBusinessUnit(buId);
      toast.success("Business unit deleted successfully");
      fetchAccountDetail();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete business unit");
    }
  };

  const clearBUForm = () => {
    setBuName("");
    setBuDescription("");
    setBuRegion("");
    setBuHeadContactId("");
  };

  const getLifecycleColor = (stage?: LifecycleStage) => {
    switch (stage) {
      case "CUSTOMER":
        return "bg-green-500/10 text-green-600 border border-green-500/20";
      case "PROSPECT":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
      case "LEAD":
        return "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20";
      case "CHURNED":
        return "bg-red-500/10 text-red-600 border border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-none";
    }
  };

  const getTierColor = (tier?: StrategicTier) => {
    switch (tier) {
      case "PLATINUM":
        return "bg-purple-500/10 text-purple-600 border border-purple-500/20";
      case "GOLD":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "SILVER":
        return "bg-slate-500/10 text-slate-600 border border-slate-500/20";
      case "BRONZE":
        return "bg-orange-500/10 text-orange-600 border border-orange-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-none";
    }
  };

  if (isLoading || !account) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-slate-500 font-sans text-sm">Loading enterprise profile...</span>
      </div>
    );
  }

  // Get Primary Contact
  const primaryContact = account.contacts?.find((c) => c.is_primary);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to="/admin/accounts"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts Directory
        </Link>

        {/* Profile Card Header */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 border border-primary/20">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
                  {account.name}
                </h1>
                {account.is_strategic_account && (
                  <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/20 font-bold px-2 py-0.5 rounded-full">
                    ABM Strategic Target
                  </Badge>
                )}
              </div>
              {account.legal_name && (
                <p className="text-sm font-sans text-slate-500 font-medium">Legal Name: {account.legal_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs font-sans text-slate-500">
                {account.website && (
                  <a
                    href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {account.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {account.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {account.email}
                  </span>
                )}
                {account.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {account.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Badge className={`${getLifecycleColor(account.lifecycle_stage)} font-bold text-xs rounded-full px-3 py-1 shadow-none`}>
              {account.lifecycle_stage}
            </Badge>
            <Badge className={`${getTierColor(account.strategic_tier)} font-bold text-xs rounded-full px-3 py-1 shadow-none`}>
              {account.strategic_tier}
            </Badge>
            <Badge variant={account.status === "ACTIVE" ? "default" : "secondary"} className="rounded-full shadow-none text-xs px-3 py-1">
              Status: {account.status}
            </Badge>
          </div>
        </div>

        {/* Tabs System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl h-11 border border-slate-200/50">
            <TabsTrigger value="overview" className="rounded-lg px-4 font-semibold text-xs tracking-wide uppercase">
              Overview
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-lg px-4 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
              Contacts ({account.contacts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="business-units" className="rounded-lg px-4 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
              Business Units ({account.business_units?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Account Details */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                    Corporate Identifiers & Sizing
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldView label="Registration Number" value={account.registration_number} />
                    <FieldView label="Tax Number (TIN)" value={account.tax_number} />
                    <FieldView label="Industry Sector" value={account.industry} />
                    <FieldView label="Sub-Sector" value={account.sub_sector} />
                    <FieldView label="Employee Count" value={account.employee_count ? account.employee_count.toLocaleString() : "—"} />
                    <FieldView label="Annual Revenue" value={account.annual_revenue ? `$${account.annual_revenue.toLocaleString()}` : "—"} />
                  </div>
                </div>

                {/* Location Details */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                    Physical Address & Region
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <FieldView label="Street Address" value={account.address} />
                    </div>
                    <FieldView label="District / City" value={account.district} />
                    <FieldView label="Province / State" value={account.province} />
                    <FieldView label="Country" value={account.country} />
                  </div>
                </div>

                {/* Notes and Tags */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                    CRM Intelligence notes
                  </h3>
                  <div className="space-y-4 font-sans text-sm">
                    <div>
                      <span className="text-slate-400 block font-semibold text-xs uppercase tracking-wider mb-1">Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {account.tags && account.tags.length > 0 ? (
                          account.tags.map((tag) => (
                            <Badge key={tag} className="bg-slate-100 text-slate-700 border-none font-medium hover:bg-slate-200">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">No tags assigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-xs uppercase tracking-wider mb-1">Internal Notes</span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                        {account.notes || "No notes registered for this account."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                    Relationship Details
                  </h3>
                  <div className="space-y-4">
                    <SidebarFieldView
                      label="Account Manager"
                      value={account.owner_name || "Unassigned"}
                      icon={<Briefcase className="h-4 w-4 text-slate-400" />}
                    />
                    <SidebarFieldView
                      label="Primary Contact Person"
                      value={
                        primaryContact
                          ? `${primaryContact.first_name || ""} ${primaryContact.last_name || ""}`.trim()
                          : "No primary contact"
                      }
                      icon={<UserCheck className="h-4 w-4 text-slate-400" />}
                    />
                    <SidebarFieldView
                      label="Parent Account"
                      value={account.parent_account_name || "None"}
                      icon={<Building className="h-4 w-4 text-slate-400" />}
                    />
                    <SidebarFieldView
                      label="Created At"
                      value={new Date(account.created_at).toLocaleDateString()}
                      icon={<Clock className="h-4 w-4 text-slate-400" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab Content */}
          <TabsContent value="contacts">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Buying Committee / Contacts</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Track decision-makers, champions, economic buyers, and stakeholders.
                  </p>
                </div>
                <Button onClick={openCreateContact} className="bg-primary text-white hover:bg-primary/95 rounded-xl h-10 gap-1.5 shadow-sm font-medium">
                  <Plus className="h-4.5 w-4.5" />
                  Add Contact
                </Button>
              </div>

              {!account.contacts || account.contacts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-sans">
                  No contacts registered for this account. Click "Add Contact" to associate a decision maker.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {account.contacts.map((c) => (
                    <div key={c.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-all flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-sans font-semibold text-slate-900 flex items-center gap-1.5">
                              {c.first_name} {c.last_name}
                              {c.is_primary && (
                                <Badge className="bg-green-500/10 text-green-600 border-none font-semibold text-[10px] py-0 px-2 h-4">
                                  Primary
                                </Badge>
                              )}
                            </h4>
                            <p className="text-xs text-slate-500 font-sans font-medium mt-0.5">
                              {c.job_title} {c.department && `• ${c.department}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => openEditContact(c)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-900"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteContact(c.id, `${c.first_name} ${c.last_name}`)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-1 text-xs font-sans text-slate-600">
                          {c.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {c.phone}
                            </span>
                          )}
                          {c.mobile && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {c.mobile} (Mobile)
                            </span>
                          )}
                          {c.linkedin_url && (
                            <a
                              href={c.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 hover:text-primary transition-colors"
                            >
                              <Globe className="h-3.5 w-3.5 text-slate-400" />
                              LinkedIn Profile
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 items-center">
                        <Badge className="bg-blue-500/10 text-blue-600 border-none font-semibold text-[10px] px-2 py-0.5">
                          {c.seniority || "STAFF"}
                        </Badge>
                        <Badge className="bg-purple-500/10 text-purple-600 border-none font-semibold text-[10px] px-2 py-0.5">
                          {c.buying_role || "USER"}
                        </Badge>
                        {c.notes && (
                          <span className="text-[11px] text-slate-400 truncate flex-1 font-sans font-medium" title={c.notes}>
                            Note: {c.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Business Units Tab Content */}
          <TabsContent value="business-units">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Business Units</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Divide large enterprise accounts into departments, subsidiaries, or regional divisions.
                  </p>
                </div>
                <Button onClick={openCreateBU} className="bg-primary text-white hover:bg-primary/95 rounded-xl h-10 gap-1.5 shadow-sm font-medium">
                  <Plus className="h-4.5 w-4.5" />
                  Add Business Unit
                </Button>
              </div>

              {!account.business_units || account.business_units.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-sans">
                  No business units segments registered for this account.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {account.business_units.map((bu) => (
                    <div key={bu.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-all flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-sans font-semibold text-slate-900">{bu.name}</h4>
                            {bu.region && (
                              <p className="text-xs text-slate-500 font-sans font-medium mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {bu.region}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => openEditBU(bu)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-900"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteBU(bu.id, bu.name)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {bu.description && (
                          <p className="text-xs text-slate-600 font-sans mt-3 leading-relaxed">
                            {bu.description}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center gap-2 text-xs font-sans text-slate-500">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Head Contact: </span>
                        <span className="font-semibold text-slate-900">
                          {bu.head_contact_name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog for Contact Create/Edit */}
        <Dialog open={isContactOpen} onOpenChange={() => setIsContactOpen(false)}>
          <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogHeader className="px-8 py-6 border-b border-slate-100">
              <DialogTitle className="font-display font-bold text-xl text-slate-900">
                {editingContact ? `Edit Contact Details` : "Add Contact Person"}
              </DialogTitle>
              <p className="text-slate-500 text-xs mt-1">
                Establish buying committee roles and contact details for the CRM dashboard.
              </p>
            </DialogHeader>

            <form onSubmit={handleContactSubmit}>
              <div className="p-8 space-y-5 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">First Name</Label>
                    <Input
                      value={contactFirst}
                      onChange={(e) => setContactFirst(e.target.value)}
                      placeholder="First Name"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Last Name</Label>
                    <Input
                      value={contactLast}
                      onChange={(e) => setContactLast(e.target.value)}
                      placeholder="Last Name"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Email Address *</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-10 border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Job Title</Label>
                    <Input
                      value={contactJob}
                      onChange={(e) => setContactJob(e.target.value)}
                      placeholder="e.g. Chief Technical Officer"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Department / Function</Label>
                    <Input
                      value={contactDept}
                      onChange={(e) => setContactDept(e.target.value)}
                      placeholder="e.g. IT Procurement"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Work Phone</Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Mobile Phone</Label>
                    <Input
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="Mobile"
                      className="h-10 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">LinkedIn URL</Label>
                  <Input
                    value={contactLinkedIn}
                    onChange={(e) => setContactLinkedIn(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-10 border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Seniority</Label>
                    <Select
                      value={contactSeniority}
                      onValueChange={(v) => setContactSeniority(v as Seniority)}
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SENIORITIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Buying Committee Role</Label>
                    <Select
                      value={contactBuyingRole}
                      onValueChange={(v) => setContactBuyingRole(v as BuyingRole)}
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUYING_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Status</Label>
                    <Select
                      value={contactStatus}
                      onValueChange={(v) => setContactStatus(v as Status)}
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

                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="contactIsPrimary"
                    checked={contactIsPrimary}
                    onChange={(e) => setContactIsPrimary(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300"
                  />
                  <Label htmlFor="contactIsPrimary" className="cursor-pointer text-sm text-slate-900 font-semibold">
                    Set as Primary Account Contact
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Notes / Professional Bio</Label>
                  <textarea
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    placeholder="E.g. Prefers email contact, key decision maker, intro via mutual connections."
                    className="w-full min-h-[80px] border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
                  />
                </div>
              </div>

              <DialogFooter className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsContactOpen(false)} className="h-10 rounded-lg">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isContactSubmitting}
                  className="h-10 bg-primary text-white hover:bg-primary/95 rounded-lg px-5"
                >
                  {isContactSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingContact ? (
                    "Save Contact"
                  ) : (
                    "Add Contact"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for Business Unit Create/Edit */}
        <Dialog open={isBUOpen} onOpenChange={() => setIsBUOpen(false)}>
          <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogHeader className="px-8 py-6 border-b border-slate-100">
              <DialogTitle className="font-display font-bold text-xl text-slate-900">
                {editingBU ? `Edit Business Unit` : "Register Business Unit Segment"}
              </DialogTitle>
              <p className="text-slate-500 text-xs mt-1">
                Delineate divisions, subsidiaries, or regions for key account mapping.
              </p>
            </DialogHeader>

            <form onSubmit={handleBUSubmit}>
              <div className="p-8 space-y-5 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Business Unit Name *</Label>
                  <Input
                    value={buName}
                    onChange={(e) => setBuName(e.target.value)}
                    placeholder="e.g. Acme EMEA Division"
                    className="h-10 border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Region / Territory</Label>
                  <Input
                    value={buRegion}
                    onChange={(e) => setBuRegion(e.target.value)}
                    placeholder="e.g. Europe, Middle East & Africa"
                    className="h-10 border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Division Head (Select from Account Contacts)</Label>
                  <Select value={buHeadContactId} onValueChange={setBuHeadContactId}>
                    <SelectTrigger className="h-10 border-slate-200 bg-white rounded-lg">
                      <SelectValue placeholder="Assign Head Contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {account.contacts?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}` : c.email} ({c.job_title || "No Title"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Description</Label>
                  <textarea
                    value={buDescription}
                    onChange={(e) => setBuDescription(e.target.value)}
                    placeholder="Enter division operations details, size, and notes."
                    className="w-full min-h-[100px] border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-sans"
                  />
                </div>
              </div>

              <DialogFooter className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsBUOpen(false)} className="h-10 rounded-lg">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isBUSubmitting}
                  className="h-10 bg-primary text-white hover:bg-primary/95 rounded-lg px-5"
                >
                  {isBUSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingBU ? (
                    "Save Business Unit"
                  ) : (
                    "Create Business Unit"
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

// Helper components for layout
interface FieldViewProps {
  label: string;
  value?: string | number | null;
}
function FieldView({ label, value }: FieldViewProps) {
  return (
    <div className="font-sans text-sm">
      <span className="text-slate-400 block font-semibold text-xs uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-slate-900 font-medium">{value || "—"}</span>
    </div>
  );
}

interface SidebarFieldViewProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}
function SidebarFieldView({ label, value, icon }: SidebarFieldViewProps) {
  return (
    <div className="flex items-start gap-2.5 text-sm font-sans">
      <div className="mt-1 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-slate-400 block font-semibold text-xs uppercase tracking-wider leading-none mb-1">
          {label}
        </span>
        <span className="text-slate-900 font-semibold truncate block">{value}</span>
      </div>
    </div>
  );
}
