"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Package, RefreshCw, Thermometer } from "lucide-react";
import {
  D3BarChart,
  D3HeatmapChart,
  D3StackedBarChart,
  D3TrendAreaChart,
} from "@/components/charts";
import { api, extractList } from "@/lib/api-client";
import { downloadCsv, formatCurrency, formatNumber } from "@/lib/format";
import type { PaginatedResponse } from "@/lib/types";
import { Button, Card, StatCard } from "@/components/ui/Primitives";

type Row = Record<string, unknown>;

export function InventoryReportsTab({ currency }: { currency: string }) {
  const [products, setProducts] = useState<Row[]>([]);
  const [stockLevels, setStockLevels] = useState<Row[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<Row[]>([]);
  const [tempLogs, setTempLogs] = useState<Row[]>([]);
  const [analytics, setAnalytics] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [pRes, sRes, rRes, tRes, aRes] = await Promise.allSettled([
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/products/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/stock-levels/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/stock-levels/reorder-alerts/"),
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/temperature-logs/", { page_size: 40 }),
      api.get<Row>("/api/inventory/analytics/"),
    ]);
    return {
      products: pRes.status === "fulfilled" ? extractList(pRes.value).items : [],
      stockLevels: sRes.status === "fulfilled" ? extractList(sRes.value).items : [],
      reorderAlerts: rRes.status === "fulfilled" ? extractList(rRes.value).items : [],
      tempLogs: tRes.status === "fulfilled" ? extractList(tRes.value).items : [],
      analytics: aRes.status === "fulfilled" ? aRes.value : null,
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAll().then((res) => {
      if (!active) return;
      setProducts(res.products);
      setStockLevels(res.stockLevels);
      setReorderAlerts(res.reorderAlerts);
      setTempLogs(res.tempLogs);
      setAnalytics(res.analytics);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const refresh = async () => {
    setLoading(true);
    const res = await fetchAll();
    setProducts(res.products);
    setStockLevels(res.stockLevels);
    setReorderAlerts(res.reorderAlerts);
    setTempLogs(res.tempLogs);
    setAnalytics(res.analytics);
    setLoading(false);
  };

  const abcXyzMatrix = useMemo(() => {
    const abcVals = ["A", "B", "C"];
    const xyzVals = ["X", "Y", "Z"];
    const counts = new Map<string, number>();
    for (const p of products) {
      const a = String(p.abc_class || "C").toUpperCase();
      const x = String(p.xyz_class || "Z").toUpperCase();
      const key = `${abcVals.includes(a) ? a : "C"}-${xyzVals.includes(x) ? x : "Z"}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const cells = [];
    for (const r of abcVals) {
      for (const c of xyzVals) {
        cells.push({ row: `Class ${r}`, col: `Turn ${c}`, value: counts.get(`${r}-${c}`) || 0 });
      }
    }
    return products.length > 0 ? cells : [];
  }, [products]);

  const stockComposition = useMemo(
    () =>
      stockLevels.slice(0, 10).map((s) => ({
        sku: String(s.product_sku || s.product_name || s.id),
        available: Math.max(0, Number(s.available ?? s.on_hand ?? 0)),
        reserved: Math.max(0, Number(s.reserved || 0)),
        in_transit: Math.max(0, Number(s.in_transit || 0)),
        quarantine: Math.max(0, Number(s.quarantine_quantity || 0)),
      })),
    [stockLevels]
  );

  const deficitBars = useMemo(
    () =>
      reorderAlerts.slice(0, 10).map((r) => ({
        label: String(r.product_sku || r.product_name || r.id),
        value: Math.max(0, (Number(r.reorder_point) || 0) - (Number(r.on_hand) || 0)),
        color: "#dc1e28",
        subtitle: `On Hand: ${formatNumber(r.on_hand as string)} / ROP: ${formatNumber(r.reorder_point as string)}`,
      })),
    [reorderAlerts]
  );

  const tempTrend = useMemo(
    () =>
      [...tempLogs]
        .reverse()
        .slice(-24)
        .map((t, idx) => ({
          label: String(t.recorded_at || t.created_at || `#${idx + 1}`).slice(11, 16) || `#${idx + 1}`,
          value: Number(t.recorded_celsius || 0),
          secondary: `Sensor ${String(t.sensor_id || t.bin_location || "")}`,
        })),
    [tempLogs]
  );

  const invVal = analytics?.total_stock_valuation ?? analytics?.total_inventory_value ?? 0;
  const deadCount = products.filter((p) => p.is_dead_stock).length;
  const breachCount = tempLogs.filter((t) => t.is_breach).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-secondary)]">
          ABC/XYZ classification matrix, bin stock allocation, replenishment deficits, and cold-chain IoT temperature telemetry.
        </p>
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={stockLevels.length === 0}
            onClick={() => downloadCsv(stockLevels, "inventory-stock-levels.csv")}
          >
            <Download className="h-3.5 w-3.5" />
            Stock CSV
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Catalog SKUs" value={products.length} subtext={`${deadCount} dead-stock flagged`} icon={Package} tone="info" />
        <StatCard label="Stock Valuation" value={analytics ? formatCurrency(invVal as string | number, currency) : "—"} tone="success" />
        <StatCard label="Reorder Alerts" value={reorderAlerts.length} icon={AlertTriangle} tone={reorderAlerts.length > 0 ? "danger" : "neutral"} />
        <StatCard label="Cold-Chain Breaches" value={breachCount} subtext={`${tempLogs.length} sensor readings`} icon={Thermometer} tone={breachCount > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">ABC × XYZ Inventory Classification Matrix</h3>
          <D3HeatmapChart
            data={abcXyzMatrix}
            rows={["Class A", "Class B", "Class C"]}
            cols={["Turn X", "Turn Y", "Turn Z"]}
            height={240}
            formatValue={(v) => `${v} SKUs`}
            title="ABC XYZ Matrix"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Stock Composition (Available / Reserved / Transit / QC)</h3>
          <D3StackedBarChart
            data={stockComposition}
            categoryKey="sku"
            mode="stacked"
            height={240}
            series={[
              { key: "available", label: "Available", color: "#059669" },
              { key: "reserved", label: "Reserved", color: "#2563eb" },
              { key: "in_transit", label: "In Transit", color: "#d97706" },
              { key: "quarantine", label: "Quarantine", color: "#dc1e28" },
            ]}
            title="Warehouse Stock Breakdown"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Replenishment Deficit (Units Below Reorder Point)</h3>
          <D3BarChart
            data={deficitBars}
            orientation="horizontal"
            height={240}
            formatValue={(v) => `${formatNumber(v)} units short`}
            title="Replenishment Deficit"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Cold-Chain IoT Temperature Trend (°C)</h3>
          <D3TrendAreaChart
            data={tempTrend}
            height={240}
            color="#0891b2"
            referenceBand={{ min: 2, max: 8, label: "2–8°C Safe Band" }}
            formatValue={(v) => `${v.toFixed(1)} °C`}
            title="Cold-Chain Sensor Trend"
          />
        </Card>
      </div>
    </div>
  );
}
