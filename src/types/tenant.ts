export type TenantType = "parastetal" | "higher-academic" | "company";

export interface TenantBranding {
  logo_url: string;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  destructive_color?: string;
  success_color?: string;
  short_name: string;
  long_name: string;
  tagline: string;
}

export interface TenantSettings {
  allow_public_reg: boolean;
  enforce_2fa: boolean;
}

export interface TenantConfig {
  branding: TenantBranding;
  settings: TenantSettings;
}

export interface Tenant {
  id: string;
  name: string;
  
  type: TenantType;
  status: "active" | "inactive";
  config: TenantConfig;
  created_at: string;
  updated_at: string;
  admins?: TenantAdmin[];
}

export interface TenantAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
  role: "super-admin" | "admin" | "manager";
  last_login?: string;
}

export interface CreateTenantPayload {
  name: string;
  type: TenantType;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateTenantBrandingPayload {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  destructive_color?: string;
  success_color?: string;
  short_name?: string;
  long_name?: string;
  tagline?: string;
}

export interface UpdateTenantSettingsPayload {
  allow_public_reg?: boolean;
  enforce_2fa?: boolean;
}
