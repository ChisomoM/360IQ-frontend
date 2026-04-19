/**
 * Centralized API configuration — single source of truth for backend URL.
 * Reads VITE_BACKEND_URL from .env files during build.
 */
// TEMP: hardcoded to debug env variable pickup issue
// export const BACKEND_URL = 'http://35.197.235.41/api/v1/';
export const BACKEND_URL = 'http://localhost:8032/api/v1/';

// export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://35.197.235.41/api/v1/';
// export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8032/api/v1/';
