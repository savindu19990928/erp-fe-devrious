"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/format";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: {
    title: string;
    description?: string;
    variant?: ToastVariant;
    durationMs?: number;
  }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "info",
      durationMs = 4800,
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
      durationMs?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev.slice(-4), { id, title, description, variant }]);
      if (durationMs > 0) {
        setTimeout(() => dismiss(id), durationMs);
      }
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    toast,
    success: (title, description) => toast({ title, description, variant: "success" }),
    error: (title, description) =>
      toast({ title, description, variant: "error", durationMs: 7000 }),
    info: (title, description) => toast({ title, description, variant: "info" }),
    warning: (title, description) =>
      toast({ title, description, variant: "warning", durationMs: 6000 }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {items.map((item) => {
          const Icon =
            item.variant === "success"
              ? CheckCircle2
              : item.variant === "error"
                ? AlertCircle
                : item.variant === "warning"
                  ? AlertTriangle
                  : Info;

          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg backdrop-blur-md transition-all",
                "bg-[var(--bg-surface)] text-[var(--text-primary)]",
                item.variant === "success" &&
                  "border-emerald-300 dark:border-emerald-500/40",
                item.variant === "error" &&
                  "border-red-300 dark:border-red-500/40",
                item.variant === "warning" &&
                  "border-amber-300 dark:border-amber-500/40",
                item.variant === "info" &&
                  "border-[var(--border-subtle)]"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  item.variant === "success" && "text-emerald-600 dark:text-emerald-400",
                  item.variant === "error" && "text-red-600 dark:text-red-400",
                  item.variant === "warning" && "text-amber-600 dark:text-amber-400",
                  item.variant === "info" && "text-blue-600 dark:text-blue-400"
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{item.title}</p>
                {item.description && (
                  <p className="mt-1 break-words text-xs leading-relaxed text-[var(--text-secondary)]">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
