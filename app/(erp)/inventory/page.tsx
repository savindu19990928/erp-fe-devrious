"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, QrCode, RefreshCw } from "lucide-react";
import { api, ApiError, extractList } from "@/lib/api-client";
import { formatDate, formatNumber } from "@/lib/format";
import {
  batchSerialsResource,
  bomsResource,
  categoriesResource,
  cycleCountsResource,
  forecastsResource,
  locationsResource,
  mrpRunsResource,
  pickingTasksResource,
  pickingWavesResource,
  podsResource,
  productionOrdersResource,
  productsResource,
  productVariantsResource,
  putAwayTasksResource,
  qualityInspectionsResource,
  recallsResource,
  reservationsResource,
  rmasResource,
  stockAdjustmentsResource,
  stockLevelsResource,
  stockMovementsResource,
  stockTransfersResource,
  temperatureLogsResource,
  toolCheckoutsResource,
  uomConversionsResource,
} from "@/lib/resources";
import type { UniversalScanResult } from "@/lib/types";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Badge, Button, Card, JsonViewer } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

function InventoryOverviewAndScanner() {
  const toast = useToast();
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<UniversalScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [reorderAlerts, setReorderAlerts] = useState<Record<string, unknown>[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<Record<string, unknown>[]>([]);
  const [traceBatch, setTraceBatch] = useState("");
  const [traceRows, setTraceRows] = useState<Record<string, unknown>[]>([]);

  const loadOverview = useCallback(async () => {
    const [anaRes, roRes, expRes] = await Promise.allSettled([
      api.get<Record<string, unknown>>("/api/inventory/analytics/"),
      api.get("/api/inventory/stock-levels/reorder-alerts/"),
      api.get("/api/inventory/batch-serials/expiry-alerts/", { days: 60 }),
    ]);
    if (anaRes.status === "fulfilled") setAnalytics(anaRes.value);
    if (roRes.status === "fulfilled") setReorderAlerts(extractList(roRes.value as never).items);
    if (expRes.status === "fulfilled") setExpiryAlerts(extractList(expRes.value as never).items);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get<Record<string, unknown>>("/api/inventory/analytics/"),
      api.get("/api/inventory/stock-levels/reorder-alerts/"),
      api.get("/api/inventory/batch-serials/expiry-alerts/", { days: 60 }),
    ]).then(([anaRes, roRes, expRes]) => {
      if (!active) return;
      if (anaRes.status === "fulfilled") setAnalytics(anaRes.value);
      if (roRes.status === "fulfilled") setReorderAlerts(extractList(roRes.value as never).items);
      if (expRes.status === "fulfilled") setExpiryAlerts(extractList(expRes.value as never).items);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setScanning(true);
    try {
      const res = await api.get<UniversalScanResult>("/api/inventory/scan/", {
        code: scanInput.trim(),
      });
      setScanResult(res);
      toast.success("Scan Matched", res.matched_type);
    } catch (err) {
      setScanResult(null);
      toast.error("No match found", err instanceof ApiError ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const runAbcXyz = async () => {
    try {
      const res = await api.post<Record<string, unknown>>("/api/inventory/analytics/", {});
      setAnalytics(res);
      toast.success("ABC/XYZ & Dead-Stock Classification Completed");
    } catch (err) {
      toast.error("Classification failed", err instanceof Error ? err.message : "Error");
    }
  };

  const runBatchTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceBatch.trim()) return;
    try {
      const res = await api.get("/api/inventory/batch-serials/trace/", {
        batch_number: traceBatch.trim(),
      });
      setTraceRows(extractList(res as never).items);
    } catch (err) {
      toast.error("Batch trace failed", err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Universal Scanner */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">
                Universal Barcode / QR / RFID / Pallet Scanner
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Instant lookup via GET /api/inventory/scan/?code=
              </p>
            </div>
            <QrCode className="h-5 w-5 text-[var(--brand-primary)]" />
          </div>
          <form onSubmit={handleScan} className="flex gap-2">
            <input
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="e.g. PALLET-QR-2026-100 or SKU/Barcode"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm"
            />
            <Button type="submit" loading={scanning}>
              Scan Lookup
            </Button>
          </form>
          {scanResult && (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="flex items-center justify-between">
                <Badge tone="success">{scanResult.matched_type}</Badge>
                <span className="font-mono font-bold">
                  Qty: {String(scanResult.quantity ?? "—")}
                </span>
              </div>
              {scanResult.product && (
                <p className="font-semibold">
                  {String(scanResult.product.name)} ({String(scanResult.product.sku)})
                </p>
              )}
              {scanResult.bin_location_path && (
                <p className="font-mono text-[var(--text-secondary)]">
                  Location: {scanResult.bin_location_path}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Batch Traceability */}
        <Card className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold">Forward / Backward Batch Trace</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Trace lot history via GET /api/inventory/batch-serials/trace/
            </p>
          </div>
          <form onSubmit={runBatchTrace} className="flex gap-2">
            <input
              value={traceBatch}
              onChange={(e) => setTraceBatch(e.target.value)}
              placeholder="Enter Batch Number (e.g. BATCH-2026-11A)"
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm"
            />
            <Button type="submit" variant="secondary">
              Trace Batch
            </Button>
          </form>
          {traceRows.length > 0 && (
            <JsonViewer data={traceRows} title="Batch Trace History" filename="batch-trace.json" />
          )}
        </Card>
      </div>

      {/* Analytics + Alerts */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">
              Inventory Analytics, ABC/XYZ Classification & Reorder/Expiry Alerts
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {reorderAlerts.length} items need replenishment • {expiryAlerts.length} batches expiring in 60 days.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void loadOverview()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" variant="primary" onClick={runAbcXyz}>
              <BarChart3 className="h-4 w-4" />
              Run ABC/XYZ & Dead-Stock Analysis
            </Button>
          </div>
        </div>
        {analytics && (
          <JsonViewer
            data={analytics}
            title="Live Inventory & Multi-Currency Analytics"
            filename="inventory-analytics.json"
          />
        )}
        {expiryAlerts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2 pr-3">Batch</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3 text-right">Qty</th>
                  <th className="py-2 text-right">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {expiryAlerts.map((b) => (
                  <tr key={String(b.id)}>
                    <td className="py-2 pr-3 font-mono font-semibold">{String(b.batch_number)}</td>
                    <td className="py-2 pr-3 font-mono">{String(b.product_sku)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatNumber(b.quantity as string)}</td>
                    <td className="py-2 text-right">{formatDate(String(b.expiry_date || ""))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ModuleTabShell
      title="Inventory, Warehousing, BOM, Cold-Chain & MRP"
      subtitle="Multi-UOM catalog, hierarchical storage bins, FIFO batches, QC quarantine, wave picking, cycle counts, IoT cold-chain & MRP."
      tabs={[
        { id: "overview", label: "Scanner & Analytics", icon: QrCode, content: <InventoryOverviewAndScanner /> },
        { id: "products", label: "Products", content: <ResourceWorkspace config={productsResource} /> },
        { id: "stock-levels", label: "Stock Ledger", content: <ResourceWorkspace config={stockLevelsResource} /> },
        { id: "locations", label: "Locations (Bins)", content: <ResourceWorkspace config={locationsResource} /> },
        { id: "transfers", label: "Transfers", content: <ResourceWorkspace config={stockTransfersResource} /> },
        { id: "batches", label: "Batches & Serials", content: <ResourceWorkspace config={batchSerialsResource} /> },
        { id: "qc", label: "QC Quarantine", content: <ResourceWorkspace config={qualityInspectionsResource} /> },
        { id: "put-away", label: "Put-Away", content: <ResourceWorkspace config={putAwayTasksResource} /> },
        { id: "picking-waves", label: "Pick Waves", content: <ResourceWorkspace config={pickingWavesResource} /> },
        { id: "picking-tasks", label: "Pick Tasks", content: <ResourceWorkspace config={pickingTasksResource} /> },
        { id: "cycle-counts", label: "Cycle Counts", content: <ResourceWorkspace config={cycleCountsResource} /> },
        { id: "adjustments", label: "Adjustments", content: <ResourceWorkspace config={stockAdjustmentsResource} /> },
        { id: "reservations", label: "Reservations", content: <ResourceWorkspace config={reservationsResource} /> },
        { id: "movements", label: "Movements", content: <ResourceWorkspace config={stockMovementsResource} /> },
        { id: "boms", label: "BOMs", content: <ResourceWorkspace config={bomsResource} /> },
        { id: "production", label: "Production", content: <ResourceWorkspace config={productionOrdersResource} /> },
        { id: "mrp", label: "MRP Runs", content: <ResourceWorkspace config={mrpRunsResource} /> },
        { id: "forecasts", label: "Forecasts", content: <ResourceWorkspace config={forecastsResource} /> },
        { id: "cold-chain", label: "Cold-Chain Temp", content: <ResourceWorkspace config={temperatureLogsResource} /> },
        { id: "recalls", label: "Batch Recalls", content: <ResourceWorkspace config={recallsResource} /> },
        { id: "rmas", label: "RMAs", content: <ResourceWorkspace config={rmasResource} /> },
        { id: "pods", label: "PODs", content: <ResourceWorkspace config={podsResource} /> },
        { id: "tools", label: "Tool Custody", content: <ResourceWorkspace config={toolCheckoutsResource} /> },
        { id: "variants", label: "Variants", content: <ResourceWorkspace config={productVariantsResource} /> },
        { id: "uoms", label: "UOMs", content: <ResourceWorkspace config={uomConversionsResource} /> },
        { id: "categories", label: "Categories", content: <ResourceWorkspace config={categoriesResource} /> },
      ]}
    />
  );
}
