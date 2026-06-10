"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeEpisodeListResult } from "@/lib/interfases";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 25;

export function PaeEpisodesContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [episodes, setEpisodes] = useState<PaeEpisodeListResult["items"]>([]);
  const [episodesTotal, setEpisodesTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [debouncedUserFilter, setDebouncedUserFilter] = useState("");
  const [loading, setLoading] = useState(false);

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

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Episodios recientes ({episodesTotal})</CardTitle>
            <CardDescription>Memoria episódica por usuario (retrieval semántico en conversación).</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filtrar por userId…"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="max-w-sm"
          />
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
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                  <TableCell className="max-w-md truncate">{row.summary}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                    {row.openQuestions?.length ? row.openQuestions.join("; ") : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.conversationId}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {episodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin episodios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
