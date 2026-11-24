"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  CreditCard,
  Headphones,
  Landmark,
  Package,
  QrCode,
  RefreshCw,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, extractList } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { FinanceStatements } from "@/lib/types";
import { Badge, Button, Card, StatCard } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

export default function ExecutiveDashboardPage() {
  const { user, activeCompanyId, companies, isAuditor } = useAuth();
  const toast = useToast();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<FinanceStatements | null>(null);
  const [invAnalytics, setInvAnalytics] = useState<Record<string, unknown> | null>(null);
  const [sdMetrics, setSdMetrics] = useState<Record<string, unknown> | null>(null);
  const [approvals, setApprovals] = useState<Record<string, unknown>[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<Record<string, unknown>[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<Record<string, unknown>[]>([]);

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const currency = activeCompany?.base_currency || "LKR";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const [finRes, invRes, sdRes, wfRes, roRes, expRes] = await Promise.allSettled([
      api.get<FinanceStatements>(
        "/api/finance/reports/statements/",
        activeCompanyId ? { company: activeCompanyId } : undefined
      ),
      api.get<Record<string, unknown>>("/api/inventory/analytics/"),
      api.get<Record<string, unknown>>("/api/service-desk/metrics/"),
      api.get("/api/workflows/requests/", { status: "PENDING" }),
      api.get("/api/inventory/stock-levels/reorder-alerts/"),
      api.get("/api/inventory/batch-serials/expiry-alerts/", { days: 60 }),
    ]);

    if (finRes.status === "fulfilled") setStatements(finRes.value);
    if (invRes.status === "fulfilled") setInvAnalytics(invRes.value);
    if (sdRes.status === "fulfilled") setSdMetrics(sdRes.value);
    if (wfRes.status === "fulfilled") setApprovals(extractList(wfRes.value as never).items);
    if (roRes.status === "fulfilled") setReorderAlerts(extractList(roRes.value as never).items);
    if (expRes.status === "fulfilled") setExpiryAlerts(extractList(expRes.value as never).items);
    setLoading(false);
  }, [activeCompanyId]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get<FinanceStatements>(
        "/api/finance/reports/statements/",
        activeCompanyId ? { company: activeCompanyId } : undefined
      ),
      api.get<Record<string, unknown>>("/api/inventory/analytics/"),
      api.get<Record<string, unknown>>("/api/service-desk/metrics/"),
      api.get("/api/workflows/requests/", { status: "PENDING" }),
      api.get("/api/inventory/stock-levels/reorder-alerts/"),
      api.get("/api/inventory/batch-serials/expiry-alerts/", { days: 60 }),
    ]).then(([finRes, invRes, sdRes, wfRes, roRes, expRes]) => {
      if (!active) return;
      if (finRes.status === "fulfilled") setStatements(finRes.value);
      if (invRes.status === "fulfilled") setInvAnalytics(invRes.value);
      if (sdRes.status === "fulfilled") setSdMetrics(sdRes.value);
      if (wfRes.status === "fulfilled") setApprovals(extractList(wfRes.value as never).items);
      if (roRes.status === "fulfilled") setReorderAlerts(extractList(roRes.value as never).items);
      if (expRes.status === "fulfilled") setExpiryAlerts(extractList(expRes.value as never).items);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [activeCompanyId]);

  const handleApproval = async (id: unknown, decision: "approve" | "reject") => {
    try {
      await api.post(`/api/workflows/requests/${id}/${decision}/`, {});
      toast.success(`Request #${String(id)} ${decision === "approve" ? "approved" : "rejected"}`);
      void loadDashboard();
    } catch (err) {
      toast.error("Approval action failed", err instanceof Error ? err.message : "Error");
    }
  };

  const pnl = statements?.income_statement_pnl;
  const bs = statements?.balance_sheet;
  const aging = statements?.aging_summary;

  const financeChartData = statements
    ? [
        { name: "Revenue", amount: Number(pnl?.total_revenue || 0) },
        { name: "Expenses", amount: Number(pnl?.total_expenses || 0) },
        { name: "Net Profit", amount: Number(pnl?.net_profit_or_loss || 0) },
        { name: "Total Assets", amount: Number(bs?.total_assets || 0) },
        { name: "Liabilities", amount: Number(bs?.total_liabilities || 0) },
      ]
    : [];

  const invVal =
    invAnalytics?.total_stock_valuation ??
    invAnalytics?.total_inventory_value ??
    0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            Bizzrious Executive Command
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Welcome back, {user?.first_name || user?.username}. Real-time operational
            summary{activeCompany ? ` for ${activeCompany.name}` : ""}.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadDashboard()}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh KPIs
        </Button>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net Profit (P&L)"
          value={pnl ? formatCurrency(pnl.net_profit_or_loss, currency) : "—"}
          subtext={
            pnl
              ? `Rev ${formatCurrency(pnl.total_revenue, currency)} • Exp ${formatCurrency(pnl.total_expenses, currency)}`
              : "Connect Finance module for live P&L"
          }
          icon={Landmark}
          tone="success"
        />
        <StatCard
          label="Inventory Valuation"
          value={
            invAnalytics
              ? formatCurrency(invVal as string | number, currency)
              : "—"
          }
          subtext={`${reorderAlerts.length} reorder alerts • ${expiryAlerts.length} expiring batches (60d)`}
          icon={Package}
          tone="info"
        />
        <StatCard
          label="Service Desk & CSAT"
          value={
            sdMetrics?.total_tickets !== undefined
              ? `${String(sdMetrics.total_tickets)} Tickets`
              : "—"
          }
          subtext={
            sdMetrics
              ? `Escalated: ${String(sdMetrics.escalated_tickets ?? 0)} • Avg CSAT: ${String(sdMetrics.average_csat ?? "—")}`
              : "SLA escalation & support metrics"
          }
          icon={Headphones}
          tone="warning"
        />
        <StatCard
          label="Pending Approvals"
          value={approvals.length}
          subtext={
            aging
              ? `AR ${formatCurrency(aging.accounts_receivable_outstanding, currency)} • AP ${formatCurrency(aging.accounts_payable_outstanding, currency)}`
              : "Workflow approval queue"
          }
          icon={AlertTriangle}
          tone={approvals.length > 0 ? "brand" : "neutral"}
        />
      </div>

      {/* Quick Launchpad */}
      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Quick Module Launchpad
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: "/pos", label: "POS Terminal", icon: ShoppingCart },
            { href: "/finance?tab=customer-invoices", label: "Tax Invoice & RAMIS", icon: Landmark },
            { href: "/hr", label: "EPF/ETF/APIT Calc", icon: Calculator },
            { href: "/inventory", label: "Barcode Scanner", icon: QrCode },
            { href: "/fleet", label: "Route Optimizer", icon: Truck },
            { href: "/platform", label: "SaaS Billing", icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]"
              >
                <span className="flex items-center gap-2 truncate">
                  <Icon className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                  <span className="truncate">{item.label}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)]" />
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Main Analytics + Action Queues */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Financial Position Overview
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Live figures from /api/finance/reports/statements/
              </p>
            </div>
            <Link
              href="/finance"
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Open Statements →
            </Link>
          </div>
          <div className="h-64 w-full">
            {mounted && financeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#dc1e28" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                {loading
                  ? "Loading live financial statements..."
                  : "Post journals or issue invoices in Finance to populate statement charts."}
              </div>
            )}
          </div>
        </Card>

        {/* Pending Approvals Queue */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Pending Approvals
            </h2>
            <Link
              href="/governance"
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              All →
            </Link>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {approvals.length === 0 ? (
              <p className="py-10 text-center text-xs text-[var(--text-muted)]">
                No pending workflow approvals.
              </p>
            ) : (
              approvals.slice(0, 6).map((req) => (
                <div
                  key={String(req.id)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold">
                      {String(req.reference_code)}
                    </span>
                    <Badge status={req.required_role}>{String(req.required_role)}</Badge>
                  </div>
                  <p className="mt-1 text-[var(--text-secondary)]">
                    {String(req.target_model)} •{" "}
                    <span className="font-mono font-semibold">
                      {formatCurrency(req.amount as string, currency)}
                    </span>
                  </p>
                  {!isAuditor && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => void handleApproval(req.id, "approve")}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => void handleApproval(req.id, "reject")}
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Operational Alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Low-Stock Reorder Alerts
            </h2>
            <Link
              href="/inventory?tab=stock-levels"
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Manage Stock →
            </Link>
          </div>
          {reorderAlerts.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              All SKUs are above reorder points.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <tr>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3 text-right">On Hand</th>
                    <th className="py-2 text-right">Reorder Pt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {reorderAlerts.slice(0, 5).map((item) => (
                    <tr key={String(item.id)}>
                      <td className="py-2 pr-3 font-mono font-semibold">
                        {String(item.product_sku)}
                      </td>
                      <td className="py-2 pr-3">{String(item.product_name)}</td>
                      <td className="py-2 pr-3 text-right font-mono text-red-600 dark:text-red-400">
                        {formatNumber(item.on_hand as string)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatNumber(item.reorder_point as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              60-Day Batch Expiry Alerts
            </h2>
            <Link
              href="/inventory?tab=batches"
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Batch Traceability →
            </Link>
          </div>
          {expiryAlerts.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No batches expiring within the next 60 days.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <tr>
                    <th className="py-2 pr-3">Batch No.</th>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3 text-right">Qty</th>
                    <th className="py-2 text-right">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {expiryAlerts.slice(0, 5).map((b) => (
                    <tr key={String(b.id)}>
                      <td className="py-2 pr-3 font-mono font-semibold">
                        {String(b.batch_number)}
                      </td>
                      <td className="py-2 pr-3 font-mono">{String(b.product_sku)}</td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {formatNumber(b.quantity as string)}
                      </td>
                      <td className="py-2 text-right text-amber-700 dark:text-amber-300">
                        {formatDate(String(b.expiry_date || ""))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
