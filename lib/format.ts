import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: string | number | null | undefined,
  currency = "LKR"
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatNumber(
  value: string | number | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

export function statusTone(raw: unknown): BadgeTone {
  const s = String(raw ?? "").toUpperCase();
  if (
    [
      "ACTIVE",
      "APPROVED",
      "COMPLETED",
      "PAID",
      "POSTED",
      "ISSUED",
      "DELIVERED",
      "RECEIVED",
      "RESOLVED",
      "CLOSED",
      "HIRED",
      "IN_STOCK",
      "PASSED",
      "TRUE",
      "OK",
      "MATCHED",
      "ON_TIME",
    ].includes(s)
  ) {
    return "success";
  }
  if (
    [
      "TRIAL",
      "PENDING",
      "DRAFT",
      "IN_TRANSIT",
      "IN_PROGRESS",
      "IN_QUARANTINE",
      "OPEN",
      "PLACED",
      "PROCESSING",
      "PAST_DUE",
      "QUEUED",
      "APPLIED",
      "PARTIAL",
    ].includes(s)
  ) {
    return "warning";
  }
  if (
    [
      "DISCONTINUED",
      "BANNED",
      "SUSPENDED",
      "REJECTED",
      "CANCELLED",
      "VOID",
      "FAILED",
      "EXPIRED",
      "ESCALATED",
      "CRITICAL",
      "DELAYED",
      "DAMAGED",
      "OVERDUE",
      "RECALLED",
      "SCRAP",
      "HIGH",
      "FALSE",
      "TEMPERATURE_BREACHED",
    ].includes(s)
  ) {
    return "danger";
  }
  if (["CREDIT_NOTE", "REVERSED", "MAINTENANCE", "SENT", "AWARDED"].includes(s)) {
    return "brand";
  }
  if (["IN_APP", "EMAIL", "SMS", "TAX_INVOICE", "SVAT_INVOICE"].includes(s)) {
    return "info";
  }
  return "neutral";
}

export function toneClasses(tone: BadgeTone): string {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
    case "warning":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
    case "danger":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30";
    case "info":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";
    case "brand":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/50";
  }
}

export function downloadJson(data: unknown, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  rows: Record<string, unknown>[],
  filename: string
): void {
  if (typeof window === "undefined" || rows.length === 0) return;
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (val: unknown) => {
    const str =
      val === null || val === undefined
        ? ""
        : typeof val === "object"
          ? JSON.stringify(val)
          : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
