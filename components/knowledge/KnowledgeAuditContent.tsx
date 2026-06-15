"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputSearch } from "@/components/InputSearch";
import { fetchKnowledgeAudit, type KnowledgeAuditResponse } from "@/lib/api";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle,
  FileSearch,
  Info,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

type DebugSearchResult = NonNullable<KnowledgeAuditResponse["debugSearch"]>;

function resolveDebugMinScoreFromConfig(
  minCosineSimilarity: number | undefined
): string {
  if (
    typeof minCosineSimilarity === "number" &&
    Number.isFinite(minCosineSimilarity) &&
    minCosineSimilarity > 0
  ) {
    return String(minCosineSimilarity);
  }
  return "0";
}

function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

function AuditSummaryGrid({ summary }: { summary: KnowledgeAuditResponse["summary"] }) {
  const isCoherent =
    summary.orphanSources.length === 0 && summary.sourcesWithoutDocuments.length === 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="flex flex-col justify-between items-center rounded-lg border p-3">
        <Label className="text-xs text-center">Documentos totales</Label>
        <p className="text-xl font-semibold text-center">{summary.totalDocuments}</p>
      </div>
      <div className="flex flex-col justify-between items-center rounded-lg border p-3">
        <Label className="text-xs text-center">Fuentes configuradas</Label>
        <p className="text-xl font-semibold text-center">{summary.totalConfigSources}</p>
      </div>
      <div className="flex flex-col justify-between items-center rounded-lg border p-3">
        <Label className="text-xs text-center">Fuentes con documentos</Label>
        <p className="text-xl font-semibold text-center">{summary.sourcesWithDocuments}</p>
      </div>
      <div className="flex flex-col justify-between items-center rounded-lg border p-3">
        <Label className="text-xs text-center">Coherencia</Label>
        <p className={cn("text-xl font-semibold text-center", !isCoherent && "text-amber-600")}>
          {isCoherent ? "OK" : "Revisar"}
        </p>
      </div>
    </div>
  );
}

