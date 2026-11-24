"use client";

import React from "react";
import { Building2, KeyRound, Shield, Store } from "lucide-react";
import {
  branchesResource,
  companiesResource,
  permissionsResource,
  usersResource,
} from "@/lib/resources";
import { ModuleTabShell } from "@/components/resource/ModuleTabShell";
import { ResourceWorkspace } from "@/components/resource/ResourceWorkspace";

export default function OrganizationPage() {
  return (
    <ModuleTabShell
      title="Companies, Branches, Users & RBAC Permissions"
      subtitle="Multi-entity legal books, branch retail/warehouse sites, user role/ban/suspension management, and granular object permissions."
      tabs={[
        { id: "companies", label: "Companies", icon: Building2, content: <ResourceWorkspace config={companiesResource} /> },
        { id: "branches", label: "Branches", icon: Store, content: <ResourceWorkspace config={branchesResource} /> },
        { id: "users", label: "Users & Bans", icon: Shield, content: <ResourceWorkspace config={usersResource} /> },
        { id: "permissions", label: "Granular Permissions", icon: KeyRound, content: <ResourceWorkspace config={permissionsResource} /> },
      ]}
    />
  );
}
