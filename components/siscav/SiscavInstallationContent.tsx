"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Copy,
  Database,
  Download,
  KeyRound,
  Link2,
  Loader2,
  PlugZap,
  RefreshCw,
  ShieldOff,
  TriangleAlert,
} from "lucide-react";
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
import { useBusinessChannels } from "@/lib/hooks/useBusinessChannels";
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

function CopyableCommand({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="break-all rounded bg-muted px-2 py-1 text-xs">{command}</code>
      <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => copy(command)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PairingCard({ pairing, serverUrl }: { pairing: SiscavPairingPayload; serverUrl: string | null }) {
  const installCommand = `powershell -ExecutionPolicy Bypass -File .\\install.ps1 -PairingCode ${pairing.pairingCode}`;
  const repairCommand = `& "C:\\ProgramData\\SiscavAgent\\siscav-agent.cmd" pair ${pairing.pairingCode}`;
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
            En la PC donde corre SISCAV (la que tiene MySQL),{" "}
            {serverUrl ? (
              <a
                href={`${serverUrl.replace(/\/$/, "")}/agent/download`}
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                descarga el instalador
              </a>
            ) : (
              <span className="text-destructive">
                descarga el instalador (falta MCP_SISCAV_PUBLIC_URL en la API)
              </span>
            )}{" "}
            y descomprímelo. Incluye todo lo necesario; no hace falta instalar Node.js.
          </li>
          <li className="space-y-1">
            <span>
              En esa carpeta, abre PowerShell <strong>como administrador</strong> y ejecuta (pide una vez la clave de
              root de MySQL para crear un usuario con permisos mínimos; no la guarda):
            </span>
            <CopyableCommand command={installCommand} />
          </li>
          <li className="space-y-1">
            <span>Si el agente ya está instalado en esa PC (por ejemplo, tras revocar), basta con:</span>
            <CopyableCommand command={repairCommand} />
          </li>
          <li>
            El agente queda como tarea de Windows, arranca solo y se actualiza solo. Esta pantalla cambia a{" "}
            <strong>Conectada</strong> en unos segundos.
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
  const {
    installation,
    pairing,
    readiness,
    loading,
    refreshing,
    refresh,
    startPairing,
    revoke,
    isStarting,
    isRevoking,
  } = useSiscavInstallation(businessSlug);
  const {
    createBaileysSession,
    isCreatingBaileys,
    refetch: refetchChannels,
  } = useBusinessChannels(businessSlug);
  const [createProfiles, setCreateProfiles] = useState(true);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const generate = (withProfiles: boolean) => void startPairing(withProfiles).catch(() => undefined);
  const disconnect = () =>
    void revoke()
      .then(() => setConfirmRevoke(false))
      .catch(() => undefined);

  const canEdit = canEditCurrentBusiness();
  const createChannelHref = businessSlug
    ? `/${businessSlug}/channels?create=baileys&engine=cse&sessionId=${encodeURIComponent(`siscav-${businessSlug}`)}`
    : "#";

  const handleCreateCseChannel = async () => {
    if (!businessSlug || !canEdit) return;
    if (readiness?.hasCseChannel) {
      window.location.href = createChannelHref;
      return;
    }
    setCreatingChannel(true);
    try {
      const sessionId = `siscav-${businessSlug}`.slice(0, 64);
      const result = await createBaileysSession({
        sessionId,
        agentEngine: "cse",
        defaultProfileId: readiness?.suggestedDefaultProfileId || "siscav-customer",
      });
      if (!result?.success) {
        toast.error(result?.error || "No se pudo crear el canal WhatsApp");
        return;
      }
      const qr = result.qrCode || result.session?.qrCode || null;
      if (qr) setQrCode(qr);
      else toast.success("Canal creado");
      void refetchChannels();
      void refresh();
    } finally {
      setCreatingChannel(false);
    }
  };

  if (!canViewCurrentBusiness()) {
    return <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>;
  }
  const missingTables = installation?.agent?.missingTables ?? [];
  const missingOptionalColumns = (installation?.agent?.optionalColumns ?? []).filter((c) => !c.present);
  const lastError = installation?.lastError ?? null;
  const errorHistory = installation?.errorHistory ?? [];
  const hasUnseenCode = Boolean(installation?.pairingExpiresAt && !pairing);
  const readinessItems = readiness
    ? [
        { ok: readiness.siscavApp, label: "App SISCAV instalada" },
        { ok: readiness.cseApp, label: "App Atención al Cliente instalada" },
        { ok: readiness.mcpProvider, label: "Proveedor MCP cableado" },
        { ok: readiness.hasCustomerProfile, label: "Perfil SISCAV · Clientes" },
        { ok: readiness.installationPaired, label: "PC emparejada" },
        { ok: readiness.installationConnected, label: "Agente conectado" },
        { ok: readiness.hasCseChannel, label: "Canal con motor CSE" },
        { ok: readiness.channelHasDefaultProfile, label: "Canal con perfil por defecto" },
        { ok: readiness.baileysConnected, label: "WhatsApp vinculado (QR)" },
      ]
    : [];

  const featureHintLabel = (hint: string) => {
    if (hint === "stock_minimo") return "Stock mínimo / bajo inventario";
    return hint;
  };

  const showCreateChannelCta = readiness && (!readiness.hasCseChannel || !readiness.baileysConnected);

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
          {readinessItems.length ? (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Listo para WhatsApp CSE</p>
                {readiness && readiness.blockers.length === 0 ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Completo</Badge>
                ) : (
                  <Badge variant="secondary">Faltan pasos</Badge>
                )}
              </div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {readinessItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm">
                    {item.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={cn(!item.ok && "text-muted-foreground")}>{item.label}</span>
                  </li>
                ))}
              </ul>
              {readiness && readiness.blockers.length > 0 ? (
                <Alert>
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Pendiente</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {readiness.blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    {showCreateChannelCta ? (
                      <p className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={!canEdit || creatingChannel || isCreatingBaileys}
                          onClick={() => void handleCreateCseChannel()}
                        >
                          {creatingChannel || isCreatingBaileys ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {!readiness.hasCseChannel ? "Crear canal y mostrar QR" : "Ir a Canales (QR)"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={createChannelHref}>Abrir Canales</Link>
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Perfil {readiness.suggestedDefaultProfileId || "siscav-customer"}. Escanea el QR en el
                          teléfono.
                        </span>
                      </p>
                    ) : !readiness.channelHasDefaultProfile ? (
                      <p className="mt-2">
                        <Link
                          href={`/${businessSlug}/channels`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Ir a Canales
                        </Link>
                        {readiness.suggestedDefaultProfileId
                          ? ` · perfil sugerido: ${readiness.suggestedDefaultProfileId}`
                          : null}
                      </p>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

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

              {installation.status === "active" && !installation.connected ? (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Agente offline</AlertTitle>
                  <AlertDescription>
                    {lastError?.code === "agent_offline" || lastError?.code === "timeout"
                      ? lastError.message
                      : "La PC no envía latidos. Revisa que el servicio SiscavAgent esté en ejecución."}
                    {lastError?.at ? (
                      <span className="mt-1 block text-xs opacity-90">
                        Último aviso {timeAgo(lastError.at)}
                        {lastError.operation ? ` · ${lastError.operation}` : ""}
                      </span>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              {installation.connected && lastError ? (
                <Alert>
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>
                    {lastError.code === "mysql_error"
                      ? "Error de MySQL en la PC"
                      : lastError.code === "missing_table"
                        ? "Falta una tabla en SISCAV"
                        : `Último error (${lastError.code})`}
                  </AlertTitle>
                  <AlertDescription>
                    {lastError.message}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {timeAgo(lastError.at)}
                      {lastError.operation ? ` · tool ${lastError.operation}` : ""}
                    </span>
                  </AlertDescription>
                </Alert>
              ) : null}

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

              {missingOptionalColumns.length ? (
                <Alert>
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Columnas opcionales ausentes</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {missingOptionalColumns.map((c) => (
                        <li key={`${c.table}.${c.column}`}>
                          <span className="font-mono text-xs">
                            {c.table}.{c.column}
                          </span>
                          {" — "}
                          {featureHintLabel(c.featureHint)} no disponible en esta base.
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {errorHistory.length > 1 ? (
                <details className="rounded-lg border p-3 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Historial de errores ({errorHistory.length})
                  </summary>
                  <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-muted-foreground">
                    {errorHistory.map((e, i) => (
                      <li key={`${e.at}-${e.code}-${i}`} className="border-t pt-2 first:border-0 first:pt-0">
                        <span className="font-mono text-xs">{e.code}</span>
                        {e.operation ? ` · ${e.operation}` : ""} — {e.message}
                        <span className="mt-0.5 block text-xs">{timeAgo(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
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

              <ol className="list-decimal space-y-1 rounded-lg border bg-muted/30 p-3 pl-8 text-sm text-muted-foreground">
                <li>
                  Empareja la PC con el código (arriba o &quot;Generar otro código&quot; / &quot;Cambiar de PC&quot;).
                </li>
                <li>
                  Asigna el perfil al canal en{" "}
                  <Link href={`/${businessSlug}/channels`} className="text-primary underline-offset-4 hover:underline">
                    Canales
                  </Link>{" "}
                  (Clientes para WhatsApp público; Personal/Admin solo si debe escribir en SISCAV).
                </li>
                <li>
                  Revisa tools e instrucciones en{" "}
                  <Link href={`/${businessSlug}/ai/profiles`} className="text-primary underline-offset-4 hover:underline">
                    Perfiles
                  </Link>
                  .
                </li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {pairing ? <PairingCard pairing={pairing} serverUrl={pairing.installation.agentServerUrl} /> : null}

      <Dialog open={Boolean(qrCode)} onOpenChange={(open) => !open && setQrCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanea con WhatsApp</DialogTitle>
            <DialogDescription>
              Vincula el teléfono al canal CSE. Cuando el estado pase a conectado, el checklist se actualizará.
            </DialogDescription>
          </DialogHeader>
          {qrCode ? (
            <div className="flex flex-col items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  qrCode.startsWith("data:")
                    ? qrCode
                    : `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`
                }
                alt="QR de WhatsApp"
                className="h-48 w-48 rounded border object-contain"
              />
              <Button type="button" variant="outline" onClick={() => void refresh()}>
                Actualizar estado
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
