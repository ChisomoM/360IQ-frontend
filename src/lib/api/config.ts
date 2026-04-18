/**
 * Centralized API configuration — single source of truth for backend URL.
 * Reads VITE_BACKEND_URL from .env files during build.
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8032/api/v1/';
