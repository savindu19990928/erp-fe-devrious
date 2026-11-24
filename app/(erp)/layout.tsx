"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export default function ErpAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg-canvas)] text-[var(--text-secondary)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bizzrious-logo.png"
          alt="Bizzrious"
          className="h-14 w-14 rounded-full object-contain shadow-md"
        />
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
          <span>Loading Bizzrious ERP workspace...</span>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
