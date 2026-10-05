import * as z from "zod";
import type { CseProfile } from "@/lib/interfases";

export const cseProfileFormSchema = z.object({
  name: z.string().trim().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  active: z.boolean(),
  customInstructions: z.string().max(8000, "Máximo 8000 caracteres"),
  tools: z.array(z.string()),
  knowledgeSourceIds: z.array(z.string()),
  escalationEnabled: z.boolean(),
  escalationOnNoData: z.boolean(),
});

export type CseProfileFormValues = z.infer<typeof cseProfileFormSchema>;

export function cseProfileToFormValues(profile: CseProfile): CseProfileFormValues {
  return {
    name: profile.name,
    active: profile.active,
    customInstructions: profile.customInstructions ?? "",
    tools: [...profile.tools],
    knowledgeSourceIds: [...profile.knowledgeSourceIds],
    escalationEnabled: profile.escalation.enabled,
    escalationOnNoData: profile.escalation.onNoData,
  };
}
