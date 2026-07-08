"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface NotificationData {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  userId?: string;
  timestamp: Date;
  read?: boolean;
  metadata?: Record<string, unknown>;
}

export default function NotificationHandler() {
  const { onNotification } = useWebSocketContext();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    onNotification((notification: NotificationData) => {
      const meta = notification.metadata ?? {};
      const invoicePath =
        typeof meta.invoicePath === "string" ? meta.invoicePath : undefined;

      const toastFn =
        notification.type === "error"
          ? toast.error
          : notification.type === "warning"
            ? toast.warning
            : notification.type === "success"
              ? toast.success
              : toast.info;

      toastFn(notification.title, {
        description: notification.message,
        action: invoicePath
          ? {
              label: "Ver factura",
              onClick: () => router.push(invoicePath),
            }
          : undefined,
        duration: meta.source === "invoice" ? 12000 : 6000,
      });
    });
  }, [onNotification, isMounted, router]);

  return null;
}
