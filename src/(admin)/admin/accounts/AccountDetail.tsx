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
} from "@/components/icons";

import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Field } from "@/components/profiles/formParts";
import {
  getAccount,
  createContact,
  updateContact,
  deleteContact,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
} from "@/lib/api/accounts";
import { formatDate, money } from "@/lib/format";
import type {
  Account,
  Contact,
  BusinessUnit,
  Seniority,
  BuyingRole,
  Status,
} from "@/types/account";
import { GradeChip, RecordStatusBadge, SENIORITY_LABEL, StageBadge, enumLabel } from "./accountUi";

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
// A select item cannot have an empty value, so "unassigned" uses a placeholder value that maps back to "".
const UNASSIGNED = "__none";

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
      toast.error("Enter a first name or a last name.");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Enter an email address.");
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
        toast.success("Contact updated");
      } else {
        await createContact(id, payload);
        toast.success("Contact added");
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
    if (!confirm(`Remove the contact "${name}"?`)) return;
    try {
      await deleteContact(contactId);
      toast.success("Contact deleted");
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
      toast.error("Enter the business unit name.");
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
        toast.success("Business unit updated");
      } else {
        await createBusinessUnit(id, payload);
        toast.success("Business unit added");
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
    if (!confirm(`Delete the business unit "${name}"?`)) return;
    try {
      await deleteBusinessUnit(buId);
      toast.success("Business unit deleted");
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

  if (isLoading || !account) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading" className="flex w-full flex-col gap-5">
        <div className="skeleton h-9 w-64 max-w-full rounded-md" />
        <div className="skeleton h-10 w-80 max-w-full rounded-lg" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    );
  }

  // Get Primary Contact
  const primaryContact = account.contacts?.find((c) => c.is_primary);

  return (
    <PageTransition>
      <div className="flex w-full min-w-0 flex-col gap-5">
        <div className="space-y-3">
          <PageHeader
            crumb={
              <Link to="/admin/accounts" className="inline-flex items-center gap-1 font-medium text-signal-text hover:underline">
                <ArrowLeft size={14} />
                Accounts
              </Link>
            }
            title={<span className="break-words">{account.name}</span>}
            description={account.legal_name ? `Legal name: ${account.legal_name}` : undefined}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <StageBadge stage={account.lifecycle_stage} />
            <GradeChip tier={account.strategic_tier} />
            <RecordStatusBadge status={account.status} />
            {account.is_strategic_account && <StatusBadge tone="neutral">Strategic account</StatusBadge>}
          </div>

          {(account.website || account.email || account.phone) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-secondary">
              {account.website && (
                <a
                  href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-1.5 break-all font-medium text-signal-text hover:underline"
                >
                  <Globe size={16} />
                  {account.website}
                  <ExternalLink size={14} />
                </a>
              )}
              {account.email && (
                <span className="flex min-w-0 items-center gap-1.5 break-all">
                  <Mail size={16} />
                  {account.email}
                </span>
              )}
              {account.phone && (
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <Phone size={16} />
                  {account.phone}
                </span>
              )}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
          <div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="w-max">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1.5">
                Contacts
                <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs text-text-secondary">{account.contacts?.length || 0}</span>
              </TabsTrigger>
              <TabsTrigger value="business-units" className="gap-1.5">
                Business units
                <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs text-text-secondary">{account.business_units?.length || 0}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
              <div className="grid min-w-0 gap-5">
                <SectionCard title="Identifiers and size">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldView label="Registration number" value={account.registration_number} mono />
                    <FieldView label="Tax number (TPIN)" value={account.tax_number} mono />
                    <FieldView label="Industry" value={account.industry} />
                    <FieldView label="Sub-sector" value={account.sub_sector} />
                    <FieldView label="Employee count" value={account.employee_count ? account.employee_count.toLocaleString() : undefined} mono />
                    <FieldView label="Annual revenue" value={account.annual_revenue ? money(account.annual_revenue, "USD") : undefined} mono />
                  </dl>
                </SectionCard>

                <SectionCard title="Address">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FieldView label="Street address" value={account.address} />
                    </div>
                    <FieldView label="District or city" value={account.district} />
                    <FieldView label="Province" value={account.province} />
                    <FieldView label="Country" value={account.country} />
                  </dl>
                </SectionCard>
              </div>

              <div className="grid min-w-0 gap-5">
                <SectionCard title="Relationship">
                  <dl className="grid gap-4">
                    <SidebarFieldView label="Account manager" value={account.owner_name || "Unassigned"} icon={<Briefcase size={16} />} />
                    <SidebarFieldView
                      label="Primary contact"
                      value={
                        primaryContact
                          ? `${primaryContact.first_name || ""} ${primaryContact.last_name || ""}`.trim()
                          : "No primary contact"
                      }
                      icon={<UserCheck size={16} />}
                    />
                    <SidebarFieldView label="Parent account" value={account.parent_account_name || "None"} icon={<Building size={16} />} />
                    <SidebarFieldView label="Created" value={formatDate(account.created_at)} icon={<Clock size={16} />} />
                  </dl>
                </SectionCard>

                <SectionCard title="Notes and tags">
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-text-muted">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {account.tags && account.tags.length > 0 ? (
                          account.tags.map((tag) => (
                            <StatusBadge key={tag} tone="neutral">
                              {tag}
                            </StatusBadge>
                          ))
                        ) : (
                          <span className="text-xs text-text-muted">No tags</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-muted">Internal notes</p>
                      <p className="whitespace-pre-line break-words text-text-primary">
                        {account.notes || "No notes for this account."}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab Content */}
          <TabsContent value="contacts">
            <SectionCard
              title="Buying committee"
              actions={
                <Button onClick={openCreateContact}>
                  <Plus />
                  Add contact
                </Button>
              }
              padded={false}
            >
              {!account.contacts || account.contacts.length === 0 ? (
                <EmptyState
                  icon={<Users size={24} />}
                  title="No contacts yet"
                  description="Add decision makers, champions and other stakeholders for this account."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-3">
                  {account.contacts.map((c) => (
                    <div key={c.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-md border border-line p-4">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold text-text-primary">
                              {c.first_name} {c.last_name}
                            </h3>
                            <p className="mt-0.5 break-words text-xs text-text-muted">
                              {c.job_title} {c.department && `· ${c.department}`}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <Button onClick={() => openEditContact(c)} variant="ghost" size="icon" aria-label={`Edit ${c.first_name} ${c.last_name}`} title="Edit">
                              <Edit2 />
                            </Button>
                            <Button
                              onClick={() => handleDeleteContact(c.id, `${c.first_name} ${c.last_name}`)}
                              variant="ghost"
                              size="icon"
                              className="text-risk"
                              aria-label={`Delete ${c.first_name} ${c.last_name}`}
                              title="Delete"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-1 text-[13px] text-text-secondary">
                          {c.email && (
                            <span className="flex min-w-0 items-center gap-1.5 break-all">
                              <Mail size={14} className="shrink-0 text-text-muted" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={14} className="shrink-0 text-text-muted" />
                              <span className="font-mono text-xs">{c.phone}</span>
                            </span>
                          )}
                          {c.mobile && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={14} className="shrink-0 text-text-muted" />
                              <span className="font-mono text-xs">{c.mobile}</span> (mobile)
                            </span>
                          )}
                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-signal-text hover:underline">
                              <Globe size={14} className="shrink-0" />
                              LinkedIn profile
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                        {c.is_primary && <StatusBadge tone="positive">Primary</StatusBadge>}
                        <StatusBadge tone="neutral">{SENIORITY_LABEL[c.seniority || "STAFF"]}</StatusBadge>
                        <StatusBadge tone="neutral">{enumLabel(c.buying_role || "USER")}</StatusBadge>
                        {c.notes && (
                          <span className="min-w-0 flex-1 basis-full truncate text-xs text-text-muted" title={c.notes}>
                            Note: {c.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* Business Units Tab Content */}
          <TabsContent value="business-units">
            <SectionCard
              title="Business units"
              actions={
                <Button onClick={openCreateBU}>
                  <Plus />
                  Add business unit
                </Button>
              }
              padded={false}
            >
              {!account.business_units || account.business_units.length === 0 ? (
                <EmptyState
                  icon={<Building2 size={24} />}
                  title="No business units yet"
                  description="Split large accounts into departments, subsidiaries or regional divisions."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-3">
                  {account.business_units.map((bu) => (
                    <div key={bu.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-md border border-line p-4">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold text-text-primary">{bu.name}</h3>
                            {bu.region && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                                <MapPin size={12} />
                                {bu.region}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <Button onClick={() => openEditBU(bu)} variant="ghost" size="icon" aria-label={`Edit ${bu.name}`} title="Edit">
                              <Edit2 />
                            </Button>
                            <Button
                              onClick={() => handleDeleteBU(bu.id, bu.name)}
                              variant="ghost"
                              size="icon"
                              className="text-risk"
                              aria-label={`Delete ${bu.name}`}
                              title="Delete"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>

                        {bu.description && <p className="mt-3 break-words text-[13px] text-text-secondary">{bu.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 border-t border-line pt-3 text-xs text-text-muted">
                        <Users size={14} />
                        <span>Head contact:</span>
                        <span className="font-semibold text-text-primary">{bu.head_contact_name || "Unassigned"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>

        {/* Dialog for Contact Create/Edit */}
        <Dialog open={isContactOpen} onOpenChange={() => setIsContactOpen(false)}>
          <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingContact ? "Edit contact" : "Add a contact"}</DialogTitle>
              <DialogDescription>Record their buying role and how to reach them.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First name" htmlFor="ct-first">
                  <Input id="ct-first" value={contactFirst} onChange={(e) => setContactFirst(e.target.value)} placeholder="Natasha" />
                </Field>
                <Field label="Last name" htmlFor="ct-last">
                  <Input id="ct-last" value={contactLast} onChange={(e) => setContactLast(e.target.value)} placeholder="Lungu" />
                </Field>
              </div>

              <Field label="Email address (required)" htmlFor="ct-email">
                <Input id="ct-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@company.co.zm" required />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Job title" htmlFor="ct-job">
                  <Input id="ct-job" value={contactJob} onChange={(e) => setContactJob(e.target.value)} placeholder="Head of IT" />
                </Field>
                <Field label="Department" htmlFor="ct-dept">
                  <Input id="ct-dept" value={contactDept} onChange={(e) => setContactDept(e.target.value)} placeholder="Procurement" />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Work phone" htmlFor="ct-phone">
                  <Input id="ct-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+260 21 123 4567" />
                </Field>
                <Field label="Mobile phone" htmlFor="ct-mobile">
                  <Input id="ct-mobile" value={contactMobile} onChange={(e) => setContactMobile(e.target.value)} placeholder="+260 97 123 4567" />
                </Field>
              </div>

              <Field label="LinkedIn URL" htmlFor="ct-linkedin">
                <Input id="ct-linkedin" value={contactLinkedIn} onChange={(e) => setContactLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/username" />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Seniority" htmlFor="ct-seniority">
                  <Select value={contactSeniority} onValueChange={(v) => setContactSeniority(v as Seniority)}>
                    <SelectTrigger id="ct-seniority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENIORITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SENIORITY_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Buying role" htmlFor="ct-role">
                  <Select value={contactBuyingRole} onValueChange={(v) => setContactBuyingRole(v as BuyingRole)}>
                    <SelectTrigger id="ct-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUYING_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {enumLabel(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status" htmlFor="ct-status">
                  <Select value={contactStatus} onValueChange={(v) => setContactStatus(v as Status)}>
                    <SelectTrigger id="ct-status">
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
                <Checkbox id="contactIsPrimary" checked={contactIsPrimary} onCheckedChange={(v) => setContactIsPrimary(v === true)} />
                <Label htmlFor="contactIsPrimary" className="cursor-pointer text-sm font-semibold text-text-primary">
                  Set as the primary account contact
                </Label>
              </div>

              <Field label="Notes" htmlFor="ct-notes">
                <Textarea id="ct-notes" rows={3} value={contactNotes} onChange={(e) => setContactNotes(e.target.value)} placeholder="Prefers email. Key decision maker." />
              </Field>

              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsContactOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isContactSubmitting}>
                  {isContactSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving…
                    </>
                  ) : editingContact ? (
                    "Save contact"
                  ) : (
                    "Add contact"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for Business Unit Create/Edit */}
        <Dialog open={isBUOpen} onOpenChange={() => setIsBUOpen(false)}>
          <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingBU ? "Edit business unit" : "Add a business unit"}</DialogTitle>
              <DialogDescription>A division, subsidiary or region of this account.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBUSubmit} className="space-y-4">
              <Field label="Business unit name (required)" htmlFor="bu-name">
                <Input id="bu-name" value={buName} onChange={(e) => setBuName(e.target.value)} placeholder="Copperbelt division" required />
              </Field>

              <Field label="Region or territory" htmlFor="bu-region">
                <Input id="bu-region" value={buRegion} onChange={(e) => setBuRegion(e.target.value)} placeholder="Copperbelt" />
              </Field>

              <Field label="Head contact (from this account's contacts)" htmlFor="bu-head">
                <Select value={buHeadContactId || UNASSIGNED} onValueChange={(v) => setBuHeadContactId(v === UNASSIGNED ? "" : v)}>
                  <SelectTrigger id="bu-head">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {account.contacts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}` : c.email} ({c.job_title || "No title"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Description" htmlFor="bu-description">
                <Textarea id="bu-description" rows={4} value={buDescription} onChange={(e) => setBuDescription(e.target.value)} placeholder="What the unit does, its size and notes" />
              </Field>

              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsBUOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBUSubmitting}>
                  {isBUSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving…
                    </>
                  ) : editingBU ? (
                    "Save business unit"
                  ) : (
                    "Add business unit"
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
  mono?: boolean;
}
function FieldView({ label, value, mono }: FieldViewProps) {
  return (
    <div className="min-w-0 text-sm">
      <dt className="mb-0.5 text-xs font-medium text-text-muted">{label}</dt>
      <dd className={value ? `break-words text-text-primary ${mono ? "font-mono text-[13px]" : ""}` : "text-text-muted"}>{value || "Not recorded"}</dd>
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
    <div className="flex items-start gap-3 text-sm">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-secondary">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-text-muted">{label}</dt>
        <dd className="break-words font-semibold text-text-primary">{value}</dd>
      </div>
    </div>
  );
}
