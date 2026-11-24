"use client";

import React, { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/format";

export interface ModuleTab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

const subscribePopState = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function ModuleTabShell({
  title,
  subtitle,
  tabs,
  defaultTab,
  headerActions,
}: {
  title: string;
  subtitle: string;
  tabs: ModuleTab[];
  defaultTab?: string;
  headerActions?: React.ReactNode;
}) {
  const urlTab = useSyncExternalStore(
    subscribePopState,
    () => new URLSearchParams(window.location.search).get("tab"),
    () => null
  );
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  const resolvedTabId =
    selectedTab ??
    (urlTab && tabs.some((t) => t.id === urlTab) ? urlTab : null) ??
    defaultTab ??
    tabs[0]?.id ??
    "";

  const selectTab = (id: string) => {
    setSelectedTab(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const current = tabs.find((t) => t.id === resolvedTabId) || tabs[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </div>
        {headerActions && <div className="flex flex-wrap gap-2">{headerActions}</div>}
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          role="tablist"
          className="inline-flex min-w-full gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 sm:min-w-0"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                  active
                    ? "bg-[var(--brand-primary)] text-white shadow-2xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>{current?.content}</div>
    </div>
  );
}
