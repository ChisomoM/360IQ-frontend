import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, CheckCircle, AlertCircle } from "lucide-react";
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
        className="h-20 w-full rounded-lg border border-gray-200 shadow-sm" 
        style={{ backgroundColor: color }}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-500 font-mono">{color}</p>
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
      toast.success("Logo uploaded successfully");
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
      toast.success("Branding updated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update branding";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Color Palette Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-ch-primary" />
            Color Palette
          </CardTitle>
          <CardDescription>Preview of all brand colors used throughout the tenant interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ColorPreview label="Primary" color={localBranding.primary_color || "#0A7A67"} />
            <ColorPreview label="Secondary" color={localBranding.secondary_color || "#1B63AE"} />
            <ColorPreview label="Accent" color={localBranding.accent_color || "#0B1B2B"} />
            <ColorPreview label="Destructive" color={localBranding.destructive_color || "#B3261E"} />
            <ColorPreview label="Success" color={localBranding.success_color || "#1F5FA8"} />
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-ch-primary" />
            Visual Identity
          </CardTitle>
          <CardDescription>Customize the look and feel of the tenant's interface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Names */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="short_name">Short Name / Initials</Label>
                <Input 
                  id="short_name" 
                  value={localBranding.short_name} 
                  onChange={(e) => setLocalBranding({...localBranding, short_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="long_name">Full Legal Name</Label>
                <Input 
                  id="long_name" 
                  value={localBranding.long_name} 
                  onChange={(e) => setLocalBranding({...localBranding, long_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input 
                  id="tagline" 
                  value={localBranding.tagline} 
                  onChange={(e) => setLocalBranding({...localBranding, tagline: e.target.value})}
                />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo URL / Upload</Label>
                <div className="flex gap-2">
                  <Input 
                    id="logo" 
                    placeholder="https://... or upload below" 
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
                    variant="outline" 
                    size="icon"
                    onClick={triggerFileInput}
                    disabled={isUploadingLogo || loading}
                  >
                    {isUploadingLogo ? "..." : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                {localBranding.logo_url && (
                  <div className="mt-2 p-2 border rounded bg-gray-50 flex justify-center">
                    <img src={localBranding.logo_url} alt="Logo Preview" className="max-h-20 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-ch-primary" />
            Brand Colors
          </CardTitle>
          <CardDescription>Define the semantic colors for your tenant interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Row 1: Primary & Secondary */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Primary Color</Label>
                <p className="text-xs text-gray-500">Main brand color for buttons, links, and primary actions.</p>
                <div className="flex gap-3 items-center">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 cursor-pointer" 
                    value={localBranding.primary_color || "#0A7A67"}
                    onChange={(e) => setLocalBranding({...localBranding, primary_color: e.target.value})}
                  />
                  <Input 
                    value={localBranding.primary_color || "#0A7A67"}
                    onChange={(e) => setLocalBranding({...localBranding, primary_color: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold">Secondary Color</Label>
                <p className="text-xs text-gray-500">Complementary accent color for secondary actions.</p>
                <div className="flex gap-3 items-center">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 cursor-pointer" 
                    value={localBranding.secondary_color || "#1B63AE"}
                    onChange={(e) => setLocalBranding({...localBranding, secondary_color: e.target.value})}
                  />
                  <Input 
                    value={localBranding.secondary_color || "#1B63AE"}
                    onChange={(e) => setLocalBranding({...localBranding, secondary_color: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Accent & Destructive */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Accent Color</Label>
                <p className="text-xs text-gray-500">Tertiary accent for highlights and hover states.</p>
                <div className="flex gap-3 items-center">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 cursor-pointer" 
                    value={localBranding.accent_color || "#0B1B2B"}
                    onChange={(e) => setLocalBranding({...localBranding, accent_color: e.target.value})}
                  />
                  <Input 
                    value={localBranding.accent_color || "#0B1B2B"}
                    onChange={(e) => setLocalBranding({...localBranding, accent_color: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold">Destructive Color</Label>
                <p className="text-xs text-gray-500">Error and danger state indicator color.</p>
                <div className="flex gap-3 items-center">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 cursor-pointer" 
                    value={localBranding.destructive_color || "#B3261E"}
                    onChange={(e) => setLocalBranding({...localBranding, destructive_color: e.target.value})}
                  />
                  <Input 
                    value={localBranding.destructive_color || "#B3261E"}
                    onChange={(e) => setLocalBranding({...localBranding, destructive_color: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Success */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Success Color</Label>
                <p className="text-xs text-gray-500">Positive action and success state indicator.</p>
                <div className="flex gap-3 items-center">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 cursor-pointer" 
                    value={localBranding.success_color || "#1F5FA8"}
                    onChange={(e) => setLocalBranding({...localBranding, success_color: e.target.value})}
                  />
                  <Input 
                    value={localBranding.success_color || "#1F5FA8"}
                    onChange={(e) => setLocalBranding({...localBranding, success_color: e.target.value})}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-0 bg-transparent shadow-none">
        <CardFooter className="gap-3 px-0">
          <Button 
            variant="outline" 
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
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-ch-primary hover:bg-ch-tertiary">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
