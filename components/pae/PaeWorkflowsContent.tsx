"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type { PaeWorkflowRunListResult } from "@/lib/interfases";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 25;

export function PaeWorkflowsContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [workflows, setWorkflows] = useState<PaeWorkflowRunListResult["items"]>([]);
  const [workflowsTotal, setWorkflowsTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const wf = (await fetchApiV1({
        query: queries.listPaeWorkflowRuns,
        type: "json",
        variables: { businessDocId: businessIdDoc, skip: 0, limit: PAGE_SIZE },
      })) as PaeWorkflowRunListResult | undefined;
      setWorkflows(wf?.items ?? []);
      setWorkflowsTotal(wf?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar workflows PAE");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc]);

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
            <CardTitle>Workflows en background ({workflowsTotal})</CardTitle>
            <CardDescription>Ejecuciones encoladas desde intención &quot;automatiza&quot;.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="text-xs font-medium uppercase">{row.status}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{row.goal}</TableCell>
                  <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground text-sm">
                    {row.resultText ?? row.errorMessage ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {workflows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin workflows
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
