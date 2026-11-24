"use client";

import React, { useEffect, useState } from "react";
import { Calculator, Download, FileText, Printer, UserCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { downloadCsv, downloadJson, formatCurrency } from "@/lib/format";
import {
  attendanceResource,
  employeesResource,
  holidaysResource,
  jobApplicantsResource,
  jobOpeningsResource,
  leavesResource,
  payrollRunsResource,
  payslipsResource,
  salaryRevisionsResource,
} from "@/lib/resources";
import type { EpfCalculatorResult } from "@/lib/types";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Button, Card, JsonViewer, Modal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

function HrCalculatorAndSelfService() {
  const toast = useToast();
  const [basicSalary, setBasicSalary] = useState("100000.00");
  const [allowances, setAllowances] = useState("0.00");
  const [calcResult, setCalcResult] = useState<EpfCalculatorResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [essData, setEssData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api
      .get<Record<string, unknown>>("/api/hr/self-service/")
      .then(setEssData)
      .catch(() => setEssData(null));
  }, []);

  const runCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await api.post<EpfCalculatorResult>("/api/hr/calculator/epf-etf-apit/", {
        basic_salary: basicSalary,
        allowances,
      });
      setCalcResult(res);
    } catch (err) {
      toast.error("Calculation failed", err instanceof Error ? err.message : "Error");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold">
            Sri Lanka EPF (12%/8%), ETF (3%) & APIT Tax Calculator
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Live statutory computation via POST /api/hr/calculator/epf-etf-apit/
          </p>
        </div>

        <form onSubmit={runCalc} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Basic Salary (LKR)
            </label>
            <input
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Fixed Allowances (LKR)
            </label>
            <input
              value={allowances}
              onChange={(e) => setAllowances(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={calculating}>
              <Calculator className="h-4 w-4" />
              Calculate Statutory Deductions
            </Button>
          </div>
        </form>

        {calcResult && (
          <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs">
            <div className="flex justify-between py-2.5">
              <span>Gross Salary</span>
              <span className="font-mono font-bold">{formatCurrency(calcResult.gross_salary)}</span>
            </div>
            <div className="flex justify-between py-2.5 text-red-600 dark:text-red-400">
              <span>Employee EPF Deducted (8%)</span>
              <span className="font-mono font-bold">-{formatCurrency(calcResult.epf_employee_8_percent)}</span>
            </div>
            <div className="flex justify-between py-2.5 text-red-600 dark:text-red-400">
              <span>APIT Progressive Tax</span>
              <span className="font-mono font-bold">-{formatCurrency(calcResult.apit_tax)}</span>
            </div>
            <div className="flex justify-between py-2.5 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              <span>Net Take-Home Salary</span>
              <span className="font-mono">{formatCurrency(calcResult.net_salary)}</span>
            </div>
            <div className="flex justify-between py-2.5 text-[var(--text-secondary)]">
              <span>Employer EPF Contribution (12%)</span>
              <span className="font-mono">{formatCurrency(calcResult.epf_employer_12_percent)}</span>
            </div>
            <div className="flex justify-between py-2.5 text-[var(--text-secondary)]">
              <span>Employer ETF Contribution (3%)</span>
              <span className="font-mono">{formatCurrency(calcResult.etf_employer_3_percent)}</span>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold">Employee Self-Service Portal (ESS)</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Logged-in staff profile, leave balances, and payslips from GET /api/hr/self-service/
          </p>
        </div>
        {essData ? (
          <JsonViewer
            data={essData}
            title="Self-Service Profile & Leave Balances"
            filename="employee-self-service.json"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-xs text-[var(--text-muted)]">
            Link your User account to an Employee record to view leave balances and payslips here.
          </div>
        )}
      </Card>
    </div>
  );
}

type Row = Record<string, unknown>;

function StatutoryReportButton({ runId }: { runId: unknown }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Row>(`/api/hr/payroll-runs/${runId}/statutory-report/`);
      setReport(res);
    } catch (err) {
      toast.error("Could not load statutory report", err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const totals = (report?.totals as Row | undefined) ?? {};
  const schedule = (report?.epf_etf_ird_form_7_schedule as Row[] | undefined) ?? [];
  const bank = (report?.bank_salary_upload_instructions as Row[] | undefined) ?? [];
  const money = (v: unknown) => formatCurrency(v as string);
  const runCode = String(report?.run_code ?? runId);

  const totalLabels: Array<[string, string]> = [
    ["total_gross_pay", "Gross Pay"],
    ["total_epf_employee_8_percent", "Employee EPF 8%"],
    ["total_epf_employer_12_percent", "Employer EPF 12%"],
    ["total_epf_remittance_20_percent", "EPF Remittance 20%"],
    ["total_etf_remittance_3_percent", "ETF Remittance 3%"],
    ["total_apit_remittance_to_ird", "APIT Remittance"],
    ["total_net_pay_disbursement", "Net Pay Disbursement"],
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
        <Button size="sm" variant="primary" loading={loading} onClick={load}>
          <FileText className="h-4 w-4" />
          Open Form IRD 7 &amp; Bank Upload Schedule
        </Button>
      </div>

      <Modal
        open={Boolean(report)}
        onClose={() => setReport(null)}
        title={`Statutory Report — ${runCode}`}
        subtitle={`${String(report?.company ?? "")} • Period ${String(report?.period ?? "")} • Employer TIN ${String(report?.employer_tin ?? "—")}`}
        maxWidth="max-w-6xl"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              disabled={bank.length === 0}
              onClick={() => downloadCsv(bank, `bank-salary-upload-${runCode}.csv`)}
            >
              <Download className="h-4 w-4" />
              Bank CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => report && downloadJson(report, `ird7-${runCode}.json`)}
            >
              <Download className="h-4 w-4" />
              IRD 7 JSON
            </Button>
            <Button onClick={() => setReport(null)}>Close</Button>
          </>
        }
      >
        <div className="print-document space-y-5 text-xs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {totalLabels.map(([key, label]) => (
              <div
                key={key}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
              >
                <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
                <p className="mt-1 font-mono text-sm font-bold tabular-nums">{money(totals[key])}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-2 font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Form IRD 7 / EPF C-Form / ETF Schedule
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                  <tr>
                    {["Code", "Name", "NIC", "TIN", "EPF No.", "Basic", "Gross", "EPF 8%", "EPF 12%", "EPF 20%", "ETF 3%", "APIT", "Gratuity", "Net Pay"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2.5 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                  {schedule.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-2">{String(r.employee_code ?? "")}</td>
                      <td className="px-2.5 py-2 font-sans">{String(r.name ?? "")}</td>
                      <td className="px-2.5 py-2">{String(r.nic_number ?? "")}</td>
                      <td className="px-2.5 py-2">{String(r.tin_number ?? "")}</td>
                      <td className="px-2.5 py-2">{String(r.epf_member_number ?? "")}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.basic_salary)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.gross_pay)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.epf_employee_8_percent)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.epf_employer_12_percent)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.epf_total_20_percent)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.etf_employer_3_percent)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.apit_tax_withheld)}</td>
                      <td className="px-2.5 py-2 text-right">{money(r.gratuity_accrual)}</td>
                      <td className="px-2.5 py-2 text-right font-bold">{money(r.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Bank Salary Upload Instructions
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full min-w-[600px] text-left">
                <thead className="bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                  <tr>
                    {["Code", "Beneficiary", "Bank", "Branch", "Account No.", "Amount"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-2.5 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                  {bank.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-2">{String(r.employee_code ?? "")}</td>
                      <td className="px-2.5 py-2 font-sans">{String(r.beneficiary_name ?? "")}</td>
                      <td className="px-2.5 py-2 font-sans">{String(r.bank_name ?? "")}</td>
                      <td className="px-2.5 py-2">{String(r.branch_code ?? "")}</td>
                      <td className="px-2.5 py-2">{String(r.account_number ?? "")}</td>
                      <td className="px-2.5 py-2 text-right font-bold">{money(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function HrPayrollPage() {
  return (
    <ModuleTabShell
      title="Human Resources & Sri Lanka Statutory Payroll"
      subtitle="Employee master, Poya/mercantile calendar, attendance & OT, leave approvals, EPF/ETF/APIT payroll runs, IRD Form 7 & hiring."
      tabs={[
        {
          id: "calculator-ess",
          label: "EPF/ETF Calculator & ESS",
          icon: Calculator,
          content: <HrCalculatorAndSelfService />,
        },
        { id: "employees", label: "Employees", icon: UserCheck, content: <ResourceWorkspace config={employeesResource} /> },
        { id: "payroll-runs", label: "Payroll Runs", content: (
            <ResourceWorkspace
              config={payrollRunsResource}
              renderDetailExtra={(row) => <StatutoryReportButton runId={row.id} />}
            />
          ),
        },
        { id: "payslips", label: "Payslips", content: <ResourceWorkspace config={payslipsResource} /> },
        { id: "leaves", label: "Leave Requests", content: <ResourceWorkspace config={leavesResource} /> },
        { id: "attendance", label: "Attendance", content: <ResourceWorkspace config={attendanceResource} /> },
        { id: "holidays", label: "Poya & Holidays", content: <ResourceWorkspace config={holidaysResource} /> },
        { id: "job-openings", label: "Job Openings", content: <ResourceWorkspace config={jobOpeningsResource} /> },
        { id: "job-applicants", label: "Applicants", content: <ResourceWorkspace config={jobApplicantsResource} /> },
        { id: "salary-revisions", label: "Salary Revisions", content: <ResourceWorkspace config={salaryRevisionsResource} /> },
      ]}
    />
  );
}
