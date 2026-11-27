"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Headphones, RefreshCw, Truck } from "lucide-react";
import {
  D3BarChart,
  D3DonutChart,
  D3HeatmapChart,
  D3StackedBarChart,
} from "@/components/charts";
import { api, extractList } from "@/lib/api-client";
import { downloadCsv, formatCurrency } from "@/lib/format";
import type { PaginatedResponse } from "@/lib/types";
import { Button, Card, StatCard } from "@/components/ui/Primitives";

type Row = Record<string, unknown>;

export function FleetSlaReportsTab({ currency }: { currency: string }) {
  const [vehicles, setVehicles] = useState<Row[]>([]);
  const [mows, setMows] = useState<Row[]>([]);
  const [fuelTxns, setFuelTxns] = useState<Row[]>([]);
  const [tickets, setTickets] = useState<Row[]>([]);
  const [sdMetrics, setSdMetrics] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [vRes, mRes, fRes, tRes, sdRes] = await Promise.allSettled([
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/fleet/vehicles/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/fleet/maintenance-orders/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/inventory/fleet/fuel-transactions/", { page_size: 100 }),
      api.get<PaginatedResponse<Row> | Row[]>("/api/service-desk/tickets/", { page_size: 100 }),
      api.get<Row>("/api/service-desk/metrics/"),
    ]);
    return {
      vehicles: vRes.status === "fulfilled" ? extractList(vRes.value).items : [],
      mows: mRes.status === "fulfilled" ? extractList(mRes.value).items : [],
      fuelTxns: fRes.status === "fulfilled" ? extractList(fRes.value).items : [],
      tickets: tRes.status === "fulfilled" ? extractList(tRes.value).items : [],
      sdMetrics: sdRes.status === "fulfilled" ? sdRes.value : null,
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAll().then((res) => {
      if (!active) return;
      setVehicles(res.vehicles);
      setMows(res.mows);
      setFuelTxns(res.fuelTxns);
      setTickets(res.tickets);
      setSdMetrics(res.sdMetrics);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const refresh = async () => {
    setLoading(true);
    const res = await fetchAll();
    setVehicles(res.vehicles);
    setMows(res.mows);
    setFuelTxns(res.fuelTxns);
    setTickets(res.tickets);
    setSdMetrics(res.sdMetrics);
    setLoading(false);
  };

  const vehicleNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const v of vehicles) {
      m.set(Number(v.id), String(v.registration_number || `Veh #${v.id}`));
    }
    return m;
  }, [vehicles]);

  const fleetTcoRows = useMemo(() => {
    const map = new Map<string, { fuel: number; maintenance: number }>();
    for (const v of vehicles.slice(0, 10)) {
      map.set(String(v.registration_number || v.id), { fuel: 0, maintenance: 0 });
    }
    for (const f of fuelTxns) {
      const label = vehicleNameById.get(Number(f.vehicle)) || `Veh #${f.vehicle}`;
      const curr = map.get(label) || { fuel: 0, maintenance: 0 };
      curr.fuel += Number(f.total_cost || 0);
      map.set(label, curr);
    }
    for (const m of mows) {
      const label = vehicleNameById.get(Number(m.vehicle)) || `Veh #${m.vehicle}`;
      const curr = map.get(label) || { fuel: 0, maintenance: 0 };
      curr.maintenance += Number(m.total_cost || m.labor_cost || 0);
      map.set(label, curr);
    }
    return Array.from(map.entries())
      .slice(0, 10)
      .map(([vehicle, costs]) => ({ vehicle, ...costs }));
  }, [fuelTxns, mows, vehicleNameById, vehicles]);

  const fuelEfficiencyBars = useMemo(() => {
    const map = new Map<string, { sum: number; count: number; anomaly: boolean }>();
    for (const f of fuelTxns) {
      const kml = Number(f.calculated_km_per_liter || 0);
      if (kml <= 0) continue;
      const label = vehicleNameById.get(Number(f.vehicle)) || `Veh #${f.vehicle}`;
      const curr = map.get(label) || { sum: 0, count: 0, anomaly: false };
      curr.sum += kml;
      curr.count += 1;
      if (f.is_flagged_anomaly) curr.anomaly = true;
      map.set(label, curr);
    }
    return Array.from(map.entries()).map(([label, v]) => ({
      label,
      value: v.sum / v.count,
      color: v.anomaly ? "#dc1e28" : "#059669",
      subtitle: v.anomaly ? "Fuel anomaly flagged" : "Normal consumption",
    }));
  }, [fuelTxns, vehicleNameById]);

  const ticketHeatmap = useMemo(() => {
    const cats = ["TECHNICAL", "BILLING", "WARRANTY_RMA", "DELIVERY", "GENERAL"];
    const pris = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const counts = new Map<string, number>();
    for (const t of tickets) {
      const c = String(t.category || "GENERAL");
      const p = String(t.priority || "MEDIUM");
      counts.set(`${c}|${p}`, (counts.get(`${c}|${p}`) || 0) + 1);
    }
    if (tickets.length === 0) return [];
    const cells = [];
    for (const r of cats) {
      for (const c of pris) {
        cells.push({ row: r, col: c, value: counts.get(`${r}|${c}`) || 0 });
      }
    }
    return cells;
  }, [tickets]);

  const ticketStatusDonut = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tickets) {
      const s = String(t.status || "OPEN");
      map.set(s, (map.get(s) || 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [tickets]);

  const totalFuel = fuelTxns.reduce((s, f) => s + (Number(f.total_cost) || 0), 0);
  const totalMaint = mows.reduce((s, m) => s + (Number(m.total_cost || m.labor_cost) || 0), 0);
  const escalatedCount = tickets.filter((t) => t.is_escalated || t.status === "ESCALATED").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-secondary)]">
          Fleet Total Cost of Ownership (Fuel + Maintenance), km/L efficiency anomalies, and Service Desk SLA matrices.
        </p>
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={fleetTcoRows.length === 0}
            onClick={() => downloadCsv(fleetTcoRows, "fleet-tco-report.csv")}
          >
            <Download className="h-3.5 w-3.5" />
            Fleet TCO CSV
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void refresh()}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fleet Assets" value={vehicles.length} subtext={`${vehicles.filter((v) => v.is_dispatch_blocked_compliance).length} compliance blocked`} icon={Truck} tone="info" />
        <StatCard label="Fuel + Maintenance Spend" value={formatCurrency(totalFuel + totalMaint, currency)} tone="brand" />
        <StatCard label="Support Tickets" value={tickets.length} subtext={`${escalatedCount} SLA escalated`} icon={Headphones} tone={escalatedCount > 0 ? "danger" : "neutral"} />
        <StatCard label="Average CSAT" value={sdMetrics?.average_csat !== undefined ? `${String(sdMetrics.average_csat)} / 5` : "—"} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Fleet TCO Cost Breakdown by Vehicle</h3>
          <D3StackedBarChart
            data={fleetTcoRows}
            categoryKey="vehicle"
            mode="stacked"
            height={250}
            formatValue={(v) => formatCurrency(v, currency)}
            series={[
              { key: "fuel", label: "Fuel Cost", color: "#d97706" },
              { key: "maintenance", label: "Maintenance MOW", color: "#dc1e28" },
            ]}
            title="Fleet TCO by Vehicle"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Vehicle Fuel Efficiency (km/L)</h3>
          <D3BarChart
            data={fuelEfficiencyBars}
            height={250}
            formatValue={(v) => `${v.toFixed(2)} km/L`}
            title="Fuel Economy"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Service Desk Category × Priority Matrix</h3>
          <D3HeatmapChart
            data={ticketHeatmap}
            rows={["TECHNICAL", "BILLING", "WARRANTY_RMA", "DELIVERY", "GENERAL"]}
            cols={["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
            height={240}
            formatValue={(v) => `${v} tickets`}
            title="Support Category Priority Heatmap"
          />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold">Support Tickets by Status</h3>
          <D3DonutChart
            data={ticketStatusDonut}
            size={195}
            centerLabel="Tickets"
            centerValue={String(tickets.length)}
            formatValue={(v) => `${v} tickets`}
            title="Tickets by Status"
          />
        </Card>
      </div>
    </div>
  );
}
