export type WhatsAppSessionEventName =
  | "whatsapp_connected"
  | "connected"
  | "disconnected"
  | "whatsapp_disconnected"
  | "qr_generated"
  | "qr_expired"
  | "error"
  | "session_snapshot";

export type WhatsAppSessionEventPayload = {
  event: WhatsAppSessionEventName | string;
  sessionId?: string;
  development?: string;
  isConnected?: boolean;
  phoneNumber?: string;
  qrCode?: string | null;
  connectionTime?: string;
  lastActivity?: string;
  timestamp?: string;
  source?: string;
};
