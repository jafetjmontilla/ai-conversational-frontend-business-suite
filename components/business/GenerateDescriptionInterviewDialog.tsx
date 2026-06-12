"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { Check, Copy, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_TURNS = 5;

type Phase = "intro" | "interview" | "loading" | "finish";

type QuestionType = "abierta" | "multiple_choice";

interface InterviewQuestion {
  question: string;
  typeQuestion: QuestionType;
  optionsList: string[];
}

interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

interface InterviewTurnResult {
  status: string;
  turnCount: number;
  description: string;
  questions: InterviewQuestion[];
}

interface GenerateDescriptionInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commercialName: string;
  slogan?: string;
  onGenerated: (description: string) => void;
}

function toggleValue(list: string[], value: string, checked: boolean): string[] {
  if (checked) return list.includes(value) ? list : [...list, value];
  return list.filter((item) => item !== value);
}

function isOtherOption(option: string): boolean {
  return option.toLowerCase().includes("otro");
}

function coerceQuestionType(value: string): QuestionType {
  if (value === "abierta") return "abierta";
  return "multiple_choice";
}

/** Renderizado ligero: títulos markdown, negritas y párrafos. */
function renderLightMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h4 key={`h3-${i}`} className="text-sm font-semibold mt-3 mb-1 text-foreground">
          {trimmed.slice(4)}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h3 key={`h2-${i}`} className="text-base font-semibold mt-4 mb-1 text-foreground">
          {trimmed.slice(3)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h2 key={`h1-${i}`} className="text-lg font-bold mt-4 mb-2 text-foreground">
          {trimmed.slice(2)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      nodes.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-sm text-muted-foreground">
          {renderInlineBold(trimmed.slice(2))}
        </li>
      );
      return;
    }

    nodes.push(
      <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed">
        {renderInlineBold(trimmed)}
      </p>
    );
  });

  return nodes;
}

function renderInlineBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function formatAnswersBlock(
  questions: InterviewQuestion[],
  answers: Record<number, { value: string | string[]; otherText?: string }>
): string {
  const lines = questions.map((q, idx) => {
    const ans = answers[idx];
    if (!ans) return `${idx + 1}. ${q.question}: (sin respuesta)`;

    let valueStr = "";
    if (q.typeQuestion === "abierta") {
      valueStr = String(ans.value || "").trim();
    } else {
      const selected = Array.isArray(ans.value) ? ans.value.filter((v) => !isOtherOption(v)) : [];
      const parts = [...selected];
      if (Array.isArray(ans.value) && ans.value.some(isOtherOption) && ans.otherText?.trim()) {
        parts.push(ans.otherText.trim());
      }
      valueStr = parts.join(", ");
    }

    return `${idx + 1}. ${q.question}: ${valueStr || "(sin respuesta)"}`;
  });

  return `Respuestas del usuario:\n${lines.join("\n")}`;
}

function validateAnswers(
  questions: InterviewQuestion[],
  answers: Record<number, { value: string | string[]; otherText?: string }>
): boolean {
  return questions.every((q, idx) => {
    const ans = answers[idx];
    if (!ans) return false;

    if (q.typeQuestion === "abierta") {
      return String(ans.value || "").trim().length > 0;
    }
    const selected = Array.isArray(ans.value) ? ans.value : [];
    if (selected.length === 0) return false;
    if (selected.some(isOtherOption) && !ans.otherText?.trim()) return false;
    return true;
  });
}

