"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import type { WhatsAppSessionEventPayload } from "@/lib/types/whatsappSession";

export type BaileysSessionStatusRow = {
  isConnected?: boolean | null;
  qrCode?: string | null;
  phoneNumber?: string | null;
};

export type BaileysStatusEntry = BaileysSessionStatusRow | null | "loading";

function isBaileysConnectedEvent(event: string, isConnected?: boolean): boolean {
  return isConnected === true || event === "whatsapp_connected" || event === "connected";
}

function isBaileysDisconnectedEvent(event: string, isConnected?: boolean): boolean {
  return (
    isConnected === false ||
    event === "disconnected" ||
    event === "whatsapp_disconnected" ||
    event === "qr_expired"
  );
}

function applySessionEvent(
  prev: Record<string, BaileysStatusEntry>,
  payload: WhatsAppSessionEventPayload
): Record<string, BaileysStatusEntry> {
  const sid = payload.sessionId?.trim();
  if (!sid) return prev;

  const prevRow = prev[sid];
  const base =
    prevRow && prevRow !== "loading" ? prevRow : ({} as BaileysSessionStatusRow);

  const connected = isBaileysConnectedEvent(payload.event, payload.isConnected);
  const disconnected = isBaileysDisconnectedEvent(payload.event, payload.isConnected);

  if (connected) {
    return {
      ...prev,
      [sid]: {
        ...base,
        isConnected: true,
        qrCode: null,
        phoneNumber: payload.phoneNumber ?? base.phoneNumber,
      },
    };
  }

  if (disconnected) {
    return {
      ...prev,
      [sid]: {
        ...base,
        isConnected: false,
        qrCode: payload.event === "qr_expired" ? null : base.qrCode,
        phoneNumber: payload.phoneNumber ?? base.phoneNumber,
      },
    };
  }

  if (payload.event === "qr_generated" && payload.qrCode) {
    return {
      ...prev,
      [sid]: {
        ...base,
        isConnected: false,
        qrCode: payload.qrCode,
      },
    };
  }

  if (payload.event === "session_snapshot") {
    return {
      ...prev,
      [sid]: {
        isConnected: payload.isConnected ?? false,
        qrCode: payload.qrCode ?? null,
        phoneNumber: payload.phoneNumber ?? null,
      },
    };
  }

  return prev;
}

/**
 * Estado en vivo de sesiones Baileys vía Socket.IO (sin polling HTTP).
 */
export function useBaileysSessionRealtime(
  businessId: string | null,
  baileysSessionIdsKey: string
) {
  const {
    onWhatsAppSessionEvent,
    subscribeToChannels,
    unsubscribeFromChannels,
    refreshChannelsSnapshot,
    onReconnect,
  } = useWebSocketContext();

  const [statusBySession, setStatusBySession] = useState<Record<string, BaileysStatusEntry>>({});

  const refreshSnapshot = useCallback(() => {
    if (businessId) refreshChannelsSnapshot(businessId);
  }, [businessId, refreshChannelsSnapshot]);

  useEffect(() => {
    if (!businessId) return;

    subscribeToChannels(businessId);

    const offEvent = onWhatsAppSessionEvent((payload) => {
      setStatusBySession((prev) => applySessionEvent(prev, payload));
    });

    const offReconnect = onReconnect(() => {
      subscribeToChannels(businessId);
      refreshSnapshot();
    });

    return () => {
      offEvent();
      offReconnect();
      unsubscribeFromChannels(businessId);
    };
  }, [
    businessId,
    onWhatsAppSessionEvent,
    onReconnect,
    refreshSnapshot,
    subscribeToChannels,
    unsubscribeFromChannels,
  ]);

  // Lista de sesiones cambió (nuevo canal, borrado, sync colaborativo)
  useEffect(() => {
    if (!businessId) return;

    const activeIds = new Set(
      baileysSessionIdsKey ? baileysSessionIdsKey.split("\0").filter(Boolean) : []
    );

    setStatusBySession((prev) => {
      const next: Record<string, BaileysStatusEntry> = {};
      activeIds.forEach((id) => {
        if (prev[id] !== undefined) {
          next[id] = prev[id];
        } else {
          next[id] = "loading";
        }
      });
      return next;
    });

    refreshSnapshot();
  }, [businessId, baileysSessionIdsKey, refreshSnapshot]);

  const seedSessionStatus = useCallback((sessionId: string, row: BaileysSessionStatusRow) => {
    const sid = sessionId.trim();
    if (!sid) return;
    setStatusBySession((prev) => ({
      ...prev,
      [sid]: row,
    }));
  }, []);

  return { statusBySession, seedSessionStatus, refreshSnapshot };
}
