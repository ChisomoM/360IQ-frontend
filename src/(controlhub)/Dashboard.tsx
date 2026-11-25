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
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { retrieve, post } from "@/lib/api/crud";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ControlHubDashboard() {
  const [stats] = useState<any[]>([
    {
      id: "tenants",
      icon: Building2,
      title: "Total Tenants",
      subtitle: "Active ecosystem",
      value: "12",
      trend: { direction: "up" as const, percentage: 20, label: "+2 this week" },
      sparkline: [40, 50, 60, 65, 70, 75, 80, 85, 90],
    },
    {
      id: "users",
      icon: Users,
      title: "Active Users",
      subtitle: "Across all tenants",
      value: "2,845",
      trend: { direction: "up" as const, percentage: 15, label: "+340 this month" },
      sparkline: [50, 55, 58, 65, 72, 78, 82, 88, 95],
    },
    {
      id: "health",
      icon: Activity,
      title: "System Health",
      subtitle: "Overall uptime",
      value: "99.9%",
      trend: { direction: "up" as const, percentage: 0.1, label: "vs last week" },
      sparkline: [95, 96, 98, 99, 99, 99, 99, 99, 100],
    },
    {
      id: "reach",
      icon: Globe,
      title: "Global Reach",
      subtitle: "Regions covered",
      value: "8",
      trend: { direction: "up" as const, percentage: 33, label: "+1 new region" },
      sparkline: [2, 3, 4, 5, 6, 7, 7, 8, 8],
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
        toast.success(`Document marked as ${status}`);
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
        toast.success(`Onboarding transitioned to ${state}`);

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
      toast.error("All fields are required");
      return;
    }

    setIsSubmittingInit(true);
    try {
      const res: any = await post("CH_ONBOARDING_INITIATE", {
        company_name: initCompanyName,
        contact_email: initContactEmail,
      });

      if (res && res.admin_setup_link) {
        toast.success("B2B Onboarding Request successfully initiated!");
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
      toast.success("Invitation setup link copied to clipboard!");
    }
  };

  const inputClass =
    "w-full p-2.5 rounded-lg border border-line bg-surface-1 text-xs text-gray-900 focus:ring-2 focus:ring-ch-primary focus:border-transparent focus:outline-none";

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Control Hub</h1>
        <p className="text-gray-600 text-lg mt-2">Manage your tenant ecosystem and onboarding supervisor review panels.</p>
      </div>

      {/* System Overview Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time metrics across your organization</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-max">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            
            // Color schemes for each stat card
            const colorSchemes = [
              { // Signal teal - Primary
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-signal-tint",
                icon: "text-signal-text",
                hex: "var(--chart-1)",
              },
              { // Blue - Secondary
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-positive-tint",
                icon: "text-positive",
                hex: "var(--chart-2)",
              },
              { // Caution
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-caution-tint",
                icon: "text-caution",
                hex: "var(--chart-3)",
              },
              { // Positive
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-positive-tint",
                icon: "text-positive",
                hex: "var(--chart-4)",
              },
            ];
            
            const scheme = colorSchemes[idx % colorSchemes.length];
            const areaData = stat.sparkline.map((v: number) => ({ v }));
            
            return (
              <div
                key={stat.id}
                className={`${scheme.bg} border ${scheme.border} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col group`}
              >
                {/* Header: Title + Trend */}
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-semibold text-gray-600 tracking-tight">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.subtitle}
                    </p>
                  </div>
                  
                  {/* Icon Badge */}
                  <div className={`h-9 w-9 rounded-lg ${scheme.iconBg} flex items-center justify-center flex-shrink-0 ml-2 shadow-sm`}>
                    <Icon className={`h-5 w-5 ${scheme.icon}`} />
                  </div>
                </div>

                {/* Main Number + Sparkline */}
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Number + Trend */}
                  <div>
                    <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                    {stat.trend && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-positive-tint">
                          <span className="text-xs font-semibold text-positive">
                            {stat.trend.direction === "up" ? "↑" : "↓"} {stat.trend.percentage}%
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">{stat.trend.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Area Chart Sparkline */}
                  {stat.sparkline && (
                    <div className="mt-auto -mx-1">
                      <ResponsiveContainer width="100%" height={52}>
                        <AreaChart data={areaData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={scheme.hex} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={scheme.hex} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={scheme.hex}
                            strokeWidth={2}
                            fill={`url(#grad-${stat.id})`}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* B2B Onboarding Audit Panel */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Corporate Onboarding Audit Panel</h2>
            <p className="text-sm text-gray-500 mt-1">Review registrations, verify company documents, and transition client lifecycles.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsInitiating(true)}
              className="bg-ch-primary hover:bg-ch-primary/90 text-white text-xs font-semibold"
            >
              + Initiate Onboarding Request
            </Button>
            <Button
              variant="outline"
              onClick={() => setListScope(listScope === "actionable" ? "unclaimed" : "actionable")}
              className="border-line text-xs"
            >
              {listScope === "actionable" ? "Show unclaimed setup links" : "Show needs review"}
            </Button>
            <Button variant="outline" onClick={() => fetchOnboardingRequests()} className="flex items-center gap-1.5 border-line text-xs">
              ↻ Refresh list
            </Button>
          </div>
        </div>

        {isLoadingRequests ? (
          <div className="bg-surface-1 border border-line rounded-xl p-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ch-primary" />
          </div>
        ) : onboardingRequests.length === 0 ? (
          <div className="bg-surface-1 border border-line rounded-xl p-10 text-center text-gray-400 space-y-3">
            <ShieldCheck className="h-10 w-10 mx-auto text-gray-300" />
            <p className="text-sm font-semibold">No pending corporate onboarding requests at this time</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-line rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-line">
              {onboardingRequests.map((req) => (
                <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-lg">{req.company_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        req.state === "SUBMITTED"
                          ? "bg-positive-tint text-positive"
                          : req.state === "INFO_REQUESTED"
                          ? "bg-caution-tint text-caution"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {req.state.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-500">
                      <p>Lead: <span className="font-semibold text-gray-700">{req.commercial_lead || "—"}</span></p>
                      <p>Email: <span className="font-semibold text-gray-700">{req.contact_email}</span></p>
                      <p>Team Size: <span className="font-semibold text-gray-700">{req.sales_team_size || 0} reps</span></p>
                      <p>Pipeline: <span className="font-semibold text-gray-700">${(req.expected_pipeline || 0).toLocaleString()}</span></p>
                    </div>
                  </div>

                  {listScope === "unclaimed" ? (
                    <Button
                      disabled={resendingId === req.id}
                      onClick={() => handleResend(req.id)}
                      className="bg-ch-secondary hover:bg-ch-secondary/90 text-white font-semibold text-xs"
                    >
                      {resendingId === req.id ? "Sending..." : "Resend setup link"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setSelectedRequest(req)}
                      className="bg-ch-secondary hover:bg-ch-secondary/90 text-white font-semibold text-xs"
                    >
                      Open Review
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Onboarding Request Initiation Modal */}
      {isInitiating && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-surface-1 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-line">
            <div className="p-6 bg-ch-primary text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Initiate B2B Client Onboarding</h3>
                <p className="text-xs text-white/70 mt-1">Pre-registers the organization and generates a password setup claim token.</p>
              </div>
              <button onClick={() => setIsInitiating(false)} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleInitiateOnboarding} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={initCompanyName}
                  onChange={(e) => setInitCompanyName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. lead@acme.com"
                  value={initContactEmail}
                  onChange={(e) => setInitContactEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsInitiating(false)} className="text-xs border-line">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingInit}
                  className="bg-ch-primary hover:bg-ch-primary/90 text-white text-xs font-semibold min-w-[120px]"
                >
                  {isSubmittingInit ? "Initiating..." : "Create Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Drawer / Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-surface-1 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-line flex flex-col max-h-[85vh]">
            <div className="p-6 bg-ch-secondary text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedRequest.company_name}</h3>
                <p className="text-xs text-white/70 mt-1">Request ID: {selectedRequest.id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-600">
              {/* Client Info grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-line">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Reg Number</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedRequest.registration_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">TPIN Tax Number</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedRequest.tax_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Expected pipeline</p>
                  <p className="font-semibold text-gray-900 mt-0.5">${(selectedRequest.expected_pipeline || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Address / Location</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedRequest.location ? `${selectedRequest.location}, ${selectedRequest.district}, ${selectedRequest.province}` : "—"}
                  </p>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Uploaded Compliance Files</h4>
                {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-line rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-ch-secondary" />
                          <span className="font-semibold text-gray-700 text-xs">{doc.document_type.replace(/_/g, " ")}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.verification_status === "VERIFIED"
                              ? "bg-positive-tint text-positive"
                              : doc.verification_status === "REJECTED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-caution-tint text-caution"
                          }`}>
                            {doc.verification_status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/v1/controlhub/admin/onboarding/documents/download?bucket=${selectedRequest.tenant_id}&object=${encodeURIComponent(doc.file_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-ch-secondary hover:underline font-semibold"
                          >
                            View Raw
                          </a>
                          {doc.verification_status !== "VERIFIED" && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, "VERIFIED")}
                              className="p-1 text-positive hover:bg-positive-tint rounded"
                              title="Mark verified"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {doc.verification_status !== "REJECTED" && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, "REJECTED")}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                              title="Mark rejected"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No documents uploaded yet.</p>
                )}
              </div>

              {/* Action Notes forms */}
              <div className="space-y-4 pt-4 border-t border-line">
                <h4 className="font-bold text-gray-900 text-sm">Supervisor Verification Notes</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Public Notes (Visible to Client)</label>
                  <textarea
                    placeholder="Enter notes about document checks or general client notifications..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputClass} min-h-[60px]`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Correction details (Required for INFO_REQUESTED)</label>
                  <input
                    type="text"
                    placeholder="e.g. Please re-sign Standard NDA on page 4."
                    value={infoRequestedFields}
                    onChange={(e) => setInfoRequestedFields(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-line flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleTransitionState("INFO_REQUESTED")}
                className="border-caution/40 text-caution hover:bg-caution-tint"
              >
                Request Info
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTransitionState("REJECTED")}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Reject Client
              </Button>
              <Button
                onClick={() => handleTransitionState("APPROVED")}
                className="bg-ch-primary hover:bg-ch-primary/90 text-white font-semibold flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4" /> Approve & Seed Tenant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Copy link modal after successful approval or initiation */}
      {claimLink && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-surface-1 rounded-2xl w-full max-w-md p-6 text-center space-y-6 shadow-2xl border border-line">
            <div className="h-16 w-16 bg-signal-tint text-signal-text rounded-full flex items-center justify-center mx-auto border-2 border-line animate-bounce">
              <CheckCircle className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-gray-900">Operation Success!</h3>
              <p className="text-xs text-gray-400">
                The setup invitation claim token has been created successfully. Use the link below to configure password credentials.
              </p>
            </div>

            <div className="space-y-1.5 text-left bg-gray-50 p-4 border border-line rounded-xl">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Invitation Setup Link
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={claimLink}
                  className="w-full text-xs font-mono bg-transparent border-none text-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                  title="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              onClick={() => {
                setClaimLink(null);
                setSelectedRequest(null);
              }}
              className="w-full bg-ch-secondary hover:bg-ch-secondary/90 text-white"
            >
              Done & Return
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
