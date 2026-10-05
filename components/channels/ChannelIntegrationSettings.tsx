"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessChannel, CseProfile } from "@/lib/interfases";

const NO_PROFILE = "__none__";

export type ChannelIntegrationPatch = {
  webhookSecret?: string;
  requireSignature?: boolean;
  defaultProfileId?: string | null;
};

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("No se pudo copiar");
  }
}

interface ChannelIntegrationSettingsProps {
  businessId: string;
  channel: BusinessChannel;
  profiles: CseProfile[];
  disabled?: boolean;
  onUpdate: (patch: ChannelIntegrationPatch) => Promise<boolean>;
}

/** Perfil CSE por defecto (canales CSE) y firma HMAC (canales genéricos). */
export function ChannelIntegrationSettings({
  businessId,
  channel,
  profiles,
  disabled,
  onUpdate,
}: ChannelIntegrationSettingsProps) {
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const isGeneric = channel.type === "generic";
  const isCse = channel.agentEngine === "cse";
  if (!isGeneric && !isCse) return null;

  const handleRotate = async () => {
    const secret = generateSecret();
    setRotating(true);
    try {
      const ok = await onUpdate({ webhookSecret: secret });
      if (ok) setRevealedSecret(secret);
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="mt-3 grid gap-4 border-t pt-3 md:grid-cols-2">
      {isCse ? (
        <div className="space-y-1">
          <Label>Perfil por defecto</Label>
          <Select
            value={channel.defaultProfileId || NO_PROFILE}
            disabled={disabled}
            onValueChange={(v) => void onUpdate({ defaultProfileId: v === NO_PROFILE ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROFILE}>Sin perfil (todas las tools y fuentes)</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.profileId} value={p.profileId}>
                  {p.name}
                  {!p.active ? " (inactivo)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Un sistema firmado puede elegir otro perfil por mensaje.{" "}
            <Link href={`/${businessId}/ai/profiles`} className="underline">
              Gestionar perfiles
            </Link>
          </p>
        </div>
      ) : null}

      {isGeneric ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Firma HMAC</Label>
            {channel.hasWebhookSecret ? (
              <Badge variant="secondary" className="font-normal">
                Secreto configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Sin secreto
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID del canal:</span>
            <span className="truncate font-mono">{channel.channelId}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => void copyText(channel.channelId, "ID del canal")}
              aria-label="Copiar ID del canal"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || rotating}
              onClick={() => void handleRotate()}
            >
              {rotating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <KeyRound className="mr-2 h-3 w-3" />}
              {channel.hasWebhookSecret ? "Rotar secreto" : "Generar secreto"}
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                checked={channel.requireSignature === true}
                disabled={disabled || !channel.hasWebhookSecret}
                onCheckedChange={(checked) => void onUpdate({ requireSignature: checked })}
              />
              <span className="text-xs text-muted-foreground">Exigir firma</span>
            </div>
          </div>
          {revealedSecret ? (
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input readOnly value={revealedSecret} className="h-8 font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => void copyText(revealedSecret, "Secreto")}
                  aria-label="Copiar secreto"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Cópialo ahora: no se volverá a mostrar. El sistema integrado debe actualizarlo.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
