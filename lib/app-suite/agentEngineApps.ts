import type { ChannelAgentEngine } from "@/lib/interfases";
import { getAppTitle, isAppInstalled, type BusinessInstalledApp } from "@/lib/app-suite/capabilities";

export const AGENT_ENGINE_APP_ID = {
  cse: "agente-atencion-cliente",
  pae: "agente-asistente-personal",
} as const satisfies Record<ChannelAgentEngine, string>;

export function isAgentEngineAvailable(
  installedApps: BusinessInstalledApp[] | null | undefined,
  engine: ChannelAgentEngine
): boolean {
  return isAppInstalled(installedApps, AGENT_ENGINE_APP_ID[engine]);
}

export function getAgentEngineAppTitle(engine: ChannelAgentEngine): string {
  return getAppTitle(AGENT_ENGINE_APP_ID[engine]);
}

export function getAgentEngineInstallHintPlain(engine: ChannelAgentEngine): string {
  const title = getAgentEngineAppTitle(engine);
  return `Debes instalar la app "${title}" en la Suite de aplicaciones para usar este destino.`;
}

export function pickAvailableAgentEngine(
  installedApps: BusinessInstalledApp[] | null | undefined,
  preferred?: ChannelAgentEngine
): ChannelAgentEngine {
  if (preferred && isAgentEngineAvailable(installedApps, preferred)) return preferred;
  if (isAgentEngineAvailable(installedApps, "cse")) return "cse";
  if (isAgentEngineAvailable(installedApps, "pae")) return "pae";
  return preferred ?? "cse";
}
