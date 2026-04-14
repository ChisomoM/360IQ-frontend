import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, ShieldCheck, UserPlus } from "lucide-react";
import type { TenantSettings } from "@/types/tenant";
import { toast } from "sonner";
import { chPatch } from "@/lib/api/controlhub";

interface TenantSettingsEditorProps {
  tenantId: string;
  settings: TenantSettings;
  onChange: (updated: Partial<TenantSettings>) => void;
}

export default function TenantSettingsEditor({ tenantId, settings, onChange }: TenantSettingsEditorProps) {
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async () => {
    setLoading(true);
    try {
      await chPatch("CH_CLIENT_SETTINGS", localSettings, { id: tenantId });
      onChange(localSettings);
      toast.success("Settings updated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-ch-primary" />
          Platform Settings
        </CardTitle>
        <CardDescription>Manage security and accessibility rules for this tenant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label className="text-base">Allow Public Registration</Label>
              <p className="text-sm text-muted-foreground">
                Enable anyone to sign up for an account under this organization's domain.
              </p>
            </div>
          </div>
          <Switch 
            checked={localSettings.allow_public_reg} 
            onCheckedChange={(checked) => setLocalSettings({...localSettings, allow_public_reg: checked})}
          />
        </div>

        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label className="text-base">Enforce Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Mandatory 2FA for all administrative and executive roles.
              </p>
            </div>
          </div>
          <Switch 
            checked={localSettings.enforce_2fa} 
            onCheckedChange={(checked) => setLocalSettings({...localSettings, enforce_2fa: checked})}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocalSettings(settings)} disabled={loading}>Reset</Button>
        <Button onClick={handleSave} disabled={loading} className="bg-ch-primary hover:bg-ch-tertiary">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
