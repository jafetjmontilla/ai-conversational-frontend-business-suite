"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApiV1, queries } from "@/lib/Fetching";
import type {
  PaeLocalDeviceCredentials,
  PaeLocalDeviceListResult,
  PaeLocalDevicePairingStart,
  PaeLocalDeviceRow,
} from "@/lib/interfases";
import { toast } from "sonner";
import { Link2, MonitorSmartphone, RefreshCw, ShieldOff } from "lucide-react";
import { useBusinessPermissions, useBusinessRole } from "@/lib/hooks/useAllowed";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PAGE_SIZE = 50;

export function PaeDevicesContent() {
  const params = useParams();
  const businessSlug = params?.businessId as string;
  const { businessRole } = useBusinessRole(businessSlug);
  const { canViewCurrentBusiness, canEditCurrentBusiness } = useBusinessPermissions(businessRole);
  const { businessIdDoc } = useBusiness(businessSlug);

  const [devices, setDevices] = useState<PaeLocalDeviceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [pairingCodeInput, setPairingCodeInput] = useState("");
  const [pendingPairing, setPendingPairing] = useState<PaeLocalDevicePairingStart | null>(null);
  const [issuedCreds, setIssuedCreds] = useState<PaeLocalDeviceCredentials | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!businessIdDoc) return;
    setLoading(true);
    try {
      const res = (await fetchApiV1({
        query: queries.listPaeLocalDevices,
        type: "json",
        variables: { businessDocId: businessIdDoc, skip: 0, limit: PAGE_SIZE },
      })) as PaeLocalDeviceListResult | undefined;
      setDevices(res?.items ?? []);
      setTotal(res?.totalCount ?? 0);
    } catch {
      toast.error("Error al cargar dispositivos locales");
    } finally {
      setLoading(false);
    }
  }, [businessIdDoc]);

  useEffect(() => {
    void load();
  }, [load]);

  const startPairing = async () => {
    if (!businessIdDoc) return;
    setBusy(true);
    setIssuedCreds(null);
    try {
      const res = (await fetchApiV1({
        query: queries.startPaeLocalDevicePairing,
        type: "json",
        variables: {
          businessDocId: businessIdDoc,
          label: label.trim() || null,
        },
      })) as PaeLocalDevicePairingStart | undefined;
      if (!res?.pairingCode) throw new Error("sin código");
      setPendingPairing(res);
      setPairingCodeInput(res.pairingCode);
      toast.success("Código de pairing generado");
      void load();
    } catch {
      toast.error("No se pudo iniciar el pairing");
    } finally {
      setBusy(false);
    }
  };

  const confirmPairing = async () => {
    if (!businessIdDoc) return;
    const code = pairingCodeInput.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setBusy(true);
    try {
      const res = (await fetchApiV1({
        query: queries.confirmPaeLocalDevicePairing,
        type: "json",
        variables: { businessDocId: businessIdDoc, pairingCode: code },
      })) as PaeLocalDeviceCredentials | undefined;
      if (!res?.deviceSecret) throw new Error("sin credenciales");
      setIssuedCreds(res);
      setPendingPairing(null);
      toast.success("Dispositivo emparejado — copia las credenciales ahora");
      void load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo confirmar el pairing";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (deviceId: string) => {
    if (!businessIdDoc) return;
    setBusy(true);
    try {
      await fetchApiV1({
        query: queries.revokePaeLocalDevice,
        type: "json",
        variables: { businessDocId: businessIdDoc, deviceId },
      });
      toast.success("Dispositivo revocado");
      void load();
    } catch {
      toast.error("No se pudo revocar");
    } finally {
      setBusy(false);
    }
  };

  if (!canViewCurrentBusiness()) {
    return (
      <div className="p-6 text-muted-foreground">No tienes permiso para ver esta sección.</div>
    );
  }

  const canEdit = canEditCurrentBusiness();

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5" />
              Dispositivos locales
            </CardTitle>
            <CardDescription>
              Empareja el daemon <code className="text-xs">pae-local-agent</code> (Fase 6). MVP:
              clipboard. {total} registrado(s).
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {loading ? "Cargando…" : "Sin dispositivos. Inicia un pairing."}
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.label || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{d.deviceId.slice(0, 12)}…</TableCell>
                    <TableCell>{d.status}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.allowedCapabilities.join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && d.status !== "revoked" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => void revoke(d.deviceId)}
                        >
                          <ShieldOff className="mr-1 h-4 w-4" />
                          Revocar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canEdit ? (
        <div className="space-y-4">
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-base">1. Iniciar pairing</CardTitle>
              <CardDescription>Genera un código de 6 dígitos (90s).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="device-label">Etiqueta (opcional)</Label>
                <Input
                  id="device-label"
                  placeholder="Mac de Ana"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={busy}
                />
              </div>
              <Button type="button" onClick={() => void startPairing()} disabled={busy}>
                <Link2 className="mr-2 h-4 w-4" />
                Generar código
              </Button>
              {pendingPairing ? (
                <p className="text-sm">
                  Código:{" "}
                  <span className="font-mono text-lg tracking-widest">{pendingPairing.pairingCode}</span>
                  <br />
                  <span className="text-muted-foreground text-xs">
                    Expira {new Date(pendingPairing.expiresAt).toLocaleTimeString()}
                  </span>
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-base">2. Confirmar</CardTitle>
              <CardDescription>
                Confirma el código para emitir <code className="text-xs">PAE_DEVICE_*</code> (una sola
                vez).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pairing-code">Código</Label>
                <Input
                  id="pairing-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={busy}
                />
              </div>
              <Button type="button" onClick={() => void confirmPairing()} disabled={busy}>
                Confirmar y emitir credenciales
              </Button>
            </CardContent>
          </Card>

          {issuedCreds ? (
            <Card className="border border-amber-500/40 bg-amber-500/5 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Credenciales (copiar ahora)</CardTitle>
                <CardDescription>
                  Configura el daemon y no se volverán a mostrar en la API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 font-mono text-xs break-all">
                <p>PAE_DEVICE_ID={issuedCreds.device.deviceId}</p>
                <p>PAE_DEVICE_SECRET={issuedCreds.deviceSecret}</p>
                <p>PAE_DEVICE_TOKEN={issuedCreds.deviceToken}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground p-4">
          Solo administradores pueden emparejar o revocar dispositivos.
        </p>
      )}
    </div>
  );
}
