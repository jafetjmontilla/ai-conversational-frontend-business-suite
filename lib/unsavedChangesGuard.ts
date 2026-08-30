"use client";

export const UNSAVED_CHANGES_MESSAGE =
  "Tienes cambios sin guardar. Si sales ahora, se perderán.";

let guarded = false;
let showDialog: ((message: string) => Promise<boolean>) | null = null;

export function setUnsavedChangesGuard(enabled: boolean) {
  guarded = enabled;
}

export function registerUnsavedChangesDialog(
  handler: (message: string) => Promise<boolean>
) {
  showDialog = handler;
  return () => {
    if (showDialog === handler) showDialog = null;
  };
}

/** Devuelve false si hay cambios sin guardar y el usuario cancela. */
export async function confirmLeaveIfUnsaved(
  message: string = UNSAVED_CHANGES_MESSAGE
): Promise<boolean> {
  if (!guarded) return true;
  if (!showDialog) return false;
  return showDialog(message);
}
