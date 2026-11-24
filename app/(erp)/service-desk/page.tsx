"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Headphones, MessageSquarePlus, RefreshCw, Star } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  contractsResource,
  knowledgeBaseResource,
  ticketsResource,
} from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Badge, Button, Card, JsonViewer } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

function TicketInspectorExtra({
  row,
  onDone,
}: {
  row: Record<string, unknown>;
  onDone: () => void;
}) {
  const toast = useToast();
  const [msgText, setMsgText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setBusy(true);
    try {
      await api.post(`/api/service-desk/tickets/${row.id}/add-message/`, {
        message: msgText,
        body: msgText,
        is_internal: isInternal,
      });
      toast.success("Message added to ticket");
      setMsgText("");
      onDone();
    } catch (err) {
      toast.error("Failed to send message", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/service-desk/tickets/${row.id}/submit-feedback/`, {
        satisfaction_rating: rating,
        customer_feedback: feedback,
      });
      toast.success("Customer CSAT Feedback Recorded");
      setFeedback("");
      onDone();
    } catch (err) {
      toast.error("Failed to record CSAT", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const messages = Array.isArray(row.messages)
    ? (row.messages as Record<string, unknown>[])
    : [];
  const purchaseHistory = Array.isArray(row.customer_purchase_history)
    ? (row.customer_purchase_history as Record<string, unknown>[])
    : [];

  return (
    <div className="space-y-4">
      {purchaseHistory.length > 0 && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 text-xs">
          <p className="mb-2 font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            CRM Purchase History
          </p>
          <div className="space-y-1.5">
            {purchaseHistory.map((inv, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-mono font-semibold">
                  {String(inv.sequential_number || inv.id)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{String(inv.grand_total || "")}</span>
                  <Badge status={inv.status}>{String(inv.status || "")}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Ticket Thread ({messages.length})
        </p>
        {messages.length > 0 && (
          <div className="max-h-44 space-y-2 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>{String(m.sender_username || m.author || "Agent")}</span>
                  <span>{formatDateTime(String(m.created_at || ""))}</span>
                </div>
                <p className="mt-1">{String(m.message || m.body || "")}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} className="space-y-2">
          <textarea
            rows={2}
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Write a customer reply or internal escalation note..."
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="accent-[var(--brand-primary)]"
              />
              Internal Staff Note
            </label>
            <Button type="submit" size="xs" loading={busy}>
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Post Reply
            </Button>
          </div>
        </form>
      </div>

      <form
        onSubmit={sendFeedback}
        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 space-y-2"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Submit CSAT Feedback (1-5)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Customer satisfaction comment..."
            className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs"
          />
          <Button type="submit" size="xs" variant="secondary" loading={busy}>
            <Star className="h-3.5 w-3.5" />
            Save CSAT
          </Button>
        </div>
      </form>
    </div>
  );
}

function ServiceDeskMetricsBanner() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Record<string, unknown>>("/api/service-desk/metrics/");
      setMetrics(res);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get<Record<string, unknown>>("/api/service-desk/metrics/")
      .then((res) => {
        if (active) setMetrics(res);
      })
      .catch(() => {
        if (active) setMetrics(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!metrics) return null;

  return (
    <Card className="mb-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Live Service Desk SLA Metrics (/api/service-desk/metrics/)
        </span>
        <Button size="xs" variant="ghost" onClick={() => void load()}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <JsonViewer data={metrics} title="Service-Level Metrics Snapshot" filename="sla-metrics.json" />
    </Card>
  );
}

export default function ServiceDeskPage() {
  return (
    <ModuleTabShell
      title="Customer Support & SLA Service Desk (ERP-SD)"
      subtitle="Multi-channel ticketing, 75% SLA auto-escalation, CRM purchase history, Knowledge Base, CSAT ratings & refund credit notes."
      tabs={[
        {
          id: "tickets",
          label: "Support Tickets & SLA",
          icon: Headphones,
          content: (
            <div>
              <ServiceDeskMetricsBanner />
              <ResourceWorkspace
                config={ticketsResource}
                renderDetailExtra={(row, refresh) => (
                  <TicketInspectorExtra row={row} onDone={refresh} />
                )}
              />
            </div>
          ),
        },
        { id: "contracts", label: "Support Contracts", content: <ResourceWorkspace config={contractsResource} /> },
        { id: "kb", label: "Knowledge Base", content: <ResourceWorkspace config={knowledgeBaseResource} /> },
      ]}
    />
  );
}
