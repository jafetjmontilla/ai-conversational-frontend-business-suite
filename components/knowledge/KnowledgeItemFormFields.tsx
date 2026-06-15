"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { KnowledgeSourceId } from "@/lib/knowledgeTypes";
import { StringListEditor } from "@/components/knowledge/StringListEditor";

export function parseKnowledgeItemPayload(payloadStr: string): Record<string, unknown> {
  try {
    return JSON.parse(payloadStr) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter(Boolean);
}

type Props = {
  sourceId: KnowledgeSourceId;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
};

export function KnowledgeItemFormFields({ sourceId, value, onChange, disabled }: Props) {
  const set = (key: string, fieldValue: unknown) => {
    onChange({ ...value, [key]: fieldValue });
  };

  if (sourceId === "faqs") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="knowledge-question">Pregunta</Label>
          <Input
            id="knowledge-question"
            value={asString(value.question)}
            onChange={(e) => set("question", e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-answer">Respuesta</Label>
          <AutoResizeTextarea
            id="knowledge-answer"
            value={asString(value.answer)}
            onChange={(e) => set("answer", e.target.value)}
            disabled={disabled}
            minRows={1}
            maxRows={8}
            className="mt-1"
          />
        </div>
        <StringListEditor
          label="Keywords"
          values={asStringList(value.keywords)}
          onChange={(keywords) => set("keywords", keywords)}
          placeholder="ej. envío, pago…"
          disabled={disabled}
          emptyHint="Sin keywords — agrega términos para mejorar la búsqueda"
        />
      </div>
    );
  }

  if (sourceId === "glossary") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="knowledge-term">Término</Label>
          <Input
            id="knowledge-term"
            value={asString(value.term)}
            onChange={(e) => set("term", e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-definition">Definición</Label>
          <AutoResizeTextarea
            id="knowledge-definition"
            value={asString(value.definition)}
            onChange={(e) => set("definition", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
        <StringListEditor
          label="Ejemplos"
          values={asStringList(value.examples)}
          onChange={(examples) => set("examples", examples)}
          placeholder="ej. caso de uso…"
          disabled={disabled}
          emptyHint="Sin ejemplos"
        />
      </div>
    );
  }

  if (sourceId === "policies") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="knowledge-rule">Regla</Label>
          <Input
            id="knowledge-rule"
            value={asString(value.rule)}
            onChange={(e) => set("rule", e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-policy-desc">Descripción</Label>
          <AutoResizeTextarea
            id="knowledge-policy-desc"
            value={asString(value.description)}
            onChange={(e) => set("description", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-consequence">Consecuencia</Label>
          <AutoResizeTextarea
            id="knowledge-consequence"
            value={asString(value.consequence)}
            onChange={(e) => set("consequence", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (sourceId === "tools") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="knowledge-tool-name">Nombre</Label>
          <Input
            id="knowledge-tool-name"
            value={asString(value.name)}
            onChange={(e) => set("name", e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-tool-desc">Descripción</Label>
          <AutoResizeTextarea
            id="knowledge-tool-desc"
            value={asString(value.description)}
            onChange={(e) => set("description", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-endpoint">Endpoint</Label>
          <Input
            id="knowledge-endpoint"
            value={asString(value.endpoint)}
            onChange={(e) => set("endpoint", e.target.value)}
            disabled={disabled}
            className="mt-1 font-mono text-sm"
          />
        </div>
        <StringListEditor
          label="Parámetros"
          values={asStringList(value.params)}
          onChange={(params) => set("params", params)}
          placeholder="ej. sku"
          disabled={disabled}
          emptyHint="Sin parámetros"
        />
      </div>
    );
  }

  if (sourceId === "products") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="knowledge-product-name">Nombre</Label>
          <Input
            id="knowledge-product-name"
            value={asString(value.name)}
            onChange={(e) => set("name", e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-product-desc">Descripción</Label>
          <AutoResizeTextarea
            id="knowledge-product-desc"
            value={asString(value.description)}
            onChange={(e) => set("description", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="knowledge-sku">SKU</Label>
            <Input
              id="knowledge-sku"
              value={asString(value.sku)}
              onChange={(e) => set("sku", e.target.value)}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="knowledge-price">Precio</Label>
            <Input
              id="knowledge-price"
              type="number"
              value={value.price != null ? String(value.price) : ""}
              onChange={(e) => set("price", e.target.value === "" ? undefined : Number(e.target.value))}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="knowledge-currency">Moneda</Label>
            <Input
              id="knowledge-currency"
              value={asString(value.currency || "USD")}
              onChange={(e) => set("currency", e.target.value)}
              disabled={disabled}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  if (sourceId === "case_studies") {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="knowledge-case-title">Título</Label>
          <Input
            id="knowledge-case-title"
            value={asString(value.title)}
            onChange={(e) => set("title", e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-situation">Situación</Label>
          <AutoResizeTextarea
            id="knowledge-situation"
            value={asString(value.situation)}
            onChange={(e) => set("situation", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-solution">Solución</Label>
          <AutoResizeTextarea
            id="knowledge-solution"
            value={asString(value.solution)}
            onChange={(e) => set("solution", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="knowledge-lesson">Lección</Label>
          <AutoResizeTextarea
            id="knowledge-lesson"
            value={asString(value.lesson)}
            onChange={(e) => set("lesson", e.target.value)}
            disabled={disabled}
            minRows={1}
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  return null;
}
