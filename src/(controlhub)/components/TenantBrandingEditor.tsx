import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "@/components/icons";
import { SectionCard } from "@/components/shared/SectionCard";
import type { TenantBranding } from "@/types/tenant";
import { toast } from "sonner";
import { chPatch, chUploadBrandingLogo } from "@/lib/api/controlhub";

interface TenantBrandingEditorProps {
  tenantId: string;
  branding: TenantBranding;
  onChange: (updated: Partial<TenantBranding>) => void;
}

// Color preview grid component
function ColorPreview({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-20 w-full rounded-md border border-line"
        style={{ backgroundColor: color }}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="text-xs text-text-muted font-mono">{color}</p>
      </div>
    </div>
  );
}

// Colour picker plus hex input for one brand colour
function ColorField({ id, label, hint, value, onChange }: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <p id={`${id}-hint`} className="text-xs text-text-muted">{hint}</p>
      <div className="flex gap-3 items-center">
        <Input
          type="color"
          aria-label={`${label} picker`}
          className="w-12 shrink-0 p-1 cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          id={id}
          aria-describedby={`${id}-hint`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      </div>
    </div>
  );
}

export default function TenantBrandingEditor({ tenantId, branding, onChange }: TenantBrandingEditorProps) {
  const [loading, setLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [localBranding, setLocalBranding] = useState<TenantBranding>(branding || {
    logo_url: "",
    primary_color: "#0A7A67",
    secondary_color: "#1B63AE",
    accent_color: "#0B1B2B",
    destructive_color: "#B3261E",
    success_color: "#1F5FA8",
    short_name: "",
    long_name: "",
    tagline: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const result = await chUploadBrandingLogo(tenantId, file);
      const logoUrl = result.logo_url;

      setLocalBranding({ ...localBranding, logo_url: logoUrl });
      toast.success("Logo uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload logo";
      toast.error(msg);
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Update local branding when prop changes (e.g., when fetched from backend)
  useEffect(() => {
    if (branding) {
      setLocalBranding(branding);
    }
  }, [branding]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await chPatch("CH_CLIENT_BRANDING", localBranding, { id: tenantId });
      onChange(localBranding);
      toast.success("Branding updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update branding";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Color Palette Overview */}
      <SectionCard title="Colour palette">
        <p className="mb-4 text-sm text-text-secondary">Preview of the brand colours used across the tenant's interface.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorPreview label="Primary" color={localBranding.primary_color || "#0A7A67"} />
          <ColorPreview label="Secondary" color={localBranding.secondary_color || "#1B63AE"} />
          <ColorPreview label="Accent" color={localBranding.accent_color || "#0B1B2B"} />
          <ColorPreview label="Destructive" color={localBranding.destructive_color || "#B3261E"} />
          <ColorPreview label="Success" color={localBranding.success_color || "#1F5FA8"} />
        </div>
      </SectionCard>

      {/* Organization Details */}
      <SectionCard title="Visual identity">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Organization Names */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="short_name">Short name or initials</Label>
              <Input
                id="short_name"
                value={localBranding.short_name}
                onChange={(e) => setLocalBranding({...localBranding, short_name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="long_name">Full legal name</Label>
              <Input
                id="long_name"
                value={localBranding.long_name}
                onChange={(e) => setLocalBranding({...localBranding, long_name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={localBranding.tagline}
                onChange={(e) => setLocalBranding({...localBranding, tagline: e.target.value})}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-1.5">
            <Label htmlFor="logo">Logo URL or upload</Label>
            <div className="flex gap-2">
              <Input
                id="logo"
                placeholder="https://company.co.zm/logo.png"
                value={localBranding.logo_url}
                onChange={(e) => setLocalBranding({...localBranding, logo_url: e.target.value})}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={triggerFileInput}
                disabled={isUploadingLogo || loading}
                aria-label="Upload logo"
                title="Upload logo"
              >
                {isUploadingLogo ? <Loader2 className="animate-spin" /> : <Upload />}
              </Button>
            </div>
            {localBranding.logo_url && (
              <div className="mt-2 p-3 border border-line rounded-md bg-field flex justify-center">
                <img src={localBranding.logo_url} alt="Logo preview" className="max-h-20 object-contain" />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Semantic Colors */}
      <SectionCard title="Brand colours">
        <div className="grid gap-4 md:grid-cols-2">
          <ColorField
            id="primary_color"
            label="Primary colour"
            hint="Buttons, links and primary actions."
            value={localBranding.primary_color || "#0A7A67"}
            onChange={(value) => setLocalBranding({...localBranding, primary_color: value})}
          />
          <ColorField
            id="secondary_color"
            label="Secondary colour"
            hint="Secondary actions."
            value={localBranding.secondary_color || "#1B63AE"}
            onChange={(value) => setLocalBranding({...localBranding, secondary_color: value})}
          />
          <ColorField
            id="accent_color"
            label="Accent colour"
            hint="Highlights and hover states."
            value={localBranding.accent_color || "#0B1B2B"}
            onChange={(value) => setLocalBranding({...localBranding, accent_color: value})}
          />
          <ColorField
            id="destructive_color"
            label="Destructive colour"
            hint="Errors and risk states."
            value={localBranding.destructive_color || "#B3261E"}
            onChange={(value) => setLocalBranding({...localBranding, destructive_color: value})}
          />
          <ColorField
            id="success_color"
            label="Success colour"
            hint="Positive actions and success states."
            value={localBranding.success_color || "#1F5FA8"}
            onChange={(value) => setLocalBranding({...localBranding, success_color: value})}
          />
        </div>
      </SectionCard>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => setLocalBranding(branding || {
            logo_url: "",
            primary_color: "#0A7A67",
            secondary_color: "#1B63AE",
            accent_color: "#0B1B2B",
            destructive_color: "#B3261E",
            success_color: "#1F5FA8",
            short_name: "",
            long_name: "",
            tagline: "",
          })}
          disabled={loading}
        >
          Reset changes
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
