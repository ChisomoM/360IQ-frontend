import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Building2,
  RefreshCw,
  Database,
  Calendar,
  Globe,
  Users,
  Palette,
  Settings2,
  ShieldCheck,
  Hash,
} from "lucide-react";
import type { Tenant } from "@/types/tenant";
import TenantBrandingEditor from "@/(controlhub)/components/TenantBrandingEditor";
import TenantSettingsEditor from "@/(controlhub)/components/TenantSettingsEditor";
import TenantAdminsView from "@/(controlhub)/components/TenantAdminsView";
import { chGet } from "@/lib/api/controlhub";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  "higher-academic": "Higher Academic",
  parastetal: "Parastatal",
  company: "Private Company",
};

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-ch-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/controlhub/tenants")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Tenants
        </button>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Tenant not found.
        </div>
      </div>
    );
  }

  const brandColor = tenant.config?.branding?.primary_color || "#0A7A67";
  const isActive = tenant.status === "active";

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/controlhub/tenants")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Tenants
      </button>

      {/* Hero Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Color bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />

        <div className="px-8 py-7 flex items-start gap-6">
          {/* Org Avatar */}
          <div
            className="h-16 w-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ backgroundColor: brandColor }}
          >
            <Building2 className="h-8 w-8 text-white" />
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{tenant.name}</h1>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-positive-tint text-positive" : "bg-gray-100 text-gray-600"}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-positive" : "bg-gray-400"}`} />
                {isActive ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-1.5 font-mono">{tenant.id}</p>

            {/* Quick stats row */}
            <div className="flex items-center gap-6 mt-5 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{tenant.id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4 text-gray-400" />
                <span>{TYPE_LABELS[tenant.type] ?? tenant.type}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{admins.length} admin{admins.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Joined {new Date(tenant.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start gap-0 h-auto p-0">
          {[
            { value: "overview", label: "Overview", icon: Hash },
            { value: "admins", label: "Admins", icon: Users },
            { value: "branding", label: "Branding", icon: Palette },
            // { value: "settings", label: "Settings", icon: Settings2 },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-ch-primary data-[state=active]:text-ch-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Org Details Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-ch-primary" />
                <h3 className="font-semibold text-gray-900 text-sm">Organization</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { label: "Full Name", value: tenant.name },
                  { label: "Short Name", value: tenant.config?.branding?.short_name || "—" },
                  { label: "Tagline", value: tenant.config?.branding?.tagline || "—" },
                  { label: "Type", value: TYPE_LABELS[tenant.type] ?? tenant.type },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Details Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Technical</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { label: "Tenant ID", value: <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{tenant.id}</span> },
                  { label: "Tenant ID", value: <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{tenant.id}</span> },
                  { label: "Created", value: new Date(tenant.created_at).toLocaleDateString() },
                  { label: "Last Updated", value: new Date(tenant.updated_at).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Branding Preview Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 flex items-center gap-2">
                <Palette className="h-4 w-4 text-signal-text" />
                <h3 className="font-semibold text-gray-900 text-sm">Branding</h3>
              </div>
              <div className="px-5 py-5 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{tenant.config?.branding?.short_name || tenant.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-4 w-4 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: brandColor }} />
                    <span className="font-mono text-xs text-gray-500">{brandColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-positive" />
                <h3 className="font-semibold text-gray-900 text-sm">Security & Access</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Public Registration</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tenant.config?.settings?.allow_public_reg ? "bg-positive-tint text-positive" : "bg-gray-100 text-gray-600"}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${tenant.config?.settings?.allow_public_reg ? "bg-positive" : "bg-gray-400"}`} />
                    {tenant.config?.settings?.allow_public_reg ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Two-Factor Auth</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tenant.config?.settings?.enforce_2fa ? "bg-positive-tint text-positive" : "bg-gray-100 text-gray-600"}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${tenant.config?.settings?.enforce_2fa ? "bg-positive" : "bg-gray-400"}`} />
                    {tenant.config?.settings?.enforce_2fa ? "Enforced" : "Optional"}
                  </span>
                </div>
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Admin Count</span>
                  <span className="text-sm font-semibold text-gray-900">{admins.length}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="mt-8">
          <TenantAdminsView
            tenantId={id!}
            admins={admins}
            onUpdate={(updated: any[]) => setAdmins(updated)}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-8">
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

        <TabsContent value="settings" className="mt-8">
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



