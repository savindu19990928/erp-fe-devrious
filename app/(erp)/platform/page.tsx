"use client";

import React from "react";
import { CreditCard, ShieldAlert } from "lucide-react";
import {
  subscriptionPaymentsResource,
  subscriptionPlansResource,
  tenantsResource,
} from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Card } from "@/components/ui/Primitives";

export default function PlatformBillingPage() {
  return (
    <ModuleTabShell
      title="SaaS Platform Billing & 2-Month Auto-Discontinuation"
      subtitle="Onboard customer organizations, record verified subscription payments, enforce 2-month overdue discontinuation, and ban/unban tenants."
      headerActions={
        <Card className="flex items-center gap-2 border-amber-300 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Policy: Services auto-discontinue at <strong>next_payment_due_date + 2 months</strong> until Admin payment is recorded.
          </span>
        </Card>
      }
      tabs={[
        { id: "tenants", label: "Tenant Organizations", icon: CreditCard, content: <ResourceWorkspace config={tenantsResource} /> },
        { id: "payments", label: "Subscription Receipts", content: <ResourceWorkspace config={subscriptionPaymentsResource} /> },
        { id: "plans", label: "Subscription Plans", content: <ResourceWorkspace config={subscriptionPlansResource} /> },
      ]}
    />
  );
}
