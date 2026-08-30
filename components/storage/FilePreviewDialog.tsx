"use client";

import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FileUploadListItem } from "./fileUploadTypes";
import { isImageMimetype } from "./fileUploadTypes";

interface FilePreviewDialogProps {
  open: boolean;
  file: FileUploadListItem | null;
  onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({
  open,
  file,
  onOpenChange,
}: FilePreviewDialogProps) {
  const previewSrc = file?.previewUrl ?? file?.openUrl ?? file?.publicUrl ?? null;
  const canDownload = Boolean(previewSrc);
  const canPreviewImage =
    Boolean(file) &&
    Boolean(previewSrc) &&
    isImageMimetype(file?.mimetype ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-14 top-1.5"
          disabled={!canDownload}
          asChild
        >
          <a
            href={previewSrc ?? "#"}
            download={file?.originalName ?? "archivo"}
            target="_blank"
            rel="noreferrer"
            aria-label="Descargar archivo"
          >
            <Download className="size-4" />
          </a>
        </Button>

        <DialogHeader>
          <div className="min-w-0 space-y-1 pr-20">
            <DialogTitle className="truncate">
              {file?.originalName ?? "Vista previa"}
            </DialogTitle>
            {file ? (
              <DialogDescription className="truncate">
                {file.mimetype}
              </DialogDescription>
            ) : null}
          </div>
        </DialogHeader>

        {canPreviewImage ? (
          <div className="overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview accepts blob/presigned URLs */}
            <img
              src={previewSrc ?? ""}
              alt={file?.originalName ?? "Vista previa"}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay vista previa disponible para este archivo.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
