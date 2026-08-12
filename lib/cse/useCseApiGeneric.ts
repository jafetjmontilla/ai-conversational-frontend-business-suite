"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getStoredGuestUid, storeGuestUid } from "@/lib/cse/guestUid";
import type {
  ChatMessage,
  ChatResponsePayload,
  ConnectionStatus,
  SessionReadyPayload,
} from "@/lib/cse/types";

/**
 * Si la UI se abre por IP/hostname remoto pero el env dice localhost,
 * reescribe al host de la página (el browser no puede usar el localhost del server).
 */
function resolveApiGenericUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_API_GENERIC_URL?.trim() || "http://localhost:2010";

  if (typeof window === "undefined") return envUrl;

  try {
    const u = new URL(envUrl, window.location.origin);
    const pageHost = window.location.hostname;
    const isLoopback =
      u.hostname === "localhost" || u.hostname === "127.0.0.1";
    const pageIsRemote =
      pageHost !== "localhost" && pageHost !== "127.0.0.1";

    if (isLoopback && pageIsRemote) {
      u.hostname = pageHost;
      u.protocol = window.location.protocol;
      return u.origin;
    }
    return u.origin;
  } catch {
    return envUrl;
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function upsertAssistantMessage(
  prev: ChatMessage[],
  payload: ChatResponsePayload
): ChatMessage[] {
  const text = (payload.botResponse || "").trim();
  if (!text) return prev;

  const isFinal = payload.isFinal !== false;
  const runId = payload.runId;

  if (runId) {
    const idx = prev.findIndex((m) => m.role === "assistant" && m.runId === runId);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        content: text,
        interim: !isFinal,
        createdAt: payload.timestamp || next[idx].createdAt,
      };
      return next;
    }
  }

  return [
    ...prev,
    {
      id: runId ? `run_${runId}` : newId(),
      role: "assistant",
      content: text,
      createdAt: payload.timestamp || new Date().toISOString(),
      runId,
      interim: !isFinal,
    },
  ];
}

type UseCseApiGenericOptions = {
  /** Solo conecta cuando el panel de prueba está abierto */
  enabled?: boolean;
  /** Organización activa (requerido por api-generic) */
  businessId: string;
};

export function useCseApiGeneric(options: UseCseApiGenericOptions) {
  const { enabled = true, businessId } = options;
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [session, setSession] = useState<SessionReadyPayload | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!enabled || !businessId) {
      setStatus("idle");
      return;
    }

    const guestUid = getStoredGuestUid();
    const wsUrl = resolveApiGenericUrl();
    const socket = io(wsUrl, {
      transports: ["polling", "websocket"],
      auth: {
        businessId,
        role: "customer",
        ...(guestUid ? { guestUid } : {}),
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setStatus("connecting");

    socket.on("connect", () => {
      setError(null);
    });

    socket.on("session:ready", (payload: SessionReadyPayload) => {
      setSession(payload);
      setStatus("ready");
      setError(null);
      if (payload.guestUid) {
        storeGuestUid(payload.guestUid);
      }
    });

    socket.on("chat:response", (payload: ChatResponsePayload) => {
      setMessages((prev) => upsertAssistantMessage(prev, payload));
    });

    socket.on("chat:error", (payload: { message?: string }) => {
      setError(payload?.message || "Error de chat");
    });

    socket.on("connect_error", (err) => {
      setStatus("error");
      setError(err.message || "No se pudo conectar a API Generic");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, businessId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const socket = socketRef.current;
    if (!socket?.connected) {
      setError("Sin conexión con API Generic");
      return;
    }

    const clientMsgId = newId();
    const userMsg: ChatMessage = {
      id: clientMsgId,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      clientMsgId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setError(null);

    await new Promise<void>((resolve) => {
      socket.emit(
        "chat:send",
        { content: trimmed, clientMsgId },
        (ack?: { success?: boolean; error?: string }) => {
          setSending(false);
          if (ack && ack.success === false) {
            setError(ack.error || "No se pudo enviar el mensaje");
          }
          resolve();
        }
      );

      window.setTimeout(() => setSending(false), 15000);
    });
  }, []);

  return {
    status,
    session,
    messages,
    error,
    sending,
    sendMessage,
    clearMessages,
    apiUrl:
      typeof window !== "undefined"
        ? resolveApiGenericUrl()
        : process.env.NEXT_PUBLIC_API_GENERIC_URL || "http://localhost:2010",
  };
}
