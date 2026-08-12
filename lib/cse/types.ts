export type SessionMode = "guest" | "user";
export type AgentEngine = "cse" | "pae";
export type ConnectionStatus = "idle" | "connecting" | "ready" | "disconnected" | "error";

export type SessionReadyPayload = {
  sessionId: string;
  conversationId: string;
  mode: SessionMode;
  engine: AgentEngine;
  uid: string;
  businessId: string;
  role: string;
  guestUid?: string;
};

export type ChatResponsePayload = {
  conversationId: string;
  userId: string;
  role: string;
  userMessage: string;
  botResponse: string;
  timestamp: string;
  runId?: string;
  isFinal?: boolean;
  phase?: string;
  source?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  runId?: string;
  interim?: boolean;
  clientMsgId?: string;
};

/** Par pregunta/respuesta seleccionado para Teach from chat */
export type SelectedTeachTurn = {
  user: ChatMessage;
  assistant: ChatMessage;
};

export type TeachMode = "create" | "correct";

export type TeachPhase = "compose" | "generating" | "preview" | "done";

/** Fuentes genéricas soportadas por sendKnowledgeNarrative (sin protocols) */
export const TEACH_SOURCE_IDS = [
  "faqs",
  "glossary",
  "policies",
  "tools",
  "case_studies",
] as const;

export type TeachSourceId = (typeof TEACH_SOURCE_IDS)[number];
