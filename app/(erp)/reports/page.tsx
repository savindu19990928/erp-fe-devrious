"use client";

import React, { useState } from "react";
import {
  Landmark,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { FinancialReportsTab } from "@/components/reports/FinancialReportsTab";
import { SalesReportsTab } from "@/components/reports/SalesReportsTab";
import { InventoryReportsTab } from "@/components/reports/InventoryReportsTab";
import { PayrollReportsTab } from "@/components/reports/PayrollReportsTab";
import { FleetSlaReportsTab } from "@/components/reports/FleetSlaReportsTab";
import { Button } from "@/components/ui/Primitives";

export default function ReportsAndVisualizationsPage() {
  const { activeCompanyId, companies } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState("");
  const companyFilter = selectedCompany || (activeCompanyId ? String(activeCompanyId) : "");
  const activeCompany = companies.find((c) => String(c.id) === companyFilter);
  const currency = activeCompany?.base_currency || "LKR";

  return (
    <ModuleTabShell
      title="Reports & Interactive Visualizations (D3.js)"
      subtitle="Executive BI across Finance & VAT 200, Omnichannel Sales, Inventory ABC/XYZ & Cold-Chain, Sri Lanka EPF/ETF Payroll, and Fleet/SLA."
      headerActions={
        <div className="no-print flex flex-wrap items-center gap-2">
          {companies.length > 0 && (
            <select
              aria-label="Filter reports by company"
              value={companyFilter}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.base_currency})
                </option>
              ))}
            </select>
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      }
      tabs={[
        {
          id: "financial",
          label: "Finance & VAT 200",
          icon: Landmark,
          content: <FinancialReportsTab companyId={companyFilter} currency={currency} />,
        },
        {
          id: "sales",
          label: "Sales & POS",
          icon: ShoppingCart,
          content: <SalesReportsTab currency={currency} />,
        },
        {
          id: "inventory",
          label: "Inventory & Cold-Chain",
          icon: Package,
          content: <InventoryReportsTab currency={currency} />,
        },
        {
          id: "payroll",
          label: "HR & EPF/ETF Payroll",
          icon: UserCheck,
          content: <PayrollReportsTab currency={currency} />,
        },
        {
          id: "fleet-sla",
          label: "Fleet TCO & SLA",
          icon: Truck,
          content: <FleetSlaReportsTab currency={currency} />,
        },
      ]}
      defaultTab="financial"
    />
  );
}
