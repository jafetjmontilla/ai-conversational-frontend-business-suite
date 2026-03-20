"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import type { Business, BaileysApiNumber } from "@/lib/interfases";
import { Plus, Trash2, Loader2, Smartphone, Wifi, WifiOff } from "lucide-react";

/** Respuesta de getBaileysSessionStatus (api-business-suite → api-whatsapp-v1). */
type BaileysSessionStatusRow = {
  isConnected?: boolean | null;
  qrCode?: string | null;
  phoneNumber?: string | null;
};

type BaileysStatusEntry = BaileysSessionStatusRow | null | "loading";

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

export default function ChannelsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  const { meData } = useAuth();
  const { businessRole } = useBusinessRole(businessId);
  const { canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [baileysStatusBySession, setBaileysStatusBySession] = useState<Record<string, BaileysStatusEntry>>({});

  const baileysList = business?.whatsapps?.baileysApiNumbers ?? [];
  const baileysSessionIdsKey = useMemo(() => baileysList.map((b) => b.sessionId).join("\0"), [baileysList]);

  const businessRef = useRef(business);
  businessRef.current = business;

  useEffect(() => {
    if (!business?._id) return;
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      const list = businessRef.current?.whatsapps?.baileysApiNumbers ?? [];
      if (list.length === 0) {
        setBaileysStatusBySession({});
        return;
      }
      setBaileysStatusBySession((prev) => {
        const next = { ...prev };
        for (const s of list) {
          next[s.sessionId] = "loading";
        }
        return next;
      });
      const results = await Promise.all(
        list.map(async (s) => {
          try {
            const st = (await fetchApiV1({
              query: queries.getBaileysSessionStatus,
              type: "json",
              variables: { sessionId: s.sessionId },
            })) as BaileysSessionStatusRow | undefined;
            return { sessionId: s.sessionId, status: (st ?? null) as BaileysSessionStatusRow | null };
          } catch {
            return { sessionId: s.sessionId, status: null };
          }
        })
      );
      if (cancelled) return;
      setBaileysStatusBySession((prev) => {
        const next = { ...prev };
        for (const r of results) {
          next[r.sessionId] = r.status;
        }
        return next;
      });
    };
    void load();
    const interval = setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [business?._id, baileysSessionIdsKey]);

  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      try {
        const isMyBusiness = meData?.business && (meData.business.businessId === businessId || meData.business._id === businessId);
        let b: Business | null = null;
        if (isMyBusiness && meData?.business) {
          b = meData.business as Business;
        }
        if (!b) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { id: businessId },
          })) as Business | null;
        }
        if (!b) {
          b = (await fetchApiV1({
            query: queries.getBusiness,
            type: "json",
            variables: { businessId },
          })) as Business | null;
        }
        if (b) setBusiness(b);
        else {
          toast.error("Negocio no encontrado");
          router.push("/businesses");
        }
      } catch {
        toast.error("Error al cargar");
        router.push("/businesses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId, meData?.business, router]);

  const handleCreateSession = async () => {
    if (!business?._id || !sessionId.trim()) {
      toast.error("Ingresa un identificador de sesión");
      return;
    }
    setCreating(true);
    setQrCode(null);
    try {
      const result = await fetchApiV1({
        query: queries.createBaileysSession,
        type: "json",
        variables: {
          id: business._id,
          sessionId: sessionId.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        },
      }) as { success: boolean; qrCode?: string | null; error?: string | null; session?: { isConnected?: boolean; phoneNumber?: string } };
      if (result?.success) {
        if (result.session?.isConnected) {
          toast.success("Sesión ya conectada");
        } else if (result.qrCode) {
          setQrCode(result.qrCode);
          toast.info("Escanea el código QR con WhatsApp");
        } else {
          toast.success("Sesión creada. Revisa el estado en la lista.");
        }
        setBusiness((prev) => {
          if (!prev) return prev;
          const list = [...(prev.whatsapps?.baileysApiNumbers ?? [])];
          if (!list.some((n) => n.sessionId === sessionId.trim())) {
            list.push({ sessionId: sessionId.trim(), phoneNumber: phoneNumber.trim() || undefined });
          }
          return {
            ...prev,
            whatsapps: {
              metaCloudApiNumbers: prev.whatsapps?.metaCloudApiNumbers ?? [],
              baileysApiNumbers: list,
            },
          };
        });
      } else {
        toast.error(result?.error ?? "Error al crear sesión");
      }
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "Error al crear sesión";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (item: BaileysApiNumber, disconnect: boolean) => {
    if (!business?._id) return;
    setRemoving(item.sessionId);
    try {
      await fetchApiV1({
        query: queries.removeBaileysNumber,
        type: "json",
        variables: {
          id: business._id,
          sessionId: item.sessionId,
          disconnect: !!disconnect,
        },
      });
      setBusiness((prev) => {
        if (!prev) return prev;
        const list = (prev.whatsapps?.baileysApiNumbers ?? []).filter((n) => n.sessionId !== item.sessionId);
        return {
          ...prev,
          whatsapps: {
            metaCloudApiNumbers: prev.whatsapps?.metaCloudApiNumbers ?? [],
            baileysApiNumbers: list,
          },
        };
      });
      toast.success("Número quitado del negocio");
    } catch {
      toast.error("Error al quitar");
    } finally {
      setRemoving(null);
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
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Canales</CardTitle>
          <CardDescription>
            {business.name} — WhatsApp Cloud API, WhatsApp (Baileys) y canal genérico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="baileys" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cloud">WhatsApp Cloud API</TabsTrigger>
              <TabsTrigger value="baileys">WhatsApp (Baileys)</TabsTrigger>
              <TabsTrigger value="generico">Genérico</TabsTrigger>
            </TabsList>

            <TabsContent value="cloud" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Configuración de números con la API oficial de Meta (WhatsApp Cloud API). Próximamente.
              </p>
            </TabsContent>

            <TabsContent value="baileys" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Conecta números de WhatsApp mediante Baileys. Crea una sesión con un identificador único y escanea el QR desde tu teléfono.
              </p>

              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> Añadir número (Baileys)
                </h4>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs text-muted-foreground block mb-1">ID de sesión</label>
                    <Input
                      placeholder="ej. ventas-1"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      disabled={creating}
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs text-muted-foreground block mb-1">Teléfono (opcional)</label>
                    <Input
                      placeholder="+58 412 1234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={creating}
                    />
                  </div>
                  <Button onClick={handleCreateSession} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Conectar sesión
                      </>
                    )}
                  </Button>
                </div>
                {qrCode && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg flex flex-col items-center gap-2">
                    <p className="text-sm font-medium">Escanea con WhatsApp</p>
                    <img
                      src={qrCode.startsWith("data:") ? qrCode : `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`}
                      alt="QR de WhatsApp"
                      className="w-48 h-48 object-contain border rounded"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Números Baileys vinculados</h4>
                {baileysList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay números conectados.</p>
                ) : (
                  <ul className="space-y-2">
                    {baileysList.map((item) => {
                      const st = baileysStatusBySession[item.sessionId];
                      const phoneFromApi =
                        st && st !== "loading" && st?.phoneNumber ? st.phoneNumber : null;
                      const phoneLabel = item.phoneNumber ?? phoneFromApi;
                      return (
                      <li
                        key={item.sessionId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
                      >
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                          <div className="min-w-0">
                            <span className="font-mono text-sm">{item.sessionId}</span>
                            {phoneLabel && (
                              <span className="text-muted-foreground text-sm ml-2">— {phoneLabel}</span>
                            )}
                          </div>
                          <BaileysConnectionBadge entry={st} />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={removing === item.sessionId}
                          onClick={() => handleRemove(item, true)}
                        >
                          {removing === item.sessionId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </li>
                    );
                    })}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="generico" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                URL de callback para webhooks genéricos. Próximamente.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
