"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface AutoResizeTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  /** Líneas visibles mínimas (por defecto 1). */
  minRows?: number;
  /** Líneas visibles máximo antes de mostrar scroll (por defecto 4). */
  maxRows?: number;
}

function setRefs<T>(
  node: T | null,
  refs: Array<React.Ref<T> | undefined>,
): void {
  refs.forEach((r) => {
    if (typeof r === "function") {
      r(node);
    } else if (r && typeof r === "object" && "current" in r) {
      (r as React.MutableRefObject<T | null>).current = node;
    }
  });
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  (
    {
      className,
      minRows = 1,
      maxRows = 4,
      value,
      defaultValue,
      onChange,
      onInput,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;

      const computed = getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize);
      let lineHeightPx = parseFloat(computed.lineHeight);
      if (Number.isNaN(lineHeightPx) || computed.lineHeight === "normal") {
        lineHeightPx = fontSize * 1.375;
      }

      const paddingTop = parseFloat(computed.paddingTop);
      const paddingBottom = parseFloat(computed.paddingBottom);
      const borderTop = parseFloat(computed.borderTopWidth);
      const borderBottom = parseFloat(computed.borderBottomWidth);
      const verticalChrome = paddingTop + paddingBottom + borderTop + borderBottom;

      const minHeight = verticalChrome + lineHeightPx * minRows;
      const maxHeight = verticalChrome + lineHeightPx * maxRows;

      el.style.minHeight = `${minHeight}px`;
      el.style.maxHeight = `${maxHeight}px`;

      // Colapsar altura para que scrollHeight refleje el contenido real (si no, queda “atascado” en la altura anterior).
      const prevOverflowY = el.style.overflowY;
      el.style.overflowY = "hidden";
      el.style.height = "0px";
      const contentHeight = el.scrollHeight;
      el.style.overflowY = prevOverflowY;

      const next = Math.min(Math.max(contentHeight, minHeight), maxHeight);
      el.style.height = `${next}px`;
      el.style.overflowY = next >= maxHeight ? "auto" : "hidden";
    }, [maxRows, minRows]);

    React.useLayoutEffect(() => {
      adjustHeight();
      const el = innerRef.current;
      if (!el || typeof ResizeObserver === "undefined") {
        return;
      }
      const ro = new ResizeObserver(() => {
        adjustHeight();
      });
      ro.observe(el);
      return () => {
        ro.disconnect();
      };
    }, [adjustHeight, value, defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      requestAnimationFrame(() => adjustHeight());
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      onInput?.(e);
      requestAnimationFrame(() => adjustHeight());
    };

    return (
      <textarea
        {...props}
        ref={(node) => setRefs(node, [innerRef, ref])}
        rows={1}
        className={cn(
          "box-border block w-full min-h-0 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        style={{ ...props.style, resize: "none" }}
        onChange={handleChange}
        onInput={handleInput}
        value={value}
        defaultValue={defaultValue}
      />
    );
  },
);
AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };
