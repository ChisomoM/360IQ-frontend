import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck, UserPlus } from "@/components/icons";
import { SectionCard } from "@/components/shared/SectionCard";
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
      toast.success("Settings updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Platform settings">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">Security and access rules for this tenant.</p>

        <div className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
          <div className="flex items-center gap-4">
            <UserPlus size={20} className="text-text-muted shrink-0" />
            <div className="space-y-0.5">
              <Label htmlFor="allow-public-reg">Allow public registration</Label>
              <p className="text-sm text-text-muted">
                Anyone can sign up for an account under this organisation's domain.
              </p>
            </div>
          </div>
          <Switch
            id="allow-public-reg"
            checked={localSettings.allow_public_reg}
            onCheckedChange={(checked) => setLocalSettings({...localSettings, allow_public_reg: checked})}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border border-line p-4">
          <div className="flex items-center gap-4">
            <ShieldCheck size={20} className="text-text-muted shrink-0" />
            <div className="space-y-0.5">
              <Label htmlFor="enforce-2fa">Enforce two-factor authentication</Label>
              <p className="text-sm text-text-muted">
                Required for all administrator and executive roles.
              </p>
            </div>
          </div>
          <Switch
            id="enforce-2fa"
            checked={localSettings.enforce_2fa}
            onCheckedChange={(checked) => setLocalSettings({...localSettings, enforce_2fa: checked})}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button variant="secondary" onClick={() => setLocalSettings(settings)} disabled={loading}>Reset changes</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
