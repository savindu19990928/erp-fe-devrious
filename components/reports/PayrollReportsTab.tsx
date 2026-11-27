"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, UserCheck } from "lucide-react";
import { D3BarChart, D3DonutChart, D3StackedBarChart } from "@/components/charts";
import { api, extractList } from "@/lib/api-client";
import { downloadCsv, downloadJson, formatCurrency } from "@/lib/format";
import type { PaginatedResponse } from "@/lib/types";
import { Button, Card, StatCard } from "@/components/ui/Primitives";

type Row = Record<string, unknown>;

export function PayrollReportsTab({ currency }: { currency: string }) {
  const [runs, setRuns] = useState<Row[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [statutory, setStatutory] = useState<Row | null>(null);
  const [employees, setEmployees] = useState<Row[]>([]);
  const [leaves, setLeaves] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBase = useCallback(async () => {
    const [runRes, empRes, lvRes] = await Promise.allSettled([
      api.get<PaginatedResponse<Row> | Row[]>("/api/hr/payroll-runs/", { page_size: 25 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/hr/employees/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/hr/leaves/", { page_size: 100 }),
    ]);
    const runList = runRes.status === "fulfilled" ? extractList(runRes.value).items : [];
    const firstId = runList[0]?.id ? String(runList[0].id) : "";
    let stat: Row | null = null;
    if (firstId) {
      try {
        stat = await api.get<Row>(`/api/hr/payroll-runs/${firstId}/statutory-report/`);
      } catch {
        stat = null;
      }
    }
    return {
      runs: runList,
      firstId,
      statutory: stat,
      employees: empRes.status === "fulfilled" ? extractList(empRes.value).items : [],
      leaves: lvRes.status === "fulfilled" ? extractList(lvRes.value).items : [],
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadBase().then((res) => {
      if (!active) return;
      setRuns(res.runs);
      setSelectedRunId(res.firstId);
      setStatutory(res.statutory);
      setEmployees(res.employees);
      setLeaves(res.leaves);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadBase]);

  const handleRunChange = async (id: string) => {
    setSelectedRunId(id);
    if (!id) {
      setStatutory(null);
      return;
    }
    setLoading(true);
    try {
      const stat = await api.get<Row>(`/api/hr/payroll-runs/${id}/statutory-report/`);
      setStatutory(stat);
    } catch {
      setStatutory(null);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => (statutory?.totals as Row | undefined) ?? {}, [statutory]);
  const schedule = useMemo(
    () => (statutory?.epf_etf_ird_form_7_schedule as Row[] | undefined) ?? [],
    [statutory]
  );
  const bank = (statutory?.bank_salary_upload_instructions as Row[] | undefined) ?? [];

  const statutoryDonut = useMemo(() => {
    if (!statutory) return [];
    return [
      { label: "Net Disbursement", value: Number(totals.total_net_pay_disbursement || 0), color: "#059669" },
      { label: "Employee EPF (8%)", value: Number(totals.total_epf_employee_8_percent || 0), color: "#2563eb" },
      { label: "Employer EPF (12%)", value: Number(totals.total_epf_employer_12_percent || 0), color: "#7c3aed" },
      { label: "Employer ETF (3%)", value: Number(totals.total_etf_remittance_3_percent || 0), color: "#d97706" },
      { label: "APIT Tax (IRD)", value: Number(totals.total_apit_remittance_to_ird || 0), color: "#dc1e28" },
    ];
  }, [statutory, totals]);

  const perEmployeeStack = useMemo(
    () =>
      schedule.slice(0, 10).map((r) => ({
        emp: String(r.employee_code || r.name),
        net_pay: Number(r.net_pay || 0),
        epf_8: Number(r.epf_employee_8_percent || 0),
        apit: Number(r.apit_tax_withheld || 0),
        employer_epf_etf: (Number(r.epf_employer_12_percent) || 0) + (Number(r.etf_employer_3_percent) || 0),
      })),
    [schedule]
  );

  const deptSalaryBars = useMemo(() => {
    const map = new Map<string, { salary: number; count: number }>();
    for (const e of employees) {
      const dept = String(e.department || "General");
      const curr = map.get(dept) || { salary: 0, count: 0 };
      curr.salary += Number(e.basic_salary || 0);
      curr.count += 1;
      map.set(dept, curr);
    }
    return Array.from(map.entries()).map(([label, v]) => ({
      label,
      value: v.salary,
      subtitle: `${v.count} employee${v.count === 1 ? "" : "s"}`,
    }));
  }, [employees]);

  const leaveDonut = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leaves) {
      const k = String(l.leave_type || "OTHER");
      map.set(k, (map.get(k) || 0) + (Number(l.days_count) || 1));
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [leaves]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Payroll Run:</label>
          <select
            value={selectedRunId}
            onChange={(e) => void handleRunChange(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium"
          >
            {runs.length === 0 && <option value="">No payroll runs</option>}
            {runs.map((r) => (
              <option key={String(r.id)} value={String(r.id)}>
                {String(r.run_code || r.id)} ({String(r.period_year)}-{String(r.period_month)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={bank.length === 0}
            onClick={() => downloadCsv(bank, "bank-salary-upload.csv")}
          >
            <Download className="h-3.5 w-3.5" />
            Bank Upload CSV
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={!statutory}
            onClick={() => statutory && downloadJson(statutory, "ird-form-7-report.json")}
          >
            <Download className="h-3.5 w-3.5" />
            IRD Form 7 JSON
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void handleRunChange(selectedRunId)}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross Payroll" value={statutory ? formatCurrency(totals.total_gross_pay as string, currency) : "—"} icon={UserCheck} tone="info" />
        <StatCard label="EPF Remittance (20%)" value={statutory ? formatCurrency(totals.total_epf_remittance_20_percent as string, currency) : "—"} tone="brand" />
        <StatCard label="ETF Remittance (3%)" value={statutory ? formatCurrency(totals.total_etf_remittance_3_percent as string, currency) : "—"} tone="warning" />
        <StatCard label="Net Disbursement" value={statutory ? formatCurrency(totals.total_net_pay_disbursement as string, currency) : "—"} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Statutory Payroll Cost Split (EPF/ETF/APIT)</h3>
          <D3DonutChart
            data={statutoryDonut}
            size={195}
            centerLabel="Gross"
            centerValue={statutory ? formatCurrency(totals.total_gross_pay as string, currency) : ""}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Statutory Payroll Cost Split"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Department Basic Salary Distribution</h3>
          <D3BarChart
            data={deptSalaryBars}
            height={230}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Department Payroll"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Per-Employee Form IRD 7 Compensation Breakdown</h3>
          <D3StackedBarChart
            data={perEmployeeStack}
            categoryKey="emp"
            mode="stacked"
            height={240}
            formatValue={(v) => formatCurrency(v, currency)}
            series={[
              { key: "net_pay", label: "Net Pay", color: "#059669" },
              { key: "epf_8", label: "EPF 8%", color: "#2563eb" },
              { key: "apit", label: "APIT", color: "#dc1e28" },
              { key: "employer_epf_etf", label: "Employer EPF+ETF", color: "#7c3aed" },
            ]}
            title="Employee Compensation Breakdown"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Leave Days Taken by Category</h3>
          <D3DonutChart
            data={leaveDonut}
            size={190}
            centerLabel="Leaves"
            centerValue={`${leaves.length} reqs`}
            formatValue={(v) => `${v} days`}
            title="Leave Category Distribution"
          />
        </Card>
      </div>
    </div>
  );
}
