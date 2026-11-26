import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Building2,
  Users,
  Palette,
  Hash,
} from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/format";
import type { Tenant } from "@/types/tenant";
import TenantBrandingEditor from "@/(controlhub)/components/TenantBrandingEditor";
import TenantSettingsEditor from "@/(controlhub)/components/TenantSettingsEditor";
import TenantAdminsView from "@/(controlhub)/components/TenantAdminsView";
import { chGet } from "@/lib/api/controlhub";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  "higher-academic": "Higher academic",
  parastetal: "Parastatal",
  company: "Private company",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenant = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [data, adminData] = await Promise.all([
        chGet("CH_CLIENT_DETAIL", { id }) as Promise<Tenant>,
        chGet("CH_CLIENT_ADMINS", { id }).catch(() => []),
      ]);
      setTenant(data);
      setAdmins((adminData as any[]) || []);
    } catch (err) {
      toast.error("Failed to load tenant details");
      console.error("[ControlHub] Failed to fetch client:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  const backLink = (
    <button
      type="button"
      onClick={() => navigate("/controlhub/tenants")}
      className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
    >
      <ChevronLeft size={14} /> Tenants
    </button>
  );

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-5">
        <div className="skeleton h-9 w-64 rounded-md" />
        <div className="skeleton h-10 w-72 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-44 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader crumb={backLink} title="Tenant not found" description="Go back to the list and choose another tenant." />
      </div>
    );
  }

  const brandColor = tenant.config?.branding?.primary_color || "#0A7A67";
  const isActive = tenant.status === "active";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb={backLink}
        title={
          <span className="flex items-center gap-3">
            {/* Tile in the tenant's brand colour */}
            <span
              className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: brandColor }}
              aria-hidden="true"
            >
              <Building2 size={20} />
            </span>
            {tenant.name}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatusBadge status={isActive ? "active" : "inactive"} />
            <span className="font-mono text-xs">{tenant.id}</span>
            <span>{TYPE_LABELS[tenant.type] ?? tenant.type}</span>
            <span><span className="font-mono text-xs">{admins.length}</span> admin{admins.length !== 1 ? "s" : ""}</span>
            <span>Joined {new Date(tenant.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
          </span>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          {[
            { value: "overview", label: "Overview", icon: Hash },
            { value: "admins", label: "Admins", icon: Users },
            { value: "branding", label: "Branding", icon: Palette },
            // { value: "settings", label: "Settings", icon: Settings2 },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <Icon size={16} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <SectionCard title="Organisation">
              <dl className="divide-y divide-line -my-3">
                <DetailRow label="Full name" value={tenant.name} />
                <DetailRow label="Short name" value={tenant.config?.branding?.short_name || "N/A"} />
                <DetailRow label="Tagline" value={tenant.config?.branding?.tagline || "N/A"} />
                <DetailRow label="Type" value={TYPE_LABELS[tenant.type] ?? tenant.type} />
              </dl>
            </SectionCard>

            <SectionCard title="Technical">
              <dl className="divide-y divide-line -my-3">
                <DetailRow label="Tenant ID" value={<span className="font-mono text-xs">{tenant.id}</span>} />
                <DetailRow label="Created" value={<span className="font-mono text-xs">{formatDate(tenant.created_at)}</span>} />
                <DetailRow label="Last updated" value={<span className="font-mono text-xs">{formatDate(tenant.updated_at)}</span>} />
              </dl>
            </SectionCard>

            <SectionCard title="Branding">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-md shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: brandColor }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{tenant.config?.branding?.short_name || tenant.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-4 w-4 rounded-xs border border-line" style={{ backgroundColor: brandColor }} />
                    <span className="font-mono text-xs text-text-muted">{brandColor}</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Security and access">
              <dl className="divide-y divide-line -my-3">
                <DetailRow
                  label="Public registration"
                  value={
                    <StatusBadge
                      tone={tenant.config?.settings?.allow_public_reg ? "positive" : "neutral"}
                      label={tenant.config?.settings?.allow_public_reg ? "Enabled" : "Disabled"}
                    />
                  }
                />
                <DetailRow
                  label="Two-factor authentication"
                  value={
                    <StatusBadge
                      tone={tenant.config?.settings?.enforce_2fa ? "positive" : "neutral"}
                      label={tenant.config?.settings?.enforce_2fa ? "Enforced" : "Optional"}
                    />
                  }
                />
                <DetailRow label="Admins" value={<span className="font-mono text-xs">{admins.length}</span>} />
              </dl>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="admins">
          <TenantAdminsView
            tenantId={id!}
            admins={admins}
            onUpdate={(updated: any[]) => setAdmins(updated)}
          />
        </TabsContent>

        <TabsContent value="branding">
          <TenantBrandingEditor
            tenantId={tenant.id}
            branding={tenant.config.branding}
            onChange={(updated) =>
              setTenant((prev) =>
                prev
                  ? { ...prev, config: { ...prev.config, branding: { ...prev.config.branding, ...updated } } }
                  : prev
              )
            }
          />
        </TabsContent>

        <TabsContent value="settings">
          <TenantSettingsEditor
            tenantId={tenant.id}
            settings={tenant.config.settings}
            onChange={(updated) =>
              setTenant((prev) =>
                prev
                  ? { ...prev, config: { ...prev.config, settings: { ...prev.config.settings, ...updated } } }
                  : prev
              )
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
