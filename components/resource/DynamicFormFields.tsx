"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, extractList } from "@/lib/api-client";
import { cn } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import type { FieldDef, LineColumnDef } from "@/lib/resources/types";
import { Button } from "@/components/ui/Primitives";

type RelationCache = Record<string, Array<Record<string, unknown>>>;

const inputCls =
  "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20";

export function buildInitialFormState(
  fields: FieldDef[],
  context: { tenantId: number | null; companyId: number | null; branchId: number | null },
  initialData?: Record<string, unknown> | null
): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (const f of fields) {
    if (initialData && initialData[f.name] !== undefined) {
      if (f.type === "json" && typeof initialData[f.name] === "object") {
        state[f.name] = JSON.stringify(initialData[f.name], null, 2);
      } else {
        state[f.name] = initialData[f.name];
      }
      continue;
    }

    if (f.autoFillContext === "tenant" && context.tenantId) {
      state[f.name] = context.tenantId;
    } else if (f.autoFillContext === "company" && context.companyId) {
      state[f.name] = context.companyId;
    } else if (f.autoFillContext === "branch" && context.branchId) {
      state[f.name] = context.branchId;
    } else if (f.defaultValue !== undefined) {
      if (f.type === "json" && typeof f.defaultValue === "object") {
        state[f.name] = JSON.stringify(f.defaultValue, null, 2);
      } else {
        state[f.name] = f.defaultValue;
      }
    } else if (f.type === "boolean") {
      state[f.name] = false;
    } else if (f.type === "lines") {
      const starterRow: Record<string, unknown> = {};
      (f.lineColumns || []).forEach((col) => {
        starterRow[col.name] =
          col.defaultValue !== undefined ? col.defaultValue : col.type === "boolean" ? false : "";
      });
      state[f.name] = [starterRow];
    } else {
      state[f.name] = "";
    }
  }
  return state;
}

export function serializeFormPayload(
  fields: FieldDef[],
  form: Record<string, unknown>,
  isEdit: boolean
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    if (isEdit && f.hideOnEdit) continue;
    if (f.type === "file") continue;
    const raw = form[f.name];

    if (f.type === "boolean") {
      payload[f.name] = Boolean(raw);
      continue;
    }

    if (f.type === "lines") {
      const rows = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
      payload[f.name] = rows
        .filter((row) =>
          Object.values(row).some((v) => v !== "" && v !== null && v !== undefined)
        )
        .map((row) => {
          const cleanRow: Record<string, unknown> = {};
          for (const col of f.lineColumns || []) {
            const val = row[col.name];
            if (col.type === "relation" || col.type === "number") {
              if (val !== "" && val !== null && val !== undefined) {
                const n = Number(val);
                cleanRow[col.name] = Number.isNaN(n) ? val : n;
              }
            } else if (col.type === "boolean") {
              cleanRow[col.name] = Boolean(val);
            } else if (val !== "" && val !== null && val !== undefined) {
              cleanRow[col.name] = String(val);
            }
          }
          return cleanRow;
        });
      continue;
    }

    if (raw === "" || raw === null || raw === undefined) {
      if (!f.required) continue;
    }

    if (f.type === "number" || f.type === "relation") {
      const num = Number(raw);
      if (!Number.isNaN(num) && raw !== "") {
        payload[f.name] = num;
      }
    } else if (f.type === "json") {
      if (typeof raw === "string") {
        try {
          payload[f.name] = raw.trim() ? JSON.parse(raw) : {};
        } catch {
          throw new Error(`Invalid JSON in field "${f.label}"`);
        }
      } else {
        payload[f.name] = raw;
      }
    } else if (f.type === "datetime" && typeof raw === "string" && raw.length === 16) {
      payload[f.name] = `${raw}:00Z`;
    } else {
      payload[f.name] = raw;
    }
  }
  return payload;
}

