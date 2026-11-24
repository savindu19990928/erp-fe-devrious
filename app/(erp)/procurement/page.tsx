"use client";

import React from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import {
  goodsReceiptsResource,
  purchaseOrdersResource,
  requisitionsResource,
  rfqsResource,
  supplierContractsResource,
} from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Card } from "@/components/ui/Primitives";

export default function ProcurementPage() {
  return (
    <ModuleTabShell
      title="Procurement & Source-to-Pay"
      subtitle="Purchase Requisitions, RFQs/Tenders, Supplier Contracts, Purchase Orders, Goods Receipt Notes (GRN), and Three-Way Matching."
      headerActions={
        <Card className="hidden items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] xl:flex">
          <span>Requisition</span>
          <ArrowRight className="h-3 w-3" />
          <span>RFQ & Bid</span>
          <ArrowRight className="h-3 w-3" />
          <span>Purchase Order</span>
          <ArrowRight className="h-3 w-3" />
          <span>GRN & QC</span>
          <ArrowRight className="h-3 w-3" />
          <span className="text-[var(--brand-primary)]">3-Way Match</span>
        </Card>
      }
      tabs={[
        { id: "purchase-orders", label: "Purchase Orders", icon: ShoppingBag, content: <ResourceWorkspace config={purchaseOrdersResource} /> },
        { id: "goods-receipts", label: "Goods Receipts (GRN)", content: <ResourceWorkspace config={goodsReceiptsResource} /> },
        { id: "requisitions", label: "Requisitions", content: <ResourceWorkspace config={requisitionsResource} /> },
        { id: "rfqs", label: "RFQs & Bids", content: <ResourceWorkspace config={rfqsResource} /> },
        { id: "contracts", label: "Supplier Contracts", content: <ResourceWorkspace config={supplierContractsResource} /> },
      ]}
    />
  );
}
