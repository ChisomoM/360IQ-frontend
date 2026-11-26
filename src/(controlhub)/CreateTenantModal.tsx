import { useState, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { chPost } from "@/lib/api/controlhub";
import {
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Loader2,
} from "@/components/icons";
import type { CreateTenantPayload, TenantType } from "@/types/tenant";

const EMPTY_FORM: CreateTenantPayload = {
  name: "",
  type: "company",
  primary_color: "#0A7A67",
  secondary_color: "#1B63AE",
  accent_color: "#0B1B2B",
  admin_email: "",
  admin_password: "",
};

const TENANT_TYPES: { value: TenantType; label: string; description: string }[] = [
  { value: "higher-academic", label: "Higher academic", description: "Universities and colleges" },
  { value: "parastetal",      label: "Parastatal",      description: "Government-linked bodies" },
  { value: "company",         label: "Private company", description: "Enterprises and SMEs" },
];

const COLOR_SWATCH = "h-10 w-12 flex-shrink-0 cursor-pointer rounded-md border border-line-strong bg-surface-1 p-1";

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pwd.length >= 8)       s++;
  if (pwd.length >= 12)      s++;
  if (/[A-Z]/.test(pwd))     s++;
  if (/[0-9]/.test(pwd))     s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 20,  label: "Very weak",   color: "bg-risk" };
  if (s === 2) return { score: 40,  label: "Weak",        color: "bg-risk" };
  if (s === 3) return { score: 60,  label: "Fair",        color: "bg-caution" };
  if (s === 4) return { score: 80,  label: "Strong",      color: "bg-positive" };
  return           { score: 100, label: "Very strong", color: "bg-positive" };
}

