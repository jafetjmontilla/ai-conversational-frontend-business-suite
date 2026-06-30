"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeEpisodeListResult, PaeEpisodeRow } from "@/lib/interfases";
import { toast } from "sonner";
import { History, RefreshCw, X } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export function PaeEpisodesContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const prefersReducedMotion = useReducedMotion();
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [episodes, setEpisodes] = useState<PaeEpisodeRow[]>([]);
  const [episodesTotal, setEpisodesTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [debouncedUserFilter, setDebouncedUserFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PaeEpisodeRow | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserFilter(userFilter.trim()), 400);
    return () => clearTimeout(t);
  }, [userFilter]);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const ep = (await fetchApiV1({
        query: queries.listPaeEpisodes,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          skip: 0,
          limit: PAGE_SIZE,
          userIdContains: debouncedUserFilter || undefined,
        },
      })) as PaeEpisodeListResult | undefined;
      setEpisodes(ep?.items ?? []);
      setEpisodesTotal(ep?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar episodios PAE");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc, debouncedUserFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectEpisode = (row: PaeEpisodeRow) => {
    setSelected(row);
    setMobileDetailOpen(true);
  };

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  const mobilePanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };

  const renderDetailCard = (options?: { className?: string; onClose?: () => void }) => (
    <Card id="card-right" className={cn("flex h-full flex-col border-none", options?.className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="pt-12 pb-2">
            <CardTitle>Detalle del episodio</CardTitle>
            <CardDescription>
              Memoria episódica por usuario (retrieval semántico en conversación).
            </CardDescription>
          </div>
          {options?.onClose ? (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={options.onClose} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto space-y-4 text-sm">
        {selected ? (
          <>
            <div className="grid gap-2">
              <p><span className="text-muted-foreground">Usuario:</span> <span className="font-mono text-xs">{selected.userId}</span></p>
              <p><span className="text-muted-foreground">Rol:</span> {selected.role || "—"}</p>
              <p><span className="text-muted-foreground">Conversación:</span> <span className="font-mono text-xs break-all">{selected.conversationId}</span></p>
              <p><span className="text-muted-foreground">Fecha:</span> {new Date(selected.createdAt).toLocaleString("es")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground font-medium">Resumen</p>
              <p className="whitespace-pre-wrap rounded-md border p-3 bg-muted/30">{selected.summary}</p>
            </div>
            {selected.userMessage ? (
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Mensaje del usuario</p>
                <p className="whitespace-pre-wrap rounded-md border p-3 bg-muted/30 text-xs">{selected.userMessage}</p>
              </div>
            ) : null}
            {selected.assistantReply ? (
              <div className="space-y-1">
                <p className="text-muted-foreground font-medium">Respuesta del asistente</p>
                <p className="whitespace-pre-wrap rounded-md border p-3 bg-muted/30 text-xs">{selected.assistantReply}</p>
              </div>
            ) : null}
            {selected.openQuestions?.length ? (
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium">Pendientes</p>
                <ul className="space-y-1">
                  {selected.openQuestions.map((q, i) => (
                    <li key={i} className="rounded-md border px-3 py-2 text-xs">{q}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground py-8 text-center">Selecciona un episodio de la tabla.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-w-0 gap-2 w-full h-full">
      <Card id="card-left" className="flex min-w-0 flex-col w-full h-full border-none overflow-y-auto overflow-x-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Episodios recientes
              <Badge variant="secondary" className="font-normal">{episodesTotal}</Badge>
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
          <CardDescription>Memoria episódica por usuario.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col flex-1 space-y-4 overflow-x-hidden">
          <div className="max-w-sm">
            <Label htmlFor="ep-filter">Filtrar por userId</Label>
            <Input id="ep-filter" className="mt-1" placeholder="Filtrar por userId…" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Resumen</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Conversación</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodes.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn("cursor-pointer", selected?.id === row.id && "bg-muted/50")}
                    onClick={() => selectEpisode(row)}
                  >
                    <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                    <TableCell className="max-w-md truncate">{row.summary}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                      {row.openQuestions?.length ? row.openQuestions.join("; ") : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.conversationId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("es")}
                    </TableCell>
                  </TableRow>
                ))}
                {episodes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Sin episodios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="hidden md:block w-full max-w-[33vw] shrink-0 overflow-y-auto">
        {renderDetailCard()}
      </div>

      <AnimatePresence>
        {mobileDetailOpen && selected ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel"
              initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={mobilePanelTransition}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileDetailOpen(false)}
            />
            <motion.div
              initial={{ x: prefersReducedMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "100%" }}
              transition={mobilePanelTransition}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md md:hidden shadow-xl"
            >
              {renderDetailCard({
                className: "h-full rounded-none border-0 border-l",
                onClose: () => setMobileDetailOpen(false),
              })}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
