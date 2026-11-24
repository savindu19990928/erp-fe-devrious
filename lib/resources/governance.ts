import type { ResourceConfig } from "./types";

export const workflowRequestsResource: ResourceConfig = {
  id: "workflow-requests",
  title: "Approval Task Queue",
  singularTitle: "Approval Request",
  description: "Pending approvals across POs, payments, credit notes, and stock adjustments.",
  endpoint: "/api/workflows/requests/",
  columns: [
    { key: "reference_code", label: "Reference", format: "code" },
    { key: "target_model", label: "Document Type" },
    { key: "amount", label: "Amount", format: "currency", align: "right" },
    { key: "required_role", label: "Required Role", format: "badge" },
    { key: "requested_by_username", label: "Requested By" },
    { key: "status", label: "Status", format: "badge" },
    { key: "created_at", label: "Created", format: "datetime" },
  ],
  fields: [
    { name: "tenant", label: "Tenant ID", type: "number", required: true, autoFillContext: "tenant" },
    {
      name: "company",
      label: "Company",
      type: "relation",
      required: true,
      autoFillContext: "company",
      relationEndpoint: "/api/companies/",
      relationLabelKey: "name",
    },
    {
      name: "branch",
      label: "Branch",
      type: "relation",
      autoFillContext: "branch",
      relationEndpoint: "/api/branches/",
      relationLabelKey: "name",
    },
    {
      name: "rule",
      label: "Workflow Rule",
      type: "relation",
      relationEndpoint: "/api/workflows/rules/",
      relationLabelKey: "name",
    },
    { name: "target_model", label: "Target Model", type: "text", required: true },
    { name: "target_object_id", label: "Target Object ID", type: "number", required: true },
    { name: "reference_code", label: "Reference Code", type: "text", required: true },
    { name: "amount", label: "Amount", type: "decimal", defaultValue: "0.00" },
    { name: "required_role", label: "Required Role", type: "text", required: true, defaultValue: "COMPANY_MANAGER" },
    { name: "comments", label: "Comments", type: "textarea", fullWidth: true },
  ],
  rowActions: [
    {
      key: "approve",
      label: "Approve",
      endpointSuffix: "approve/",
      variant: "primary",
      isVisible: (r) => r.status === "PENDING",
      fields: [{ name: "comments", label: "Approval Comments", type: "textarea", fullWidth: true }],
    },
    {
      key: "reject",
      label: "Reject",
      endpointSuffix: "reject/",
      variant: "danger",
      isVisible: (r) => r.status === "PENDING",
      fields: [{ name: "comments", label: "Rejection Reason", type: "textarea", required: true, fullWidth: true }],
    },
  ],
};

