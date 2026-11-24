"use client";

import React from "react";
import { Globe, Package } from "lucide-react";
import { ecommerceOrdersResource, productsResource } from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";

export default function EcommercePage() {
  const storefrontCatalogConfig = {
    ...productsResource,
    id: "ecommerce-catalog",
    title: "Published E-Commerce Catalog",
    description: "Products published to the online storefront (is_published_ecommerce=true) synchronized with warehouse stock.",
    defaultFilters: { is_published_ecommerce: "true" },
  };

  return (
    <ModuleTabShell
      title="E-Commerce & Omnichannel Fulfillment (ERP-ECOM)"
      subtitle="Online order ingestion, payment gateway capture, warehouse fulfillment routing, in-store pickup, and return credit notes."
      tabs={[
        {
          id: "orders",
          label: "Online Orders",
          icon: Globe,
          content: <ResourceWorkspace config={ecommerceOrdersResource} />,
        },
        {
          id: "catalog",
          label: "Published Catalog",
          icon: Package,
          content: <ResourceWorkspace config={storefrontCatalogConfig} />,
        },
      ]}
    />
  );
}
