"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Clock,
  CreditCard,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { api, ApiError, extractList } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { cn, formatCurrency, formatDateTime } from "@/lib/format";
import { posOrdersResource, posShiftsResource } from "@/lib/resources";
import type { UniversalScanResult } from "@/lib/types";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";
import { Badge, Button, Card, Modal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";

interface CartLine {
  productId: number;
  sku: string;
  name: string;
  uom_code: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
}

function PosRegisterTerminal() {
  const { user, activeCompanyId, activeBranchId, companies, isAuditor } = useAuth();
  const toast = useToast();

  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [openShift, setOpenShift] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [mobilePane, setMobilePane] = useState<"catalog" | "cart">("catalog");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [orderDiscount, setOrderDiscount] = useState("0.00");
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState("0");
  const [offlineSynced, setOfflineSynced] = useState(false);

  const [openingCash, setOpeningCash] = useState("10000.00");
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<Record<string, unknown> | null>(null);

  const company = companies.find((c) => c.id === activeCompanyId);
  const currency = company?.base_currency || "LKR";

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get("/api/inventory/products/", { page_size: 100 }),
      api.get("/api/customers/", { page_size: 100 }),
      api.get("/api/inventory/pos/shifts/", { status: "OPEN" }),
    ]).then(([prodRes, custRes, shiftRes]) => {
      if (!active) return;
      if (prodRes.status === "fulfilled") setProducts(extractList(prodRes.value as never).items);
      if (custRes.status === "fulfilled") setCustomers(extractList(custRes.value as never).items);
      if (shiftRes.status === "fulfilled") {
        const shifts = extractList(shiftRes.value as never).items;
        setOpenShift(shifts.find((s) => s.status === "OPEN") || shifts[0] || null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const addProductToCart = (p: Record<string, unknown>) => {
    const id = Number(p.id);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === id);
      if (existing) {
        return prev.map((l) =>
          l.productId === id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: id,
          sku: String(p.sku || ""),
          name: String(p.name || `Product #${id}`),
          uom_code: String(p.unit_of_measure || "PCS"),
          quantity: 1,
          unit_price: Number(p.selling_price || 0),
          discount_amount: 0,
          tax_rate: Number(p.tax_rate || 0),
        },
      ];
    });
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    try {
      const res = await api.get<UniversalScanResult>("/api/inventory/scan/", {
        code: scanCode.trim(),
      });
      if (res.product) {
        addProductToCart(res.product);
        toast.success("Scanned item added", String(res.product.name));
        setScanCode("");
      } else {
        toast.warning("No product matched scanned code", scanCode);
      }
    } catch (err) {
      toast.error(
        "Scan lookup failed",
        err instanceof ApiError ? err.message : "Code not found"
      );
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant || !activeBranchId) {
      toast.error("Branch required", "Please select an active branch first.");
      return;
    }
    try {
      const created = await api.post<Record<string, unknown>>("/api/inventory/pos/shifts/", {
        tenant: user.tenant,
        branch: activeBranchId,
        opening_cash: openingCash,
      });
      setOpenShift(created);
      setShiftModalOpen(false);
      toast.success("POS Cash Drawer Shift Opened");
    } catch (err) {
      toast.error("Unable to open shift", err instanceof Error ? err.message : "Error");
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.sku || "").toLowerCase().includes(q) ||
        String(p.barcode || "").toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const subtotal = cart.reduce(
    (sum, l) => sum + l.quantity * l.unit_price - l.discount_amount,
    0
  );
  const taxTotal = cart.reduce(
    (sum, l) =>
      sum + ((l.quantity * l.unit_price - l.discount_amount) * l.tax_rate) / 100,
    0
  );
  const discNum = Number(orderDiscount) || 0;
  const rawTotal = Math.max(0, subtotal + taxTotal - discNum);
  const grandTotal = company?.round_to_nearest_rupee ? Math.round(rawTotal) : rawTotal;

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);
  const isCustomerBanned = Boolean(selectedCustomer?.is_banned);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user?.tenant || !activeCompanyId || !activeBranchId) {
      toast.error("Company & Branch required", "Select active Company and Branch in header.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        tenant: user.tenant,
        company: activeCompanyId,
        branch: activeBranchId,
        shift: openShift?.id ?? undefined,
        customer: customerId ? Number(customerId) : undefined,
        payment_method: paymentMethod,
        discount_amount: Number(orderDiscount || 0).toFixed(2),
        loyalty_points_redeemed: Number(loyaltyRedeemed || 0),
        is_offline_synced: offlineSynced,
        offline_receipt_uid: offlineSynced ? `OFF-${Date.now()}` : undefined,
        lines: cart.map((l) => ({
          product: l.productId,
          uom_code: l.uom_code,
          quantity: l.quantity.toFixed(2),
          unit_price: l.unit_price.toFixed(2),
          discount_amount: l.discount_amount.toFixed(2),
        })),
      };
      const order = await api.post<Record<string, unknown>>(
        "/api/inventory/pos/orders/",
        payload
      );
      toast.success("POS Sale Completed", `Receipt ${String(order.receipt_number || order.id)}`);
      setReceiptData(order);
      setCart([]);
      setOrderDiscount("0.00");
      setLoyaltyRedeemed("0");
    } catch (err) {
      toast.error(
        "Checkout failed",
        err instanceof ApiError ? err.message : "Could not complete POS sale."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Shift & Scanner Header Bar */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleBarcodeScan} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan Barcode / QR / SKU and press Enter..."
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2 pl-9 pr-3 font-mono text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>
            <Button type="submit" variant="secondary">
              Scan Add
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {openShift ? (
              <Badge tone="success">
                Shift #{String(openShift.id)} Open • Float{" "}
                {formatCurrency(openShift.opening_cash as string, currency)}
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={isAuditor}
                onClick={() => setShiftModalOpen(true)}
              >
                <Clock className="h-4 w-4" />
                Open Cash Shift
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Pane Switcher */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        <Button
          variant={mobilePane === "catalog" ? "primary" : "outline"}
          onClick={() => setMobilePane("catalog")}
        >
          Catalog ({filteredProducts.length})
        </Button>
        <Button
          variant={mobilePane === "cart" ? "primary" : "outline"}
          onClick={() => setMobilePane("cart")}
        >
          <ShoppingCart className="h-4 w-4" />
          Cart ({cart.reduce((s, l) => s + l.quantity, 0)})
        </Button>
      </div>

      {/* Responsive Split POS Register */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Product Catalog */}
        <div
          className={cn(
            "space-y-3 lg:col-span-7 xl:col-span-8",
            mobilePane !== "catalog" && "hidden lg:block"
          )}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter catalog by product name, SKU, or barcode..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <button
                key={String(p.id)}
                type="button"
                onClick={() => addProductToCart(p)}
                className="flex cursor-pointer flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 text-left transition-all hover:border-[var(--brand-primary)] hover:shadow-sm"
              >
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)]">
                    {String(p.sku || "")}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-[var(--text-primary)]">
                    {String(p.name)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-[var(--brand-primary)] tabular-nums">
                    {formatCurrency(p.selling_price as string, currency)}
                  </span>
                  <Badge tone="neutral">{String(p.unit_of_measure || "PCS")}</Badge>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-xs text-[var(--text-muted)]">
                No products loaded. Create products in Inventory or verify API connection.
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout */}
        <Card
          className={cn(
            "flex flex-col justify-between p-4 lg:col-span-5 xl:col-span-4",
            mobilePane !== "cart" && "hidden lg:flex"
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <ShoppingCart className="h-4 w-4 text-[var(--brand-primary)]" />
                Current Basket
              </h2>
              {cart.length > 0 && (
                <Button size="xs" variant="ghost" onClick={() => setCart([])}>
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Customer (Optional for Walk-In)
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
              >
                <option value="">Walk-In Retail Customer</option>
                {customers.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {String(c.name)} ({String(c.customer_code)})
                    {c.is_banned ? " [BANNED]" : ""}
                  </option>
                ))}
              </select>
              {isCustomerBanned && (
                <p className="text-xs font-semibold text-red-600">
                  Warning: This customer is banned and checkout will be rejected (403).
                </p>
              )}
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="py-10 text-center text-xs text-[var(--text-muted)]">
                  Tap a product or scan a barcode to start a sale.
                </p>
              ) : (
                cart.map((line) => (
                  <div
                    key={line.productId}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {line.name}
                        </p>
                        <p className="font-mono text-[11px] text-[var(--text-muted)]">
                          {line.sku} • {formatCurrency(line.unit_price, currency)} / {line.uom_code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter((l) => l.productId !== line.productId)
                          )
                        }
                        className="text-[var(--text-muted)] hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) =>
                              prev
                                .map((l) =>
                                  l.productId === line.productId
                                    ? { ...l, quantity: l.quantity - 1 }
                                    : l
                                )
                                .filter((l) => l.quantity > 0)
                            )
                          }
                          className="rounded border border-[var(--border-subtle)] p-1 hover:bg-[var(--bg-surface)]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((prev) =>
                              prev.map((l) =>
                                l.productId === line.productId
                                  ? { ...l, quantity: l.quantity + 1 }
                                  : l
                              )
                            )
                          }
                          className="rounded border border-[var(--border-subtle)] p-1 hover:bg-[var(--bg-surface)]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono font-bold tabular-nums">
                        {formatCurrency(
                          line.quantity * line.unit_price - line.discount_amount,
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-[var(--text-muted)]">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE_QR">Mobile QR</option>
                  <option value="SPLIT">Split</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-muted)]">Order Discount</label>
                <input
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={offlineSynced}
                  onChange={(e) => setOfflineSynced(e.target.checked)}
                  className="accent-[var(--brand-primary)]"
                />
                Offline Queue Sync Mode
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">Redeem Pts:</span>
                <input
                  type="number"
                  value={loyaltyRedeemed}
                  onChange={(e) => setLoyaltyRedeemed(e.target.value)}
                  className="w-16 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1 rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Tax (VAT)</span>
                <span className="font-mono">{formatCurrency(taxTotal, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-subtle)] pt-1.5 text-sm font-extrabold text-[var(--text-primary)]">
                <span>Total Due</span>
                <span className="font-mono text-[var(--brand-primary)]">
                  {formatCurrency(grandTotal, currency)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={cart.length === 0 || isAuditor}
              loading={submitting}
              onClick={handleCheckout}
            >
              <CreditCard className="h-4 w-4" />
              Complete Sale & Issue Receipt
            </Button>
          </div>
        </Card>
      </div>

      {/* Open Shift Modal */}
      <Modal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        title="Open POS Cash Drawer Shift"
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShiftModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="open-shift-form">
              Open Shift
            </Button>
          </>
        }
      >
        <form id="open-shift-form" onSubmit={handleOpenShift} className="space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Opening Cash Float ({currency})
          </label>
          <input
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-sm"
          />
        </form>
      </Modal>

      {/* Printable POS Receipt Modal */}
      <Modal
        open={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        title="POS Sales Receipt"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button onClick={() => setReceiptData(null)}>Done</Button>
          </>
        }
      >
        {receiptData && (
          <div className="print-document space-y-3 font-mono text-xs">
            <div className="border-b border-dashed border-[var(--border-strong)] pb-3 text-center">
              <p className="text-base font-extrabold">BIZZRIOUS ERP POS</p>
              <p>{company?.legal_name || company?.name || "Retail Store"}</p>
              <p>Receipt: {String(receiptData.receipt_number || receiptData.id)}</p>
              <p>{formatDateTime(String(receiptData.created_at || ""))}</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(receiptData.subtotal as string, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{formatCurrency(receiptData.discount_amount as string, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(receiptData.tax_amount as string, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-[var(--border-strong)] pt-1.5 text-sm font-bold">
                <span>GRAND TOTAL</span>
                <span>{formatCurrency(receiptData.grand_total as string, currency)}</span>
              </div>
            </div>
            {Boolean(receiptData.provisional_receipt_note) && (
              <p className="rounded bg-amber-50 p-2 text-[11px] text-amber-800">
                {String(receiptData.provisional_receipt_note)}
              </p>
            )}
            <p className="text-center text-[11px] text-[var(--text-muted)]">
              Loyalty Points Earned: {String(receiptData.loyalty_points_earned ?? 0)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function PosPage() {
  return (
    <ModuleTabShell
      title="Point of Sale (ERP-POS)"
      subtitle="Real-time barcode POS register, offline queue sync, loyalty points, cash drawer shifts, and returns/voids."
      tabs={[
        {
          id: "register",
          label: "POS Terminal",
          icon: ShoppingCart,
          content: <PosRegisterTerminal />,
        },
        {
          id: "shifts",
          label: "Cash Drawer Shifts",
          icon: Clock,
          content: <ResourceWorkspace config={posShiftsResource} />,
        },
        {
          id: "orders",
          label: "POS Orders & Returns",
          icon: Receipt,
          content: <ResourceWorkspace config={posOrdersResource} />,
        },
      ]}
    />
  );
}