export const workflowRulesResource: ResourceConfig = {
  id: "workflow-rules",
  title: "Approval Workflow Rules",
  singularTitle: "Approval Rule",
  description: "Configure minimum amount thresholds and required approver roles per module.",
  endpoint: "/api/workflows/rules/",
  columns: [
    { key: "name", label: "Rule Name" },
    { key: "module", label: "Module", format: "badge" },
    { key: "target_model", label: "Target Model", format: "code" },
    { key: "min_amount", label: "Min Amount", format: "currency", align: "right" },
    { key: "required_role", label: "Approver Role", format: "badge" },
    { key: "is_active", label: "Active", format: "boolean" },
  ],
  fields: [
    { name: "tenant", label: "Tenant ID", type: "number", required: true, autoFillContext: "tenant" },
    {
      name: "company",
      label: "Company",
      type: "relation",
      required: true,
      autoFillContext: "company",
      relationEndpoint: "/api/companies/",
      relationLabelKey: "name",
    },
    { name: "name", label: "Rule Name", type: "text", required: true },
    { name: "module", label: "Module", type: "text", required: true, defaultValue: "INVENTORY" },
    { name: "target_model", label: "Target Model", type: "text", required: true, placeholder: "PurchaseOrder" },
    { name: "min_amount", label: "Min Amount Threshold", type: "decimal", required: true, defaultValue: "100000.00" },
    { name: "required_role", label: "Required Role", type: "text", required: true, defaultValue: "COMPANY_MANAGER" },
    { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
  ],
};

export const notificationsResource: ResourceConfig = {
  id: "notifications",
  title: "System Notifications & Alerts",
  singularTitle: "Notification",
  description: "Real-time in-app, email, and SMS alerts across low stock, cold-chain breaches, compliance, and billing.",
  endpoint: "/api/notifications/",
  columns: [
    { key: "subject", label: "Subject" },
    { key: "channel", label: "Channel", format: "badge" },
    { key: "recipient_address", label: "Recipient" },
    { key: "related_model", label: "Source Model", format: "code" },
    { key: "status", label: "Status", format: "badge" },
    { key: "created_at", label: "Created", format: "datetime" },
  ],
  fields: [
    { name: "tenant", label: "Tenant ID", type: "number", required: true, autoFillContext: "tenant" },
    { name: "recipient_address", label: "Recipient Address", type: "text", required: true },
    {
      name: "channel",
      label: "Channel",
      type: "select",
      defaultValue: "IN_APP",
      options: [
        { value: "IN_APP", label: "In-App" },
        { value: "EMAIL", label: "Email" },
        { value: "SMS", label: "SMS" },
      ],
    },
    { name: "subject", label: "Subject", type: "text", required: true },
    { name: "message", label: "Message", type: "textarea", required: true, fullWidth: true },
  ],
  rowActions: [
    {
      key: "mark-read",
      label: "Mark Read",
      endpointSuffix: "mark-read/",
      variant: "outline",
      isVisible: (r) => r.status !== "READ",
    },
  ],
};

export const notificationTemplatesResource: ResourceConfig = {
  id: "notification-templates",
  title: "Localized Notification Templates",
  singularTitle: "Template",
  description: "English (en), Sinhala (si), and Tamil (ta) multi-channel alert templates.",
  endpoint: "/api/notification-templates/",
  columns: [
    { key: "code", label: "Code", format: "code" },
    { key: "name", label: "Name" },
    { key: "channel", label: "Channel", format: "badge" },
    { key: "language", label: "Lang", format: "badge" },
    { key: "is_active", label: "Active", format: "boolean" },
  ],
  fields: [
    { name: "tenant", label: "Tenant ID", type: "number", required: true, autoFillContext: "tenant" },
    { name: "code", label: "Template Code", type: "text", required: true },
    { name: "name", label: "Template Name", type: "text", required: true },
    {
      name: "channel",
      label: "Channel",
      type: "select",
      defaultValue: "EMAIL",
      options: [
        { value: "IN_APP", label: "In-App" },
        { value: "EMAIL", label: "Email" },
        { value: "SMS", label: "SMS" },
      ],
    },
    {
      name: "language",
      label: "Language",
      type: "select",
      defaultValue: "en",
      options: [
        { value: "en", label: "English (en)" },
        { value: "si", label: "Sinhala (si)" },
        { value: "ta", label: "Tamil (ta)" },
      ],
    },
    { name: "subject_template", label: "Subject Template", type: "text", required: true, fullWidth: true },
    { name: "body_template", label: "Body Template", type: "textarea", required: true, fullWidth: true },
    { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
  ],
};

export const webhooksResource: ResourceConfig = {
  id: "webhooks",
  title: "Webhook Subscriptions",
  singularTitle: "Webhook",
  description: "Outbound HTTP webhook subscriptions for critical ERP domain events.",
  endpoint: "/api/webhooks/",
  columns: [
    { key: "event_name", label: "Event", format: "code" },
    { key: "target_url", label: "Target URL" },
    { key: "is_active", label: "Active", format: "boolean" },
  ],
  fields: [
    { name: "tenant", label: "Tenant ID", type: "number", required: true, autoFillContext: "tenant" },
    { name: "event_name", label: "Event Name", type: "text", required: true, placeholder: "invoice.issued" },
    { name: "target_url", label: "Target URL", type: "text", required: true, placeholder: "https://example.com/hook" },
    { name: "secret_token", label: "Signing Secret", type: "text" },
    { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
  ],
};

export const attachmentsResource: ResourceConfig = {
  id: "attachments",
  title: "Document Attachments & OCR",
  singularTitle: "Attachment",
  description: "Attach receipts, POD photos, or vendor bills with OCR-extracted metadata.",
  endpoint: "/api/attachments/",
  multipart: true,
  columns: [
    { key: "file_name", label: "File Name" },
    { key: "target_model", label: "Model", format: "code" },
    { key: "target_object_id", label: "Object ID", format: "number", align: "right" },
    { key: "external_url", label: "External URL" },
    { key: "created_at", label: "Uploaded", format: "datetime" },
  ],
  fields: [
    { name: "tenant", label: "Tenant ID", type: "number", required: true, autoFillContext: "tenant" },
    { name: "target_model", label: "Target Model", type: "text", required: true, placeholder: "VendorBill" },
    { name: "target_object_id", label: "Target Object ID", type: "number", required: true },
    { name: "file_name", label: "File Name", type: "text", required: true },
    { name: "file", label: "Upload File", type: "file" },
    { name: "external_url", label: "External URL", type: "text" },
    { name: "ocr_extracted_text", label: "OCR Extracted Text", type: "textarea", fullWidth: true },
  ],
};

export const auditLogsResource: ResourceConfig = {
  id: "audit-logs",
  title: "Immutable Audit Trail",
  singularTitle: "Audit Log",
  description: "Read-only audit trail capturing before_state and after_state JSON diffs.",
  endpoint: "/api/audit-logs/",
  readOnly: true,
  columns: [
    { key: "action_id", label: "Action ID", format: "code" },
    { key: "action", label: "Action", format: "badge" },
    { key: "target_model", label: "Model", format: "code" },
    { key: "target_object_id", label: "Obj ID", format: "code" },
    { key: "actor_username", label: "Actor" },
    { key: "notes", label: "Notes" },
    { key: "created_at", label: "Timestamp", format: "datetime" },
  ],
  fields: [],
};

export const activityLogsResource: ResourceConfig = {
  id: "activity-logs",
  title: "User Activity Logs",
  singularTitle: "Activity Log",
  description: "Read-only authentication, login/logout, password reset, ban, and billing security events.",
  endpoint: "/api/activity-logs/",
  readOnly: true,
  columns: [
    { key: "event_type", label: "Event", format: "badge" },
    { key: "username", label: "Username", format: "code" },
    { key: "ip_address", label: "IP Address", format: "code" },
    { key: "details", label: "Details" },
    { key: "created_at", label: "Timestamp", format: "datetime" },
  ],
  fields: [],
};

export const documentVersionsResource: ResourceConfig = {
  id: "document-versions",
  title: "Document Version Snapshots",
  singularTitle: "Document Version",
  description: "Historical immutable JSON snapshots of modified financial and operational documents.",
  endpoint: "/api/document-versions/",
  readOnly: true,
  columns: [
    { key: "target_model", label: "Model", format: "code" },
    { key: "target_object_id", label: "Object ID", format: "code" },
    { key: "version_number", label: "Version", format: "number", align: "right" },
    { key: "change_reason", label: "Change Reason" },
    { key: "created_at", label: "Captured", format: "datetime" },
  ],
  fields: [],
};
