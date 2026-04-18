/**
 * ControlHub API helpers — thin wrappers around fetchData.
 *
 * These helpers inject the ControlHub token + default tenant ID so callers
 * don't have to pass overrides manually. No fetch logic is duplicated here.
 */

import { API } from "./end_points";
import { fetchData, type FetchOptions } from "./crud";
import { getControlHubToken } from "@/lib/context/auth";
import { BACKEND_URL } from "./config";

type CHEndpoint = keyof typeof API;

const chOptions = (): FetchOptions => ({
  token: getControlHubToken() ?? undefined,
  tenantId: import.meta.env.VITE_TENANT_ID || "dims",
  skipValidation: true,
});

export const chGet = (key: CHEndpoint, params: Record<string, string> = {}, query: Record<string, string> = {}) =>
  fetchData(key, "GET", params, null, query, {}, chOptions());

export const chPost = (key: CHEndpoint, data: unknown, params: Record<string, string> = {}) =>
  fetchData(key, "POST", params, data, {}, {}, chOptions());

export const chPatch = (key: CHEndpoint, data: unknown, params: Record<string, string> = {}) =>
  fetchData(key, "PATCH", params, data, {}, {}, chOptions());

export const chDelete = (key: CHEndpoint, params: Record<string, string> = {}) =>
  fetchData(key, "DELETE", params, null, {}, {}, chOptions());

/**
 * Upload a logo file for a tenant branding
 * @param tenantId - The tenant ID 
 * @param file - The File object to upload
 * @returns Promise resolving to {logo_url: string}
 */
export const chUploadBrandingLogo = async (tenantId: string, file: File) => {
  const formData = new FormData();
  formData.append("logo", file);

  const url = `${BACKEND_URL}controlhub/clients/${tenantId}/branding/logo`;
  const token = getControlHubToken();

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": "dims",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || "Failed to upload logo");
  }

  const data = await response.json();
  return data?.data || data;
};
