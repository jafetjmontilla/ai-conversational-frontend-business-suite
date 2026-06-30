"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fetchApiV1, queries } from "@/lib/Fetching";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const IDEAL_CLIENT_OPTIONS = [
  { value: "empresas", label: "Empresas" },
  { value: "emprendedores", label: "Emprendedores" },
  { value: "consumidores finales", label: "Consumidores finales" },
  { value: "un sector específico", label: "Un sector específico" },
] as const;

const TONE_OPTIONS = [
  { value: "corporativo", label: "Corporativo" },
  { value: "ultra-profesional", label: "Ultra-profesional" },
  { value: "moderno", label: "Moderno" },
  { value: "disruptivo", label: "Disruptivo" },
  { value: "cercano", label: "Cercano" },
  { value: "amigable", label: "Amigable" },
  { value: "sofisticado", label: "Sofisticado" },
  { value: "minimalista", label: "Minimalista" },
] as const;

function toggleValue(list: string[], value: string, checked: boolean): string[] {
  if (checked) return list.includes(value) ? list : [...list, value];
  return list.filter((item) => item !== value);
}

interface CheckboxGroupProps {
  options: readonly { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  idPrefix: string;
}

function CheckboxGroup({ options, values, onChange, idPrefix }: CheckboxGroupProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const checked = values.includes(opt.value);
        const inputId = `${idPrefix}-${opt.value.replace(/\s+/g, "-")}`;
        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
          >
            <input
              id={inputId}
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(toggleValue(values, opt.value, e.target.checked))}
              className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

interface GenerateDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commercialName: string;
  slogan?: string;
  onGenerated: (description: string) => void;
}

export function GenerateDescriptionDialog({
  open,
  onOpenChange,
  commercialName,
  slogan,
  onGenerated,
}: GenerateDescriptionDialogProps) {
  const [includeCommercialName, setIncludeCommercialName] = useState(false);
  const [whatTheyOffer, setWhatTheyOffer] = useState("");
  const [problemSolved, setProblemSolved] = useState("");
  const [whyChooseUs, setWhyChooseUs] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [idealClients, setIdealClients] = useState<string[]>([]);
  const [idealClientSector, setIdealClientSector] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const needsSector = idealClients.includes("un sector específico");

  const canGenerate = whatTheyOffer.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = (await fetchApiV1({
        query: queries.generateBusinessDescription,
        type: "json",
        variables: {
          input: {
            includeCommercialName,
            commercialName: commercialName.trim() || undefined,
            slogan: slogan?.trim() || undefined,
            whatTheyOffer: whatTheyOffer.trim(),
            problemSolved: problemSolved.trim() || undefined,
            whyChooseUs: whyChooseUs.trim() || undefined,
            differentiator: differentiator.trim() || undefined,
            idealClient: idealClients.length ? idealClients : undefined,
            idealClientSector:
              needsSector && idealClientSector.trim() ? idealClientSector.trim() : undefined,
            tone: tones.length ? tones : undefined,
          },
        },
      })) as { description: string };
      onGenerated(result.description);
      toast.success("Descripción generada. Puedes editarla antes de guardar.");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Error al generar la descripción";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generar descripción con IA
          </DialogTitle>
          <DialogDescription>
            Solo es obligatorio indicar qué hace o vende. El resto de campos son opcionales y
            ayudan a afinar el resultado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          <label
            htmlFor="include-commercial-name"
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
              includeCommercialName ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
          >
            <input
              id="include-commercial-name"
              type="checkbox"
              checked={includeCommercialName}
              onChange={(e) => setIncludeCommercialName(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border border-input accent-primary"
            />
            <span>Incluir nombre comercial en la descripción</span>
          </label>

          <div className="space-y-2">
            <Label htmlFor="ai-what-offer">
              ¿Qué hace o vende? Di los productos, servicios o soluciones más importantes que
              ofreces. *
            </Label>
            <Textarea
              id="ai-what-offer"
              value={whatTheyOffer}
              onChange={(e) => setWhatTheyOffer(e.target.value)}
              placeholder="Ej. software de facturación, consultoría fiscal..."
              className="resize-none min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-problem">
              ¿Qué problema resuelve? Di una frase corta que describa el problema que resuelve tu
              producto, servicio o solución. (opcional)
            </Label>
            <Textarea
              id="ai-problem"
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
              placeholder="Ej. elimina la burocracia al facturar..."
              className="resize-none min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-why">
              ¿Por qué un cliente debería elegirte a ti y no a la competencia? (opcional)
            </Label>
            <Textarea
              id="ai-why"
              value={whyChooseUs}
              onChange={(e) => setWhyChooseUs(e.target.value)}
              className="resize-none min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-diff">¿Qué te hace diferente o mejor? (opcional)</Label>
            <Textarea
              id="ai-diff"
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value)}
              className="resize-none min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label>¿Quién es tu cliente ideal? (opcional, puedes elegir varias)</Label>
            <CheckboxGroup
              idPrefix="ideal-client"
              options={IDEAL_CLIENT_OPTIONS}
              values={idealClients}
              onChange={setIdealClients}
            />
            {needsSector && (
              <Input
                value={idealClientSector}
                onChange={(e) => setIdealClientSector(e.target.value)}
                placeholder="Ej. clínicas dentales, restaurantes..."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>¿Cómo quieres sonar? (opcional, puedes elegir varias)</Label>
            <CheckboxGroup
              idPrefix="tone"
              options={TONE_OPTIONS}
              values={tones}
              onChange={setTones}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={!canGenerate || generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Generar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
