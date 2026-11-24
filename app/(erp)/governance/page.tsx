"use client";

import React from "react";
import { Bell, FileCheck2, History, ShieldCheck, Webhook } from "lucide-react";
import {
  activityLogsResource,
  attachmentsResource,
  auditLogsResource,
  documentVersionsResource,
  notificationsResource,
  notificationTemplatesResource,
  webhooksResource,
  workflowRequestsResource,
  workflowRulesResource,
} from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";

export default function GovernancePage() {
  return (
    <ModuleTabShell
      title="Workflows, Notifications, Webhooks & Immutable Audit"
      subtitle="Role-based approval queues, localized templates (en/si/ta), OCR attachments, outbound webhooks, and immutable audit logs."
      tabs={[
        { id: "requests", label: "Approval Queue", icon: FileCheck2, content: <ResourceWorkspace config={workflowRequestsResource} /> },
        { id: "rules", label: "Approval Rules", icon: ShieldCheck, content: <ResourceWorkspace config={workflowRulesResource} /> },
        { id: "notifications", label: "Notifications", icon: Bell, content: <ResourceWorkspace config={notificationsResource} /> },
        { id: "templates", label: "Templates (en/si/ta)", content: <ResourceWorkspace config={notificationTemplatesResource} /> },
        { id: "webhooks", label: "Webhooks", icon: Webhook, content: <ResourceWorkspace config={webhooksResource} /> },
        { id: "attachments", label: "Attachments & OCR", content: <ResourceWorkspace config={attachmentsResource} /> },
        { id: "audit-logs", label: "Audit Trail", icon: History, content: <ResourceWorkspace config={auditLogsResource} /> },
        { id: "activity-logs", label: "Activity Logs", content: <ResourceWorkspace config={activityLogsResource} /> },
        { id: "doc-versions", label: "Doc Versions", content: <ResourceWorkspace config={documentVersionsResource} /> },
      ]}
    />
  );
}
