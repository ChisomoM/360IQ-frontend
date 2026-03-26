import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload } from "lucide-react";
import type { TenantBranding } from "@/types/tenant";
import { toast } from "sonner";

interface TenantBrandingEditorProps {
  branding: TenantBranding;
  onChange: (updated: Partial<TenantBranding>) => void;
}

export default function TenantBrandingEditor({ branding, onChange }: TenantBrandingEditorProps) {
  const [loading, setLoading] = useState(false);
  const [localBranding, setLocalBranding] = useState(branding);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onChange(localBranding);
      toast.success("Branding updated successfully");
    } catch (error) {
      toast.error("Failed to update branding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-ch-primary" />
          Visual Identity
        </CardTitle>
        <CardDescription>Customize the look and feel of the tenant's interface.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

          <div className="space-y-4">
             <div className="grid gap-2">
              <Label>Primary Brand Color</Label>
              <div className="flex gap-3 items-center">
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1 cursor-pointer" 
                  value={localBranding.primary_color}
                  onChange={(e) => setLocalBranding({...localBranding, primary_color: e.target.value})}
                />
                <Input 
                  value={localBranding.primary_color}
                  onChange={(e) => setLocalBranding({...localBranding, primary_color: e.target.value})}
                  className="font-mono"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="logo" 
                  placeholder="https://..." 
                  value={localBranding.logo_url} 
                  onChange={(e) => setLocalBranding({...localBranding, logo_url: e.target.value})}
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
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
      <CardFooter className="border-t px-6 py-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocalBranding(branding)} disabled={loading}>Reset</Button>
        <Button onClick={handleSave} disabled={loading} className="bg-ch-primary hover:bg-ch-tertiary">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