interface FieldErrors {
  name?: string;
  primary_color?: string;
  admin_email?: string;
  admin_password?: string;
  confirm_password?: string;
}

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTenantModal({ isOpen, onClose, onSuccess }: CreateTenantModalProps) {
  const [step, setStep]                   = useState<1 | 2>(1);
  const [loading, setLoading]             = useState(false);
  const [formData, setFormData]           = useState<CreateTenantPayload>(EMPTY_FORM);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  const [errors, setErrors]               = useState<FieldErrors>({});
  const [logoFile, setLogoFile]           = useState<File | null>(null);
  const [logoPreview, setLogoPreview]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const set = useCallback(<K extends keyof CreateTenantPayload>(key: K, value: CreateTenantPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleNameChange = (value: string) => {
    set("name", value);
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setConfirmPassword("");
    setErrors({});
    setStep(1);
    setShowPassword(false);
    setShowConfirm(false);
    setLogoFile(null);
    setLogoPreview(null);
    onClose();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = (): boolean => {
    const e: FieldErrors = {};
    if (!formData.name.trim())    e.name    = "Enter the organisation name.";
    if (!/^#[0-9a-fA-F]{6}$/.test(formData.primary_color))
      e.primary_color = "Enter a hex colour, like #0A7A67.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FieldErrors = {};
    if (!formData.admin_email.trim())
      e.admin_email = "Enter the admin email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email))
      e.admin_email = "Enter a full email address, like name@company.co.zm.";
    if (!formData.admin_password)
      e.admin_password = "Enter a password.";
    else if (formData.admin_password.length < 8)
      e.admin_password = "Use at least 8 characters.";
    if (!confirmPassword)
      e.confirm_password = "Confirm the password.";
    else if (formData.admin_password !== confirmPassword)
      e.confirm_password = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { if (validateStep1()) setStep(2); return; }
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Use FormData to support file uploads
      const body = new FormData();
      body.append("name", formData.name);
      body.append("type", formData.type);
      body.append("primary_color", formData.primary_color);
      body.append("secondary_color", formData.secondary_color);
      body.append("accent_color", formData.accent_color);
      body.append("admin_email", formData.admin_email);
      body.append("admin_password", formData.admin_password);
      if (logoFile) {
        body.append("logo", logoFile);
      }

      await chPost("CH_CLIENT_ONBOARD", body);
      toast.success(`"${formData.name}" created`);
      handleClose();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to register tenant. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength    = formData.admin_password ? getPasswordStrength(formData.admin_password) : null;
  const selectedType   = TENANT_TYPES.find((t) => t.value === formData.type);
  const validColor     = /^#[0-9a-fA-F]{6}$/.test(formData.primary_color);
  const passwordsMatch = confirmPassword && confirmPassword === formData.admin_password;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-[500px] p-0 flex flex-col">

        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-8 pb-4 border-b border-line flex-shrink-0">
          <SheetTitle>Create tenant</SheetTitle>
          <SheetDescription>
            Set up a new organisation.
          </SheetDescription>

          {/* Progress bar */}
          <div className="pt-2">
            <p className="mb-2 text-xs text-text-muted">
              Step <span className="font-mono">{step}</span> of <span className="font-mono">2</span>
            </p>
            <div className="h-1.5 bg-surface-2 rounded-pill overflow-hidden" aria-hidden="true">
              <div
                className="h-full rounded-pill bg-signal transition-all duration-300"
                style={{ width: `${step === 1 ? 50 : 100}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <form id="create-tenant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-5">

            {/* ════ STEP 1: Organisation ════ */}
            {step === 1 && (
              <>
                {/* Org name */}
                <div className="space-y-1.5">
                  <Label htmlFor="org-name">Organisation name</Label>
                  <Input
                    id="org-name"
                    placeholder="Zambezi Logistics Ltd"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    aria-invalid={!!errors.name}
                    autoFocus
                  />
                  {errors.name && <p className="text-xs text-risk">{errors.name}</p>}
                </div>

                {/* Org type: card selection */}
                <div className="space-y-1.5">
                  <Label>Organisation type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {TENANT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={formData.type === t.value}
                        onClick={() => set("type", t.value)}
                        className={`rounded-md border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                          formData.type === t.value
                            ? "border-signal bg-signal-tint"
                            : "border-line bg-surface-1 hover:bg-surface-2"
                        }`}
                      >
                        <p className="text-sm font-semibold leading-tight text-text-primary">{t.label}</p>
                        <p className="text-xs text-text-muted mt-1 leading-snug">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand color */}
                <div className="space-y-1.5">
                  <Label htmlFor="brand-color-text">Brand colour</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="brand-color-picker"
                      type="color"
                      aria-label="Pick brand colour"
                      value={validColor ? formData.primary_color : "#0A7A67"}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className={COLOR_SWATCH}
                    />
                    <Input
                      id="brand-color-text"
                      value={formData.primary_color}
                      placeholder="#0A7A67"
                      maxLength={7}
                      onChange={(e) => set("primary_color", e.target.value)}
                      aria-invalid={!!errors.primary_color}
                      className="font-mono"
                    />
                    {/* White label previews text on the tenant's own colour */}
                    <div
                      className="h-10 w-20 flex-shrink-0 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: validColor ? formData.primary_color : "#0A7A67" }}
                    >
                      Preview
                    </div>
                  </div>
                  {errors.primary_color && <p className="text-xs text-risk">{errors.primary_color}</p>}
                </div>

                {/* Secondary & Accent Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="secondary-color-text">Secondary colour</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Pick secondary colour"
                        value={formData.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        className={COLOR_SWATCH}
                      />
                      <Input
                        id="secondary-color-text"
                        value={formData.secondary_color}
                        maxLength={7}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="accent-color-text">Accent colour</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Pick accent colour"
                        value={formData.accent_color}
                        onChange={(e) => set("accent_color", e.target.value)}
                        className={COLOR_SWATCH}
                      />
                      <Input
                        id="accent-color-text"
                        value={formData.accent_color}
                        maxLength={7}
                        onChange={(e) => set("accent_color", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Preview Strip */}
                <div className="flex gap-2 rounded-sm overflow-hidden border border-line h-8">
                  <div className="flex-1" style={{ backgroundColor: formData.primary_color }} title="Primary" />
                  <div className="flex-1" style={{ backgroundColor: formData.secondary_color }} title="Secondary" />
                  <div className="flex-1" style={{ backgroundColor: formData.accent_color }} title="Accent" />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Logo <span className="text-text-muted font-normal">(optional)</span>
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-line-strong rounded-md bg-field p-4 text-center cursor-pointer hover:bg-field-hover transition-colors"
                  >
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-auto mx-auto object-contain" />
                        <p className="text-xs text-text-secondary">{logoFile?.name}</p>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="w-full"
                        >
                          Change logo
                        </Button>
                      </div>
                    ) : (
                      <button type="button" className="w-full space-y-2">
                        <Upload size={24} className="text-text-muted mx-auto" />
                        <span className="block text-sm font-medium text-text-primary">Upload logo</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ════ STEP 2 — Admin Account ════ */}
            {step === 2 && (
              <>
                {/* Org summary card */}
                <div className="rounded-md bg-field p-4">
                  <p className="text-xs font-semibold text-text-muted mb-3">Creating</p>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <div className="h-10 w-10 rounded-sm flex items-center justify-center flex-shrink-0 bg-surface-1 border border-line">
                        <img src={logoPreview} alt="Organisation logo" className="h-8 w-8 object-contain" />
                      </div>
                    ) : (
                      <div
                        className="h-10 w-10 rounded-sm flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: validColor ? formData.primary_color : "#0A7A67" }}
                      >
                        <Building2 size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-text-primary">{formData.name}</p>
                    </div>
                    <StatusBadge tone="neutral" label={selectedType?.label} className="flex-shrink-0" />
                  </div>
                </div>

                {/* Admin email */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email">Admin email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="name@company.co.zm"
                    value={formData.admin_email}
                    onChange={(e) => { set("admin_email", e.target.value); }}
                    aria-invalid={!!errors.admin_email}
                    autoFocus
                  />
                  {errors.admin_email && <p className="text-xs text-risk">{errors.admin_email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={formData.admin_password}
                      onChange={(e) => set("admin_password", e.target.value)}
                      aria-invalid={!!errors.admin_password}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.admin_password && <p className="text-xs text-risk">{errors.admin_password}</p>}
                  {!pwdStrength && !errors.admin_password && (
                    <p className="text-xs text-text-muted">At least 8 characters.</p>
                  )}
                  {pwdStrength && !errors.admin_password && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
                        <div
                          className={`h-full rounded-pill transition-all duration-300 ${pwdStrength.color}`}
                          style={{ width: `${pwdStrength.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary">
                        Strength: <span className="font-semibold">{pwdStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirm_password: undefined }));
                      }}
                      aria-invalid={!!errors.confirm_password}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-xs text-risk">{errors.confirm_password}</p>}
                  {passwordsMatch && !errors.confirm_password && (
                    <p className="text-xs text-positive flex items-center gap-1 font-medium">
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-line flex items-center justify-between gap-3 flex-shrink-0">
          {step === 1 ? (
            <>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-tenant-form"
              >
                Continue <ChevronRight />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setErrors({}); setStep(1); }}
              >
                <ChevronLeft /> Back
              </Button>
              <Button
                type="submit"
                form="create-tenant-form"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating
                  </>
                ) : (
                  "Create tenant"
                )}
              </Button>
            </>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}

