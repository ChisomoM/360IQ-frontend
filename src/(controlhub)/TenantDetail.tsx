import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Building2 } from "lucide-react";
import type { Tenant } from "@/types/tenant";
import TenantBrandingEditor from "@/(controlhub)/components/TenantBrandingEditor";
import TenantSettingsEditor from "@/(controlhub)/components/TenantSettingsEditor";
import TenantAdminsView from "@/(controlhub)/components/TenantAdminsView";

// Mock Data (matches ID 1)
const MOCK_TENANT: Tenant = {
  id: "1",
  name: "Ministry of Education",
  db_name: "edu_min_db",
  type: "parastetal",
  status: "active",
  config: {
    branding: { 
      logo_url: "https://placehold.co/200x100/1e5631/white?text=MOE", 
      primary_color: "#7c69ff", 
      short_name: "MoE", 
      long_name: "Ministry of Education", 
      tagline: "Education for all citizens" 
    },
    settings: { 
      allow_public_reg: false, 
      enforce_2fa: true 
    }
  },
  admins: [
    { id: "1", name: "Sarah Mumba", email: "sarah.m@moe.gov.zm", status: "active", role: "super-admin", last_login: "2 hours ago" },
    { id: "2", name: "Brian Phiri", email: "b.phiri@moe.gov.zm", status: "active", role: "admin", last_login: "Yesterday" }
  ],
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z"
};

export default function TenantDetail() {
  const { id } = useParams(); // 'id' is still destructured but might be unused if useTenant handles fetching
  const navigate = useNavigate();
  // In a real app, fetch tenant by id
  const [tenant, setTenant] = useState<Tenant>(MOCK_TENANT);

  const handleBack = () => navigate("/admin/controlhub/tenants");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{tenant.name}</h1>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{tenant.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">ID: {tenant.id} • DB: {tenant.db_name}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-ch-primary" />
                General Information
              </CardTitle>
              <CardDescription>Basic system details for this organization.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tenant Name</p>
                <p className="text-base font-semibold">{tenant.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Database Schema</p>
                <p className="text-base font-semibold font-mono">{tenant.db_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Organization Type</p>
                <p className="text-base capitalize">{tenant.type.replace("-", " ")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-base">{new Date(tenant.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <TenantAdminsView 
            admins={tenant.admins || []} 
            onUpdate={(updated: any[]) => setTenant((prev: any) => ({ ...prev, admins: updated }))}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <TenantBrandingEditor 
            branding={tenant.config.branding} 
            onChange={(updated: Partial<Tenant["config"]["branding"]>) => setTenant(prev => ({
              ...prev,
              config: { ...prev.config, branding: { ...prev.config.branding, ...updated } }
            }))}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <TenantSettingsEditor 
            settings={tenant.config.settings}
            onChange={(updated: Partial<Tenant["config"]["settings"]>) => setTenant(prev => ({
              ...prev,
              config: { ...prev.config, settings: { ...prev.config.settings, ...updated } }
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
