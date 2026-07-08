import type {
  BusinessConfig,
  BusinessConfigForUpdate,
  DataProvider,
  LlmAuthForUpdate,
  LlmAuthMasked,
  LlmConfig,
  LlmConfigForUpdate,
} from "@/lib/interfases";

/** Quita campos de solo lectura (p. ej. apiKeyMasked) antes de updateBusiness. */
export function sanitizeBusinessConfigForUpdate(config: BusinessConfig): BusinessConfigForUpdate {
  return {
    ...config,
    dataProviders: config.dataProviders?.map(sanitizeDataProviderForUpdate),
    llm: config.llm ? sanitizeLlmForUpdate(config.llm) : config.llm,
  };
}

function sanitizeDataProviderForUpdate(p: DataProvider): DataProvider {
  if (!p.auth?.type) {
    const { auth: _auth, ...rest } = p;
    return rest;
  }
  const { apiKeyMasked: _masked, ...auth } = p.auth;
  return {
    ...p,
    auth: {
      type: auth.type,
      headerName: auth.headerName || undefined,
      ...(auth.apiKey?.trim() ? { apiKey: auth.apiKey.trim() } : {}),
    },
  };
}

function sanitizeLlmForUpdate(llm: LlmConfig): LlmConfigForUpdate {
  if (!llm.auth) return llm;
  const { apiKeyMasked: _masked, type, headerName, apiKey } = llm.auth as LlmAuthMasked &
    Partial<LlmAuthForUpdate>;
  return {
    ...llm,
    auth: {
      type,
      headerName: headerName || undefined,
      ...(apiKey?.trim() ? { apiKey: apiKey.trim() } : {}),
    },
  };
}
