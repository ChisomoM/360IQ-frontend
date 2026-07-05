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
  AlertCircle,
  Copy,
  CheckCircle,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { retrieve, post } from "@/lib/api/crud";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ControlHubDashboard() {
  const [stats, setStats] = useState<any[]>([
    { id: "tenants", icon: Building2, title: "Total Tenants", subtitle: "Active ecosystem", value: "12", sparkline: [40, 50, 60, 65, 70, 75, 80, 85, 90] },
    { id: "users", icon: Users, title: "Active Users", subtitle: "Across all tenants", value: "2,845", sparkline: [50, 55, 58, 65, 72, 78, 82, 88, 95] },
    { id: "health", icon: Activity, title: "System Health", subtitle: "Overall uptime", value: "99.9%", sparkline: [95, 96, 98, 99, 99, 99, 99, 99, 100] },
    { id: "reach", icon: Globe, title: "Global Reach", subtitle: "Regions covered", value: "8", sparkline: [2, 3, 4, 5, 6, 7, 7, 8, 8] },
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

  const fetchOnboardingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res: any = await retrieve("CH_ONBOARDING", {}, { scope: "actionable" });
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
    fetchOnboardingRequests();
  }, []);

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

  const handleCopyLink = () => {
    if (claimLink) {
      navigator.clipboard.writeText(claimLink);
      toast.success("Invitation setup link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Control Hub</h1>
        <p className="text-slate-600 text-lg mt-2">Manage your tenant ecosystem and onboarding supervisor review panels.</p>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colors = [
            { bg: "from-[#7c69ff]/10 to-[#7c69ff]/5", border: "border-[#7c69ff]/20", text: "text-[#7c69ff]", hex: "#7c69ff" },
            { bg: "from-cyan-50 to-cyan-50/50", border: "border-cyan-200", text: "text-cyan-600", hex: "#03d8fd" },
            { bg: "from-amber-50 to-amber-50/50", border: "border-amber-200", text: "text-amber-600", hex: "#f59e0b" },
            { bg: "from-emerald-50 to-emerald-50/50", border: "border-emerald-200", text: "text-emerald-600", hex: "#10b981" },
          ];
          const c = colors[idx % colors.length];
          return (
            <div key={stat.id} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-xl p-6 shadow-sm flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg bg-white shadow-sm text-slate-700`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800">{stat.value}</h2>
            </div>
          );
        })}
      </section>

      {/* B2B Onboarding Audit Panel */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Corporate Onboarding Audit Panel</h2>
            <p className="text-sm text-slate-500 mt-1">Review registrations, verify company documents, and transition client lifecycles.</p>
          </div>
          <Button variant="outline" onClick={fetchOnboardingRequests} className="flex items-center gap-1.5 border-slate-300">
            ↻ Refresh list
          </Button>
        </div>

        {isLoadingRequests ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#7c69ff]" />
          </div>
        ) : onboardingRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 space-y-3">
            <ShieldCheck className="h-10 w-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No pending corporate onboarding requests at this time</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {onboardingRequests.map((req) => (
                <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-lg">{req.company_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        req.state === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : req.state === "INFO_REQUESTED"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {req.state.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-500">
                      <p>Lead: <span className="font-semibold text-slate-700">{req.commercial_lead}</span></p>
                      <p>Email: <span className="font-semibold text-slate-700">{req.contact_email}</span></p>
                      <p>Team Size: <span className="font-semibold text-slate-700">{req.sales_team_size} reps</span></p>
                      <p>Pipeline: <span className="font-semibold text-slate-700">${req.expected_pipeline.toLocaleString()}</span></p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedRequest(req)}
                    className="bg-[#1e2e70] hover:bg-[#25398a] text-white font-semibold text-xs"
                  >
                    Open Review
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Review Drawer / Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-6 bg-[#1e2e70] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedRequest.company_name}</h3>
                <p className="text-xs text-white/70 mt-1">Request ID: {selectedRequest.id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600">
              {/* Client Info grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Reg Number</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.registration_number}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">TPIN Tax Number</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.tax_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Expected pipeline</p>
                  <p className="font-semibold text-slate-800 mt-0.5">${selectedRequest.expected_pipeline.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Address / Location</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.location}, {selectedRequest.district}, {selectedRequest.province}</p>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Uploaded Compliance Files</h4>
                {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#1e2e70]" />
                          <span className="font-semibold text-slate-700 text-xs">{doc.document_type.replace(/_/g, " ")}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.verification_status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.verification_status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {doc.verification_status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/v1/controlhub/admin/onboarding/documents/download?bucket=${selectedRequest.tenant_id}&object=${encodeURIComponent(doc.file_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                          >
                            View Raw
                          </a>
                          {doc.verification_status !== "VERIFIED" && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, "VERIFIED")}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Mark verified"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {doc.verification_status !== "REJECTED" && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, "REJECTED")}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
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
                  <p className="text-xs text-slate-400">No documents uploaded yet.</p>
                )}
              </div>

              {/* Action Notes forms */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm">Supervisor Verification Notes</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Public Notes (Visible to Client)</label>
                  <textarea
                    placeholder="Enter notes about document checks or general client notifications..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[60px] p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#7c69ff] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Correction details (Required for INFO_REQUESTED)</label>
                  <input
                    type="text"
                    placeholder="e.g. Please re-sign Standard NDA on page 4."
                    value={infoRequestedFields}
                    onChange={(e) => setInfoRequestedFields(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#7c69ff] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleTransitionState("INFO_REQUESTED")}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Request Info
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTransitionState("REJECTED")}
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                Reject Client
              </Button>
              <Button
                onClick={() => handleTransitionState("APPROVED")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4" /> Approve & Seed Tenant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Copy link modal after successful approval */}
      {claimLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center space-y-6 shadow-2xl border border-slate-100">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 animate-bounce">
              <CheckCircle className="h-9 w-9" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-slate-800">Tenant Approved!</h3>
              <p className="text-xs text-slate-400">
                Unified databases, RBAC rules, legacy organizational roles, and dashboard structures have been seeded.
              </p>
            </div>

            <div className="space-y-1.5 text-left bg-slate-50 p-4 border border-slate-200 rounded-xl">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Invitation Claim Link
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={claimLink}
                  className="w-full text-xs font-mono bg-transparent border-none text-slate-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-500"
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
              className="w-full bg-[#1e2e70] hover:bg-[#25398a] text-white"
            >
              Done & Return
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
