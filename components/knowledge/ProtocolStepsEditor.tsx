"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface ProtocolStepsEditorProps {
  steps: string[];
  onChange: (steps: string[]) => void;
  disabled?: boolean;
}

export function ProtocolStepsEditor({ steps, onChange, disabled }: ProtocolStepsEditorProps) {
  const updateStep = (index: number, value: string) => {
    const next = [...steps];
    next[index] = value;
    onChange(next);
  };

  const addStep = () => onChange([...steps, ""]);

  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>Pasos del protocolo</Label>
      <p className="text-sm text-muted-foreground">
        Describe cada paso en orden. El agente los seguirá secuencialmente.
      </p>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2 items-start rounded-lg border p-3 bg-muted/20">
            <span className="text-sm font-medium text-muted-foreground pt-2 w-6 shrink-0">
              {index + 1}.
            </span>
            <Textarea
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              placeholder={`Paso ${index + 1}`}
              rows={2}
              className="resize-none flex-1"
              disabled={disabled}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled || index === 0}
                onClick={() => moveStep(index, -1)}
                aria-label="Subir paso"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled || index === steps.length - 1}
                onClick={() => moveStep(index, 1)}
                aria-label="Bajar paso"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                disabled={disabled}
                onClick={() => removeStep(index)}
                aria-label="Eliminar paso"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addStep} disabled={disabled}>
        <Plus className="h-4 w-4 mr-1" />
        Añadir paso
      </Button>
    </div>
  );
}
