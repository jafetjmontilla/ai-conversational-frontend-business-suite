"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PromptLogListResult, PromptLogRecordRow } from "@/lib/interfases";
import { toast } from "sonner";
import { FileText, RefreshCw, Search } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 20;

export function PromptLogsContent() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [items, setItems] = useState<PromptLogRecordRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [conversationFilter, setConversationFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<PromptLogRecordRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchText(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSkip(0);
  }, [searchText, userFilter, conversationFilter, modelFilter]);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const data = (await fetchApiV1({
        query: queries.listPromptLogs,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          skip,
          limit: PAGE_SIZE,
          textSearch: searchText || undefined,
          userId: userFilter.trim() || undefined,
          conversationId: conversationFilter.trim() || undefined,
          modelName: modelFilter.trim() || undefined,
        },
      })) as PromptLogListResult | undefined;
      setItems(data?.items ?? []);
      setTotalCount(data?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar Prompt Logs");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, skip, searchText, userFilter, conversationFilter, modelFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const canPrev = skip > 0;
  const canNext = skip + items.length < totalCount;
  const rangeLabel = useMemo(() => {
    if (totalCount === 0) return "0 de 0";
    return `${skip + 1}-${skip + items.length} de ${totalCount}`;
  }, [items.length, skip, totalCount]);

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para ver esta sección.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1200px] space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs de prompts
          </CardTitle>
          <CardDescription>
            Auditoría de prompts enviados al modelo, su respuesta, tokens y contexto conversacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar en entrada/prompt/respuesta"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Input
              placeholder="Filtrar por userId"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
            <Input
              placeholder="Filtrar por conversationId"
              value={conversationFilter}
              onChange={(e) => setConversationFilter(e.target.value)}
            />
            <Input
              placeholder="Filtrar por modelo"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Actualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="w-[120px] text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No hay logs para los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString("es")}
                      </TableCell>
                      <TableCell className="uppercase text-xs">{row.channel || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{row.modelName}</TableCell>
                      <TableCell className="text-xs">
                        {row.socialMode === true ? "social" : row.socialMode === false ? "business" : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{row.intentType || "—"}</TableCell>
                      <TableCell className="text-xs font-mono max-w-[140px] truncate" title={row.toolUsed || ""}>
                        {row.toolUsed || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[160px] truncate" title={row.userId || ""}>
                        {row.userId || "—"}
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate" title={row.incomingMessage}>
                        {row.incomingMessage}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.tokenUsage?.totalTokens ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(row)}>
                          <Search className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{rangeLabel}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}>
                Anterior
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!canNext || loading} onClick={() => setSkip((s) => s + PAGE_SIZE)}>
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detalle Prompt Log</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><span className="text-muted-foreground">Modelo:</span> <span className="font-mono">{selected.modelName}</span></div>
                <div><span className="text-muted-foreground">Canal:</span> {selected.channel || "—"}</div>
                <div><span className="text-muted-foreground">Tokens:</span> {selected.tokenUsage?.totalTokens ?? "—"}</div>
                <div><span className="text-muted-foreground">socialMode:</span> {selected.socialMode === true ? "true" : selected.socialMode === false ? "false" : "—"}</div>
                <div><span className="text-muted-foreground">intentType:</span> {selected.intentType || "—"}</div>
                <div><span className="text-muted-foreground">toolUsed:</span> <span className="font-mono">{selected.toolUsed || "—"}</span></div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Entrada</p>
                <pre className="text-xs whitespace-pre-wrap rounded-md border p-3 bg-muted/40">{selected.incomingMessage}</pre>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Prompt enviado</p>
                <pre className="text-xs whitespace-pre-wrap rounded-md border p-3 max-h-64 overflow-auto bg-muted/40">{selected.prompt}</pre>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Respuesta del modelo</p>
                <pre className="text-xs whitespace-pre-wrap rounded-md border p-3 max-h-64 overflow-auto bg-muted/40">{selected.responseText}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
