"use client";

import React from "react";
import { Building, Users } from "lucide-react";
import { customersResource, suppliersResource } from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";

export default function PartnersPage() {
  return (
    <ModuleTabShell
      title="Customers & Suppliers Master Data"
      subtitle="Single source of truth CRM customers (with SVAT, credit limits, loyalty & banning) and procurement/AP suppliers (with WHT rates)."
      tabs={[
        { id: "customers", label: "Customers", icon: Users, content: <ResourceWorkspace config={customersResource} /> },
        { id: "suppliers", label: "Suppliers", icon: Building, content: <ResourceWorkspace config={suppliersResource} /> },
      ]}
    />
  );
}
