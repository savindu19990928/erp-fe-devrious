"use client";

import type { PaginatedResponse } from "./types";

export const TOKEN_STORAGE_KEY = "bizzrious_access_token";
export const REFRESH_STORAGE_KEY = "bizzrious_refresh_token";
export const API_BASE_STORAGE_KEY = "bizzrious_api_base";

export const DEFAULT_PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://erp.devrious.lk/api";

export class ApiError extends Error {
  status: number;
  data: unknown;
  isDiscontinued: boolean;
  isBanned: boolean;
  isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    data: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    const text = message.toLowerCase();
    this.isDiscontinued =
      status === 403 &&
      (text.includes("discontinu") || text.includes("overdue") || text.includes("subscription"));
    this.isBanned = status === 403 && text.includes("ban");
    this.isNetworkError = status === 502 || status === 504;
  }
}

export function getStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: window.localStorage.getItem(TOKEN_STORAGE_KEY),
    refresh: window.localStorage.getItem(REFRESH_STORAGE_KEY),
  };
}

export function setStoredTokens(access: string, refresh?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, access);
  if (refresh) {
    window.localStorage.setItem(REFRESH_STORAGE_KEY, refresh);
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_STORAGE_KEY);
}

export function getStoredApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_PUBLIC_API_BASE;
  return window.localStorage.getItem(API_BASE_STORAGE_KEY) || DEFAULT_PUBLIC_API_BASE;
}

export function setStoredApiBase(url: string): void {
  if (typeof window === "undefined") return;
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) {
    window.localStorage.removeItem(API_BASE_STORAGE_KEY);
  } else {
    window.localStorage.setItem(API_BASE_STORAGE_KEY, trimmed);
  }
}

export function parseDrfError(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail;
    if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
    if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
    if (Array.isArray(obj.non_field_errors) && obj.non_field_errors.length > 0) {
      return obj.non_field_errors.map(String).join(" ");
    }
    const parts: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        parts.push(`${key}: ${val.map(String).join(", ")}`);
      } else if (typeof val === "string") {
        parts.push(`${key}: ${val}`);
      }
    }
    if (parts.length > 0) return parts.join(" • ");
  }
  return fallback;
}

function buildProxyUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  let clean = endpoint.trim();
  if (clean.startsWith("/api/")) {
    clean = clean.slice(5);
  } else if (clean.startsWith("/")) {
    clean = clean.slice(1);
  }

  const [pathOnly, existingQuery] = clean.split("?");
  const normalizedPath = pathOnly.endsWith("/") ? pathOnly : `${pathOnly}/`;
  const sp = new URLSearchParams(existingQuery || "");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        sp.set(k, String(v));
      }
    }
  }
  const qs = sp.toString();
  return `/api/erp/${normalizedPath}${qs ? `?${qs}` : ""}`;
}

let inFlightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const { refresh } = getStoredTokens();
    if (!refresh) return null;

    try {
      const customBase = getStoredApiBase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (customBase && customBase !== DEFAULT_PUBLIC_API_BASE) {
        headers["x-bizzrious-api-base"] = customBase;
      }

      const res = await fetch(buildProxyUrl("/api/auth/refresh/"), {
        method: "POST",
        headers,
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        clearStoredTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bizzrious:auth-expired"));
        }
        return null;
      }

      const json = (await res.json()) as { access?: string; refresh?: string };
      if (!json.access) {
        clearStoredTokens();
        return null;
      }
      setStoredTokens(json.access, json.refresh);
      return json.access;
    } catch {
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  isMultipart?: boolean;
  headers?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    params,
    skipAuth = false,
    isMultipart = false,
    headers: extraHeaders = {},
  } = options;

  const url = buildProxyUrl(endpoint, params);
  const execute = async (tokenOverride?: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...extraHeaders,
    };

    if (!isMultipart && body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const customBase = getStoredApiBase();
    if (customBase && customBase !== DEFAULT_PUBLIC_API_BASE) {
      headers["x-bizzrious-api-base"] = customBase;
    }

    if (!skipAuth) {
      const token = tokenOverride ?? getStoredTokens().access;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      cache: "no-store",
    });
  };

  let res = await execute();

  if (res.status === 401 && !skipAuth && !endpoint.includes("/auth/login")) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await execute(newAccess);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg = parseDrfError(parsed, `Request failed with status ${res.status}`);
    throw new ApiError(msg, res.status, parsed);
  }

  return parsed as T;
}

export function extractList<T = Record<string, unknown>>(
  data: PaginatedResponse<T> | T[] | null | undefined
): { items: T[]; count: number; next: string | null; previous: string | null } {
  if (!data) return { items: [], count: 0, next: null, previous: null };
  if (Array.isArray(data)) {
    return { items: data, count: data.length, next: null, previous: null };
  }
  const results = Array.isArray(data.results) ? data.results : [];
  return {
    items: results,
    count: typeof data.count === "number" ? data.count : results.length,
    next: data.next ?? null,
    previous: data.previous ?? null,
  };
}

export const api = {
  get: <T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    skipAuth = false
  ) => apiFetch<T>(endpoint, { method: "GET", params, skipAuth }),
  post: <T = unknown>(endpoint: string, body?: unknown, skipAuth = false) =>
    apiFetch<T>(endpoint, { method: "POST", body, skipAuth }),
  put: <T = unknown>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: "PUT", body }),
  patch: <T = unknown>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: "PATCH", body }),
  delete: <T = unknown>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: "DELETE" }),
  upload: <T = unknown>(endpoint: string, formData: FormData) =>
    apiFetch<T>(endpoint, { method: "POST", body: formData, isMultipart: true }),
};
