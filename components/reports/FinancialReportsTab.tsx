"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Landmark, RefreshCw } from "lucide-react";
import {
  D3BarChart,
  D3DonutChart,
  D3StackedBarChart,
  D3TrendAreaChart,
} from "@/components/charts";
import { api, extractList } from "@/lib/api-client";
import { downloadCsv, downloadJson, formatCurrency } from "@/lib/format";
import type { FinanceStatements, PaginatedResponse } from "@/lib/types";
import { Badge, Button, Card, StatCard } from "@/components/ui/Primitives";

type Row = Record<string, unknown>;

export function FinancialReportsTab({
  companyId,
  currency,
}: {
  companyId: string;
  currency: string;
}) {
  const [statements, setStatements] = useState<FinanceStatements | null>(null);
  const [budgets, setBudgets] = useState<Row[]>([]);
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (cid: string) => {
    const params = cid ? { company: cid } : undefined;
    const [stRes, bgRes, invRes] = await Promise.allSettled([
      api.get<FinanceStatements>("/api/finance/reports/statements/", params),
      api.get<PaginatedResponse<Row> | Row[]>("/api/finance/budgets/", { page_size: 50, ...(params || {}) }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/finance/customer-invoices/", { page_size: 100, ...(params || {}) }),
    ]);
    return {
      statements: stRes.status === "fulfilled" ? stRes.value : null,
      budgets: bgRes.status === "fulfilled" ? extractList(bgRes.value).items : [],
      invoices: invRes.status === "fulfilled" ? extractList(invRes.value).items : [],
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAll(companyId).then((res) => {
      if (!active) return;
      setStatements(res.statements);
      setBudgets(res.budgets);
      setInvoices(res.invoices);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [companyId, fetchAll]);

  const refresh = async () => {
    setLoading(true);
    const res = await fetchAll(companyId);
    setStatements(res.statements);
    setBudgets(res.budgets);
    setInvoices(res.invoices);
    setLoading(false);
  };

  const pnl = statements?.income_statement_pnl;
  const bs = statements?.balance_sheet;
  const vat = statements?.sri_lanka_ird_vat_200_return;

  const statementBars = useMemo(() => {
    if (!statements) return [];
    const net = Number(pnl?.net_profit_or_loss || 0);
    return [
      { label: "Revenue", value: Number(pnl?.total_revenue || 0), color: "#2563eb" },
      { label: "Expenses", value: Number(pnl?.total_expenses || 0), color: "#d97706" },
      { label: "Net Profit", value: net, color: net >= 0 ? "#059669" : "#dc1e28" },
      { label: "Assets", value: Number(bs?.total_assets || 0), color: "#7c3aed" },
      { label: "Liabilities", value: Number(bs?.total_liabilities || 0), color: "#dc1e28" },
      { label: "Equity", value: Number(bs?.total_equity_plus_current_profit || 0), color: "#0891b2" },
    ];
  }, [bs?.total_assets, bs?.total_equity_plus_current_profit, bs?.total_liabilities, pnl?.net_profit_or_loss, pnl?.total_expenses, pnl?.total_revenue, statements]);

  const accountTypeDonut = useMemo(() => {
    const tb = statements?.trial_balance || [];
    const map = new Map<string, number>();
    for (const acc of tb) {
      map.set(acc.account_type, (map.get(acc.account_type) || 0) + Math.abs(Number(acc.balance) || 0));
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [statements]);

  const vatBars = useMemo(() => {
    if (!vat) return [];
    return [
      { label: "Output VAT", value: Number(vat.total_output_vat_collected || 0), color: "#dc1e28" },
      { label: "Input VAT Credit", value: Number(vat.total_allowable_input_vat_credit || 0), color: "#059669" },
      { label: "SVAT Supplies", value: Number(vat.suspended_vat_svat_supplies_value || 0), color: "#2563eb" },
      { label: "Net Payable IRD", value: Number(vat.net_vat_payable_to_ird || 0), color: "#d97706" },
    ];
  }, [vat]);

  const budgetRows = useMemo(
    () =>
      budgets.slice(0, 8).map((b) => ({
        label: `Acc #${String(b.account ?? b.id)} (${String(b.fiscal_year ?? "")})`,
        allocated: Number(b.allocated_amount || 0),
        committed: Number(b.committed_amount || 0),
        actual: Number(b.actual_spent || 0),
      })),
    [budgets]
  );

  const invoiceTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.invoice_type === "CREDIT_NOTE" || inv.status === "VOID") continue;
      const d = String(inv.invoice_date || "").slice(0, 10);
      if (!d) continue;
      byDate.set(d, (byDate.get(d) || 0) + (Number(inv.grand_total) || 0));
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }, [invoices]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-secondary)]">
          Live General Ledger statements, Sri Lanka IRD VAT 200 return, Budgets, and AR invoicing trend.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={!statements?.trial_balance?.length}
            onClick={() =>
              statements?.trial_balance &&
              downloadCsv(statements.trial_balance as unknown as Row[], "trial-balance.csv")
            }
          >
            <Download className="h-3.5 w-3.5" />
            Trial Balance CSV
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={!statements}
            onClick={() => statements && downloadJson(statements, "financial-statements.json")}
          >
            <Download className="h-3.5 w-3.5" />
            Statements JSON
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={pnl ? formatCurrency(pnl.total_revenue, currency) : "—"} icon={Landmark} tone="info" />
        <StatCard label="Net Profit / Loss" value={pnl ? formatCurrency(pnl.net_profit_or_loss, currency) : "—"} tone="success" />
        <StatCard label="Total Assets" value={bs ? formatCurrency(bs.total_assets, currency) : "—"} tone="neutral" />
        <StatCard label="Net VAT Payable (IRD 200)" value={vat ? formatCurrency(vat.net_vat_payable_to_ird, currency) : "—"} tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Income Statement &amp; Balance Sheet</h3>
          <D3BarChart data={statementBars} height={260} formatValue={(v) => formatCurrency(v, currency)} title="Financial Statements" />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Trial Balance by Account Class</h3>
          <D3DonutChart
            data={accountTypeDonut}
            size={200}
            centerLabel="Accounts"
            centerValue={String(statements?.trial_balance?.length || 0)}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Trial Balance Composition"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Sri Lanka IRD VAT 200 Summary</h3>
          <D3BarChart
            data={vatBars}
            orientation="horizontal"
            height={230}
            formatValue={(v) => formatCurrency(v, currency)}
            title="VAT 200 Summary"
            emptyText="Post invoices and vendor bills to populate VAT 200 metrics."
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">AR Invoice Revenue Timeline</h3>
          <D3TrendAreaChart
            data={invoiceTrend}
            height={230}
            color="#2563eb"
            formatValue={(v) => formatCurrency(v, currency)}
            title="Customer Invoice Revenue Trend"
            emptyText="No issued customer invoices found for trend visualization."
          />
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-bold">Budget Allocation vs Committed vs Actual Spend</h3>
        <D3StackedBarChart
          data={budgetRows}
          categoryKey="label"
          mode="grouped"
          height={260}
          formatValue={(v) => formatCurrency(v, currency)}
          series={[
            { key: "allocated", label: "Allocated", color: "#2563eb" },
            { key: "committed", label: "Committed", color: "#d97706" },
            { key: "actual", label: "Actual Spent", color: "#dc1e28" },
          ]}
          title="Budget Utilization"
          emptyText="Create budgets in Finance to track budget vs actual variance."
        />
      </Card>

      {statements?.trial_balance && statements.trial_balance.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 className="text-sm font-bold">Trial Balance Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Account Name</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {statements.trial_balance.map((acc) => (
                  <tr key={acc.code}>
                    <td className="px-4 py-2.5 font-mono font-semibold">{acc.code}</td>
                    <td className="px-4 py-2.5">{acc.name}</td>
                    <td className="px-4 py-2.5"><Badge status={acc.account_type}>{acc.account_type}</Badge></td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(acc.balance, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
