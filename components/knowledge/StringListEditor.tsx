"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyHint?: string;
};

export function StringListEditor({
  label,
  values,
  onChange,
  placeholder = "Agregar…",
  disabled,
  emptyHint,
}: Props) {
  const [input, setInput] = useState("");

  const addValue = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      toast.error("Ese valor ya está en la lista");
      return;
    }
    onChange([...values, trimmed]);
    setInput("");
  };

  const removeValue = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
        {values.length === 0 ? (
          <span className="text-xs text-muted-foreground">{emptyHint ?? "Sin valores"}</span>
        ) : (
          values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 pr-1 font-normal">
              {value}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50"
                disabled={disabled}
                onClick={() => removeValue(value)}
                aria-label={`Quitar ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="h-8 text-sm"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          disabled={disabled || !input.trim()}
          onClick={addValue}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
