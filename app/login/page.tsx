"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      toast.success("Signed in to Bizzrious ERP");
      router.replace("/");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Authentication failed. Please verify credentials and try again.";
      setErrorBanner(msg);
      toast.error("Sign in failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Brand Showcase */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#0D1117] px-6 py-10 text-white sm:px-12 lg:w-[46%] lg:py-14">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#DC1E28]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#DC1E28]/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bizzrious-logo.png"
            alt="Bizzrious"
            className="h-12 w-12 rounded-full object-contain shadow-lg"
          />
          <div>
            <span className="text-2xl font-extrabold tracking-tight">Bizzrious</span>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              All-in-One Multi-Tenant ERP
            </p>
          </div>
        </div>

        <div className="relative z-10 my-10 space-y-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Unified Enterprise Operations, Finance &amp; Logistics.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-300">
            Built for multi-branch enterprises: Sri Lanka VAT/SVAT &amp; RAMIS e-invoicing,
            EPF/ETF/APIT payroll, hierarchical warehouse inventory, POS, e-commerce,
            GPS fleet telematics, and SLA service desk.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            {[
              "Finance & RAMIS E-Invoicing",
              "HR & EPF/ETF/APIT Payroll",
              "Warehouse, Barcode & MRP",
              "POS, E-Commerce & Fleet GPS",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-slate-200"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#DC1E28]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-5 text-xs text-slate-400">
          <span>Bizzrious Enterprise Platform</span>
          <span>JWT Bearer Auth • Multi-Tenant Isolated</span>
        </div>
      </div>

      {/* Right Sign-In Form */}
      <div className="flex flex-1 flex-col justify-center bg-[var(--bg-canvas)] px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Sign in to your workspace
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Enter your Bizzrious ERP credentials to continue.
            </p>
          </div>

          {errorBanner && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs leading-relaxed text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
              {errorBanner}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or kasun_admin"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Sign In to Bizzrious ERP
            </Button>
          </form>

          <p className="text-center text-xs text-[var(--text-muted)]">
            Contact your Bizzrious Platform Administrator for organization provisioning.
          </p>
        </div>
      </div>
    </div>
  );
}
