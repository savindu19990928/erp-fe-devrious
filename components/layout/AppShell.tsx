"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Command,
  CreditCard,
  Globe,
  Headphones,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  UserCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn, formatDateTime } from "@/lib/format";
import { Badge, Button } from "@/components/ui/Primitives";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  keywords?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Executive Overview", icon: LayoutDashboard, group: "Core", keywords: "dashboard kpi home" },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3, group: "Core", keywords: "d3 charts visualizations pnl vat payroll inventory fleet sla" },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart, group: "Operations", keywords: "cashier register receipt shift" },
  { href: "/finance", label: "Finance & Accounting", icon: Landmark, group: "Operations", keywords: "vat svat ramis gl ledger invoice bill" },
  { href: "/hr", label: "HR & Payroll", icon: UserCheck, group: "Operations", keywords: "epf etf apit ird7 employees leave" },
  { href: "/inventory", label: "Inventory & Warehouse", icon: Package, group: "Supply Chain", keywords: "stock barcode qr bom mrp cold chain" },
  { href: "/procurement", label: "Procurement", icon: ShoppingBag, group: "Supply Chain", keywords: "requisition rfq po grn 3-way match" },
  { href: "/fleet", label: "Fleet & Logistics", icon: Truck, group: "Supply Chain", keywords: "gps telemetry dvir eld fuel carrier" },
  { href: "/ecommerce", label: "E-Commerce", icon: Globe, group: "Operations", keywords: "online orders storefront returns" },
  { href: "/service-desk", label: "Service Desk", icon: Headphones, group: "Customer", keywords: "tickets sla escalation kb csat" },
  { href: "/partners", label: "Customers & Suppliers", icon: Users, group: "Customer", keywords: "crm credit limit ban vendors" },
  { href: "/platform", label: "SaaS Billing & Tenants", icon: CreditCard, group: "Administration", keywords: "subscription overdue 2-month plans" },
  { href: "/organization", label: "Companies & Users", icon: Building2, group: "Administration", keywords: "branches roles rbac permissions" },
  { href: "/governance", label: "Workflows & Audit", icon: ShieldCheck, group: "Administration", keywords: "approvals notifications webhooks logs" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Administration", keywords: "profile theme preferences" },
];

const GROUPS = ["Core", "Operations", "Supply Chain", "Customer", "Administration"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    tenant,
    companies,
    branches,
    activeCompanyId,
    activeBranchId,
    setActiveCompanyId,
    setActiveBranchId,
    notifications,
    markNotificationRead,
    theme,
    toggleTheme,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status !== "READ").length,
    [notifications]
  );

  const filteredCmds = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q) ||
        (i.keywords || "").toLowerCase().includes(q)
    );
  }, [cmdQuery]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const renderSidebarNav = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] text-slate-200">
      <div className="flex h-16 items-center justify-between border-b border-[var(--sidebar-border)] px-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bizzrious-logo.png"
            alt="Bizzrious Logo"
            className="h-9 w-9 shrink-0 rounded-full object-contain shadow-sm"
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-white">
                Bizzrious
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Enterprise ERP
              </p>
            </div>
          )}
        </Link>
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          return (
            <div key={group}>
              {(!collapsed || isMobile) && (
                <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMobileOpen(false);
                        setNotifOpen(false);
                      }}
                      title={collapsed && !isMobile ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[var(--brand-primary)] text-white shadow-sm"
                          : "text-slate-300 hover:bg-[var(--sidebar-surface)] hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {(!collapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-3">
        {(!collapsed || isMobile) && user && (
          <div className="mb-2.5 rounded-xl bg-[var(--sidebar-surface)] p-2.5">
            <p className="truncate text-xs font-semibold text-white">
              {user.first_name || user.username} {user.last_name}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {user.tenant_name || "Global Platform"}
            </p>
            <div className="mt-1.5">
              <Badge tone="brand">{user.role}</Badge>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700/70 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "no-print hidden shrink-0 border-r border-[var(--sidebar-border)] transition-all duration-200 lg:block",
          collapsed ? "w-[74px]" : "w-64"
        )}
      >
        <div className="sticky top-0 h-screen">{renderSidebarNav(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl">
            {renderSidebarNav(true)}
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--text-primary)] hover:bg-[var(--bg-muted)] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] sm:w-64"
              >
                <Command className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="hidden truncate sm:inline">Jump to any module...</span>
                <span className="sm:hidden">Jump</span>
                <kbd className="ml-auto hidden rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {companies.length > 0 && (
                <select
                  aria-label="Active Company"
                  value={activeCompanyId ?? ""}
                  onChange={(e) =>
                    setActiveCompanyId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="hidden max-w-[170px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] md:block"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.base_currency})
                    </option>
                  ))}
                </select>
              )}

              {branches.length > 0 && (
                <select
                  aria-label="Active Branch"
                  value={activeBranchId ?? ""}
                  onChange={(e) =>
                    setActiveBranchId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="hidden max-w-[150px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] xl:block"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Notifications ({unreadCount} unread)
                      </span>
                      <Link
                        href="/governance?tab=notifications"
                        className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "rounded-xl border p-2.5 text-xs",
                              n.status === "READ"
                                ? "border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-75"
                                : "border-red-200 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/10"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-[var(--text-primary)]">
                                {n.subject}
                              </p>
                              {n.status !== "READ" && (
                                <button
                                  type="button"
                                  onClick={() => void markNotificationRead(n.id)}
                                  className="shrink-0 text-[11px] font-semibold text-[var(--brand-primary)] hover:underline"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-[var(--text-secondary)]">
                              {n.message}
                            </p>
                            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                              {formatDateTime(n.created_at)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Toggle Light/Dark theme"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {tenant &&
            (tenant.subscription_status === "PAST_DUE" ||
              tenant.subscription_status === "DISCONTINUED") && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200 sm:px-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Subscription {tenant.subscription_status}:</strong>{" "}
                    {tenant.subscription_status === "DISCONTINUED"
                      ? "Services discontinued due to 2+ months overdue payment. Contact Platform Admin to record payment."
                      : `Payment is past due (${tenant.days_overdue ?? 0} days). Services auto-discontinue after 2 months overdue.`}
                  </span>
                </div>
                <Link
                  href="/platform"
                  className="font-semibold underline hover:no-underline"
                >
                  Open Billing
                </Link>
              </div>
            )}
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {cmdOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-[12vh] backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0" onClick={() => setCmdOpen(false)} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
              <Command className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Search Bizzrious ERP modules (Finance, POS, HR, Fleet, VAT, EPF)..."
                className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <Button size="xs" variant="ghost" onClick={() => setCmdOpen(false)}>
                Esc
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCmds.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      router.push(item.href);
                      setCmdOpen(false);
                      setCmdQuery("");
                    }}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span className="font-medium text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{item.group}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
