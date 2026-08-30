"use client";

import { useEffect } from "react";
import {
  confirmLeaveIfUnsaved,
  setUnsavedChangesGuard,
  UNSAVED_CHANGES_MESSAGE,
} from "@/lib/unsavedChangesGuard";

/**
 * Advierte al abandonar la ruta cuando hay cambios sin guardar:
 * - cierre / recarga de pestaña (beforeunload)
 * - navegación del shell (sidebar, selector de org) vía confirmLeaveIfUnsaved
 * - links internos y botón atrás / adelante del navegador
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  message: string = UNSAVED_CHANGES_MESSAGE
) {
  useEffect(() => {
    setUnsavedChangesGuard(isDirty);
    return () => setUnsavedChangesGuard(false);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      void confirmLeaveIfUnsaved(message).then((ok) => {
        if (ok) window.location.assign(url.href);
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty, message]);

  useEffect(() => {
    if (!isDirty) return;

    const currentUrl = window.location.href;
    history.pushState(null, "", currentUrl);

    const onPopState = () => {
      history.pushState(null, "", currentUrl);
      void confirmLeaveIfUnsaved(message).then((ok) => {
        if (ok) history.back();
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isDirty, message]);
}
