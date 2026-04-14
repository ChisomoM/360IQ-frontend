import { useState, useCallback, useRef, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { chPost } from "@/lib/api/controlhub";
import {
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Database,
  Palette,
  Shield,
  Upload,
} from "lucide-react";
import type { CreateTenantPayload, TenantType } from "@/types/tenant";

const EMPTY_FORM: CreateTenantPayload = {
  name: "",
  type: "company",
  primary_color: "#7c69ff",
  secondary_color: "#febb00",
  accent_color: "#172E70",
  admin_email: "",
  admin_password: "",
};

const TENANT_TYPES: { value: TenantType; label: string; description: string }[] = [
  { value: "higher-academic", label: "Higher Academic", description: "Universities & colleges" },
  { value: "parastetal",      label: "Parastatal",      description: "Government-linked bodies" },
  { value: "company",         label: "Private Company", description: "Enterprises & SMEs" },
];

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pwd.length >= 8)       s++;
  if (pwd.length >= 12)      s++;
  if (/[A-Z]/.test(pwd))     s++;
  if (/[0-9]/.test(pwd))     s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { score: 20,  label: "Very weak",   color: "bg-red-500" };
  if (s === 2) return { score: 40,  label: "Weak",        color: "bg-orange-500" };
  if (s === 3) return { score: 60,  label: "Fair",        color: "bg-yellow-500" };
  if (s === 4) return { score: 80,  label: "Strong",      color: "bg-blue-500" };
  return           { score: 100, label: "Very strong", color: "bg-green-500" };
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
    if (!formData.name.trim())    e.name    = "Organization name is required";
    if (!/^#[0-9a-fA-F]{6}$/.test(formData.primary_color))
      e.primary_color = "Must be a valid hex color (e.g. #7c69ff)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FieldErrors = {};
    if (!formData.admin_email.trim())
      e.admin_email = "Admin email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email))
      e.admin_email = "Enter a valid email address";
    if (!formData.admin_password)
      e.admin_password = "Password is required";
    else if (formData.admin_password.length < 8)
      e.admin_password = "Password must be at least 8 characters";
    if (!confirmPassword)
      e.confirm_password = "Please confirm your password";
    else if (formData.admin_password !== confirmPassword)
      e.confirm_password = "Passwords do not match";
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
      toast.success(`"${formData.name}" has been provisioned successfully!`);
      handleClose();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to register tenant. Please try again.";
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
      <SheetContent side="right" className="w-full sm:max-w-[500px] p-0 bg-white flex flex-col">

        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-8 pb-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="mb-6">
            <SheetTitle className="text-gray-900 text-2xl font-bold leading-tight">
              Register Tenant
            </SheetTitle>
            <SheetDescription className="text-gray-600 text-sm mt-2">
              Set up a new organization in your ecosystem
            </SheetDescription>
          </div>

          {/* Progress Bar - Refined */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-700">
                Step {step} of 2
              </span>
              <span className="text-xs text-gray-500">{step === 1 ? '50' : '100'}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-ch-primary transition-all duration-300"
                style={{ width: `${step === 1 ? 50 : 100}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <form id="create-tenant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-8 space-y-6">

            {/* ════ STEP 1 — Organization ════ */}
            {step === 1 && (
              <>
                {/* Org name */}
                <div className="space-y-2.5">
                  <Label htmlFor="org-name" className="text-sm font-semibold text-gray-900">
                    Organization Name<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="org-name"
                    placeholder="e.g. University of Southern Africa"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`border-gray-200 rounded-lg ${errors.name ? "border-red-400 focus-visible:ring-red-400" : "focus-visible:ring-ch-primary"}`}
                    autoFocus
                  />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>

                {/* Org type — card selection */}
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold text-gray-900">
                    Organization Type<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TENANT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set("type", t.value)}
                        className={`rounded-lg border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ch-primary ${
                          formData.type === t.value
                            ? "border-ch-primary bg-ch-primary/5 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <p className="text-sm font-medium leading-tight text-gray-900">{t.label}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-snug">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand color */}
                <div className="space-y-2.5">
                  <Label htmlFor="brand-color-text" className="text-sm font-semibold text-gray-900">
                    Brand Color
                  </Label>
                  <div className="flex items-center gap-2.5">
                    <input
                      id="brand-color-picker"
                      type="color"
                      aria-label="Pick brand color"
                      value={validColor ? formData.primary_color : "#7c69ff"}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className="h-11 w-14 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white flex-shrink-0 shadow-sm hover:shadow-md transition-shadow"
                    />
                    <Input
                      id="brand-color-text"
                      value={formData.primary_color}
                      placeholder="#7c69ff"
                      maxLength={7}
                      onChange={(e) => set("primary_color", e.target.value)}
                      className="font-mono text-sm border-gray-200 rounded-lg"
                    />
                    <div
                      className="h-11 w-20 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold text-white shadow-sm transition-all"
                      style={{ backgroundColor: validColor ? formData.primary_color : "#7c69ff" }}
                    >
                      Preview
                    </div>
                  </div>
                  {errors.primary_color && <p className="text-xs text-red-500 font-medium">{errors.primary_color}</p>}
                </div>

                {/* Secondary & Accent Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-900">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Pick secondary color"
                        value={formData.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white flex-shrink-0"
                      />
                      <Input
                        value={formData.secondary_color}
                        maxLength={7}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        className="font-mono text-sm border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-900">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Pick accent color"
                        value={formData.accent_color}
                        onChange={(e) => set("accent_color", e.target.value)}
                        className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white flex-shrink-0"
                      />
                      <Input
                        value={formData.accent_color}
                        maxLength={7}
                        onChange={(e) => set("accent_color", e.target.value)}
                        className="font-mono text-sm border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Preview Strip */}
                <div className="flex gap-2 rounded-lg overflow-hidden border border-gray-200 h-8">
                  <div className="flex-1" style={{ backgroundColor: formData.primary_color }} title="Primary" />
                  <div className="flex-1" style={{ backgroundColor: formData.secondary_color }} title="Secondary" />
                  <div className="flex-1" style={{ backgroundColor: formData.accent_color }} title="Accent" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold text-gray-900">
                    Logo <span className="text-gray-500 font-normal">(Optional)</span>
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
                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-all"
                  >
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-auto mx-auto object-contain" />
                        <p className="text-xs text-gray-600">{logoFile?.name}</p>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="w-full"
                        >
                          Change Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Click to upload</p>
                          <p className="text-xs text-gray-500">or drag and drop</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ════ STEP 2 — Admin Account ════ */}
            {step === 2 && (
              <>
                {/* Org summary card */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 mb-2">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Provisioning for</p>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-white border border-gray-200">
                        <img src={logoPreview} alt="Org logo" className="h-8 w-8 object-contain" />
                      </div>
                    ) : (
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: validColor ? formData.primary_color : "#7c69ff" }}
                      >
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-gray-900">{formData.name}</p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 text-xs capitalize bg-gray-200 text-gray-700">
                      {selectedType?.label}
                    </Badge>
                  </div>
                </div>

                {/* Admin email */}
                <div className="space-y-2.5 pt-2">
                  <Label htmlFor="admin-email" className="text-sm font-semibold text-gray-900">
                    Admin Email<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@organization.com"
                    value={formData.admin_email}
                    onChange={(e) => { set("admin_email", e.target.value); }}
                    className={`border-gray-200 rounded-lg ${errors.admin_email ? "border-red-400 focus-visible:ring-red-400" : "focus-visible:ring-ch-primary"}`}
                    autoFocus
                  />
                  {errors.admin_email && <p className="text-xs text-red-500 font-medium">{errors.admin_email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2.5">
                  <Label htmlFor="admin-password" className="text-sm font-semibold text-gray-900">
                    Password<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={formData.admin_password}
                      onChange={(e) => set("admin_password", e.target.value)}
                      className={`pr-10 border-gray-200 rounded-lg ${errors.admin_password ? "border-red-400 focus-visible:ring-red-400" : "focus-visible:ring-ch-primary"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.admin_password && <p className="text-xs text-red-500 font-medium">{errors.admin_password}</p>}
                  {pwdStrength && !errors.admin_password && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pwdStrength.color}`}
                          style={{ width: `${pwdStrength.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Strength: <span className="font-medium">{pwdStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2.5">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-900">
                    Confirm Password<span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirm_password: undefined }));
                      }}
                      className={`pr-10 border-gray-200 rounded-lg ${
                        passwordsMatch
                          ? "border-green-400 focus-visible:ring-green-400"
                          : errors.confirm_password
                          ? "border-red-400 focus-visible:ring-red-400"
                          : "focus-visible:ring-ch-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-xs text-red-500 font-medium">{errors.confirm_password}</p>}
                  {passwordsMatch && !errors.confirm_password && (
                    <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose} className="text-gray-700 border-gray-200">
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-tenant-form"
                className="bg-ch-primary text-white hover:bg-ch-primary/90"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setErrors({}); setStep(1); }}
                className="text-gray-700 border-gray-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                form="create-tenant-form"
                className="bg-ch-primary text-white hover:bg-ch-primary/90 min-w-[140px]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Provisioning...
                  </span>
                ) : (
                  "Provision Tenant"
                )}
              </Button>
            </>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}

