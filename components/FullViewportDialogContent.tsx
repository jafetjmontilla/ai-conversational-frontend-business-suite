'use client';

import * as React from 'react';
import { composeEventHandlers } from '@radix-ui/primitive';
import { DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type RadixDismissInteractEvent = CustomEvent<{
  originalEvent: PointerEvent | FocusEvent;
}>;

export type FullViewportDialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogContent
> & {
  /**
   * Si es `true`, un clic fuera del panel cierra el diálogo.
   * Por defecto `false` (solo se cierra con botones explícitos o `onOpenChange`).
   */
  closeOnOutsideClick?: boolean;
  /**
   * Si es `true`, la tecla Escape cierra el diálogo.
   * Por defecto `false`.
   */
  closeOnCancel?: boolean;
};

function preventOutsideDismiss(event: RadixDismissInteractEvent) {
  event.preventDefault();
}

function preventEscapeDismiss(event: KeyboardEvent) {
  event.preventDefault();
}

function useRadixSelectOutsideDismissGuard() {
  const suppressNextOutsideDismissRef = React.useRef(false);

  React.useEffect(() => {
    const onPointerDownCapture = (e: PointerEvent) => {
      if (!document.querySelector('[data-radix-select-viewport]')) {
        suppressNextOutsideDismissRef.current = false;
        return;
      }
      const t = e.target;
      if (t instanceof Element && !t.closest('[role="listbox"]')) {
        suppressNextOutsideDismissRef.current = true;
      }
    };
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
    };
  }, []);

  return React.useCallback((event: RadixDismissInteractEvent) => {
    if (suppressNextOutsideDismissRef.current) {
      event.preventDefault();
      suppressNextOutsideDismissRef.current = false;
      return;
    }
    const original = event.detail.originalEvent;
    const target =
      'target' in original && original.target instanceof Element
        ? original.target
        : null;
    if (target?.closest('[role="listbox"]')) {
      event.preventDefault();
      return;
    }
    if (document.querySelector('[data-radix-select-viewport]')) {
      event.preventDefault();
    }
  }, []);
}

/**
 * Contenedor de diálogo a altura de viewport, columna flexible y scroll interno en hijos.
 * Por defecto `max-w-2xl`; sobrescribir con `className` (p. ej. `max-w-xl`).
 */
export const FullViewportDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  FullViewportDialogContentProps
>(
  (
    {
      className,
      closeOnOutsideClick = false,
      closeOnCancel = false,
      onPointerDownOutside,
      onInteractOutside,
      onEscapeKeyDown,
      ...props
    },
    ref
  ) => {
    const radixSelectOutsideGuard = useRadixSelectOutsideDismissGuard();

    const pointerDownOutside = closeOnOutsideClick
      ? composeEventHandlers(radixSelectOutsideGuard, onPointerDownOutside)
      : composeEventHandlers(preventOutsideDismiss, onPointerDownOutside);

    const interactOutside = closeOnOutsideClick
      ? composeEventHandlers(radixSelectOutsideGuard, onInteractOutside)
      : composeEventHandlers(preventOutsideDismiss, onInteractOutside);

    const escapeKeyDown = closeOnCancel
      ? onEscapeKeyDown
      : composeEventHandlers(preventEscapeDismiss, onEscapeKeyDown);

    return (
      <DialogContent
        ref={ref}
        className={cn(
          'flex max-h-[100svh] h-[100svh] max-w-2xl flex-col',
          className
        )}
        onPointerDownOutside={pointerDownOutside}
        onInteractOutside={interactOutside}
        onEscapeKeyDown={escapeKeyDown}
        {...props}
      />
    );
  }
);
FullViewportDialogContent.displayName = 'FullViewportDialogContent';
