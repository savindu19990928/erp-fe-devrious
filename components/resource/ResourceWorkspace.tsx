"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { api, ApiError, extractList } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  cn,
  downloadCsv,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/format";
import type {
  CollectionActionDef,
  ColumnDef,
  ResourceConfig,
  RowActionDef,
} from "@/lib/resources/types";
import {
  AuditDiffViewer,
  Badge,
  Button,
  Card,
  EmptyState,
  JsonViewer,
  Modal,
  SlideOver,
  TableSkeleton,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/ToastProvider";
import {
  buildInitialFormState,
  DynamicFormFields,
  serializeFormPayload,
} from "./DynamicFormFields";

function renderCell(row: Record<string, unknown>, col: ColumnDef) {
  const val = row[col.key];
  if (val === null || val === undefined || val === "") {
    return <span className="text-[var(--text-muted)]">—</span>;
  }
  switch (col.format) {
    case "currency": {
      const curr = col.currencyKey ? String(row[col.currencyKey] || "LKR") : "LKR";
      return (
        <span className="font-mono font-medium tabular-nums">
          {formatCurrency(val as string | number, curr)}
        </span>
      );
    }
    case "number":
      return (
        <span className="font-mono tabular-nums">
          {formatNumber(val as string | number, 2)}
        </span>
      );
    case "date":
      return <span className="whitespace-nowrap">{formatDate(String(val))}</span>;
    case "datetime":
      return (
        <span className="whitespace-nowrap text-xs text-[var(--text-secondary)]">
          {formatDateTime(String(val))}
        </span>
      );
    case "boolean":
      return (
        <Badge tone={val ? "success" : "neutral"}>
          {val ? "Yes" : "No"}
        </Badge>
      );
    case "badge":
      return <Badge status={val}>{String(val)}</Badge>;
    case "code":
      return (
        <span className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-xs font-medium text-[var(--text-primary)]">
          {String(val)}
        </span>
      );
    default:
      return <span className="line-clamp-2 max-w-[240px]">{String(val)}</span>;
  }
}

export function ResourceWorkspace({
  config,
  renderDetailExtra,
  onDataChange,
}: {
  config: ResourceConfig;
  renderDetailExtra?: (
    row: Record<string, unknown>,
    refresh: () => void
  ) => React.ReactNode;
  onDataChange?: () => void;
}) {
  const { user, activeCompanyId, activeBranchId, isAuditor } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);

  const [actionModal, setActionModal] = useState<{
    action: RowActionDef | CollectionActionDef;
    row?: Record<string, unknown>;
  } | null>(null);
  const [actionForm, setActionForm] = useState<Record<string, unknown>>({});
  const [resultModal, setResultModal] = useState<{
    title: string;
    data: unknown;
  } | null>(null);

  const ctxIds = {
    tenantId: user?.tenant ?? null,
    companyId: activeCompanyId,
    branchId: activeBranchId,
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(config.endpoint, {
        page,
        search: search.trim() || undefined,
        ...(config.defaultFilters || {}),
      });
      const parsed = extractList(res as never);
      setRows(parsed.items);
      setTotalCount(parsed.count);
      setHasNext(Boolean(parsed.next));
      setHasPrev(Boolean(parsed.previous));
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to load records from server.";
      setErrorMsg(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.defaultFilters, config.endpoint, page, search]);

  useEffect(() => {
    let active = true;
    api
      .get(config.endpoint, {
        page,
        search: search.trim() || undefined,
        ...(config.defaultFilters || {}),
      })
      .then((res) => {
        if (!active) return;
        const parsed = extractList(res as never);
        setRows(parsed.items);
        setTotalCount(parsed.count);
        setHasNext(Boolean(parsed.next));
        setHasPrev(Boolean(parsed.previous));
        setErrorMsg(null);
      })
      .catch((err) => {
        if (!active) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load records from server.";
        setErrorMsg(msg);
        setRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config.defaultFilters, config.endpoint, page, search]);

  const canCreate = !config.readOnly && config.allowCreate !== false && !isAuditor;
  const canEdit = !config.readOnly && config.allowEdit !== false && !isAuditor;
  const canDelete = !config.readOnly && config.allowDelete !== false && !isAuditor;

  const openCreate = () => {
    setEditingRow(null);
    setFormValues(buildInitialFormState(config.fields, ctxIds, null));
    setFileValues({});
    setFormOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingRow(row);
    setFormValues(buildInitialFormState(config.fields, ctxIds, row));
    setFileValues({});
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = serializeFormPayload(
        config.fields,
        formValues,
        Boolean(editingRow)
      );

      if (config.multipart && Object.values(fileValues).some(Boolean) && !editingRow) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        });
        Object.entries(fileValues).forEach(([k, file]) => {
          if (file) fd.append(k, file);
        });
        await api.upload(config.endpoint, fd);
      } else if (editingRow) {
        await api.patch(`${config.endpoint}${editingRow.id}/`, payload);
      } else {
        await api.post(config.endpoint, payload);
      }

      toast.success(
        editingRow ? `${config.singularTitle} updated` : `${config.singularTitle} created`
      );
      setFormOpen(false);
      await fetchRows();
      onDataChange?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Operation failed.";
      toast.error(`Unable to save ${config.singularTitle}`, msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`${config.endpoint}${deleteTarget.id}/`);
      toast.success(`${config.singularTitle} deleted`);
      setDeleteTarget(null);
      await fetchRows();
      onDataChange?.();
    } catch (err) {
      toast.error(
        `Cannot delete ${config.singularTitle}`,
        err instanceof Error ? err.message : "Request failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAction = (
    action: RowActionDef | CollectionActionDef,
    row?: Record<string, unknown>
  ) => {
    if (action.fields && action.fields.length > 0) {
      setActionForm(buildInitialFormState(action.fields, ctxIds, null));
      setActionModal({ action, row });
    } else if (action.confirmMessage) {
      setActionForm({});
      setActionModal({ action, row });
    } else {
      void executeAction(action, row, {});
    }
  };

  const executeAction = async (
    action: RowActionDef | CollectionActionDef,
    row: Record<string, unknown> | undefined,
    payload: Record<string, unknown>
  ) => {
    setSubmitting(true);
    try {
      const targetEndpoint = row
        ? `${config.endpoint}${row.id}/${action.endpointSuffix}`
        : `${config.endpoint}${action.endpointSuffix}`;

      const res =
        action.method === "GET"
          ? await api.get(targetEndpoint)
          : await api.post(targetEndpoint, payload);

      toast.success(`${action.label} completed`);
      setActionModal(null);

      if (action.showResultModal) {
        setResultModal({
          title: action.resultTitle || action.label,
          data: res,
        });
      }
      await fetchRows();
      onDataChange?.();
    } catch (err) {
      toast.error(
        `${action.label} failed`,
        err instanceof Error ? err.message : "Request rejected"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {config.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {config.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(config.collectionActions || []).map((act) => (
              <Button
                key={act.key}
                size="sm"
                variant={act.variant || "outline"}
                onClick={() => triggerAction(act)}
                disabled={isAuditor && act.method !== "GET"}
              >
                {act.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCsv(rows, `${config.id}.csv`)}
              disabled={rows.length === 0}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            {canCreate && (
              <Button size="sm" variant="primary" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New {config.singularTitle}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={config.searchPlaceholder || `Search ${config.title.toLowerCase()}...`}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="font-mono tabular-nums">
              {totalCount} record{totalCount === 1 ? "" : "s"}
            </span>
            <Button size="xs" variant="ghost" onClick={() => void fetchRows()}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {errorMsg && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">API Notice</p>
          <p className="mt-1">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} cols={Math.min(config.columns.length + 1, 7)} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${config.title} found`}
          description={
            errorMsg
              ? "Connect to a live Bizzrious ERP API server or adjust your query."
              : "Create your first record to populate this ledger."
          }
          action={
            canCreate ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create {config.singularTitle}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <tr>
                  {config.columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3",
                        col.align === "right" && "text-right"
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {rows.map((row, idx) => {
                  const visibleRowActions = (config.rowActions || []).filter((a) =>
                    (!a.isVisible || a.isVisible(row)) && (!isAuditor || a.method === "GET")
                  );
                  return (
                    <tr
                      key={String(row.id ?? idx)}
                      className="transition-colors hover:bg-[var(--bg-elevated)]"
                    >
                      {config.columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-sm text-[var(--text-primary)]",
                            col.align === "right" && "text-right"
                          )}
                        >
                          {renderCell(row, col)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {visibleRowActions.map((act) => (
                            <Button
                              key={act.key}
                              size="xs"
                              variant={act.variant || "outline"}
                              onClick={() => triggerAction(act, row)}
                            >
                              {act.label}
                            </Button>
                          ))}
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDetailRow(row)}
                            title="Inspect record"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => openEdit(row)}
                              title="Edit record"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setDeleteTarget(row)}
                              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15"
                              title="Delete record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(hasNext || hasPrev) && (
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 text-xs">
              <span className="text-[var(--text-secondary)]">Page {page}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editingRow
            ? `Edit ${config.singularTitle} #${String(editingRow.id ?? "")}`
            : `Create ${config.singularTitle}`
        }
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="resource-crud-form" loading={submitting}>
              {editingRow ? "Save Changes" : `Create ${config.singularTitle}`}
            </Button>
          </>
        }
      >
        <form id="resource-crud-form" onSubmit={handleFormSubmit} className="space-y-4">
          <DynamicFormFields
            fields={config.fields}
            values={formValues}
            onChange={(name, val) =>
              setFormValues((prev) => ({ ...prev, [name]: val }))
            }
            onFileChange={(name, file) =>
              setFileValues((prev) => ({ ...prev, [name]: file }))
            }
            isEdit={Boolean(editingRow)}
          />
        </form>
      </Modal>

      {/* Row Detail SlideOver */}
      <SlideOver
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        title={`${config.singularTitle} #${String(detailRow?.id ?? "")}`}
        subtitle={config.endpoint}
      >
        {detailRow && (
          <div className="space-y-5">
            {renderDetailExtra?.(detailRow, () => void fetchRows())}

            {(detailRow.before_state !== undefined ||
              detailRow.after_state !== undefined) && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  State Diff (Before vs After)
                </h3>
                <AuditDiffViewer
                  beforeState={detailRow.before_state}
                  afterState={detailRow.after_state}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(detailRow)
                .filter(([, v]) => typeof v !== "object" || v === null)
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 break-all font-mono text-xs text-[var(--text-primary)]">
                      {val === null || val === "" ? "—" : String(val)}
                    </p>
                  </div>
                ))}
            </div>

            {Object.entries(detailRow)
              .filter(([, v]) => Array.isArray(v) && v.length > 0)
              .map(([key, list]) => {
                const items = list as Record<string, unknown>[];
                const headers = Object.keys(items[0] || {});
                return (
                  <div key={key} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {key.replace(/_/g, " ")} ({items.length})
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                          <tr>
                            {headers.map((h) => (
                              <th key={h} className="px-3 py-2 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {items.map((item, i) => (
                            <tr key={i}>
                              {headers.map((h) => (
                                <td key={h} className="px-3 py-2 font-mono">
                                  {typeof item[h] === "object"
                                    ? JSON.stringify(item[h])
                                    : String(item[h] ?? "—")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

            <JsonViewer
              data={detailRow}
              title="Complete Record JSON"
              filename={`${config.id}-${String(detailRow.id ?? "item")}.json`}
            />
          </div>
        )}
      </SlideOver>

      {/* Action Input / Confirmation Modal */}
      <Modal
        open={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={actionModal?.action.label || "Confirm Action"}
        subtitle={
          actionModal?.row
            ? `${config.singularTitle} #${String(actionModal.row.id)}`
            : config.title
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant={actionModal?.action.variant === "danger" ? "danger" : "primary"}
              loading={submitting}
              onClick={() => {
                if (!actionModal) return;
                try {
                  const payload = actionModal.action.fields
                    ? serializeFormPayload(
                        actionModal.action.fields,
                        actionForm,
                        false
                      )
                    : {};
                  void executeAction(actionModal.action, actionModal.row, payload);
                } catch (err) {
                  toast.error(
                    "Invalid Input",
                    err instanceof Error ? err.message : "Check fields"
                  );
                }
              }}
            >
              Confirm {actionModal?.action.label}
            </Button>
          </>
        }
      >
        {actionModal?.action.confirmMessage && (
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            {actionModal.action.confirmMessage}
          </p>
        )}
        {actionModal?.action.fields && (
          <DynamicFormFields
            fields={actionModal.action.fields}
            values={actionForm}
            onChange={(name, val) =>
              setActionForm((prev) => ({ ...prev, [name]: val }))
            }
          />
        )}
      </Modal>

      {/* Action Output Viewer Modal */}
      <Modal
        open={Boolean(resultModal)}
        onClose={() => setResultModal(null)}
        title={resultModal?.title || "API Response"}
        maxWidth="max-w-3xl"
        footer={
          <Button variant="primary" onClick={() => setResultModal(null)}>
            Close
          </Button>
        }
      >
        {resultModal && (
          <JsonViewer
            data={resultModal.data}
            title={resultModal.title}
            filename={`${config.id}-report.json`}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${config.singularTitle}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete {config.singularTitle} #
          {String(deleteTarget?.id ?? "")}? Posted financial documents and issued
          invoices are immutable and cannot be deleted.
        </p>
      </Modal>
    </div>
  );
}
