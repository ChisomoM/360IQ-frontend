import { useEffect } from 'react';
import { useTenantStore } from '@/lib/store/tenantStore';

const DEFAULT_PRIMARY_COLOR = '#1e5631';
const DEFAULT_SECONDARY_COLOR = '#febb00';
const DEFAULT_ACCENT_COLOR = '#172E70';
const DEFAULT_DESTRUCTIVE_COLOR = '#dc2626';
const DEFAULT_SUCCESS_COLOR = '#10b981';
const DEFAULT_LOGO = '/logos/unilus-logo-3.png';

/**
 * Converts a hex color string to its HSL numeric components (e.g., "248 75% 44%").
 * This is required for shadcn/ui and Tailwind compatibility when using CSS variables.
 */
function hexToHSLValues(hex: string): string {
  // Remove '#' if present
  hex = hex.replace(/^#/, '');

  // Handle shorthand hex colors (e.g. #03F)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Returns the current tenant's branding values from the global Zustand store.
 * Falls back to sensible defaults when no config has been fetched yet.
 */
export function useTenantBranding() {
  const config = useTenantStore((state) => state.currentTenantConfig);
  const branding = config?.branding;

  return {
    logo: branding?.logo_url || DEFAULT_LOGO,
    logoUrl: branding?.logo_url,
    primaryColor: branding?.primary_color || DEFAULT_PRIMARY_COLOR,
    secondaryColor: branding?.secondary_color || DEFAULT_SECONDARY_COLOR,
    accentColor: branding?.accent_color || DEFAULT_ACCENT_COLOR,
    destructiveColor: branding?.destructive_color || DEFAULT_DESTRUCTIVE_COLOR,
    successColor: branding?.success_color || DEFAULT_SUCCESS_COLOR,
    tenantName: branding?.long_name || branding?.short_name || 'DIMS',
    shortName: branding?.short_name || 'DIMS',
    tagline: branding?.tagline || '',
    settings: config?.settings || {},
  };
}

/**
 * Applies the current tenant's branding colors as CSS custom properties on
 * `document.documentElement`. Call this in a `useEffect` whenever the tenant
 * config changes so the UI reflects the correct brand colors.
 */
export function useTenantBrandingEffect() {
  const colors = useTenantBranding();

  useEffect(() => {
    // 1. Set Hex Variables (for raw usage)
    if (colors.primaryColor) {
      document.documentElement.style.setProperty('--tenant-primary', colors.primaryColor);
      // Link to standard shadcn variables
      const hsl = hexToHSLValues(colors.primaryColor);
      document.documentElement.style.setProperty('--primary', hsl);
      document.documentElement.style.setProperty('--sidebar', hsl);
      document.documentElement.style.setProperty('--ring', hsl);
    }
    if (colors.secondaryColor) {
      document.documentElement.style.setProperty('--tenant-secondary', colors.secondaryColor);
      // Link to standard shadcn variables
      const hsl = hexToHSLValues(colors.secondaryColor);
      document.documentElement.style.setProperty('--secondary', hsl);
      document.documentElement.style.setProperty('--sidebar-primary', hsl);
    }
    if (colors.accentColor) {
      document.documentElement.style.setProperty('--tenant-accent', colors.accentColor);
      document.documentElement.style.setProperty('--accent', hexToHSLValues(colors.accentColor));
    }
    if (colors.destructiveColor) {
      document.documentElement.style.setProperty('--tenant-destructive', colors.destructiveColor);
      document.documentElement.style.setProperty('--destructive', hexToHSLValues(colors.destructiveColor));
    }
    if (colors.successColor) {
      document.documentElement.style.setProperty('--tenant-success', colors.successColor);
    }
  }, [colors.primaryColor, colors.secondaryColor, colors.accentColor, colors.destructiveColor, colors.successColor]);
}
