"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { CheckoutAuditListResult, CheckoutAuditRecordRow } from "@/lib/interfases";
import { toast } from "sonner";
import { RefreshCw, Search, ShoppingCart } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 20;

export function CheckoutAuditContent() {
  const params = useParams();
  const router = useRouter();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [items, setItems] = useState<CheckoutAuditRecordRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [conversationFilter, setConversationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CheckoutAuditRecordRow | null>(null);

  useEffect(() => {
    setSkip(0);
  }, [conversationFilter]);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const data = (await fetchApiV1({
        query: queries.checkoutAuditLogs,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          skip,
          limit: PAGE_SIZE,
          conversationId: conversationFilter.trim() || undefined,
        },
      })) as CheckoutAuditListResult | undefined;
      setItems(data?.items ?? []);
      setTotalCount(data?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar auditoría de checkout");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, skip, conversationFilter]);

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
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Auditoría de checkout
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>
            Cambios de estado de checkout por conversación (solo lectura). Útil para depurar el flujo comercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 space-y-4 overflow-x-hidden">
          <div className="max-w-md">
            <Input
              placeholder="Filtrar por conversationId"
              value={conversationFilter}
              onChange={(e) => setConversationFilter(e.target.value)}
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Conversación</TableHead>
                  <TableHead>Herramienta</TableHead>
                  <TableHead>Trace</TableHead>
                  <TableHead className="w-[120px] text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay registros para los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString("es")}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={row.conversationId}>
                        {row.conversationId}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[160px] truncate" title={row.tool}>
                        {row.tool}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[120px] truncate" title={row.traceId ?? ""}>
                        {row.traceId || "—"}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle auditoría checkout</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Conversación:</span>{" "}
                  <span className="font-mono text-xs break-all">{selected.conversationId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Herramienta:</span> <span className="font-mono">{selected.tool}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-muted-foreground">traceId:</span>{" "}
                  <span className="font-mono text-xs">{selected.traceId || "—"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Estado anterior (JSON)</p>
                <pre className="text-xs whitespace-pre-wrap rounded-md border p-3 max-h-48 overflow-auto bg-muted/40">
                  {selected.previousCheckoutJson ?? "—"}
                </pre>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Estado siguiente (JSON)</p>
                <pre className="text-xs whitespace-pre-wrap rounded-md border p-3 max-h-64 overflow-auto bg-muted/40">{selected.nextCheckoutJson}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
