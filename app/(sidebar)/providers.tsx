"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/contexts/QueryProvider";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import NotificationHandler from "@/components/NotificationHandler";
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
        <SidebarLayout defaultOpen={defaultOpen}>
          <div className="flex-1 max-h-[100vh] overflow-auto">{children}</div>
        </SidebarLayout>
      </WebSocketProvider>
    </QueryProvider>
  );
}