export function DynamicFormFields({
  fields,
  values,
  onChange,
  onFileChange,
  isEdit = false,
}: {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onFileChange?: (name: string, file: File | null) => void;
  isEdit?: boolean;
}) {
  const { user, companies, branches } = useAuth();
  const [relations, setRelations] = useState<RelationCache>({});

  const endpointsToLoad = useMemo(() => {
    const set = new Set<string>();
    for (const f of fields) {
      if (f.type === "relation" && f.relationEndpoint) {
        set.add(f.relationEndpoint);
      }
      if (f.type === "lines" && f.lineColumns) {
        for (const col of f.lineColumns) {
          if (col.type === "relation" && col.relationEndpoint) {
            set.add(col.relationEndpoint);
          }
        }
      }
    }
    return Array.from(set);
  }, [fields]);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      const updates: RelationCache = {};
      // Seed known companies/branches immediately
      if (companies.length > 0) updates["/api/companies/"] = companies as unknown as Record<string, unknown>[];
      if (branches.length > 0) updates["/api/branches/"] = branches as unknown as Record<string, unknown>[];

      const pending = endpointsToLoad.filter((ep) => !updates[ep]);
      const results = await Promise.allSettled(
        pending.map((ep) => api.get(ep, { page_size: 100 }))
      );
      results.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          updates[pending[idx]] = extractList(res.value as never).items;
        }
      });
      if (!cancelled) {
        setRelations((prev) => ({ ...prev, ...updates }));
      }
    }
    if (endpointsToLoad.length > 0) {
      void loadAll();
    }
    return () => {
      cancelled = true;
    };
  }, [branches, companies, endpointsToLoad]);

  const visibleFields = fields.filter((f) => !(isEdit && f.hideOnEdit));

  const formatOptionLabel = (
    row: Record<string, unknown>,
    primary?: string,
    secondary?: string
  ) => {
    const p = primary ? row[primary] : row.name ?? row.title ?? row.code ?? row.id;
    const s = secondary ? row[secondary] : undefined;
    const base = p !== undefined && p !== null && p !== "" ? String(p) : `#${row.id}`;
    return s ? `${base} (${String(s)})` : base;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleFields.map((field) => {
        if (field.type === "boolean") {
          return (
            <label
              key={field.name}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5",
                field.fullWidth && "sm:col-span-2"
              )}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {field.label}
              </span>
              <input
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
            </label>
          );
        }

        if (field.type === "lines") {
          const rows = Array.isArray(values[field.name])
            ? (values[field.name] as Record<string, unknown>[])
            : [];
          const cols: LineColumnDef[] = field.lineColumns || [];

          const isJournal = cols.some((c) => c.name === "debit") && cols.some((c) => c.name === "credit");
          const debitSum = isJournal
            ? rows.reduce((acc, r) => acc + (Number(r.debit) || 0), 0)
            : 0;
          const creditSum = isJournal
            ? rows.reduce((acc, r) => acc + (Number(r.credit) || 0), 0)
            : 0;

          const updateRow = (idx: number, colName: string, val: unknown) => {
            const next = rows.map((r, i) => (i === idx ? { ...r, [colName]: val } : r));
            onChange(field.name, next);
          };

          const addRow = () => {
            const empty: Record<string, unknown> = {};
            cols.forEach((c) => {
              empty[c.name] =
                c.defaultValue !== undefined ? c.defaultValue : c.type === "boolean" ? false : "";
            });
            onChange(field.name, [...rows, empty]);
          };

          const removeRow = (idx: number) => {
            onChange(
              field.name,
              rows.filter((_, i) => i !== idx)
            );
          };

          return (
            <div key={field.name} className="sm:col-span-2 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  {isJournal && (
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
                        Math.abs(debitSum - creditSum) < 0.01 && debitSum > 0
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                      )}
                    >
                      Dr {debitSum.toFixed(2)} = Cr {creditSum.toFixed(2)}
                    </span>
                  )}
                  <Button size="xs" variant="outline" onClick={addRow}>
                    <Plus className="h-3.5 w-3.5" />
                    Add Line
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                    <tr>
                      {cols.map((col) => (
                        <th key={col.name} className="px-2.5 py-2 font-semibold">
                          {col.label}
                        </th>
                      ))}
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        {cols.map((col) => (
                          <td key={col.name} className="px-2 py-1.5">
                            {col.type === "boolean" ? (
                              <input
                                type="checkbox"
                                checked={Boolean(row[col.name])}
                                onChange={(e) => updateRow(idx, col.name, e.target.checked)}
                                className="h-4 w-4 accent-[var(--brand-primary)]"
                              />
                            ) : col.type === "relation" ? (
                              <div className="flex gap-1">
                                <select
                                  value={String(row[col.name] ?? "")}
                                  onChange={(e) => updateRow(idx, col.name, e.target.value)}
                                  className="w-full min-w-[130px] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                                >
                                  <option value="">Select...</option>
                                  {(relations[col.relationEndpoint || ""] || []).map((opt) => (
                                    <option key={String(opt.id)} value={String(opt.id)}>
                                      {formatOptionLabel(
                                        opt,
                                        col.relationLabelKey,
                                        col.relationSecondaryKey
                                      )}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <input
                                type={col.type === "number" ? "number" : "text"}
                                value={String(row[col.name] ?? "")}
                                onChange={(e) => updateRow(idx, col.name, e.target.value)}
                                placeholder={col.placeholder || col.label}
                                className="w-full min-w-[85px] rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                              />
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15"
                            aria-label="Remove line"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        const val = values[field.name] ?? "";
        const isFull =
          field.fullWidth || field.type === "textarea" || field.type === "json";

        return (
          <div key={field.name} className={cn("space-y-1.5", isFull && "sm:col-span-2")}>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              {field.label}
              {field.required && <span className="ml-1 text-[var(--brand-primary)]">*</span>}
              {field.autoFillContext === "tenant" && user?.tenant_name && (
                <span className="ml-2 font-normal text-[var(--text-muted)]">
                  ({user.tenant_name})
                </span>
              )}
            </label>

            {field.type === "textarea" ? (
              <textarea
                rows={3}
                value={String(val)}
                required={field.required}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.name, e.target.value)}
                className={inputCls}
              />
            ) : field.type === "json" ? (
              <textarea
                rows={4}
                value={String(val)}
                onChange={(e) => onChange(field.name, e.target.value)}
                className={cn(inputCls, "font-mono text-xs")}
              />
            ) : field.type === "select" ? (
              <select
                value={String(val)}
                required={field.required}
                onChange={(e) => onChange(field.name, e.target.value)}
                className={inputCls}
              >
                <option value="">Select {field.label}...</option>
                {(field.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "relation" ? (
              <div className="flex gap-2">
                <select
                  value={String(val)}
                  required={field.required}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className={cn(inputCls, "flex-1")}
                >
                  <option value="">Select {field.label}...</option>
                  {(relations[field.relationEndpoint || ""] || []).map((opt) => (
                    <option key={String(opt.id)} value={String(opt.id)}>
                      {formatOptionLabel(
                        opt,
                        field.relationLabelKey,
                        field.relationSecondaryKey
                      )}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={String(val)}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder="ID"
                  aria-label={`${field.label} numeric ID`}
                  className={cn(inputCls, "w-20 font-mono text-center")}
                />
              </div>
            ) : field.type === "file" ? (
              <input
                type="file"
                onChange={(e) =>
                  onFileChange?.(field.name, e.target.files?.[0] ?? null)
                }
                className={inputCls}
              />
            ) : (
              <input
                type={
                  field.type === "password"
                    ? "password"
                    : field.type === "date"
                      ? "date"
                      : field.type === "datetime"
                        ? "datetime-local"
                        : field.type === "number"
                          ? "number"
                          : "text"
                }
                value={String(val)}
                required={field.required}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.name, e.target.value)}
                className={cn(
                  inputCls,
                  (field.type === "decimal" || field.type === "number") && "font-mono tabular-nums"
                )}
              />
            )}

            {field.helpText && (
              <p className="text-[11px] text-[var(--text-muted)]">{field.helpText}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
