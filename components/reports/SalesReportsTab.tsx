"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Globe, RefreshCw, ShoppingCart, Users } from "lucide-react";
import { D3BarChart, D3DonutChart, D3TrendAreaChart } from "@/components/charts";
import { api, extractList } from "@/lib/api-client";
import { downloadCsv, formatCurrency } from "@/lib/format";
import type { PaginatedResponse } from "@/lib/types";
import { Button, Card, StatCard } from "@/components/ui/Primitives";

type Row = Record<string, unknown>;

export function SalesReportsTab({ currency }: { currency: string }) {
  const [posOrders, setPosOrders] = useState<Row[]>([]);
  const [ecomOrders, setEcomOrders] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [posRes, ecomRes, custRes] = await Promise.allSettled([
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/pos/orders/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/ecommerce/orders/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/customers/", { page_size: 100 }),
    ]);
    return {
      posOrders: posRes.status === "fulfilled" ? extractList(posRes.value).items : [],
      ecomOrders: ecomRes.status === "fulfilled" ? extractList(ecomRes.value).items : [],
      customers: custRes.status === "fulfilled" ? extractList(custRes.value).items : [],
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAll().then((res) => {
      if (!active) return;
      setPosOrders(res.posOrders);
      setEcomOrders(res.ecomOrders);
      setCustomers(res.customers);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const refresh = async () => {
    setLoading(true);
    const res = await fetchAll();
    setPosOrders(res.posOrders);
    setEcomOrders(res.ecomOrders);
    setCustomers(res.customers);
    setLoading(false);
  };

  const posTotal = useMemo(
    () => posOrders.reduce((s, o) => s + (o.status === "VOID" ? 0 : Number(o.grand_total) || 0), 0),
    [posOrders]
  );
  const ecomTotal = useMemo(
    () => ecomOrders.reduce((s, o) => s + (o.status === "CANCELLED" ? 0 : Number(o.grand_total) || 0), 0),
    [ecomOrders]
  );

  const channelDonut = useMemo(
    () => [
      { label: "Retail POS", value: posTotal, color: "#dc1e28" },
      { label: "E-Commerce", value: ecomTotal, color: "#2563eb" },
    ],
    [ecomTotal, posTotal]
  );

  const paymentDonut = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of posOrders) {
      if (o.status === "VOID") continue;
      const m = String(o.payment_method || "OTHER");
      map.set(m, (map.get(m) || 0) + (Number(o.grand_total) || 0));
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [posOrders]);

  const dailySalesTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const o of [...posOrders, ...ecomOrders]) {
      if (o.status === "VOID" || o.status === "CANCELLED") continue;
      const d = String(o.created_at || "").slice(0, 10);
      if (!d) continue;
      byDay.set(d, (byDay.get(d) || 0) + (Number(o.grand_total) || 0));
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }, [ecomOrders, posOrders]);

  const topCustomers = useMemo(
    () =>
      [...customers]
        .filter((c) => Number(c.current_balance || 0) > 0 || Number(c.loyalty_points || 0) > 0)
        .sort((a, b) => Number(b.current_balance || 0) - Number(a.current_balance || 0))
        .slice(0, 8)
        .map((c) => ({
          label: String(c.name || c.customer_code),
          value: Number(c.current_balance || 0),
          subtitle: `Limit: ${formatCurrency(c.credit_limit as string, currency)} • Pts: ${String(c.loyalty_points ?? 0)}`,
        })),
    [currency, customers]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-secondary)]">
          Omnichannel revenue analytics across POS registers, online storefront orders, payment methods, and customer AR exposure.
        </p>
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={posOrders.length === 0 && ecomOrders.length === 0}
            onClick={() => downloadCsv([...posOrders, ...ecomOrders], "omnichannel-sales.csv")}
          >
            <Download className="h-3.5 w-3.5" />
            Export Sales CSV
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="POS Revenue" value={formatCurrency(posTotal, currency)} subtext={`${posOrders.length} orders`} icon={ShoppingCart} tone="brand" />
        <StatCard label="E-Commerce Revenue" value={formatCurrency(ecomTotal, currency)} subtext={`${ecomOrders.length} online orders`} icon={Globe} tone="info" />
        <StatCard label="Combined Revenue" value={formatCurrency(posTotal + ecomTotal, currency)} tone="success" />
        <StatCard label="Active Customers" value={customers.length} subtext={`${customers.filter((c) => c.is_banned).length} banned`} icon={Users} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Omnichannel Revenue Split (POS vs E-Commerce)</h3>
          <D3DonutChart
            data={channelDonut}
            size={195}
            centerLabel="Total"
            centerValue={formatCurrency(posTotal + ecomTotal, currency)}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Channel Split"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">POS Revenue by Payment Method</h3>
          <D3DonutChart
            data={paymentDonut}
            size={195}
            centerLabel="POS"
            centerValue={`${posOrders.length} txns`}
            formatValue={(v) => formatCurrency(v, currency)}
            title="POS Payment Methods"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Daily Combined Sales Trend</h3>
          <D3TrendAreaChart
            data={dailySalesTrend}
            height={240}
            color="#dc1e28"
            formatValue={(v) => formatCurrency(v, currency)}
            title="Daily Sales Trend"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Top Customers by AR Balance</h3>
          <D3BarChart
            data={topCustomers}
            orientation="horizontal"
            height={240}
            formatValue={(v) => formatCurrency(v, currency)}
            title="Customer AR Exposure"
          />
        </Card>
      </div>
    </div>
  );
}