export function GenerateDescriptionInterviewDialog({
  open,
  onOpenChange,
  commercialName,
  slogan,
  onGenerated,
}: GenerateDescriptionInterviewDialogProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [initialBusiness, setInitialBusiness] = useState("");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<
    Record<number, { value: string | string[]; otherText?: string }>
  >({});
  const [resultDescription, setResultDescription] = useState("");
  const [copied, setCopied] = useState(false);

  const userTurnCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );

  const resetFlow = useCallback(() => {
    setPhase("intro");
    setInitialBusiness("");
    setMessages([]);
    setCurrentQuestions([]);
    setAnswers({});
    setResultDescription("");
    setCopied(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next && phase === "loading") return;
    if (!next) resetFlow();
    onOpenChange(next);
  };

  const handleCancel = () => {
    if (phase === "loading") return;
    resetFlow();
    onOpenChange(false);
  };

  const callInterview = async (
    nextMessages: InterviewMessage[],
    forceFinish = false
  ): Promise<InterviewTurnResult> => {
    return (await fetchApiV1({
      query: queries.runBusinessDescriptionInterview,
      type: "json",
      variables: {
        input: {
          messages: nextMessages,
          forceFinish,
          commercialName: commercialName.trim() || undefined,
          slogan: slogan?.trim() || undefined,
        },
      },
    })) as InterviewTurnResult;
  };

  const handleStart = async () => {
    const text = initialBusiness.trim();
    if (!text) return;

    setPhase("loading");
    const firstMessages: InterviewMessage[] = [{ role: "user", content: text }];

    try {
      const result = await callInterview(firstMessages);
      setMessages(firstMessages);

      if (result.status === "finish") {
        setResultDescription(result.description);
        setPhase("finish");
        return;
      }

      setCurrentQuestions(
        result.questions.map((q) => ({
          ...q,
          typeQuestion: coerceQuestionType(q.typeQuestion),
        }))
      );
      setAnswers({});
      setPhase("interview");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Error al iniciar la entrevista";
      toast.error(msg);
      setPhase("intro");
    }
  };

  const handleNext = async (forceFinish = false) => {
    if (!forceFinish && !validateAnswers(currentQuestions, answers)) {
      toast.error("Responde todas las preguntas antes de continuar");
      return;
    }

    setPhase("loading");

    const answersContent = forceFinish
      ? "El usuario solicita generar la descripción final con la información disponible hasta ahora."
      : formatAnswersBlock(currentQuestions, answers);

    const assistantContent = JSON.stringify({ questions: currentQuestions });
    const nextMessages: InterviewMessage[] = [
      ...messages,
      { role: "assistant", content: assistantContent },
      { role: "user", content: answersContent },
    ];

    try {
      const result = await callInterview(nextMessages, forceFinish);
      setMessages(nextMessages);

      if (result.status === "finish") {
        setResultDescription(result.description);
        setPhase("finish");
        return;
      }

      setCurrentQuestions(
        result.questions.map((q) => ({
          ...q,
          typeQuestion: coerceQuestionType(q.typeQuestion),
        }))
      );
      setAnswers({});
      setPhase("interview");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Error al procesar el turno";
      toast.error(msg);
      setPhase("interview");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultDescription);
      setCopied(true);
      toast.success("Descripción copiada");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleApply = () => {
    onGenerated(resultDescription);
    toast.success("Descripción aplicada al formulario");
    onOpenChange(false);
    resetFlow();
  };

  const canClose = phase === "intro" || phase === "finish";
  const progressLabel = `${Math.min(userTurnCount, MAX_TURNS)} / ${MAX_TURNS} turnos`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-xl max-h-[90vh] flex flex-col",
          !canClose && "[&>button]:hidden"
        )}
        onInteractOutside={(e) => {
          if (!canClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Entrevista con IA
          </DialogTitle>
          <DialogDescription>
            {phase === "intro" &&
              "Cuéntanos tu negocio y la IA te hará preguntas para crear una descripción detallada."}
            {phase === "interview" &&
              `Responde las preguntas del turno actual. Progreso: ${progressLabel}.`}
            {phase === "loading" && "Procesando con IA..."}
            {phase === "finish" && "Descripción generada. Puedes copiarla o aplicarla al formulario."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 min-h-[200px]">
          {phase === "intro" && (
            <div className="space-y-3">
              <Label htmlFor="initial-business">
                ¿Qué negocio tienes en mente o estás operando?
              </Label>
              <Textarea
                id="initial-business"
                value={initialBusiness}
                onChange={(e) => setInitialBusiness(e.target.value)}
                placeholder="Describe tu negocio con tus palabras..."
                className="resize-none min-h-[120px] text-base"
              />
              <p className="text-xs text-muted-foreground">
                Ejemplos: Tengo una ferretería · Soy entrenador personal · Tengo un puesto de perros
                calientes
              </p>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando siguiente paso...</p>
            </div>
          )}

          {phase === "interview" &&
            currentQuestions.map((q, qIdx) => {
              const type = coerceQuestionType(q.typeQuestion);
              const ans = answers[qIdx] ?? { value: type === "multiple_choice" ? [] : "" };
              const showOther =
                type === "multiple_choice" &&
                Array.isArray(ans.value) &&
                ans.value.some(isOtherOption);

              return (
                <div key={qIdx} className="space-y-2 rounded-lg border p-4">
                  <Label className="text-sm font-medium leading-snug">{q.question}</Label>

                  {type === "abierta" && (
                    <Textarea
                      value={String(ans.value || "")}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [qIdx]: { value: e.target.value },
                        }))
                      }
                      className="resize-none min-h-[80px]"
                      placeholder="Escribe tu respuesta..."
                    />
                  )}

                  {type === "multiple_choice" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.optionsList.map((opt) => {
                        const selected = Array.isArray(ans.value) && ans.value.includes(opt);
                        return (
                          <label
                            key={opt}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                const current = Array.isArray(ans.value) ? ans.value : [];
                                setAnswers((prev) => ({
                                  ...prev,
                                  [qIdx]: {
                                    value: toggleValue(current, opt, e.target.checked),
                                    otherText: prev[qIdx]?.otherText,
                                  },
                                }));
                              }}
                              className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {showOther && (
                    <Input
                      value={ans.otherText ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [qIdx]: { ...prev[qIdx], value: ans.value, otherText: e.target.value },
                        }))
                      }
                      placeholder="Especifica tu respuesta..."
                    />
                  )}
                </div>
              );
            })}

          {phase === "finish" && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-1 max-h-[50vh] overflow-y-auto">
              {renderLightMarkdown(resultDescription)}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          {phase === "intro" && (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleStart}
                disabled={!initialBusiness.trim()}
              >
                Iniciar entrevista
              </Button>
            </>
          )}

          {phase === "loading" && (
            <Button type="button" variant="outline" disabled>
              Cancelar
            </Button>
          )}

          {phase === "interview" && (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNext(true)}
              >
                Generar ya con lo que tengo
              </Button>
              <Button type="button" onClick={() => handleNext(false)}>
                Siguiente
              </Button>
            </>
          )}

          {phase === "finish" && (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="button" variant="outline" onClick={resetFlow}>
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reiniciar
              </Button>
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1.5" />
                ) : (
                  <Copy className="h-4 w-4 mr-1.5" />
                )}
                Copiar
              </Button>
              <Button type="button" onClick={handleApply}>
                Aplicar al formulario
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
