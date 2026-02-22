"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";

type Props = {
  sourceId: KnowledgeSourceId;
  title: string;
  description: string;
};

export function KnowledgePlaceholder({ sourceId, title, description }: Props) {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta fuente de conocimiento (<code className="rounded bg-muted px-1">{sourceId}</code>) seguirá la misma filosofía: IA genera el borrador a partir de tu narrativa o texto, tú revisas y apruebas, y se indexa en Knowledge-RAG.
          </p>
          <p className="text-sm text-muted-foreground">
            Próximamente: flujo de generación, borradores y aprobación para este tipo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
