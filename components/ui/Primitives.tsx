"use client";

import React, { useEffect } from "react";
import { Loader2, X, Copy, Download } from "lucide-react";
import { cn, downloadJson, statusTone, toneClasses, type BadgeTone } from "@/lib/format";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const variants = {
    primary:
      "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-xs border border-transparent",
    secondary:
      "bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] border border-transparent",
    outline:
      "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] border border-transparent",
    danger:
      "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-xs",
  };

  const sizes = {
    xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-9 px-3.5 text-sm rounded-lg gap-2",
    lg: "h-11 px-5 text-sm rounded-xl gap-2",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone,
  status,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  status?: unknown;
  className?: string;
}) {
  const resolved = tone ?? statusTone(status ?? children);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap",
        toneClasses(resolved),
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const iconColors: Record<string, string> = {
    brand: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-1.5 truncate font-mono text-xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums sm:text-2xl">
            {value}
          </p>
          {subtext && (
            <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconColors[tone]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "max-w-2xl",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl sm:rounded-2xl",
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)] px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-xs text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="divide-y divide-[var(--border-subtle)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 px-4 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 animate-pulse rounded bg-[var(--bg-muted)]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function JsonViewer({
  data,
  title,
  filename = "bizzrious-export.json",
}: {
  data: unknown;
  title?: string;
  filename?: string;
}) {
  const copy = () => {
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2">
        <span className="text-xs font-medium text-slate-400">
          {title || "JSON Payload"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={() => downloadJson(data, filename)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
      <pre className="max-h-96 overflow-auto p-3.5 font-mono text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function AuditDiffViewer({
  beforeState,
  afterState,
}: {
  beforeState: unknown;
  afterState: unknown;
}) {
  const beforeObj =
    beforeState && typeof beforeState === "object"
      ? (beforeState as Record<string, unknown>)
      : {};
  const afterObj =
    afterState && typeof afterState === "object"
      ? (afterState as Record<string, unknown>)
      : {};
  const keys = Array.from(
    new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])
  );

  if (keys.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        No structured state diff recorded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[var(--bg-muted)] text-[var(--text-secondary)]">
          <tr>
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Before State</th>
            <th className="px-3 py-2 font-semibold">After State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {keys.map((key) => {
            const b = JSON.stringify(beforeObj[key] ?? null);
            const a = JSON.stringify(afterObj[key] ?? null);
            const changed = b !== a;
            return (
              <tr
                key={key}
                className={changed ? "bg-amber-50/40 dark:bg-amber-500/5" : ""}
              >
                <td className="px-3 py-2 font-mono font-medium text-[var(--text-primary)]">
                  {key}
                </td>
                <td className="px-3 py-2 font-mono text-red-700 dark:text-red-300 break-all">
                  {b}
                </td>
                <td className="px-3 py-2 font-mono text-emerald-700 dark:text-emerald-300 break-all">
                  {a}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
