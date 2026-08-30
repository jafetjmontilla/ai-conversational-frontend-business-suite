"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TeachFromChatModal } from "@/components/cse/TeachFromChatModal";
import { useCseApiGeneric } from "@/lib/cse/useCseApiGeneric";
import { findTeachTurn } from "@/lib/cse/buildTeachNarrative";
import type { ConnectionStatus, SelectedTeachTurn } from "@/lib/cse/types";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case "ready":
      return "Conectado";
    case "connecting":
      return "Conectando…";
    case "disconnected":
      return "Desconectado";
    case "error":
      return "Error";
    default:
      return "Inactivo";
  }
}

function statusDotClass(status: ConnectionStatus): string {
  switch (status) {
    case "ready":
      return "bg-emerald-500";
    case "connecting":
      return "bg-amber-500 animate-pulse";
    case "error":
      return "bg-destructive";
    default:
      return "bg-muted-foreground/50";
  }
}

/**
 * Widget flotante para probar el flujo CSE (guest → api-generic → worker).
 * Solo se monta dentro de una organización; conecta Socket.IO al abrir el panel.
 * Doble clic en una respuesta → Teach from chat (si hay permiso de editar).
 */
export function CseTestChat({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedTurn, setSelectedTurn] = useState<SelectedTeachTurn | null>(
    null
  );
  const [teachOpen, setTeachOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const canTeach = canEditCurrentBusiness();

  const {
    status,
    session,
    messages,
    error,
    sending,
    sendMessage,
    clearMessages,
  } = useCseApiGeneric({ enabled: open, businessId });

  const ready = status === "ready";

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) {
      setSelectedTurn(null);
      setTeachOpen(false);
    }
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !ready || sending) return;
    const text = draft;
    setDraft("");
    await sendMessage(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  }

  function handleAssistantDoubleClick(assistantId: string) {
    if (!canTeach) return;
    const turn = findTeachTurn(messages, assistantId);
    if (!turn) {
      toast.error("No hay un mensaje de usuario previo para enseñar");
      return;
    }
    setSelectedTurn({
      user: turn.user,
      assistant: turn.assistant,
    });
    setTeachOpen(true);
  }

  function handleClear() {
    clearMessages();
    setSelectedTurn(null);
  }

  function handleRetest(userMessage: string) {
    setOpen(true);
    void sendMessage(userMessage);
  }

  const selectedUserId = selectedTurn?.user.id;
  const selectedAssistantId = selectedTurn?.assistant.id;

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed bottom-14 right-2 sm:bottom-[32px] sm:right-8 flex flex-col items-end gap-3",
          teachOpen ? "z-40" : "z-[60]"
        )}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              key="cse-panel"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex h-[min(560px,calc(100vh-6.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
              role="dialog"
              aria-label="Chat de prueba CSE"
            >
              <header className="flex shrink-0 items-start justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        statusDotClass(status)
                      )}
                      aria-hidden
                    />
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      Prueba CSE
                    </h2>
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-[10px] uppercase tracking-wide"
                    >
                      guest
                    </Badge>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {statusLabel(status)}
                    {session?.engine ? ` · ${session.engine.toUpperCase()}` : ""}
                    {" · "}
                    {businessId}
                  </p>
                  {canTeach && (
                    <p className="text-[10px] text-muted-foreground/80">
                      Doble clic en una respuesta para enseñar
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {canTeach && selectedTurn && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Enseñar desde el turno seleccionado"
                      onClick={() => setTeachOpen(true)}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Limpiar mensajes"
                    onClick={handleClear}
                    disabled={messages.length === 0}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Cerrar"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
                {status === "connecting" && messages.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando a API Generic…
                  </div>
                )}

                {(status === "disconnected" || status === "error") &&
                  messages.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-xs text-muted-foreground">
                      <WifiOff className="h-5 w-5" />
                      <p>{error || "Desconectado de API Generic"}</p>
                      <p className="text-[10px] opacity-70">
                        Reintentando automáticamente…
                      </p>
                    </div>
                  )}

                {ready && messages.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                    Envía un mensaje para probar el flujo CSE
                    <span className="mt-1 block text-[10px] opacity-70">
                      guest → api-generic → webhook → worker → respuesta
                    </span>
                  </div>
                )}

                {messages.map((m) => {
                  const isSelected =
                    m.id === selectedUserId || m.id === selectedAssistantId;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        role={m.role === "assistant" && canTeach ? "button" : undefined}
                        tabIndex={
                          m.role === "assistant" && canTeach && !m.interim
                            ? 0
                            : undefined
                        }
                        title={
                          m.role === "assistant" && canTeach && !m.interim
                            ? "Doble clic para enseñar desde este turno"
                            : undefined
                        }
                        onDoubleClick={
                          m.role === "assistant" && canTeach && !m.interim
                            ? () => handleAssistantDoubleClick(m.id)
                            : undefined
                        }
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm transition-shadow",
                          m.role === "user"
                            ? "rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm border border-border bg-card text-card-foreground",
                          m.interim && "opacity-80",
                          isSelected &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          m.role === "assistant" &&
                          canTeach &&
                          !m.interim &&
                          "cursor-pointer select-none"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                        <div
                          className={cn(
                            "mt-1 text-[10px]",
                            m.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatTime(m.createdAt)}
                          {m.interim ? " · …" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {sending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enviando…
                  </div>
                )}

                {error && messages.length > 0 && (
                  <p className="text-center text-[11px] text-destructive">
                    {error}
                  </p>
                )}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex shrink-0 items-end gap-2 border-t border-border bg-background p-2.5"
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    ready ? "Escribe un mensaje…" : "Esperando conexión…"
                  }
                  disabled={!ready}
                  rows={1}
                  className="min-h-[40px] max-h-28 resize-none py-2 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  disabled={!ready || sending || !draft.trim()}
                  title="Enviar"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="pointer-events-auto"
          initial={false}
          animate={{ scale: open ? 0.92 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <Button
            type="button"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full shadow-lg",
              open && "bg-muted text-foreground hover:bg-muted/90"
            )}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar chat CSE" : "Abrir chat de prueba CSE"}
            title={open ? "Cerrar" : "Prueba CSE"}
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </Button>
        </motion.div>
      </div>

      {canTeach && (
        <TeachFromChatModal
          open={teachOpen}
          onOpenChange={setTeachOpen}
          businessId={businessId}
          turn={selectedTurn}
          conversationId={session?.conversationId}
          onRetest={handleRetest}
        />
      )}
    </>
  );
}
