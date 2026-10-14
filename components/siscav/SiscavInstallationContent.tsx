"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Copy, Database, KeyRound, Link2, PlugZap, RefreshCw, ShieldOff, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useSiscavInstallation } from "@/lib/hooks/useSiscavInstallation";
import type { SiscavInstallation, SiscavPairingPayload } from "@/lib/interfases";
import { cn } from "@/lib/utils";

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86400), "day");
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("es") : "—";
}

function StatusBadge({ installation }: { installation: SiscavInstallation }) {
  if (installation.status === "pending") return <Badge variant="secondary">Esperando al agente</Badge>;
  return installation.connected ? (
    <Badge className="bg-emerald-600 hover:bg-emerald-600">Conectada</Badge>
  ) : (
    <Badge variant="destructive">Desconectada</Badge>
  );
}

function Detail({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm", mono && "font-mono text-xs break-all")}>{value || "—"}</dd>
    </div>
  );
}

function copy(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success("Copiado"),
    () => toast.error("No se pudo copiar")
  );
}

function PairingCard({ pairing, serverUrl }: { pairing: SiscavPairingPayload; serverUrl: string | null }) {
  const command = `npm run pair -- ${pairing.pairingCode}`;
  return (
    <Card className="border border-primary/30 bg-primary/5 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          Código de emparejamiento
        </CardTitle>
        <CardDescription>
          Un solo uso. Vence a las {new Date(pairing.expiresAt).toLocaleTimeString("es")}. No se vuelve a mostrar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-3xl tracking-[0.3em]">{pairing.pairingCode}</span>
          <Button type="button" variant="outline" size="icon" onClick={() => copy(pairing.pairingCode)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            En la PC donde corre SISCAV (la que tiene MySQL), copia las carpetas{" "}
            <code className="text-xs">siscav-agent</code> y <code className="text-xs">siscav-protocol</code> e instala
            Node.js 18 o superior.
          </li>
          <li>
            En <code className="text-xs">siscav-agent/.env</code> pon{" "}
            {serverUrl ? (
              <code className="break-all text-xs">MCP_SISCAV_URL={serverUrl}</code>
            ) : (
              <span className="text-destructive">
                la URL pública de mcp-siscav (falta MCP_SISCAV_PUBLIC_URL en la API)
              </span>
            )}{" "}
            y el usuario de MySQL de solo lectura/escritura indicado en el README del agente.
          </li>
          <li className="space-y-1">
            <span>Ejecuta:</span>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-xs">{command}</code>
              <Button type="button" variant="ghost" size="icon" onClick={() => copy(command)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </li>
          <li>
            Deja el agente corriendo (<code className="text-xs">npm start</code> o como servicio de Windows). Esta
            pantalla cambia a <strong>Conectada</strong> sola.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}

export function SiscavInstallationContent() {
  const params = useParams();
  const businessSlug = (params?.businessId as string) ?? null;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { installation, pairing, loading, refreshing, refresh, startPairing, revoke, isStarting, isRevoking } =
    useSiscavInstallation(businessSlug);
  const [createProfiles, setCreateProfiles] = useState(true);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const generate = (withProfiles: boolean) => void startPairing(withProfiles).catch(() => undefined);
  const disconnect = () =>
    void revoke()
      .then(() => setConfirmRevoke(false))
      .catch(() => undefined);

  if (!canViewCurrentBusiness()) {
    return <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>;
  }
  const canEdit = canEditCurrentBusiness();
  const missingTables = installation?.agent?.missingTables ?? [];
  const hasUnseenCode = Boolean(installation?.pairingExpiresAt && !pairing);

  return (
    <div className="space-y-4 p-4">
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SISCAV
            </CardTitle>
            <CardDescription>
              Conecta el SISCAV de la PC del negocio para que el asistente consulte inventario, precios, clientes y
              ventas, y registre clientes o cambie la tasa del dólar según el perfil de cada canal.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !installation ? (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm">
                Este negocio aún no tiene SISCAV conectado. Genera un código y úsalo en el agente instalado en la PC.
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  id="siscav-profiles"
                  checked={createProfiles}
                  onCheckedChange={setCreateProfiles}
                  disabled={!canEdit || isStarting}
                />
                <Label htmlFor="siscav-profiles" className="text-sm font-normal">
                  Crear perfiles por rol (Clientes, Personal y Administración)
                </Label>
              </div>
              <Button type="button" onClick={() => generate(createProfiles)} disabled={!canEdit || isStarting}>
                <Link2 className="mr-2 h-4 w-4" />
                Generar código
              </Button>
              {!canEdit ? (
                <p className="text-xs text-muted-foreground">Solo los administradores del negocio pueden conectar SISCAV.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge installation={installation} />
                <span className="text-sm text-muted-foreground">
                  {installation.status === "pending"
                    ? "El agente todavía no ha canjeado el código."
                    : installation.connected
                      ? `Último latido ${timeAgo(installation.lastSeenAt)}`
                      : `Sin conexión desde ${timeAgo(installation.disconnectedAt ?? installation.lastSeenAt)}. El asistente responde con los últimos datos guardados y deja los cambios en cola 3 minutos.`}
                </span>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="PC" value={installation.agent?.hostname} />
                <Detail label="Versión del agente" value={installation.agent?.agentVersion} />
                <Detail label="MySQL" value={installation.agent?.mysqlVersion} />
                <Detail label="Base de datos" value={installation.agent?.database} />
                <Detail
                  label="siscav.exe"
                  value={installation.agent?.siscavBuild ? formatDate(installation.agent.siscavBuild) : null}
                />
                <Detail label="Emparejada" value={formatDate(installation.pairedAt)} />
                <Detail label="ID de instalación" value={installation.installationId} mono />
              </dl>

              {missingTables.length ? (
                <Alert>
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Faltan tablas en esta versión de SISCAV</AlertTitle>
                  <AlertDescription>
                    {missingTables.join(", ")}. Las consultas que las usan responderán que no están disponibles para
                    este negocio; el resto funciona normal.
                  </AlertDescription>
                </Alert>
              ) : null}

              {hasUnseenCode ? (
                <p className="text-sm text-muted-foreground">
                  Hay un código vigente hasta {new Date(installation.pairingExpiresAt as string).toLocaleTimeString("es")}.
                  Si no lo tienes, genera otro.
                </p>
              ) : null}

              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generate(false)}
                    disabled={isStarting || isRevoking}
                  >
                    <PlugZap className="mr-2 h-4 w-4" />
                    {installation.status === "pending" ? "Generar otro código" : "Cambiar de PC"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmRevoke(true)}
                    disabled={isStarting || isRevoking}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              ) : null}

              {installation.status === "active" ? (
                <p className="text-xs text-muted-foreground">
                  Elige qué perfil usa cada canal en{" "}
                  <Link href={`/${businessSlug}/channels`} className="text-primary underline-offset-4 hover:underline">
                    Canales
                  </Link>{" "}
                  y ajusta herramientas o instrucciones en{" "}
                  <Link href={`/${businessSlug}/ai/profiles`} className="text-primary underline-offset-4 hover:underline">
                    Perfiles
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {pairing ? <PairingCard pairing={pairing} serverUrl={pairing.installation.agentServerUrl} /> : null}

      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desconectar SISCAV?</DialogTitle>
            <DialogDescription>
              La PC se desconecta y el asistente deja de tener las herramientas de SISCAV. Los perfiles se conservan.
              Para volver a conectar habrá que generar un código nuevo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmRevoke(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isRevoking}
              onClick={disconnect}
            >
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
