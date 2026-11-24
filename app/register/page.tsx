"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { api, ApiError, extractList } from "@/lib/api-client";
import { formatCurrency, slugify } from "@/lib/format";
import type { PaginatedResponse, SubscriptionPlan, Tenant } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

export default function RegisterErpAccountPage() {
  const router = useRouter();
  const toast = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null);

  const [form, setForm] = useState({
    tenant_name: "",
    tenant_slug: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    tax_id: "",
    br_number: "",
    address: "",
    subscription_plan: "1",
    admin_username: "",
    admin_password: "",
    base_currency: "LKR",
  });

  useEffect(() => {
    api
      .get<PaginatedResponse<SubscriptionPlan> | SubscriptionPlan[]>(
        "/api/platform/plans/",
        undefined,
        true
      )
      .then((res) => {
        const list = extractList(res).items;
        setPlans(list);
        if (list[0]?.id) {
          setForm((prev) => ({ ...prev, subscription_plan: String(list[0].id) }));
        }
      })
      .catch(() => {
        // Plans endpoint may require auth in some deployments; keep manual Plan ID input
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        subscription_plan: Number(form.subscription_plan) || 1,
      };
      const tenant = await api.post<Tenant>(
        "/api/auth/register-erp-account/",
        payload,
        true
      );
      setCreatedTenant(tenant);
      toast.success("Bizzrious ERP Tenant Created!", `Account ${tenant.name} is ready.`);
    } catch (err) {
      toast.error(
        "Registration failed",
        err instanceof ApiError ? err.message : "Could not create tenant account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none";

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bizzrious-logo.png"
              alt="Bizzrious"
              className="h-11 w-11 rounded-full object-contain"
            />
            <div>
              <h1 className="text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
                Register Bizzrious ERP Account
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Provision a new multi-tenant ERP workspace via /api/auth/register-erp-account/
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        {createdTenant ? (
          <Card className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Tenant Organization Onboarded
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Next step: Platform Admin verifies subscription payment via /api/platform/tenants/
                  {createdTenant.id}/record-payment/.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
                <p className="text-[var(--text-muted)]">Tenant Name</p>
                <p className="mt-1 font-semibold">{createdTenant.name}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
                <p className="text-[var(--text-muted)]">Slug</p>
                <p className="mt-1 font-mono">{createdTenant.slug}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
                <p className="text-[var(--text-muted)]">Status</p>
                <div className="mt-1">
                  <Badge status={createdTenant.subscription_status}>
                    {createdTenant.subscription_status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => router.push("/login")}>
                Sign In as {form.admin_username}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {plans.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Select SaaS Subscription Plan
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {plans.map((p) => {
                      const selected = form.subscription_plan === String(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, subscription_plan: String(p.id) }))
                          }
                          className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                            selected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] ring-2 ring-[var(--brand-primary)]/20"
                              : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{p.name}</span>
                            <Badge tone="neutral">{p.billing_cycle}</Badge>
                          </div>
                          <p className="mt-1 font-mono text-base font-bold text-[var(--brand-primary)]">
                            {formatCurrency(p.price, p.currency)}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                            Up to {p.max_companies} co • {p.max_branches} branches • {p.max_users} users
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Organization / Tenant Name *
                  </label>
                  <input
                    required
                    value={form.tenant_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((p) => ({
                        ...p,
                        tenant_name: val,
                        tenant_slug: slugify(val),
                      }));
                    }}
                    placeholder="Bizzrious Retail Group (Pvt) Ltd"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Tenant Slug *
                  </label>
                  <input
                    required
                    value={form.tenant_slug}
                    onChange={(e) => setForm((p) => ({ ...p, tenant_slug: e.target.value }))}
                    placeholder="bizzrious-retail-group"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Owner Full Name *
                  </label>
                  <input
                    required
                    value={form.owner_name}
                    onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))}
                    placeholder="Kasun Perera"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.owner_email}
                    onChange={(e) => setForm((p) => ({ ...p, owner_email: e.target.value }))}
                    placeholder="owner@bizzrious.lk"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Owner Phone
                  </label>
                  <input
                    value={form.owner_phone}
                    onChange={(e) => setForm((p) => ({ ...p, owner_phone: e.target.value }))}
                    placeholder="+94771234567"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Base Currency *
                  </label>
                  <select
                    value={form.base_currency}
                    onChange={(e) => setForm((p) => ({ ...p, base_currency: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="LKR">LKR — Sri Lankan Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    TIN Number
                  </label>
                  <input
                    value={form.tax_id}
                    onChange={(e) => setForm((p) => ({ ...p, tax_id: e.target.value }))}
                    placeholder="TIN-100200300"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    BR Number
                  </label>
                  <input
                    value={form.br_number}
                    onChange={(e) => setForm((p) => ({ ...p, br_number: e.target.value }))}
                    placeholder="PV-88990"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Business Address
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="No. 42, World Trade Center, Colombo 01, Sri Lanka"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    System Admin Username *
                  </label>
                  <input
                    required
                    value={form.admin_username}
                    onChange={(e) => setForm((p) => ({ ...p, admin_username: e.target.value }))}
                    placeholder="kasun_admin"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    System Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={form.admin_password}
                    onChange={(e) => setForm((p) => ({ ...p, admin_password: e.target.value }))}
                    placeholder="StrongPassword123!"
                    className={inputCls}
                  />
                </div>

                {plans.length === 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Subscription Plan ID *
                    </label>
                    <input
                      type="number"
                      required
                      value={form.subscription_plan}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, subscription_plan: e.target.value }))
                      }
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" loading={submitting}>
                  <Building2 className="h-4 w-4" />
                  Create Tenant ERP Account
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
