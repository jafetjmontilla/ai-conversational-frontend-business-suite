"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchKnowledgeAudit, type KnowledgeAuditResponse } from "@/lib/api";
import { toast } from "sonner";
import { FileSearch, AlertTriangle, Info, Search } from "lucide-react";

const DEFAULT_MIN_SCORE = 0.7;

function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function KnowledgeAuditContent() {
  const params = useParams();
  const businessId = params?.businessId as string;

  const [audit, setAudit] = useState<KnowledgeAuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [debugMinScore, setDebugMinScore] = useState(String(DEFAULT_MIN_SCORE));
  const [debugLoading, setDebugLoading] = useState(false);

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
      setAudit(data);
      if (!data.debugSearch?.results.length) {
        toast.info("Sin resultados por encima del umbral de similitud");
      }
    } catch (e) {
      toast.error((e as Error)?.message ?? "Error en búsqueda de prueba");
    } finally {
      setDebugLoading(false);
    }
  }, [businessId, debugQuery, debugMinScore]);

  if (!businessId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Auditoría del conocimiento
          </CardTitle>
          <CardDescription>
            Compara la configuración del negocio (fuentes y roles) con el contenido realmente indexado en Knowledge-RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={loadAudit} disabled={auditLoading}>
            {auditLoading ? "Cargando…" : "Cargar auditoría"}
          </Button>

          {audit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Documentos totales</p>
                  <p className="text-xl font-semibold">{audit.summary.totalDocuments}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Fuentes configuradas</p>
                  <p className="text-xl font-semibold">{audit.summary.totalConfigSources}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Fuentes con documentos</p>
                  <p className="text-xl font-semibold">{audit.summary.sourcesWithDocuments}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Coherencia</p>
                  <p className="text-xl font-semibold">
                    {audit.summary.orphanSources.length === 0 &&
                    audit.summary.sourcesWithoutDocuments.length === 0
                      ? "OK"
                      : "Revisar"}
                  </p>
                </div>
              </div>

              {(audit.summary.sourcesWithoutDocuments.length > 0 ||
                audit.summary.orphanSources.length > 0) && (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                  {audit.summary.sourcesWithoutDocuments.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Fuentes configuradas sin documentos indexados
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {audit.summary.sourcesWithoutDocuments.join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  {audit.summary.orphanSources.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Fuentes con documentos pero no en configuración (huérfanas)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {audit.summary.orphanSources.join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Fuentes configuradas (MongoDB)</p>
                <div className="flex flex-wrap gap-2">
                  {audit.configSources.length === 0 ? (
                    <span className="text-muted-foreground text-sm">Ninguna</span>
                  ) : (
                    audit.configSources.map((s) => (
                      <Badge key={s.sourceId} variant="secondary">
                        {s.name || s.sourceId} · {s.roles?.length ?? 0} roles
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Documentos por fuente (índice RAG)</p>
                <div className="space-y-4">
                  {audit.documentsBySource.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay documentos indexados.</p>
                  ) : (
                    audit.documentsBySource.map((src) => (
                      <div key={src.sourceId} className="rounded-lg border p-3">
                        <p className="font-medium flex items-center gap-2">
                          {src.name || src.sourceId}
                          <Badge variant="outline">{src.documentCount} docs</Badge>
                        </p>
                        <ul className="mt-2 space-y-2 pl-2 border-l border-muted">
                          {src.documents.map((doc, i) => (
                            <li key={doc.documentId ?? i} className="text-sm py-1">
                              <span className="font-mono text-muted-foreground">
                                {doc.documentId ?? `#${i + 1}`}
                              </span>
                              <span className="text-muted-foreground ml-1">
                                ({doc.contentLength} chars)
                              </span>
                              <p className="text-muted-foreground truncate max-w-full mt-0.5">
                                {doc.contentPreview || "—"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda de prueba
          </CardTitle>
          <CardDescription>
            Simula una consulta RAG sobre el índice del negocio. Solo se muestran resultados con similitud coseno ≥
            min_score (mayor es mejor).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div>
              <Label htmlFor="debug-query">Consulta</Label>
              <Input
                id="debug-query"
                placeholder="Ej: devolución de producto"
                value={debugQuery}
                onChange={(e) => setDebugQuery(e.target.value)}
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") runDebugSearch();
                }}
              />
            </div>
            <div>
              <Label htmlFor="debug-min-score">min_score</Label>
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
            </div>
          </div>
          <Button onClick={runDebugSearch} disabled={debugLoading}>
            {debugLoading ? "Buscando…" : "Probar búsqueda"}
          </Button>

          {audit?.debugSearch && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  Resultados para &quot;{audit.debugSearch.query}&quot;
                </p>
                {audit.debugSearch.min_score != null && (
                  <Badge variant="outline">min_score ≥ {audit.debugSearch.min_score}</Badge>
                )}
                <Badge variant="secondary">{audit.debugSearch.results.length} hits</Badge>
              </div>

              {audit.debugSearch.note && (
                <p className="text-sm text-muted-foreground">{audit.debugSearch.note}</p>
              )}

              {audit.debugSearch.results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ningún documento superó el umbral de similitud.
                </p>
              ) : (
                <ul className="space-y-3">
                  {audit.debugSearch.results.map((result, i) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
