"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Landmark,
  Printer,
  RefreshCw,
} from "lucide-react";
import { D3BarChart, D3DonutChart } from "@/components/charts";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/format";
import {
  accountsResource,
  bankAccountsResource,
  budgetsResource,
  customerInvoicesResource,
  exchangeRatesResource,
  fiscalPeriodsResource,
  fixedAssetsResource,
  intercompanyResource,
  journalsResource,
  paymentsResource,
  vendorBillsResource,
} from "@/lib/resources";
import type { FinanceStatements } from "@/lib/types";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Badge, Button, Card, Modal, StatCard } from "@/components/ui/Primitives";

function FinancialStatementsView() {
  const { activeCompanyId, companies } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const companyFilter = selectedCompany || (activeCompanyId ? String(activeCompanyId) : "");
  const [statements, setStatements] = useState<FinanceStatements | null>(null);
  const [loading, setLoading] = useState(true);

  const company = companies.find((c) => String(c.id) === companyFilter);
  const currency = company?.base_currency || "LKR";

  const loadStatements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FinanceStatements>(
        "/api/finance/reports/statements/",
        companyFilter ? { company: companyFilter } : undefined
      );
      setStatements(data);
    } catch {
      setStatements(null);
    } finally {
      setLoading(false);
    }
  }, [companyFilter]);

  useEffect(() => {
    let active = true;
    api
      .get<FinanceStatements>(
        "/api/finance/reports/statements/",
        companyFilter ? { company: companyFilter } : undefined
      )
      .then((data) => {
        if (active) setStatements(data);
      })
      .catch(() => {
        if (active) setStatements(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [companyFilter]);

  const pnl = statements?.income_statement_pnl;
  const bs = statements?.balance_sheet;
  const aging = statements?.aging_summary;
  const vat200 = statements?.sri_lanka_ird_vat_200_return;

  const chartData = useMemo(() => {
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

  const trialDonutData = useMemo(() => {
    if (!statements?.trial_balance?.length) return [];
    const grouped = new Map<string, number>();
    for (const acc of statements.trial_balance) {
      const k = acc.account_type || "OTHER";
      grouped.set(k, (grouped.get(k) || 0) + Math.abs(Number(acc.balance) || 0));
    }
    return Array.from(grouped.entries()).map(([label, value]) => ({ label, value }));
  }, [statements]);

  return (
    <div className="space-y-5">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">
            Real-Time Financial Statements & Sri Lanka IRD VAT 200 Return
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Live Trial Balance, Income Statement (P&L), Balance Sheet, AR/AP Aging, and VAT 200 schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {companies.length > 0 && (
            <select
              value={companyFilter}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" variant="outline" onClick={() => void loadStatements()}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={pnl ? formatCurrency(pnl.total_revenue, currency) : "—"}
          subtext={`Expenses: ${pnl ? formatCurrency(pnl.total_expenses, currency) : "—"}`}
          tone="info"
        />
        <StatCard
          label="Net Profit / Loss"
          value={pnl ? formatCurrency(pnl.net_profit_or_loss, currency) : "—"}
          tone="success"
        />
        <StatCard
          label="Total Assets"
          value={bs ? formatCurrency(bs.total_assets, currency) : "—"}
          subtext={`Liabilities: ${bs ? formatCurrency(bs.total_liabilities, currency) : "—"}`}
          tone="neutral"
        />
        <StatCard
          label="AR vs AP Outstanding"
          value={aging ? formatCurrency(aging.accounts_receivable_outstanding, currency) : "—"}
          subtext={`Payable: ${aging ? formatCurrency(aging.accounts_payable_outstanding, currency) : "—"}`}
          tone="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Statement Visual Breakdown (D3.js)</h3>
          <D3BarChart
            data={chartData}
            height={256}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Financial Statement Visual Breakdown"
            emptyText="No financial statement figures yet."
          />
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Trial Balance Composition by Type</h3>
          <D3DonutChart
            data={trialDonutData}
            size={195}
            centerLabel="Accounts"
            centerValue={String(statements?.trial_balance?.length || 0)}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Trial Balance Composition"
            emptyText="Post entries to populate Trial Balance chart."
          />
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-bold">Sri Lanka IRD VAT 200 Return Summary</h3>
        {vat200 ? (
          <div className="divide-y divide-[var(--border-subtle)] text-xs">
            {Object.entries(vat200).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5">
                <span className="capitalize text-[var(--text-secondary)]">
                  {k.replace(/_/g, " ")}
                </span>
                <span className="font-mono font-bold">
                  {typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v))
                    ? String(v)
                    : String(v)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-xs text-[var(--text-muted)]">
            VAT 200 return data will populate once invoices/bills are posted.
          </p>
        )}
      </Card>

      {statements?.trial_balance && statements.trial_balance.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 className="text-sm font-bold">Trial Balance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-2.5">GL Code</th>
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
                    <td className="px-4 py-2.5">
                      <Badge status={acc.account_type}>{acc.account_type}</Badge>
                    </td>
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

export default function FinancePage() {
  const [printInvoice, setPrintInvoice] = useState<Record<string, unknown> | null>(null);

  return (
    <>
      <ModuleTabShell
        title="Finance, Accounting & Sri Lanka Tax Compliance"
        subtitle="General Ledger, AR Tax/SVAT Invoices, RAMIS E-Invoicing, Vendor Bills, Bank Reconciliation, Fixed Assets & Budgets."
        tabs={[
          {
            id: "statements",
            label: "Statements & VAT 200",
            icon: Landmark,
            content: <FinancialStatementsView />,
          },
          {
            id: "customer-invoices",
            label: "Customer Invoices",
            icon: FileText,
            content: (
              <ResourceWorkspace
                config={customerInvoicesResource}
                renderDetailExtra={(row) => (
                  <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                    <Button size="sm" variant="primary" onClick={() => setPrintInvoice(row)}>
                      <Printer className="h-4 w-4" />
                      Open Printable Sri Lanka Statutory Invoice
                    </Button>
                  </div>
                )}
              />
            ),
          },
          { id: "journals", label: "GL Journals", content: <ResourceWorkspace config={journalsResource} /> },
          { id: "accounts", label: "Chart of Accounts", content: <ResourceWorkspace config={accountsResource} /> },
          { id: "vendor-bills", label: "Vendor Bills (AP)", content: <ResourceWorkspace config={vendorBillsResource} /> },
          { id: "bank-accounts", label: "Bank & Cash", content: <ResourceWorkspace config={bankAccountsResource} /> },
          { id: "payments", label: "Payments", content: <ResourceWorkspace config={paymentsResource} /> },
          { id: "fixed-assets", label: "Fixed Assets", content: <ResourceWorkspace config={fixedAssetsResource} /> },
          { id: "budgets", label: "Budgets", content: <ResourceWorkspace config={budgetsResource} /> },
          { id: "fiscal-periods", label: "Fiscal Periods", content: <ResourceWorkspace config={fiscalPeriodsResource} /> },
          { id: "exchange-rates", label: "Exchange Rates", content: <ResourceWorkspace config={exchangeRatesResource} /> },
          { id: "intercompany", label: "Inter-Company", content: <ResourceWorkspace config={intercompanyResource} /> },
        ]}
      />

      {/* Printable Sri Lanka Statutory Tax Invoice Modal */}
      <Modal
        open={Boolean(printInvoice)}
        onClose={() => setPrintInvoice(null)}
        title="Sri Lanka Statutory Tax Invoice Preview"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
            <Button onClick={() => setPrintInvoice(null)}>Close</Button>
          </>
        }
      >
        {printInvoice && (
          <div className="print-document space-y-4 text-xs">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 dark:border-slate-400">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bizzrious-logo.png" alt="Bizzrious" className="h-10 w-10 rounded-full" />
                <div>
                  <p className="text-base font-extrabold">
                    {String(printInvoice.supplier_legal_name || "Bizzrious ERP Entity")}
                  </p>
                  <p>BR: {String(printInvoice.supplier_br_number || "—")} • TIN: {String(printInvoice.supplier_tin || "—")}</p>
                  <p>VAT Reg: {String(printInvoice.supplier_vat_reg || "—")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold tracking-wide text-[var(--brand-primary)]">
                  {String(printInvoice.invoice_heading || printInvoice.invoice_type || "TAX INVOICE")}
                </p>
                <p className="font-mono font-bold">{String(printInvoice.sequential_number)}</p>
                <p>Date: {String(printInvoice.invoice_date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--bg-elevated)] p-3">
              <div>
                <p className="font-bold text-[var(--text-secondary)]">Bill To:</p>
                <p className="font-semibold">{String(printInvoice.customer_name || printInvoice.customer)}</p>
                <p>Customer TIN: {String(printInvoice.customer_tin || "—")}</p>
                <p>Customer VAT Reg: {String(printInvoice.customer_vat_reg || "—")}</p>
              </div>
              <div className="text-right">
                <p>Due Date: {String(printInvoice.due_date || "—")}</p>
                <p>Currency: {String(printInvoice.currency || "LKR")}</p>
                <p>SVAT RIS: {String(printInvoice.svat_ris_number || "—")}</p>
              </div>
            </div>

            {Array.isArray(printInvoice.lines) && printInvoice.lines.length > 0 && (
              <table className="w-full border-collapse border border-[var(--border-subtle)] text-left">
                <thead className="bg-[var(--bg-muted)]">
                  <tr>
                    <th className="border border-[var(--border-subtle)] p-2">Item</th>
                    <th className="border border-[var(--border-subtle)] p-2">Description</th>
                    <th className="border border-[var(--border-subtle)] p-2 text-right">Qty</th>
                    <th className="border border-[var(--border-subtle)] p-2 text-right">Unit Price</th>
                    <th className="border border-[var(--border-subtle)] p-2 text-right">VAT</th>
                  </tr>
                </thead>
                <tbody>
                  {(printInvoice.lines as Record<string, unknown>[]).map((line, i) => (
                    <tr key={i}>
                      <td className="border border-[var(--border-subtle)] p-2 font-mono">{String(line.item_code || "")}</td>
                      <td className="border border-[var(--border-subtle)] p-2">{String(line.description || "")}</td>
                      <td className="border border-[var(--border-subtle)] p-2 text-right font-mono">{String(line.quantity || "")}</td>
                      <td className="border border-[var(--border-subtle)] p-2 text-right font-mono">{String(line.unit_price || "")}</td>
                      <td className="border border-[var(--border-subtle)] p-2 text-right font-mono">{String(line.tax_rate || "18.00")}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex flex-col items-end space-y-1">
              <p>Subtotal: <strong className="font-mono">{formatCurrency(printInvoice.subtotal as string, String(printInvoice.currency || "LKR"))}</strong></p>
              <p>VAT ({String(printInvoice.vat_rate || "18.00")}%): <strong className="font-mono">{formatCurrency(printInvoice.vat_amount as string, String(printInvoice.currency || "LKR"))}</strong></p>
              <p>NBT: <strong className="font-mono">{formatCurrency(printInvoice.nbt_amount as string, String(printInvoice.currency || "LKR"))}</strong></p>
              <p className="text-base font-extrabold">Grand Total: <span className="font-mono">{formatCurrency(printInvoice.grand_total as string, String(printInvoice.currency || "LKR"))}</span></p>
              {Boolean(printInvoice.total_in_words) && (
                <p className="italic text-[var(--text-secondary)]">
                  Amount in Words: {String(printInvoice.total_in_words)}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
