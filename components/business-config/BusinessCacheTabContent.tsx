"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { Database, Layers, Loader2, RefreshCw, Sparkles, Zap } from "lucide-react";

export type BusinessCacheOverview = {
  redis: {
    responseKeys: number;
    sourceSets: number;
    personalitySets: number;
    defaultTtlSeconds: number;
    schemaVersion: string;
  };
  semanticIndex: {
    entries: number;
    similarityThreshold: number;
    indexExists: boolean;
  };
  contextCaching: {
    enabled: boolean;
    ttlSeconds: number | null;
  };
  globalResponses: {
    hasGreeting: boolean;
    hasGoodbye: boolean;
    hasNoData: boolean;
    noReplyWithoutRag: boolean;
  };
};

type BusinessCacheTabContentProps = {
  businessDocId: string;
};

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export function BusinessCacheTabContent({ businessDocId }: BusinessCacheTabContentProps) {
  const [overview, setOverview] = useState<BusinessCacheOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await fetchApiV1({
        query: queries.getBusinessCacheOverview,
        type: "json",
        variables: { businessDocId },
      })) as BusinessCacheOverview | null;
      setOverview(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Error al cargar el resumen de caché";
      toast.error(msg);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [businessDocId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleFlush = async () => {
    if (flushing) return;
    setFlushing(true);
    try {
      const result = (await fetchApiV1({
        query: queries.flushBusinessCache,
        type: "json",
        variables: { businessDocId },
      })) as { success: boolean; message: string } | null;
      if (result?.success) {
        toast.success("Caché vaciado", { description: result.message });
        await loadOverview();
      } else {
        toast.error("Error al vaciar el caché");
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Error al vaciar el caché";
      toast.error(msg);
    } finally {
      setFlushing(false);
    }
  };

  const globalShortcutsConfigured =
    overview &&
    (overview.globalResponses.hasGreeting ||
      overview.globalResponses.hasGoodbye ||
      overview.globalResponses.hasNoData);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Capas de caché y atajos que afectan las respuestas del asistente. Vaciar el caché fuerza
          respuestas nuevas tras cambios en personalidad, conocimiento o configuración.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading || flushing} onClick={() => void loadOverview()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Actualizar</span>
          </Button>
          <Button type="button" variant="destructive" size="sm" disabled={loading || flushing} onClick={() => void handleFlush()}>
            {flushing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vaciando...
              </>
            ) : (
              "Vaciar caché de respuestas"
            )}
          </Button>
        </div>
      </div>

      {loading && !overview ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : overview ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Respuestas en Redis
              </CardTitle>
              <CardDescription>
                Match exacto tras normalizar la pregunta. TTL por defecto{" "}
                {Math.round(overview.redis.defaultTtlSeconds / 60)} min (esquema{" "}
                {overview.redis.schemaVersion}).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              <StatBlock label="Entradas" value={overview.redis.responseKeys} />
              <StatBlock label="Sets por fuente" value={overview.redis.sourceSets} />
              <StatBlock label="Sets personalidad" value={overview.redis.personalitySets} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Índice semántico (FAISS)
              </CardTitle>
              <CardDescription>
                Reutiliza respuestas cuando la pregunta es parecida (umbral{" "}
                {(overview.semanticIndex.similarityThreshold * 100).toFixed(0)}% similitud).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <StatBlock label="Entradas indexadas" value={overview.semanticIndex.entries} />
              <StatBlock
                label="Índice en disco"
                value={overview.semanticIndex.indexExists ? "Sí" : "No"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Context caching (Gemini)
              </CardTitle>
              <CardDescription>
                Caché del proveedor LLM vía proxy. No se almacena en Redis; se configura en Agente /
                LLM.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Badge variant={overview.contextCaching.enabled ? "default" : "secondary"}>
                {overview.contextCaching.enabled ? "Activado" : "Desactivado"}
              </Badge>
              {overview.contextCaching.enabled && overview.contextCaching.ttlSeconds != null && (
                <span className="text-sm text-muted-foreground">
                  TTL segmento: {overview.contextCaching.ttlSeconds}s
                </span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Respuestas globales (atajos)
              </CardTitle>
              <CardDescription>
                No es caché: mensajes fijos evaluados antes del caché (saludo, despedida, sin datos).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {overview.globalResponses.hasGreeting && <Badge variant="outline">Saludo</Badge>}
              {overview.globalResponses.hasGoodbye && <Badge variant="outline">Despedida</Badge>}
              {overview.globalResponses.hasNoData && <Badge variant="outline">Sin datos</Badge>}
              {overview.globalResponses.noReplyWithoutRag && (
                <Badge variant="outline">Sin RAG → silencio</Badge>
              )}
              {!globalShortcutsConfigured && !overview.globalResponses.noReplyWithoutRag && (
                <span className="text-sm text-muted-foreground">Ninguno configurado</span>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No se pudo cargar el resumen. Comprueba que el worker y Knowledge-RAG estén activos.
        </p>
      )}

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Invalidación automática</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Al reindexar conocimiento se invalida el caché de las fuentes afectadas.</p>
          <p>• Al cambiar personalidad se descartan entradas con hash de personalidad distinto.</p>
          <p>• Al guardar configuración del negocio el worker puede invalidar entradas obsoletas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
