import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Activity,
  Globe,
  Loader2,
  Check,
  X,
  FileText,
  ShieldCheck,
  Copy,
  CheckCircle,
  TrendingUp,
  Plus,
  RefreshCw,
} from "@/components/icons";
import { retrieve, post } from "@/lib/api/crud";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiTile } from "@/components/shared/KpiTile";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import type { Tone } from "@/lib/status";

const STATE_TONES: Record<string, Tone> = {
  SUBMITTED: "positive",
  INFO_REQUESTED: "caution",
};

const DOC_TONES: Record<string, Tone> = {
  VERIFIED: "positive",
  REJECTED: "risk",
};

const sentenceCase = (value: string) => {
  const words = (value ?? "").replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const pipelineAmount = (value: number) => `USD ${(value || 0).toLocaleString()}`;

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words font-medium text-text-primary ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

export default function ControlHubDashboard() {
  const [stats] = useState<any[]>([
    {
      id: "tenants",
      icon: Building2,
      title: "Total tenants",
      value: "12",
      trend: { direction: "up" as const, percentage: 20, label: "+2 this week" },
    },
    {
      id: "users",
      icon: Users,
      title: "Active users",
      value: "2,845",
      trend: { direction: "up" as const, percentage: 15, label: "+340 this month" },
    },
    {
      id: "health",
      icon: Activity,
      title: "Overall uptime",
      value: "99.9%",
      trend: { direction: "up" as const, percentage: 0.1, label: "vs last week" },
    },
    {
      id: "reach",
      icon: Globe,
      title: "Regions covered",
      value: "8",
      trend: { direction: "up" as const, percentage: 33, label: "+1 new region" },
    },
  ]);

  const [onboardingRequests, setOnboardingRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // States for verification actions
  const [notes, setNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [infoRequestedFields, setInfoRequestedFields] = useState("");

  // Successful approval invitation setup link state
  const [claimLink, setClaimLink] = useState<string | null>(null);

  // States for initiating a new onboarding request
  const [isInitiating, setIsInitiating] = useState(false);
  const [initCompanyName, setInitCompanyName] = useState("");
  const [initContactEmail, setInitContactEmail] = useState("");
  const [isSubmittingInit, setIsSubmittingInit] = useState(false);

  // "actionable" hides companies that have only registered; "unclaimed" lists those whose setup link nobody has used yet
  const [listScope, setListScope] = useState<"actionable" | "unclaimed">("actionable");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      await post("CH_ONBOARDING_RESEND", {}, { id });
      toast.success("A new setup link was sent");
    } catch (err: any) {
      toast.error(err.message || "Could not resend the setup link");
    } finally {
      setResendingId(null);
    }
  };

  const fetchOnboardingRequests = async (scope: "actionable" | "unclaimed" = listScope) => {
    setIsLoadingRequests(true);
    try {
      const res: any = await retrieve("CH_ONBOARDING", {}, { scope });
      if (Array.isArray(res)) {
        setOnboardingRequests(res);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load onboarding requests");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchOnboardingRequests(listScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listScope]);

  const handleVerifyDoc = async (docId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      const res: any = await post("CH_ONBOARDING_VERIFY_DOC", { status, reason: "Supervisor verification review" }, { id: docId });
      if (res) {
        toast.success(`Document marked as ${status.toLowerCase()}`);
        // Refresh selected request state
        if (selectedRequest) {
          const updatedDocs = selectedRequest.documents.map((d: any) =>
            d.id === docId ? { ...d, verification_status: status } : d
          );
          setSelectedRequest({ ...selectedRequest, documents: updatedDocs });
        }
        fetchOnboardingRequests();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to review document");
    }
  };

  const handleTransitionState = async (state: string) => {
    if (!selectedRequest) return;

    try {
      const res: any = await post("CH_ONBOARDING_TRANSITION", {
        state,
        notes,
        admin_notes: adminNotes,
        info_requested_fields: state === "INFO_REQUESTED" ? infoRequestedFields : "",
      }, { id: selectedRequest.id });

      if (res) {
        toast.success(`Onboarding status: ${sentenceCase(state)}`);

        // If approved, capture invitation setup link DTO
        if (state === "APPROVED" && res.admin_setup_link) {
          setClaimLink(res.admin_setup_link);
        } else {
          setSelectedRequest(null);
        }

        setNotes("");
        setAdminNotes("");
        setInfoRequestedFields("");
        fetchOnboardingRequests();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update onboarding request state");
    }
  };

  const handleInitiateOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initCompanyName.trim() || !initContactEmail.trim()) {
      toast.error("Enter a company name and a contact email.");
      return;
    }

    setIsSubmittingInit(true);
    try {
      const res: any = await post("CH_ONBOARDING_INITIATE", {
        company_name: initCompanyName,
        contact_email: initContactEmail,
      });

      if (res && res.admin_setup_link) {
        toast.success("Onboarding request created");
        setClaimLink(res.admin_setup_link);
        setIsInitiating(false);
        setInitCompanyName("");
        setInitContactEmail("");
        fetchOnboardingRequests();
      } else {
        toast.error("Failed to generate setup link");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate onboarding request");
    } finally {
      setIsSubmittingInit(false);
    }
  };

  const handleCopyLink = () => {
    if (claimLink) {
      navigator.clipboard.writeText(claimLink);
      toast.success("Setup link copied");
    }
  };

  const closeClaimLink = () => {
    setClaimLink(null);
    setSelectedRequest(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Control Hub"
        description="Manage tenants and review client onboarding."
        actions={
          <Button onClick={() => setIsInitiating(true)}>
            <Plus />
            Start onboarding
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <KpiTile
              key={stat.id}
              label={stat.title}
              value={stat.value}
              icon={<Icon size={18} />}
              hint={stat.trend && (
                <>
                  <TrendingUp size={14} className="text-positive" />
                  <span className="text-positive">{stat.trend.percentage}%</span>
                  <span>{stat.trend.label}</span>
                </>
              )}
            />
          );
        })}
      </div>

      {/* Onboarding review */}
      <SectionCard
        eyebrow="Onboarding"
        title="Client onboarding review"
        padded={false}
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setListScope(listScope === "actionable" ? "unclaimed" : "actionable")}
            >
              {listScope === "actionable" ? "Show unclaimed setup links" : "Show needs review"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => fetchOnboardingRequests()}>
              <RefreshCw />
              Refresh list
            </Button>
          </>
        }
      >
        {isLoadingRequests ? (
          <TableSkeleton rows={4} columns={4} />
        ) : onboardingRequests.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={24} />}
            title="No onboarding requests"
            description="Company registrations that need your attention appear here."
          />
        ) : (
          <div className="divide-y divide-line border-t border-line">
            {onboardingRequests.map((req) => (
              <div key={req.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-2 transition-colors">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm text-text-primary">{req.company_name}</h3>
                    <StatusBadge tone={STATE_TONES[req.state] ?? "neutral"} label={sentenceCase(req.state)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-1 text-xs text-text-muted">
                    <p>Lead: <span className="font-semibold text-text-secondary">{req.commercial_lead || "N/A"}</span></p>
                    <p className="break-all">Email: <span className="font-semibold text-text-secondary">{req.contact_email}</span></p>
                    <p>Team size: <span className="font-mono text-text-secondary">{req.sales_team_size || 0}</span> reps</p>
                    <p>Pipeline: <span className="font-mono text-text-secondary">{pipelineAmount(req.expected_pipeline)}</span></p>
                  </div>
                </div>

                {listScope === "unclaimed" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={resendingId === req.id}
                    onClick={() => handleResend(req.id)}
                  >
                    {resendingId === req.id ? "Sending" : "Resend setup link"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedRequest(req)}
                  >
                    Open review
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Onboarding Request Initiation Modal */}
      <Dialog open={isInitiating} onOpenChange={(open) => { if (!open) setIsInitiating(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start client onboarding</DialogTitle>
            <DialogDescription>Registers the organisation and creates a setup link for its administrator.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInitiateOnboarding} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="init-company-name">Company name</Label>
              <Input
                id="init-company-name"
                type="text"
                required
                placeholder="Zambezi Logistics Ltd"
                value={initCompanyName}
                onChange={(e) => setInitCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="init-contact-email">Contact email</Label>
              <Input
                id="init-contact-email"
                type="email"
                required
                placeholder="name@company.co.zm"
                value={initContactEmail}
                onChange={(e) => setInitContactEmail(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setIsInitiating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingInit}>
                {isSubmittingInit && <Loader2 className="animate-spin" />}
                Create request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Modal (hidden while the setup link is showing) */}
      <Dialog open={!!selectedRequest && !claimLink} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequest.company_name}</DialogTitle>
                <DialogDescription>
                  Request ID <span className="font-mono text-xs">{selectedRequest.id}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {/* Client Info grid */}
                <dl className="grid grid-cols-2 gap-4 bg-field p-4 rounded-md">
                  <Detail label="Registration number" mono value={selectedRequest.registration_number || "N/A"} />
                  <Detail label="TPIN" mono value={selectedRequest.tax_number || "N/A"} />
                  <Detail label="Expected pipeline" mono value={pipelineAmount(selectedRequest.expected_pipeline)} />
                  <Detail
                    label="Address"
                    value={selectedRequest.location ? `${selectedRequest.location}, ${selectedRequest.district}, ${selectedRequest.province}` : "N/A"}
                  />
                </dl>

                {/* Uploaded Documents List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-text-primary text-sm">Compliance files</h4>
                  {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRequest.documents.map((doc: any) => (
                        <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border border-line rounded-md">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <FileText size={16} className="text-text-muted" />
                            <span className="font-semibold text-text-primary text-xs">{doc.document_type.replace(/_/g, " ")}</span>
                            <StatusBadge tone={DOC_TONES[doc.verification_status] ?? "caution"} label={sentenceCase(doc.verification_status)} />
                          </div>

                          <div className="flex items-center gap-1">
                            <Button asChild size="sm" variant="ghost">
                              <a
                                href={`/api/v1/controlhub/admin/onboarding/documents/download?bucket=${selectedRequest.tenant_id}&object=${encodeURIComponent(doc.file_path)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View file
                              </a>
                            </Button>
                            {doc.verification_status !== "VERIFIED" && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleVerifyDoc(doc.id, "VERIFIED")}
                                className="h-8 w-8 text-positive hover:text-positive hover:bg-positive-tint"
                                title="Mark verified"
                                aria-label="Mark verified"
                              >
                                <Check />
                              </Button>
                            )}
                            {doc.verification_status !== "REJECTED" && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleVerifyDoc(doc.id, "REJECTED")}
                                className="h-8 w-8 text-risk hover:text-risk hover:bg-risk-tint"
                                title="Mark rejected"
                                aria-label="Mark rejected"
                              >
                                <X />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">No documents uploaded yet.</p>
                  )}
                </div>

                {/* Action Notes forms */}
                <div className="space-y-4 pt-4 border-t border-line">
                  <h4 className="font-semibold text-text-primary text-sm">Review notes</h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="review-public-notes">Notes the client can see</Label>
                    <Textarea
                      id="review-public-notes"
                      placeholder="Add notes about the document checks"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="review-corrections">Corrections needed (for information requests)</Label>
                    <Input
                      id="review-corrections"
                      type="text"
                      placeholder="Sign the standard NDA on page 4"
                      value={infoRequestedFields}
                      onChange={(e) => setInfoRequestedFields(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 border-t border-line pt-4">
                <Button
                  variant="secondary"
                  onClick={() => handleTransitionState("INFO_REQUESTED")}
                >
                  Request information
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleTransitionState("REJECTED")}
                >
                  Reject client
                </Button>
                <Button onClick={() => handleTransitionState("APPROVED")}>
                  <CheckCircle />
                  Approve and create tenant
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Copy link modal after successful approval or initiation */}
      <Dialog open={!!claimLink} onOpenChange={(open) => { if (!open) closeClaimLink(); }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Setup link created</DialogTitle>
            <DialogDescription>
              Share this link so the administrator can set a password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="claim-link">Setup link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="claim-link"
                type="text"
                readOnly
                value={claimLink ?? ""}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={handleCopyLink}
                title="Copy link"
                aria-label="Copy link"
              >
                <Copy />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={closeClaimLink}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
