"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/contexts/QueryProvider";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import NotificationHandler from "@/components/NotificationHandler";
import { UnsavedChangesDialogHost } from "@/components/UnsavedChangesDialogHost";
import { SidebarLayout } from "@/components/layouts/SidebarLayout";

type SidebarProvidersProps = {
  children: ReactNode;
  defaultOpen?: boolean;
};

export function SidebarProviders({ children, defaultOpen }: SidebarProvidersProps) {
  return (
    <QueryProvider>
      <WebSocketProvider>
        <NotificationHandler />
        <UnsavedChangesDialogHost />
        <SidebarLayout defaultOpen={defaultOpen}>
          <div className="flex min-h-0 flex-1 flex-col overflow-auto max-w-full p-1.5 md:p-3">
            {children}
          </div>
        </SidebarLayout>
      </WebSocketProvider>
    </QueryProvider>
  );
}
