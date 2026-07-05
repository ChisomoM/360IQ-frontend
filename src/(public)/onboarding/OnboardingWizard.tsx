import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileUp,
  Trash2,
  Lock,
} from "lucide-react";
import { post, update, retrieve } from "@/lib/api/crud";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1];

const verticalsList = [
  "FinTech",
  "AgriTech",
  "Retail",
  "Manufacturing",
  "Logistics",
  "Healthcare",
  "SaaS",
  "Telecommunications",
];

const integrationsList = [
  "Salesforce",
  "HubSpot",
  "SAP",
  "Slack",
  "Teams",
  "GMail",
  "Office365",
];

const allowedDocTypesList = [
  { slug: "certificate_of_incorporation", label: "Certificate of Incorporation" },
  { slug: "tax_clearance_certificate", label: "Tax Clearance Certificate" },
  { slug: "standard_nda", label: "Signed Standard NDA" },
  { slug: "data_protection_policy", label: "Data Protection Policy" },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [commercialLead, setCommercialLead] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [locationName, setLocationName] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [salesTeamSize, setSalesTeamSize] = useState(5);
  const [expectedPipeline, setExpectedPipeline] = useState(10000);
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  // Current onboarding status state
  const [onboardingState, setOnboardingState] = useState("REGISTERED");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res: any = await retrieve("ONBOARDING_STATUS");
        if (res) {
          setOnboardingState(res.state || "REGISTERED");
          setCompanyName(res.company_name || "");
          setCompanyType(res.company_type || "");
          setRegistrationNumber(res.registration_number || "");
          setTaxNumber(res.tax_number || "");
          setCommercialLead(res.commercial_lead || "");
          setContactEmail(res.contact_email || "");
          setContactPhone(res.contact_phone || "");
          setLocationName(res.location || "");
          setDistrict(res.district || "");
          setProvince(res.province || "");
          setSalesTeamSize(res.sales_team_size || 5);
          setExpectedPipeline(res.expected_pipeline || 10000);
          setSelectedVerticals(res.industry_verticals || []);
          setSelectedIntegrations(res.integrations_config || []);
          setUploadedDocs(res.documents || []);

          // If the profile is already active or submitted/under review, they shouldn't edit
          if (res.state === "ACTIVE") {
            toast.success("Onboarding is complete!");
            navigate("/admin/dashboard");
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load onboarding request state");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [navigate]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await update("ONBOARDING_UPDATE", {
        company_name: companyName,
        company_type: companyType,
        registration_number: registrationNumber,
        tax_number: taxNumber,
        commercial_lead: commercialLead,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        location: locationName,
        district: district,
        province: province,
        sales_team_size: Number(salesTeamSize),
        expected_pipeline: Number(expectedPipeline),
        industry_verticals: selectedVerticals,
        integrations_config: selectedIntegrations,
      });
      toast.success("Draft saved successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("document_type", docType);
    formData.append("file", file);

    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const res: any = await post("ONBOARDING_DOCUMENTS", formData);
      if (res) {
        setUploadedDocs((prev) => [...prev, res]);
        toast.success("Document uploaded successfully", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload document", { id: toastId });
    }
  };

  const handleSubmitProfile = async () => {
    if (uploadedDocs.length === 0) {
      toast.error("At least one compliance document is required before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await post("ONBOARDING_SUBMIT", {
        company_name: companyName,
        company_type: companyType,
        registration_number: registrationNumber,
        tax_number: taxNumber,
        commercial_lead: commercialLead,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        location: locationName,
        district: district,
        province: province,
        sales_team_size: Number(salesTeamSize),
        expected_pipeline: Number(expectedPipeline),
        industry_verticals: selectedVerticals,
        integrations_config: selectedIntegrations,
      });

      if (res) {
        setOnboardingState(res.state);
        toast.success("Corporate onboarding profile submitted for review!");
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit onboarding profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVertical = (v: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const toggleIntegration = (i: string) => {
    setSelectedIntegrations((prev) =>
      prev.includes(i) ? prev.filter((item) => item !== i) : [...prev, i]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0d173b]">
        <Loader2 className="h-10 w-10 animate-spin text-[#7c69ff]" />
      </div>
    );
  }

  const isLocked = onboardingState === "SUBMITTED" || onboardingState === "UNDER_REVIEW";

  return (
    <div className="min-h-screen w-full bg-[#f4f7fe] py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[600px]">
        {/* Left pane: progress sidebar */}
        <div className="md:w-80 bg-gradient-to-b from-[#1e2e70] to-[#0d173b] p-8 text-white flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-[#febb00]" />
              <span className="font-display font-extrabold text-xl tracking-tight">360IQ B2B CRM</span>
            </div>

            <div className="space-y-6">
              {[
                { stepNum: 1, label: "Company Information" },
                { stepNum: 2, label: "Commercial Parameters" },
                { stepNum: 3, label: "Compliance & Documents" },
                { stepNum: 4, label: "Review & Submit" },
              ].map((s) => (
                <div key={s.stepNum} className="flex items-center gap-4">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${
                      step === s.stepNum
                        ? "bg-[#febb00] text-[#0d173b] border-[#febb00]"
                        : step > s.stepNum
                        ? "bg-[#10b981] border-[#10b981] text-white"
                        : "border-white/30 text-white/50"
                    }`}
                  >
                    {step > s.stepNum ? "✓" : s.stepNum}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${
                      step === s.stepNum ? "text-[#febb00]" : "text-white/60"
                    }`}>
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-xs text-white/50 flex flex-col gap-2">
            <p>Onboarding Profile State: <span className="font-semibold text-yellow-300">{onboardingState}</span></p>
            {isLocked && (
              <p className="flex items-center gap-1 text-red-300">
                <Lock className="h-3 w-3" /> Locked - Under Review
              </p>
            )}
          </div>
        </div>

        {/* Right pane: form wizards */}
        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="space-y-6"
            >
              {/* STEP 1: COMPANY INFO */}
              {step === 1 && (
                <div className="space-y-5">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Company Details</h3>
                  <p className="text-sm text-slate-500">Provide legal identification and address parameters.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Company Name</label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enterprise Corp"
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Company Type</label>
                      <select
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        disabled={isLocked}
                      >
                        <option value="">Select Company Type</option>
                        <option value="enterprise">Enterprise</option>
                        <option value="startup">Startup</option>
                        <option value="mid-market">Mid-Market</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">PACRA Reg Number</label>
                      <Input
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="LCO-19920-A"
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Tax TPIN Number</label>
                      <Input
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="TPIN-100239-X"
                        disabled={isLocked}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Commercial Lead Name</label>
                      <Input
                        value={commercialLead}
                        onChange={(e) => setCommercialLead(e.target.value)}
                        placeholder="Sarah Connor"
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Contact Phone</label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+260 977 123 456"
                        disabled={isLocked}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">City / Location</label>
                      <Input
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Lusaka"
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">District</label>
                      <Input
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Lusaka District"
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Province</label>
                      <Input
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="Lusaka Province"
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: COMMERCIAL PARAMETERS */}
              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Commercial & Pipeline</h3>
                  <p className="text-sm text-slate-500">Tune CRM settings to fit your organization's sales profile.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Sales Team Size</label>
                      <Input
                        type="number"
                        value={salesTeamSize}
                        onChange={(e) => setSalesTeamSize(Number(e.target.value))}
                        min={1}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Expected Annual Pipeline ($)</label>
                      <Input
                        type="number"
                        value={expectedPipeline}
                        onChange={(e) => setExpectedPipeline(Number(e.target.value))}
                        min={1000}
                        disabled={isLocked}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase block">Industry Verticals</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {verticalsList.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => !isLocked && toggleVertical(v)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                            selectedVerticals.includes(v)
                              ? "bg-[#1e2e70] border-[#1e2e70] text-white shadow-md"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          disabled={isLocked}
                        >
                          <span>{v}</span>
                          {selectedVerticals.includes(v) && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase block">Third-Party Integrations</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {integrationsList.map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => !isLocked && toggleIntegration(i)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                            selectedIntegrations.includes(i)
                              ? "bg-[#7c69ff] border-[#7c69ff] text-white shadow-md"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          disabled={isLocked}
                        >
                          <span>{i}</span>
                          {selectedIntegrations.includes(i) && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COMPLIANCE DOCUMENTS */}
              {step === 3 && (
                <div className="space-y-5">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Compliance Documents</h3>
                  <p className="text-sm text-slate-500">Upload corporate certificates for verification. (Max 10MB, PDF/Images)</p>

                  <div className="space-y-4">
                    {allowedDocTypesList.map((docType) => {
                      const uploaded = uploadedDocs.find((d) => d.document_type === docType.slug);
                      return (
                        <div
                          key={docType.slug}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${
                              uploaded ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                            }`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{docType.label}</p>
                              {uploaded ? (
                                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <CheckCircle className="h-3.5 w-3.5" /> Checked in • {uploaded.verification_status}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 mt-0.5">Awaiting upload</p>
                              )}
                            </div>
                          </div>

                          {!uploaded && !isLocked ? (
                            <label className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
                              <FileUp className="h-4 w-4" /> Upload File
                              <input
                                type="file"
                                accept=".pdf,image/png,image/jpeg"
                                onChange={(e) => handleDocumentUpload(docType.slug, e)}
                                className="hidden"
                              />
                            </label>
                          ) : (
                            uploaded && (
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/v1/onboarding/documents/download?bucket=${uploaded.tenant_id}&object=${encodeURIComponent(uploaded.file_path)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#1e2e70] hover:underline font-semibold"
                                >
                                  View
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Review Submission</h3>
                  <p className="text-sm text-slate-500">Confirm details before locking profile for audit.</p>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 text-sm text-slate-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Company Name</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{companyName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Commercial Lead</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{commercialLead || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">PACRA Reg</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{registrationNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Sales Team Size</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{salesTeamSize} reps</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase">Uploaded Documents</p>
                      <p className="font-semibold text-slate-800 mt-1">{uploadedDocs.length} files submitted</p>
                    </div>
                  </div>

                  {onboardingState === "INFO_REQUESTED" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-semibold">Compliance feedback requires adjustments:</p>
                      <p className="mt-1 font-sans text-amber-700">Please review uploaded incorporation cards or NDAs.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((prev) => prev - 1)}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isLocked && (
                <Button
                  variant="ghost"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="text-slate-500 hover:text-slate-800"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
              )}

              {step < 4 ? (
                <Button
                  onClick={() => setStep((prev) => prev + 1)}
                  className="bg-[#1e2e70] hover:bg-[#25398a] text-white flex items-center gap-1.5"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                !isLocked && (
                  <Button
                    onClick={handleSubmitProfile}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Profile for Review"
                    )}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
