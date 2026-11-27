"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearStoredTokens,
  extractList,
  getStoredTokens,
  setStoredTokens,
} from "./api-client";
import type {
  Branch,
  Company,
  NotificationItem,
  PaginatedResponse,
  Tenant,
  UserProfile,
} from "./types";

interface AuthContextValue {
  user: UserProfile | null;
  tenant: Tenant | null;
  companies: Company[];
  branches: Branch[];
  activeCompanyId: number | null;
  activeBranchId: number | null;
  notifications: NotificationItem[];
  theme: "light" | "dark";
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuditor: boolean;
  setActiveCompanyId: (id: number | null) => void;
  setActiveBranchId: (id: number | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const THEME_KEY = "bizzrious_theme";
const COMPANY_KEY = "bizzrious_active_company";
const BRANCH_KEY = "bizzrious_active_branch";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(null);
  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyThemeDom = useCallback((nextTheme: "light" | "dark") => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    if (nextTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const setTheme = useCallback(
    (nextTheme: "light" | "dark") => {
      setThemeState(nextTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_KEY, nextTheme);
      }
      applyThemeDom(nextTheme);
    },
    [applyThemeDom]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const setActiveCompanyId = useCallback((id: number | null) => {
    setActiveCompanyIdState(id);
    if (typeof window !== "undefined") {
      if (id === null) window.localStorage.removeItem(COMPANY_KEY);
      else window.localStorage.setItem(COMPANY_KEY, String(id));
    }
  }, []);

  const setActiveBranchId = useCallback((id: number | null) => {
    setActiveBranchIdState(id);
    if (typeof window !== "undefined") {
      if (id === null) window.localStorage.removeItem(BRANCH_KEY);
      else window.localStorage.setItem(BRANCH_KEY, String(id));
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const { access } = getStoredTokens();
    if (!access) {
      setUser(null);
      setTenant(null);
      setCompanies([]);
      setBranches([]);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.get<UserProfile>("/api/users/me/");
      setUser(me);

      const [compRes, branchRes, notifRes, tenantRes] = await Promise.allSettled([
        api.get<PaginatedResponse<Company> | Company[]>("/api/companies/"),
        api.get<PaginatedResponse<Branch> | Branch[]>("/api/branches/"),
        api.get<PaginatedResponse<NotificationItem> | NotificationItem[]>(
          "/api/notifications/"
        ),
        me.tenant ? api.get<Tenant>(`/api/platform/tenants/${me.tenant}/`) : Promise.resolve(null),
      ]);

      if (compRes.status === "fulfilled") {
        const list = extractList(compRes.value).items;
        setCompanies(list);
        const savedCo =
          typeof window !== "undefined"
            ? Number(window.localStorage.getItem(COMPANY_KEY))
            : 0;
        const matched =
          list.find((c) => c.id === savedCo)?.id ??
          me.company ??
          list[0]?.id ??
          null;
        setActiveCompanyIdState(matched);
      }

      if (branchRes.status === "fulfilled") {
        const list = extractList(branchRes.value).items;
        setBranches(list);
        const savedBr =
          typeof window !== "undefined"
            ? Number(window.localStorage.getItem(BRANCH_KEY))
            : 0;
        const matched =
          list.find((b) => b.id === savedBr)?.id ??
          me.branch ??
          list[0]?.id ??
          null;
        setActiveBranchIdState(matched);
      }

      if (notifRes.status === "fulfilled") {
        setNotifications(extractList(notifRes.value).items);
      }

      if (tenantRes.status === "fulfilled" && tenantRes.value) {
        setTenant(tenantRes.value);
      }
    } catch {
      clearStoredTokens();
      setUser(null);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof window !== "undefined") {
        const savedTheme =
          (window.localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ||
          "light";
        setThemeState(savedTheme);
        applyThemeDom(savedTheme);
      }
      void refreshSession();
    }, 0);
    return () => clearTimeout(id);
  }, [applyThemeDom, refreshSession]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setTenant(null);
    };
    window.addEventListener("bizzrious:auth-expired", onExpired);
    return () => window.removeEventListener("bizzrious:auth-expired", onExpired);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await api.post<{ access: string; refresh: string }>(
        "/api/auth/login/",
        { username, password },
        true
      );
      setStoredTokens(tokens.access, tokens.refresh);
      setIsLoading(true);
      await refreshSession();
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    const { refresh } = getStoredTokens();
    if (refresh) {
      try {
        await api.post("/api/auth/logout/", { refresh });
      } catch {
        // Proceed clearing tokens even if server reject/unreachable
      }
    }
    clearStoredTokens();
    setUser(null);
    setTenant(null);
    setCompanies([]);
    setBranches([]);
    setNotifications([]);
  }, []);

  const markNotificationRead = useCallback(async (id: number) => {
    await api.post(`/api/notifications/${id}/mark-read/`, {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tenant,
      companies,
      branches,
      activeCompanyId,
      activeBranchId,
      notifications,
      theme,
      isLoading,
      isAuthenticated: Boolean(user),
      isAuditor: user?.role === "AUDITOR",
      setActiveCompanyId,
      setActiveBranchId,
      setTheme,
      toggleTheme,
      login,
      logout,
      refreshSession,
      markNotificationRead,
    }),
    [
      user,
      tenant,
      companies,
      branches,
      activeCompanyId,
      activeBranchId,
      notifications,
      theme,
      isLoading,
      setActiveCompanyId,
      setActiveBranchId,
      setTheme,
      toggleTheme,
      login,
      logout,
      refreshSession,
      markNotificationRead,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
