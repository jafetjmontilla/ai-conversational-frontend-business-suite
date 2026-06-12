"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusinessApps } from "@/lib/hooks/useBusinessApps";
import { useBusinessChannels } from "@/lib/hooks/useBusinessChannels";
import {
  useBaileysSessionRealtime,
  type BaileysStatusEntry,
} from "@/lib/hooks/useBaileysSessionRealtime";
import { isAgentEngineAvailable, pickAvailableAgentEngine } from "@/lib/app-suite/agentEngineApps";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { InfoNotice } from "@/components/ui/info-notice";
import {
  assertAgentEngineAvailable,
  ChannelAgentEngineSelect,
} from "@/components/channels/ChannelAgentEngineSelect";
import type { BusinessChannel, ChannelAgentEngine, ChannelType } from "@/lib/interfases";
import {
  Plus,
  Trash2,
  Loader2,
  Smartphone,
  Wifi,
  WifiOff,
  MessageSquare,
  Globe,
  Radio,
  X,
} from "lucide-react";

const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  whatsapp_cloud: "WhatsApp Cloud API",
  whatsapp_baileys: "WhatsApp (Baileys)",
  generic: "Genérico",
};

function BaileysConnectionBadge({ entry }: { entry: BaileysStatusEntry | undefined }) {
  if (entry === undefined || entry === "loading") {
    return (
      <Badge variant="secondary" className="shrink-0 gap-1 font-normal">
        <Loader2 className="h-3 w-3 animate-spin" />
        Comprobando…
      </Badge>
    );
  }
  if (entry === null) {
    return (
      <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
        Sin datos
      </Badge>
    );
  }
  if (entry.isConnected) {
    return (
      <Badge className="shrink-0 gap-1 border-transparent bg-emerald-600 font-normal text-primary-foreground hover:bg-emerald-600">
        <Wifi className="h-3 w-3" />
        Conectado
      </Badge>
    );
  }
  if (entry.qrCode) {
    return (
      <Badge className="shrink-0 border-transparent bg-amber-500 font-normal text-amber-950 hover:bg-amber-500">
        Esperando QR
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="shrink-0 gap-1 font-normal">
      <WifiOff className="h-3 w-3" />
      Desconectado
    </Badge>
  );
}

function ChannelTypeIcon({ type }: { type: ChannelType }) {
  if (type === "whatsapp_cloud") return <MessageSquare className="h-4 w-4" />;
  if (type === "whatsapp_baileys") return <Smartphone className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

function allowlistArraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

interface ChannelAllowlistEditorProps {
  numbers: string[];
  disabled?: boolean;
  onChange: (numbers: string[]) => void;
}

function ChannelAllowlistEditor({ numbers, disabled, onChange }: ChannelAllowlistEditorProps) {
  const [input, setInput] = useState("");
  const [pendingRemoveNumber, setPendingRemoveNumber] = useState<string | null>(null);

  const addNumber = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (numbers.includes(trimmed)) {
      toast.error("Ese número ya está en la lista");
      return;
    }
    onChange([...numbers, trimmed]);
    setInput("");
  };

  const removeNumber = (value: string) => {
    if (numbers.length === 1) {
      setPendingRemoveNumber(value);
      return;
    }
    onChange(numbers.filter((n) => n !== value));
  };

  const confirmRemoveLastNumber = () => {
    if (!pendingRemoveNumber) return;
    onChange([]);
    setPendingRemoveNumber(null);
  };

  return (
    <div className="w-full max-w-[300px] space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        Números permitidos (vacío = todos)
      </label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addNumber();
            }
          }}
          placeholder="+58 412 1234567"
          disabled={disabled}
          className="h-8 text-sm"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          disabled={disabled || !input.trim()}
          onClick={addNumber}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
        {numbers.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sin restricción — todos los números</span>
        ) : (
          numbers.map((number) => (
            <Badge key={number} variant="secondary" className="gap-1 pr-1 font-normal">
              {number}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50"
                disabled={disabled}
                onClick={() => removeNumber(number)}
                aria-label={`Quitar ${number}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <ConfirmDeleteDialog
        open={pendingRemoveNumber !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveNumber(null);
        }}
        onConfirm={confirmRemoveLastNumber}
        title="Quitar último número"
        description={
          pendingRemoveNumber ? (
            <span>
              ¿Quitar <strong>{pendingRemoveNumber}</strong> de la lista? Si no queda ningún
              número configurado, el canal <strong>aceptará mensajes de todos los números</strong>.
            </span>
          ) : (
            ""
          )
        }
        confirmButtonText="Quitar y permitir todos"
        cancelButtonText="Cancelar"
      />
    </div>
  );
}

function getChannelDisplayPhone(
  ch: BusinessChannel,
  baileysStatus?: BaileysStatusEntry
): string | null {
  if (ch.type === "whatsapp_cloud") {
    return ch.phoneNumber?.trim() || ch.phoneNumberId?.trim() || null;
  }
  if (ch.type === "whatsapp_baileys") {
    if (baileysStatus && baileysStatus !== "loading" && baileysStatus.phoneNumber?.trim()) {
      return baileysStatus.phoneNumber.trim();
    }
    return ch.phoneNumber?.trim() || null;
  }
  return null;
}

export function ChannelsPageContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { installedApps } = useBusinessApps(businessId);
  const {
    business,
    channels,
    loading,
    upsertChannel,
    deleteChannel,
    createBaileysSession,
    isCreatingBaileys,
  } = useBusinessChannels(businessId);

  const [savingChannelId, setSavingChannelId] = useState<string | null>(null);
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<BusinessChannel | null>(null);

  const [sessionId, setSessionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [baileysAgentEngine, setBaileysAgentEngine] = useState<"cse" | "pae">("cse");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pendingQrSessionId, setPendingQrSessionId] = useState<string | null>(null);

  const [cloudName, setCloudName] = useState("");
  const [cloudPhoneNumberId, setCloudPhoneNumberId] = useState("");
  const [cloudPhoneNumber, setCloudPhoneNumber] = useState("");
  const [cloudAccessToken, setCloudAccessToken] = useState("");
  const [cloudVerifyToken, setCloudVerifyToken] = useState("");
  const [cloudAgentEngine, setCloudAgentEngine] = useState<"cse" | "pae">("cse");
  const [savingCloud, setSavingCloud] = useState(false);

  const [genericName, setGenericName] = useState("");
  const [genericCallbackUrl, setGenericCallbackUrl] = useState("");
  const [genericWebhookSecret, setGenericWebhookSecret] = useState("");
  const [genericAgentEngine, setGenericAgentEngine] = useState<"cse" | "pae">("cse");
  const [savingGeneric, setSavingGeneric] = useState(false);

  const [allowlistDrafts, setAllowlistDrafts] = useState<Record<string, string[]>>({});

  const baileysSessionIdsKey = useMemo(
    () =>
      channels
        .filter((c) => c.type === "whatsapp_baileys" && c.sessionId)
        .map((c) => c.sessionId!)
        .join("\0"),
    [channels]
  );

  const { statusBySession: baileysStatusBySession, seedSessionStatus } =
    useBaileysSessionRealtime(businessId, baileysSessionIdsKey);

  const hasAnyAgentApp = useMemo(
    () =>
      isAgentEngineAvailable(installedApps, "cse") ||
      isAgentEngineAvailable(installedApps, "pae"),
    [installedApps]
  );

  useEffect(() => {
    if (!loading && !business && businessId) {
      toast.error("Negocio no encontrado");
      router.push("/businesses");
    }
  }, [loading, business, businessId, router]);

  useEffect(() => {
    if (!business) return;
    const preferred = business.config?.agent?.defaultEngine === "pae" ? "pae" : "cse";
    const available = pickAvailableAgentEngine(business.installedApps, preferred);
    setBaileysAgentEngine(available);
    setCloudAgentEngine(available);
    setGenericAgentEngine(available);
  }, [business]);

  const channelsAllowlistKey = useMemo(
    () =>
      channels
        .map((c) => `${c.channelId}\0${(c.allowedPhoneNumbers ?? []).join("\n")}`)
        .join("\x01"),
    [channels]
  );

  useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const ch of channels) {
      next[ch.channelId] = [...(ch.allowedPhoneNumbers ?? [])];
    }
    setAllowlistDrafts((prev) => {
      const ids = Object.keys(next);
      if (
        ids.length === Object.keys(prev).length &&
        ids.every((id) => allowlistArraysEqual(prev[id], next[id]))
      ) {
        return prev;
      }
      return next;
    });
  }, [channelsAllowlistKey, channels]);

  useEffect(() => {
    if (!pendingQrSessionId) return;
    const entry = baileysStatusBySession[pendingQrSessionId];
    if (entry && entry !== "loading" && entry.isConnected) {
      setQrCode(null);
      setPendingQrSessionId(null);
      toast.success("WhatsApp conectado");
      return;
    }
    if (entry && entry !== "loading" && entry.qrCode) {
      setQrCode(entry.qrCode);
    }
  }, [pendingQrSessionId, baileysStatusBySession]);

  const handleChannelFieldUpdate = async (
    channel: BusinessChannel,
    patch: Partial<BusinessChannel>,
    options?: { silent?: boolean }
  ) => {
    const nextEngine = (patch.agentEngine ?? channel.agentEngine) as ChannelAgentEngine;
    if (patch.agentEngine && !assertAgentEngineAvailable(installedApps, nextEngine, businessId)) {
      return;
    }
    if (patch.active === true && !assertAgentEngineAvailable(installedApps, nextEngine, businessId)) {
      return;
    }
    setSavingChannelId(channel.channelId);
    try {
      const updated = await upsertChannel({
        channelId: channel.channelId,
        name: patch.name ?? channel.name,
        type: channel.type,
        active: patch.active ?? channel.active,
        agentEngine: patch.agentEngine ?? channel.agentEngine,
        allowedPhoneNumbers: patch.allowedPhoneNumbers ?? channel.allowedPhoneNumbers,
        sessionId: channel.sessionId,
        phoneNumber: channel.phoneNumber,
        phoneNumberId: channel.phoneNumberId,
        accessToken: channel.accessToken,
        verifyToken: channel.verifyToken,
        callbackUrl: channel.callbackUrl,
        webhookSecret: channel.webhookSecret,
      });
      if (updated && !options?.silent) toast.success("Canal actualizado");
    } finally {
      setSavingChannelId(null);
    }
  };

  const handleAllowlistChange = async (channel: BusinessChannel, numbers: string[]) => {
    const unique = Array.from(new Set(numbers.map((n) => n.trim()).filter(Boolean)));
    setAllowlistDrafts((prev) => ({ ...prev, [channel.channelId]: unique }));
    await handleChannelFieldUpdate(channel, { allowedPhoneNumbers: unique }, { silent: true });
  };

  const handleConfirmDeleteChannel = async () => {
    if (!channelToDelete) return;
    const { channelId } = channelToDelete;
    setDeletingChannelId(channelId);
    try {
      const updated = await deleteChannel(channelId);
      if (updated) setChannelToDelete(null);
    } finally {
      setDeletingChannelId(null);
    }
  };

  const handleCreateBaileys = async () => {
    if (!sessionId.trim()) {
      toast.error("Ingresa un identificador de sesión");
      return;
    }
    if (!assertAgentEngineAvailable(installedApps, baileysAgentEngine, businessId)) {
      return;
    }
    const trimmedSessionId = sessionId.trim();
    setQrCode(null);
    setPendingQrSessionId(null);
    const result = await createBaileysSession({
      sessionId: trimmedSessionId,
      phoneNumber: phoneNumber.trim() || undefined,
      agentEngine: baileysAgentEngine,
    });
    if (!result?.success) return;
    seedSessionStatus(trimmedSessionId, {
      isConnected: result.session?.isConnected ?? false,
      phoneNumber: result.session?.phoneNumber ?? null,
      qrCode: result.qrCode ?? null,
    });
    if (result.session?.isConnected) {
      toast.success("Sesión ya conectada");
    } else if (result.qrCode) {
      setPendingQrSessionId(trimmedSessionId);
      setQrCode(result.qrCode);
      toast.info("Escanea el código QR con WhatsApp");
    } else {
      toast.success("Sesión creada");
    }
    setSessionId("");
    setPhoneNumber("");
  };

  const handleCreateCloud = async () => {
    if (!assertAgentEngineAvailable(installedApps, cloudAgentEngine, businessId)) {
      return;
    }
    setSavingCloud(true);
    try {
      const updated = await upsertChannel({
        name: cloudName.trim() || cloudPhoneNumber.trim() || "WhatsApp Cloud",
        type: "whatsapp_cloud",
        active: true,
        agentEngine: cloudAgentEngine,
        allowedPhoneNumbers: [],
        phoneNumberId: cloudPhoneNumberId.trim(),
        phoneNumber: cloudPhoneNumber.trim(),
        accessToken: cloudAccessToken.trim(),
        verifyToken: cloudVerifyToken.trim(),
      });
      if (updated) {
        toast.success("Canal Cloud API creado");
        setCloudName("");
        setCloudPhoneNumberId("");
        setCloudPhoneNumber("");
        setCloudAccessToken("");
        setCloudVerifyToken("");
      }
    } finally {
      setSavingCloud(false);
    }
  };

  const handleCreateGeneric = async () => {
    if (!assertAgentEngineAvailable(installedApps, genericAgentEngine, businessId)) {
      return;
    }
    setSavingGeneric(true);
    try {
      const updated = await upsertChannel({
        name: genericName.trim() || "Canal genérico",
        type: "generic",
        active: true,
        agentEngine: genericAgentEngine,
        allowedPhoneNumbers: [],
        callbackUrl: genericCallbackUrl.trim(),
        webhookSecret: genericWebhookSecret.trim() || undefined,
      });
      if (updated) {
        toast.success("Canal genérico creado");
        setGenericName("");
        setGenericCallbackUrl("");
        setGenericWebhookSecret("");
      }
    } finally {
      setSavingGeneric(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!business) return null;

  if (!canEditCurrentBusiness()) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes permiso para gestionar canales de este negocio.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/businesses")}>
              Volver a Negocios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Canales
          </CardTitle>
          <CardDescription>
            {business.name} — Cada canal tiene su configuración y un destino: agente CSE (servicio al cliente) o PAE
            (asistente personal).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay canales configurados.</p>
          ) : (
            <ul className="space-y-3">
              {channels.map((ch) => {
                const baileysSt =
                  ch.type === "whatsapp_baileys" && ch.sessionId
                    ? baileysStatusBySession[ch.sessionId]
                    : undefined;
                const displayPhone = getChannelDisplayPhone(ch, baileysSt);
                return (
                  <li
                    key={ch.channelId}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 text-muted-foreground">
                          <ChannelTypeIcon type={ch.type} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{ch.name}</p>
                            {displayPhone && (
                              <p className="text-xs text-muted-foreground mt-1">{displayPhone}</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{CHANNEL_TYPE_LABEL[ch.type]}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {baileysSt !== undefined && <BaileysConnectionBadge entry={baileysSt} />}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Activo</span>
                          <Switch
                            checked={ch.active !== false}
                            disabled={savingChannelId === ch.channelId || deletingChannelId === ch.channelId}
                            onCheckedChange={(checked) =>
                              void handleChannelFieldUpdate(ch, { active: checked })
                            }
                          />
                        </div>
                        <ChannelAgentEngineSelect
                          value={ch.agentEngine}
                          businessId={businessId}
                          installedApps={installedApps}
                          disabled={savingChannelId === ch.channelId}
                          triggerClassName="w-[180px] h-8 text-xs"
                          onChange={(engine) =>
                            void handleChannelFieldUpdate(ch, { agentEngine: engine })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingChannelId === ch.channelId}
                          onClick={() => setChannelToDelete(ch)}
                        >
                          {deletingChannelId === ch.channelId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {(ch.type === "whatsapp_cloud" || ch.type === "whatsapp_baileys") && (
                      <div className="border-t pt-3">
                        <ChannelAllowlistEditor
                          numbers={allowlistDrafts[ch.channelId] ?? []}
                          disabled={savingChannelId === ch.channelId}
                          onChange={(numbers) => void handleAllowlistChange(ch, numbers)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle>Añadir canal</CardTitle>
            <CardDescription>Puedes tener varios canales del mismo tipo con distinto destino.</CardDescription>
          </div>
          {!hasAnyAgentApp && (
            <InfoNotice>
              Instala un agente en la{" "}
              <Link href={`/${businessId}/app-suite`}>Suite de aplicaciones</Link> para conectar
              canales.
            </InfoNotice>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="baileys" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cloud">Cloud API</TabsTrigger>
              <TabsTrigger value="baileys">Baileys</TabsTrigger>
              <TabsTrigger value="generico">Genérico</TabsTrigger>
            </TabsList>

            <TabsContent value="cloud" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Nombre</label>
                  <Input value={cloudName} onChange={(e) => setCloudName(e.target.value)} placeholder="Ventas" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Destino</label>
                  <ChannelAgentEngineSelect
                    value={cloudAgentEngine}
                    businessId={businessId}
                    installedApps={installedApps}
                    onChange={setCloudAgentEngine}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone Number ID</label>
                  <Input value={cloudPhoneNumberId} onChange={(e) => setCloudPhoneNumberId(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Teléfono</label>
                  <Input value={cloudPhoneNumber} onChange={(e) => setCloudPhoneNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Access Token</label>
                  <Input value={cloudAccessToken} onChange={(e) => setCloudAccessToken(e.target.value)} type="password" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Verify Token</label>
                  <Input value={cloudVerifyToken} onChange={(e) => setCloudVerifyToken(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => void handleCreateCloud()} disabled={savingCloud}>
                {savingCloud ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Añadir canal Cloud API
              </Button>
            </TabsContent>

            <TabsContent value="baileys" className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-muted-foreground block mb-1">ID de sesión</label>
                  <Input
                    placeholder="ventas-1"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    disabled={isCreatingBaileys}
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-muted-foreground block mb-1">Teléfono (opcional)</label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCreatingBaileys}
                  />
                </div>
                <div className="w-[200px]">
                  <label className="text-xs text-muted-foreground block mb-1">Destino</label>
                  <ChannelAgentEngineSelect
                    value={baileysAgentEngine}
                    businessId={businessId}
                    installedApps={installedApps}
                    onChange={setBaileysAgentEngine}
                  />
                </div>
                <Button onClick={() => void handleCreateBaileys()} disabled={isCreatingBaileys}>
                  {isCreatingBaileys ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Conectar
                </Button>
              </div>
              {qrCode && (
                <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center gap-2">
                  <p className="text-sm font-medium">Escanea con WhatsApp</p>
                  <img
                    src={
                      qrCode.startsWith("data:")
                        ? qrCode
                        : `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`
                    }
                    alt="QR de WhatsApp"
                    className="w-48 h-48 object-contain border rounded"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="generico" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Nombre</label>
                  <Input value={genericName} onChange={(e) => setGenericName(e.target.value)} placeholder="Webhook app" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Destino</label>
                  <ChannelAgentEngineSelect
                    value={genericAgentEngine}
                    businessId={businessId}
                    installedApps={installedApps}
                    onChange={setGenericAgentEngine}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Callback URL</label>
                  <Input
                    value={genericCallbackUrl}
                    onChange={(e) => setGenericCallbackUrl(e.target.value)}
                    placeholder="https://tu-app.com/webhook"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Webhook secret (opcional)</label>
                  <Input
                    value={genericWebhookSecret}
                    onChange={(e) => setGenericWebhookSecret(e.target.value)}
                    type="password"
                  />
                </div>
              </div>
              <Button onClick={() => void handleCreateGeneric()} disabled={savingGeneric}>
                {savingGeneric ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Añadir canal genérico
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={channelToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingChannelId) setChannelToDelete(null);
        }}
        title="Eliminar canal"
        description={
          channelToDelete ? (
            <span>
              ¿Eliminar el canal <strong>{channelToDelete.name}</strong> (
              {CHANNEL_TYPE_LABEL[channelToDelete.type]}
              )?
              {channelToDelete.type === "whatsapp_baileys" && channelToDelete.sessionId ? (
                <>
                  {" "}
                  La sesión <span className="font-mono text-xs">{channelToDelete.sessionId}</span> se
                  desconectará de WhatsApp.
                </>
              ) : null}{" "}
              Esta acción no se puede deshacer.
            </span>
          ) : (
            ""
          )
        }
        onConfirm={() => void handleConfirmDeleteChannel()}
        loading={deletingChannelId === channelToDelete?.channelId}
        confirmButtonText="Eliminar canal"
      />
    </div>
  );
}
