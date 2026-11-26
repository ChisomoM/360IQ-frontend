import { useEffect } from 'react';
import { useTenantStore } from '@/lib/store/tenantStore';

const DEFAULT_PRIMARY_COLOR = '#0A7A67';
const DEFAULT_SECONDARY_COLOR = '#1B63AE';
const DEFAULT_ACCENT_COLOR = '#0B1B2B';
const DEFAULT_DESTRUCTIVE_COLOR = '#B3261E';
const DEFAULT_SUCCESS_COLOR = '#1F5FA8';
const DEFAULT_LOGO = '/logos/logo/360IQ-horizontal-transparent-for-light.png';

/**
 * Converts a hex color string to its HSL numeric components (e.g., "248 75% 44%").
 * This is required for shadcn/ui and Tailwind compatibility when using CSS variables.
 */
function normalizeHex(hex: string): string | null {
  let h = hex.replace(/^#/, '').trim();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) {
    return null;
  }
  return `#${h}`;
}

/**
 * WCAG 2.1 relative luminance (0 = black, 1 = white).
 */
function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0;

  const h = normalized.slice(1);
  const rs = parseInt(h.slice(0, 2), 16) / 255;
  const gs = parseInt(h.slice(2, 4), 16) / 255;
  const bs = parseInt(h.slice(4, 6), 16) / 255;

  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = lin(rs);
  const G = lin(gs);
  const B = lin(bs);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Light background → dark text hex; dark background → white. */
function contrastingForegroundHex(backgroundHex: string): '#ffffff' | '#0f172a' {
  const L = relativeLuminance(backgroundHex);
  return L > 0.55 ? '#0f172a' : '#ffffff';
}

function hexToHSLValues(hex: string): string {
  // Remove '#' if present
  hex = hex.replace(/^#/, '');

  // Handle shorthand hex colors (e.g. #03F)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/i.test(hex)) {
    return '0 0% 100%';
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
    tenantName: branding?.long_name || branding?.short_name || '360IQ',
    shortName: branding?.short_name || '360IQ',
    tagline: branding?.tagline || '',
    settings: config?.settings || {},
  };
}

/**
 * Applies the current tenant's branding colors as CSS custom properties on
 * `document.documentElement`. Only colours the tenant actually supplies are written:
 * inline styles beat the stylesheet, so writing defaults would override the ink theme.
 */
export function useTenantBrandingEffect() {
  const branding = useTenantStore((state) => state.currentTenantConfig)?.branding;
  const primary = branding?.primary_color;
  const secondary = branding?.secondary_color;
  const accent = branding?.accent_color;
  const destructive = branding?.destructive_color;
  const success = branding?.success_color;

  useEffect(() => {
    const root = document.documentElement.style;
    const applied: string[] = [];
    const set = (name: string, value: string) => {
      root.setProperty(name, value);
      applied.push(name);
    };

    // Helper function to darken a hex color
    const darkenHex = (hex: string, percent: number): string => {
      const num = parseInt(hex.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = (num >> 8 & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;
      return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    // Helper function to create alpha version
    const alphaHex = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // 1. Set Hex Variables (for raw usage)
    if (primary) {
      const primaryFgHex = contrastingForegroundHex(primary);
      set('--tenant-primary', primary);
      set('--tenant-primary-hover', darkenHex(primary, 10));
      set('--tenant-primary-light', alphaHex(primary, 0.12));
      set('--tenant-primary-fg', primaryFgHex);
      // Link to standard shadcn variables
      const hsl = hexToHSLValues(primary);
      set('--primary', hsl);
      set('--primary-foreground', hexToHSLValues(primaryFgHex));
      set('--sidebar', hsl);
      set('--ring', hsl);
    }
    if (secondary) {
      const secondaryFgHex = contrastingForegroundHex(secondary);
      set('--tenant-secondary', secondary);
      set('--tenant-secondary-hover', darkenHex(secondary, 10));
      set('--tenant-secondary-fg', secondaryFgHex);
      // Link to standard shadcn variables
      const hsl = hexToHSLValues(secondary);
      set('--secondary', hsl);
      set('--secondary-foreground', hexToHSLValues(secondaryFgHex));
      set('--sidebar-primary', hsl);
      set('--sidebar-primary-foreground', hexToHSLValues(secondaryFgHex));
    }
    if (accent) {
      set('--tenant-accent', accent);
    }
    if (destructive) {
      set('--tenant-destructive', destructive);
      set('--destructive', hexToHSLValues(destructive));
    }
    if (success) {
      set('--tenant-success', success);
    }

    // Switching tenants must not leave the previous tenant's colours behind.
    return () => applied.forEach((name) => root.removeProperty(name));
  }, [primary, secondary, accent, destructive, success]);
}
