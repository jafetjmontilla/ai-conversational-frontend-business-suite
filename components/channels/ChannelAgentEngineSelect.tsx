"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAgentEngineAppTitle,
  getAgentEngineInstallHintPlain,
  isAgentEngineAvailable,
} from "@/lib/app-suite/agentEngineApps";
import type { BusinessInstalledApp } from "@/lib/app-suite/capabilities";
import type { ChannelAgentEngine } from "@/lib/interfases";
import { toast } from "sonner";

type Props = {
  value: ChannelAgentEngine;
  onChange: (engine: ChannelAgentEngine) => void;
  businessId: string;
  installedApps: BusinessInstalledApp[] | null | undefined;
  disabled?: boolean;
  triggerClassName?: string;
};

export function ChannelAgentEngineSelect({
  value,
  onChange,
  businessId,
  installedApps,
  disabled,
  triggerClassName,
}: Props) {
  const hasCse = isAgentEngineAvailable(installedApps, "cse");
  const hasPae = isAgentEngineAvailable(installedApps, "pae");

  const trySelect = (next: ChannelAgentEngine) => {
    if (!isAgentEngineAvailable(installedApps, next)) {
      toast.error(getAgentEngineInstallHintPlain(next), {
        action: {
          label: "Ir a Suite",
          onClick: () => {
            window.location.href = `/${businessId}/app-suite`;
          },
        },
      });
      return;
    }
    onChange(next);
  };

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(v) => trySelect(v as ChannelAgentEngine)}
    >
      <SelectTrigger className={triggerClassName ?? "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cse" disabled={!hasCse}>
          CSE — {getAgentEngineAppTitle("cse")}
          {!hasCse ? " (no instalada)" : ""}
        </SelectItem>
        <SelectItem value="pae" disabled={!hasPae}>
          PAE — {getAgentEngineAppTitle("pae")}
          {!hasPae ? " (no instalada)" : ""}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function assertAgentEngineAvailable(
  installedApps: BusinessInstalledApp[] | null | undefined,
  engine: ChannelAgentEngine,
  businessId: string
): boolean {
  if (isAgentEngineAvailable(installedApps, engine)) return true;
  toast.error(getAgentEngineInstallHintPlain(engine), {
    action: {
      label: "Ir a Suite",
      onClick: () => {
        window.location.href = `/${businessId}/app-suite`;
      },
    },
  });
  return false;
}