function AuditWarnings({ summary }: { summary: KnowledgeAuditResponse["summary"] }) {
  if (summary.sourcesWithoutDocuments.length === 0 && summary.orphanSources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
      {summary.sourcesWithoutDocuments.length > 0 && (
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Fuentes configuradas sin documentos indexados
            </p>
            <p className="text-sm text-muted-foreground">
              {summary.sourcesWithoutDocuments.join(", ")}
            </p>
          </div>
        </div>
      )}
      {summary.orphanSources.length > 0 && (
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Fuentes con documentos pero no en configuración (huérfanas)
            </p>
            <p className="text-sm text-muted-foreground">{summary.orphanSources.join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditDocumentsList({ audit }: { audit: KnowledgeAuditResponse }) {
  return (
    <div className="space-y-4 min-w-0 w-full max-w-full overflow-hidden">
      <div className="min-w-0">
        <p className="text-sm font-medium mb-2">Fuentes configuradas (MongoDB)</p>
        <div className="flex flex-wrap gap-2 min-w-0">
          {audit.configSources.length === 0 ? (
            <span className="text-muted-foreground text-sm">Ninguna</span>
          ) : (
            audit.configSources.map((s) => (
              <Badge key={s.sourceId} variant="secondary" className="max-w-full truncate">
                {s.name || s.sourceId} · {s.roles?.length ?? 0} roles
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium mb-2">Documentos por fuente (índice RAG)</p>
        {audit.documentsBySource.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay documentos indexados.</p>
        ) : (
          <div className="space-y-3 min-w-0">
            {audit.documentsBySource.map((src) => (
              <div key={src.sourceId} className="min-w-0 overflow-hidden rounded-lg border p-3">
                <div className="font-medium flex flex-wrap items-center gap-2 min-w-0">
                  <span className="truncate min-w-0">{src.name || src.sourceId}</span>
                  <Badge variant="outline" className="shrink-0">
                    {src.documentCount} docs
                  </Badge>
                </div>
                <ul className="mt-2 min-w-0 space-y-2 pl-2 border-l border-muted">
                  {src.documents.map((doc, i) => (
                    <li key={doc.documentId ?? i} className="min-w-0 overflow-hidden text-sm py-1">
                      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 min-w-0">
                        <span className="font-mono text-xs text-muted-foreground break-all">
                          {doc.documentId ?? `#${i + 1}`}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({doc.contentLength} chars)
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2 break-words mt-0.5">
                        {doc.contentPreview || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DebugSearchResults({ debugSearch }: { debugSearch: DebugSearchResult }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">Resultados para &quot;{debugSearch.query}&quot;</p>
        {debugSearch.min_score != null && (
          <Badge variant="outline">min_score ≥ {debugSearch.min_score}</Badge>
        )}
        <Badge variant="secondary">{debugSearch.results.length} hits</Badge>
      </div>

      {debugSearch.note && (
        <p className="text-sm text-muted-foreground">{debugSearch.note}</p>
      )}

      {debugSearch.results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún documento superó el umbral de similitud.
        </p>
      ) : (
        <ul className="space-y-3">
          {debugSearch.results.map((result, i) => (
            <li key={`${result.documentId}-${i}`} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge>{formatScore(result.score)}</Badge>
                <Badge variant="outline">{result.sourceId}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{result.documentId}</span>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4">
                {result.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function KnowledgeAuditContent() {
  const params = useParams();
  const businessId = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { business } = useBusiness(businessId);
  const configMinCosineSimilarity = business?.config?.ragSearch?.minCosineSimilarity;

  const [audit, setAudit] = useState<KnowledgeAuditResponse | null>(null);
  const [debugSearch, setDebugSearch] = useState<DebugSearchResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [debugMinScore, setDebugMinScore] = useState("0");
  const [debugLoading, setDebugLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (!business) return;
    setDebugMinScore(
      resolveDebugMinScoreFromConfig(business.config?.ragSearch?.minCosineSimilarity)
    );
  }, [business]);

  const loadAudit = useCallback(async () => {
    if (!businessId) return;
    setAuditLoading(true);
    try {
      const data = await fetchKnowledgeAudit(businessId);
      setAudit(data);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Error al cargar auditoría");
      setAudit(null);
    } finally {
      setAuditLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const runDebugSearch = useCallback(async () => {
    if (!businessId) return;
    const query = debugQuery.trim();
    if (!query) {
      toast.error("Escribe una consulta de prueba");
      return;
    }
    const minScore = Number(debugMinScore);
    if (!Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
      toast.error("min_score debe ser un número entre 0 y 1");
      return;
    }
    setDebugLoading(true);
    try {
      const data = await fetchKnowledgeAudit(businessId, { query, minScore });
      setDebugSearch(data.debugSearch ?? null);
      if (!data.debugSearch?.results.length) {
        toast.info("Sin resultados por encima del umbral de similitud");
      }
    } catch (e) {
      toast.error((e as Error)?.message ?? "Error en búsqueda de prueba");
    } finally {
      setDebugLoading(false);
    }
  }, [businessId, debugQuery, debugMinScore]);

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderDebugCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className={cn(options?.onClose ? "pt-4 pb-2" : undefined)}>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Búsqueda de prueba
            </CardTitle>
            <CardDescription>
              Simula una consulta RAG sobre el índice del negocio. Solo se muestran resultados con
              similitud coseno ≥ min_score.
            </CardDescription>
          </div>
          {options?.onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={options.onClose}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="debug-query">Consulta</Label>
            <InputSearch
              id="debug-query"
              placeholder="Ej: devolución de producto"
              value={debugQuery}
              onChange={(e) => setDebugQuery(e.target.value)}
              className="mt-1 w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") void runDebugSearch();
              }}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="debug-min-score">Tets de similitud coseno mínima</Label>
              <span className="text-xs text-muted-foreground">
                Valor configurado:{" "}
                {typeof configMinCosineSimilarity === "number" &&
                  Number.isFinite(configMinCosineSimilarity) ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    ≥ {configMinCosineSimilarity}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    sin filtro
                  </Badge>
                )}
              </span>
            </div>
            <Input
              id="debug-min-score"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={debugMinScore}
              onChange={(e) => setDebugMinScore(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Similitud coseno mínima (0–1; mayor = más parecido a la consulta). Solo se listan fragmentos
              con score ≥ este valor. En producción el worker aplica el umbral de{" "}
              <span className="font-medium">Conocimiento → Búsqueda RAG → Similitud coseno mínima (opcional)</span>
              {typeof configMinCosineSimilarity === "number" &&
                Number.isFinite(configMinCosineSimilarity) ? (
                <>
                  {" "}
                  (<span className="font-mono">≥ {configMinCosineSimilarity}</span>); usa el mismo valor aquí
                  para simular el comportamiento real del bot.
                </>
              ) : (
                <>
                  ; si está en <span className="font-medium">sin filtro</span>, el worker no descarta
                  fragmentos por similitud (salvo variable global en el servidor).
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => void runDebugSearch()} disabled={debugLoading}>
            {debugLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando…
              </>
            ) : (
              "Probar búsqueda"
            )}
          </Button>
        </div>

        {debugSearch && <DebugSearchResults debugSearch={debugSearch} />}
      </CardContent>
    </Card>
  );

  if (!businessId) return null;

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Auditoría del conocimiento
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex md:hidden"
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="h-4 w-4 mr-1" />
                Búsqueda
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void loadAudit()}
                disabled={auditLoading}
                aria-label="Actualizar auditoría"
              >
                {auditLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Compara la configuración del negocio (fuentes y roles) con el contenido indexado en
            Knowledge-RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 overflow-x-hidden">
          {auditLoading && !audit ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !audit ? (
            <p className="text-muted-foreground text-sm">No se pudo cargar la auditoría.</p>
          ) : (
            <div className="space-y-4 min-w-0 flex-1 min-h-0">
              <AuditSummaryGrid summary={audit.summary} />
              <AuditWarnings summary={audit.summary} />
              <AuditDocumentsList audit={audit} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
        {renderDebugCard()}
      </div>

      <AnimatePresence>
        {mobileSearchOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel"
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={mobilePanelTransition}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileSearchOpen(false)}
            />
            <motion.div
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "100%" }}
              transition={mobilePanelTransition}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
            >
              {renderDebugCard({
                className: "h-full rounded-none border-0 border-l",
                onClose: () => setMobileSearchOpen(false),
              })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
