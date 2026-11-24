"use client";

import React, { useState } from "react";
import { CheckCircle2, Globe, Moon, Save, Server, Sun, User } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Badge, Button, Card } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

export default function SettingsPage() {
  const {
    user,
    companies,
    branches,
    activeCompanyId,
    activeBranchId,
    setActiveCompanyId,
    setActiveBranchId,
    theme,
    setTheme,
    apiBaseUrl,
    updateApiBaseUrl,
    refreshSession,
  } = useAuth();
  const toast = useToast();

  const [profileDraft, setProfileDraft] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [serverDraft, setServerDraft] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const profile = {
    first_name: profileDraft.first_name ?? user?.first_name ?? "",
    last_name: profileDraft.last_name ?? user?.last_name ?? "",
    email: profileDraft.email ?? user?.email ?? "",
    phone: profileDraft.phone ?? user?.phone ?? "",
  };
  const serverUrl = serverDraft ?? apiBaseUrl;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch("/api/users/me/", profile);
      await refreshSession();
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to update profile", err instanceof Error ? err.message : "Error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTestServer = async () => {
    updateApiBaseUrl(serverUrl);
    setTesting(true);
    try {
      await api.get("/api/users/me/");
      toast.success("Connected to Bizzrious ERP API", serverUrl);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 502 && err.status !== 504) {
        toast.info("API Server Reached", `Server responded with HTTP ${err.status}`);
      } else {
        toast.warning(
          "Saved API URL (Server unreachable)",
          err instanceof Error ? err.message : serverUrl
        );
      }
    } finally {
      setTesting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm text-[var(--text-primary)]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Workspace Settings & API Connection
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your profile, default company/branch scope, Light/Dark appearance, and backend REST API target.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Profile */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <User className="h-4 w-4 text-[var(--brand-primary)]" />
              My Profile
            </h2>
            {user && <Badge tone="brand">{user.role}</Badge>}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  First Name
                </label>
                <input
                  value={profile.first_name}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, first_name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Last Name
                </label>
                <input
                  value={profile.last_name}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, last_name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Phone
                </label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            <Button type="submit" loading={savingProfile}>
              <Save className="h-4 w-4" />
              Update Profile
            </Button>
          </form>
        </Card>

        {/* Appearance & Default Scope */}
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-bold">Appearance & Default Scope</h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Interface Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${
                  theme === "light"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-text)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${
                  theme === "dark"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-text)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark Mode
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Default Company
              </label>
              <select
                value={activeCompanyId ?? ""}
                onChange={(e) =>
                  setActiveCompanyId(e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls}
              >
                <option value="">All / Auto</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Default Branch
              </label>
              <select
                value={activeBranchId ?? ""}
                onChange={(e) =>
                  setActiveBranchId(e.target.value ? Number(e.target.value) : null)
                }
                className={inputCls}
              >
                <option value="">All / Auto</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Backend API Connection */}
        <Card className="p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Server className="h-4 w-4 text-[var(--brand-primary)]" />
                Backend REST API Server Configuration
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Proxied securely via Next.js /api/erp/ route handler with trailing slash preservation.
              </p>
            </div>
            <Badge tone="success">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerDraft(e.target.value)}
              placeholder="https://erp.devrious.lk/api"
              className={`${inputCls} flex-1 font-mono`}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setServerDraft("https://erp.devrious.lk/api")}
              >
                <Globe className="h-4 w-4" />
                erp.devrious.lk
              </Button>
              <Button
                variant="outline"
                onClick={() => setServerDraft("http://127.0.0.1:8000/api")}
              >
                127.0.0.1:8000
              </Button>
              <Button loading={testing} onClick={handleTestServer}>
                Save & Test Connection
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
