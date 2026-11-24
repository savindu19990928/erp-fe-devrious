"use client";

import React, { useEffect, useState } from "react";
import { Plus, Route, ShieldAlert, Trash2, Truck } from "lucide-react";
import { api, extractList } from "@/lib/api-client";
import {
  accidentsResource,
  carriersResource,
  complianceDocsResource,
  driversResource,
  dtcAlertsResource,
  dvirsResource,
  freightShipmentsResource,
  fuelTransactionsResource,
  geofencesResource,
  maintenanceOrdersResource,
  telemetryLogsResource,
  tollsFinesResource,
  tripsResource,
  vehiclesResource,
} from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Badge, Button, Card, JsonViewer } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

function FleetCommandAndOptimizer() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Record<string, unknown>[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [stops, setStops] = useState([
    { stop_order: 1, address: "Negombo Branch", weight_kg: "450.00" },
    { stop_order: 2, address: "Chilaw Store", weight_kg: "600.00" },
  ]);
  const [routeResult, setRouteResult] = useState<Record<string, unknown> | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    api
      .get("/api/inventory/fleet/vehicles/", { page_size: 100 })
      .then((res) => {
        const list = extractList(res as never).items;
        setVehicles(list);
        setSelectedVehicleIds(list.slice(0, 3).map((v) => Number(v.id)));
      })
      .catch(() => {});
  }, []);

  const toggleVehicle = (id: number) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const optimize = async () => {
    setOptimizing(true);
    try {
      const res = await api.post<Record<string, unknown>>(
        "/api/inventory/fleet/trips/optimize-routes/",
        {
          vehicle_ids: selectedVehicleIds,
          stops: stops.map((s, idx) => ({
            stop_order: idx + 1,
            address: s.address,
            weight_kg: s.weight_kg,
          })),
        }
      );
      setRouteResult(res);
      toast.success("Routes Optimized Across Fleet Capacity");
    } catch (err) {
      toast.error("Route optimization failed", err instanceof Error ? err.message : "Error");
    } finally {
      setOptimizing(false);
    }
  };

  const runComplianceSweep = async () => {
    try {
      const res = await api.post<Record<string, unknown>>(
        "/api/inventory/fleet/compliance-documents/check-compliance/",
        {}
      );
      toast.success("60-Day Fleet Compliance Check Completed");
      setRouteResult(res);
    } catch (err) {
      toast.error("Compliance check failed", err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">
              Multi-Stop Route Optimization & Compliance Sweep
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Assign delivery stops across available vehicles respecting payload capacity (FLT-09).
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={runComplianceSweep}>
            <ShieldAlert className="h-4 w-4 text-[var(--brand-primary)]" />
            Run 60-Day Compliance Check
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Select Fleet Vehicles ({selectedVehicleIds.length} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {vehicles.map((v) => {
              const id = Number(v.id);
              const active = selectedVehicleIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleVehicle(id)}
                  className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-text)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  {String(v.registration_number)} ({String(v.capacity_kg)} kg)
                </button>
              );
            })}
            {vehicles.length === 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                Add vehicles in the Vehicles tab first.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Delivery Stops
            </label>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                setStops((prev) => [
                  ...prev,
                  { stop_order: prev.length + 1, address: "", weight_kg: "250.00" },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add Stop
            </Button>
          </div>
          <div className="space-y-2">
            {stops.map((stop, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">#{idx + 1}</Badge>
                <input
                  value={stop.address}
                  onChange={(e) =>
                    setStops((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, address: e.target.value } : s))
                    )
                  }
                  placeholder="Delivery Stop Address"
                  className="flex-1 min-w-[200px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs"
                />
                <input
                  value={stop.weight_kg}
                  onChange={(e) =>
                    setStops((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, weight_kg: e.target.value } : s))
                    )
                  }
                  placeholder="Weight (kg)"
                  className="w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setStops((prev) => prev.filter((_, i) => i !== idx))}
                  className="rounded p-1.5 text-[var(--text-muted)] hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={optimize}
          loading={optimizing}
          disabled={selectedVehicleIds.length === 0 || stops.length === 0}
        >
          <Route className="h-4 w-4" />
          Optimize Multi-Stop Routes
        </Button>

        {routeResult && (
          <JsonViewer
            data={routeResult}
            title="Fleet Route / Compliance Output"
            filename="fleet-output.json"
          />
        )}
      </Card>
    </div>
  );
}

export default function FleetPage() {
  return (
    <ModuleTabShell
      title="Fleet & Transportation Management (FLT-01 to FLT-42)"
      subtitle="Multi-asset registry, compliance 60-day blocks, ELD 10h drivers, live GPS geofencing, route replay, DVIR/DTC maintenance, fuel anomaly reconciliation & 3PL."
      tabs={[
        { id: "optimizer", label: "Route Optimizer", icon: Truck, content: <FleetCommandAndOptimizer /> },
        { id: "vehicles", label: "Vehicles & Assets", content: <ResourceWorkspace config={vehiclesResource} /> },
        { id: "trips", label: "Delivery Trips", content: <ResourceWorkspace config={tripsResource} /> },
        { id: "drivers", label: "Drivers & ELD", content: <ResourceWorkspace config={driversResource} /> },
        { id: "compliance", label: "Compliance Docs", content: <ResourceWorkspace config={complianceDocsResource} /> },
        { id: "maintenance", label: "Maintenance MOWs", content: <ResourceWorkspace config={maintenanceOrdersResource} /> },
        { id: "dvirs", label: "DVIRs", content: <ResourceWorkspace config={dvirsResource} /> },
        { id: "dtc", label: "DTC Alerts", content: <ResourceWorkspace config={dtcAlertsResource} /> },
        { id: "fuel", label: "Fuel Cards", content: <ResourceWorkspace config={fuelTransactionsResource} /> },
        { id: "geofences", label: "Geofences", content: <ResourceWorkspace config={geofencesResource} /> },
        { id: "telemetry", label: "GPS Telemetry", content: <ResourceWorkspace config={telemetryLogsResource} /> },
        { id: "tolls-fines", label: "Tolls & Fines", content: <ResourceWorkspace config={tollsFinesResource} /> },
        { id: "accidents", label: "Accidents", content: <ResourceWorkspace config={accidentsResource} /> },
        { id: "carriers", label: "3PL Carriers", content: <ResourceWorkspace config={carriersResource} /> },
        { id: "freight", label: "Freight Shipments", content: <ResourceWorkspace config={freightShipmentsResource} /> },
      ]}
    />
  );
}
