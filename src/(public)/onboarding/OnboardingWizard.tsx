import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  ArrowRight,
  ArrowLeft,
  FileUp,
  Lock,
} from "@/components/icons";
import { post, update, retrieve } from "@/lib/api/crud";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Field } from "@/components/profiles/formParts";
import { PublicHeader, Stepper } from "../PublicParts";
import { onboardingStateBadge } from "../onboardingState";

const EASE = [0.16, 1, 0.3, 1] as const;
// A select item cannot have an empty value, so "no type" uses a placeholder value that maps back to "".
const NO_TYPE = "__none";

const STEPS = [
  { title: "Company details", short: "Company", description: "Legal identification and address." },
  { title: "Sales profile", short: "Sales", description: "Settings that fit your sales team." },
  { title: "Compliance documents", short: "Documents", description: "Upload your company certificates for verification. PDF or image, 10 MB at most." },
  { title: "Review and submit", short: "Review", description: "Check the details. The registration is locked while it is reviewed." },
];

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
  { slug: "certificate_of_incorporation", label: "Certificate of incorporation" },
  { slug: "tax_clearance_certificate", label: "Tax clearance certificate" },
  { slug: "standard_nda", label: "Signed standard NDA" },
  { slug: "data_protection_policy", label: "Data protection policy" },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
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
            toast.success("Onboarding is complete");
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
      toast.success("Draft saved");
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

    const toastId = toast.loading(`Uploading ${file.name}…`);
    try {
      const res: any = await post("ONBOARDING_DOCUMENTS", formData);
      if (res) {
        setUploadedDocs((prev) => [...prev, res]);
        toast.success("Document uploaded", { id: toastId });
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
        toast.success("Submitted for review");
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
      <div className="min-h-screen w-full bg-surface-0">
        <PublicHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <SectionCard padded={false}>
            <SectionBody loading>{null}</SectionBody>
          </SectionCard>
        </main>
      </div>
    );
  }

  const isLocked = onboardingState === "SUBMITTED" || onboardingState === "UNDER_REVIEW";
  const badge = onboardingStateBadge(onboardingState);
  const current = STEPS[step - 1];

  return (
    <div className="min-h-screen w-full bg-surface-0 text-text-primary">
      <PublicHeader actions={<StatusBadge tone={badge.tone} label={badge.label} />} />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6">
        <PageHeader crumb="Company onboarding" title="Register your company" />

        {isLocked && (
          <p className="flex items-center gap-2 rounded-lg bg-field px-4 py-3 text-sm text-text-secondary">
            <Lock size={18} className="shrink-0" />
            Locked while your registration is under review.
          </p>
        )}

        <Stepper steps={STEPS.map((s) => s.short)} current={step - 1} />

        <SectionCard eyebrow={`Step ${step} of ${STEPS.length}`} title={current.title}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="space-y-4"
            >
              <p className="text-sm text-text-secondary">{current.description}</p>

              {/* STEP 1: COMPANY INFO */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Company name" htmlFor="ob-name">
                      <Input id="ob-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Zambezi Logistics Ltd" disabled={isLocked} />
                    </Field>
                    <Field label="Company type" htmlFor="ob-type">
                      <Select value={companyType || NO_TYPE} onValueChange={(v) => setCompanyType(v === NO_TYPE ? "" : v)} disabled={isLocked}>
                        <SelectTrigger id="ob-type">
                          <SelectValue placeholder="Choose a company type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_TYPE}>Choose a company type</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="mid-market">Mid-market</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="PACRA registration number" htmlFor="ob-reg">
                      <Input id="ob-reg" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} disabled={isLocked} className="font-mono" />
                    </Field>
                    <Field label="TPIN (tax number)" htmlFor="ob-tax">
                      <Input id="ob-tax" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} disabled={isLocked} className="font-mono" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Commercial lead name" htmlFor="ob-lead">
                      <Input id="ob-lead" value={commercialLead} onChange={(e) => setCommercialLead(e.target.value)} placeholder="Mutinta Banda" disabled={isLocked} />
                    </Field>
                    <Field label="Contact phone" htmlFor="ob-phone">
                      <Input id="ob-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+260 97 123 4567" disabled={isLocked} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="City or location" htmlFor="ob-city">
                      <Input id="ob-city" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Lusaka" disabled={isLocked} />
                    </Field>
                    <Field label="District" htmlFor="ob-district">
                      <Input id="ob-district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Lusaka" disabled={isLocked} />
                    </Field>
                    <Field label="Province" htmlFor="ob-province">
                      <Input id="ob-province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Lusaka" disabled={isLocked} />
                    </Field>
                  </div>
                </div>
              )}

              {/* STEP 2: COMMERCIAL PARAMETERS */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Sales team size" htmlFor="ob-team">
                      <Input id="ob-team" type="number" value={salesTeamSize} onChange={(e) => setSalesTeamSize(Number(e.target.value))} min={1} disabled={isLocked} className="font-mono" />
                    </Field>
                    <Field label="Expected annual pipeline (USD)" htmlFor="ob-pipeline">
                      <Input id="ob-pipeline" type="number" value={expectedPipeline} onChange={(e) => setExpectedPipeline(Number(e.target.value))} min={1000} disabled={isLocked} className="font-mono" />
                    </Field>
                  </div>

                  <ChoiceGroup legend="Industry verticals" options={verticalsList} selected={selectedVerticals} disabled={isLocked} onToggle={(v) => !isLocked && toggleVertical(v)} />

                  <ChoiceGroup legend="Integrations" options={integrationsList} selected={selectedIntegrations} disabled={isLocked} onToggle={(i) => !isLocked && toggleIntegration(i)} />
                </div>
              )}

              {/* STEP 3: COMPLIANCE DOCUMENTS */}
              {step === 3 && (
                <ul className="divide-y divide-line">
                  {allowedDocTypesList.map((docType) => {
                    const uploaded = uploadedDocs.find((d) => d.document_type === docType.slug);
                    return (
                      <li key={docType.slug} className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-secondary">
                            <FileText size={20} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary">{docType.label}</p>
                            {uploaded ? (
                              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                                Uploaded
                                {uploaded.verification_status && <StatusBadge status={uploaded.verification_status} />}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-text-muted">Not uploaded yet</p>
                            )}
                          </div>
                        </div>

                        {!uploaded && !isLocked ? (
                          <Button asChild variant="secondary" size="sm">
                            <label className="cursor-pointer focus-within:ring-2 focus-within:ring-focus">
                              <FileUp /> Upload file
                              <input
                                type="file"
                                accept=".pdf,image/png,image/jpeg"
                                onChange={(e) => handleDocumentUpload(docType.slug, e)}
                                className="sr-only"
                                aria-label={`Upload ${docType.label}`}
                              />
                            </label>
                          </Button>
                        ) : (
                          uploaded && (
                            <a
                              href={`/api/v1/onboarding/documents/download?bucket=${uploaded.tenant_id}&object=${encodeURIComponent(uploaded.file_path)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-signal-text hover:underline"
                            >
                              View
                            </a>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {step === 4 && (
                <div className="space-y-4">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReviewItem label="Company name" value={companyName || "Not provided"} />
                    <ReviewItem label="Commercial lead" value={commercialLead || "Not provided"} />
                    <ReviewItem label="PACRA registration number" value={registrationNumber || "Not provided"} mono={Boolean(registrationNumber)} />
                    <ReviewItem label="Sales team size" value={`${salesTeamSize} reps`} />
                    <ReviewItem label="Uploaded documents" value={`${uploadedDocs.length} ${uploadedDocs.length === 1 ? "file" : "files"}`} />
                  </dl>

                  {onboardingState === "INFO_REQUESTED" && (
                    <div className="rounded-md bg-caution-tint px-4 py-3 text-sm text-caution">
                      <p className="font-semibold">Changes requested</p>
                      <p className="mt-1">Please review the uploaded incorporation documents or NDA.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
            <div>
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep((prev) => prev - 1)}>
                  <ArrowLeft /> Back
                </Button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {!isLocked && (
                <Button variant="ghost" onClick={handleSaveDraft} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save draft"}
                </Button>
              )}

              {step < 4 ? (
                <Button onClick={() => setStep((prev) => prev + 1)}>
                  Continue <ArrowRight />
                </Button>
              ) : (
                !isLocked && (
                  <Button onClick={handleSubmitProfile} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" /> Submitting…
                      </>
                    ) : (
                      "Submit for review"
                    )}
                  </Button>
                )
              )}
            </div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
}

function ChoiceGroup({ legend, options, selected, disabled, onToggle }: {
  legend: string;
  options: string[];
  selected: string[];
  disabled: boolean;
  onToggle: (option: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[13px] font-medium text-text-secondary">{legend}</legend>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
        {options.map((o) => (
          <label key={o} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-field px-3 py-2 text-sm text-text-primary hover:bg-field-hover">
            <Checkbox checked={selected.includes(o)} onCheckedChange={() => onToggle(o)} disabled={disabled} />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm font-semibold text-text-primary ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
