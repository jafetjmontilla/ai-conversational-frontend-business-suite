"use client";

import { useId, useRef, useState } from "react";
import { Camera, Download, Loader2, Search, Upload, X } from "lucide-react";
import { FileIcon, defaultStyles } from "react-file-icon";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isImageMimetype,
  type FileUploadListItem,
  type FileUploadMode,
  type StorageVisibility,
} from "./fileUploadTypes";

export type { FileUploadListItem, FileUploadMode, StorageVisibility } from "./fileUploadTypes";
export { isImageMimetype } from "./fileUploadTypes";

export interface FileUploadViewProps {
  mode?: FileUploadMode;
  items: FileUploadListItem[];
  uploading?: boolean;
  loadingList?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  multiple?: boolean;
  hideCamera?: boolean;
  hideTitle?: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
  onDeleteRequest: (item: FileUploadListItem) => void;
  className?: string;
}

const PHOTOS_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const fileIconStyles = defaultStyles as Record<string, Record<string, unknown>>;

function shortDisplayName(name: string): string {
  const base = name.trim();
  if (base.length <= 18) return base;
  const dot = base.lastIndexOf(".");
  if (dot > 0 && dot < base.length - 1) {
    const ext = base.slice(dot);
    const stem = base.slice(0, dot);
    return `${stem.slice(0, 14)}…${ext}`;
  }
  return `${base.slice(0, 16)}…`;
}

function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0 || dot === filename.length - 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

function StorageFileTypeIcon({ filename }: { filename: string }) {
  const extension = getFileExtension(filename);
  const style = extension && fileIconStyles[extension] ? fileIconStyles[extension] : {};

  return (
    <div className="flex size-full items-center justify-center p-3">
      <FileIcon extension={extension || "file"} {...style} />
    </div>
  );
}

function PillButton({
  children,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border-border bg-transparent px-4 text-sm font-normal shadow-none",
        className,
      )}
    >
      {children}
    </Button>
  );
}

function getItemAccessUrl(item: FileUploadListItem): string | null {
  return item.openUrl ?? item.previewUrl ?? item.publicUrl ?? null;
}

function UploadItemTile({
  item,
  useFileIconForNonImages,
  readOnly = false,
  onPreview,
  onDelete,
}: {
  item: FileUploadListItem;
  useFileIconForNonImages: boolean;
  readOnly?: boolean;
  onPreview: (item: FileUploadListItem) => void;
  onDelete: (item: FileUploadListItem) => void;
}) {
  const isImage = isImageMimetype(item.mimetype);
  const showImagePreview = isImage && Boolean(item.previewUrl);
  const showFileIcon = !isImage && useFileIconForNonImages;
  const accessUrl = getItemAccessUrl(item);
  const canPreview = isImage && Boolean(accessUrl);
  const canOpenFile = !isImage && Boolean(accessUrl);

  const actionButtonClassName =
    "flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40";

  return (
    <li className="w-[88px] shrink-0">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {showImagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob / presigned URLs
          <img
            src={item.previewUrl}
            alt={item.originalName}
            className="size-full object-cover"
          />
        ) : showFileIcon ? (
          <StorageFileTypeIcon filename={item.originalName} />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Upload className="size-5" aria-hidden />
          </div>
        )}
        {item.uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          <div className="absolute right-1 top-1 flex gap-1">
            {isImage ? (
              <button
                type="button"
                className={actionButtonClassName}
                aria-label={`Vista previa de ${item.originalName}`}
                disabled={!canPreview}
                onClick={() => onPreview(item)}
              >
                <Search className="size-3.5" />
              </button>
            ) : (
              <a
                href={accessUrl ?? "#"}
                download={item.originalName}
                target="_blank"
                rel="noreferrer"
                className={cn(actionButtonClassName, !canOpenFile && "pointer-events-none opacity-40")}
                aria-label={`Abrir ${item.originalName}`}
                aria-disabled={!canOpenFile}
                onClick={(event) => {
                  if (!canOpenFile) event.preventDefault();
                }}
              >
                <Download className="size-3.5" />
              </a>
            )}
            {readOnly ? null : (
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                aria-label={`Eliminar ${item.originalName}`}
                onClick={() => onDelete(item)}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      <p className="mt-1.5 truncate text-xs text-muted-foreground" title={item.originalName}>
        {shortDisplayName(item.originalName)}
      </p>
    </li>
  );
}

export function FileUploadView({
  mode = "photos",
  items,
  uploading = false,
  loadingList = false,
  disabled = false,
  readOnly = false,
  multiple = true,
  hideCamera = false,
  hideTitle = false,
  onFilesSelected,
  onDeleteRequest,
  className,
}: FileUploadViewProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewTarget, setPreviewTarget] = useState<FileUploadListItem | null>(null);

  const interactionDisabled = disabled || uploading || readOnly;
  const title = mode === "files" ? "Adjuntar archivos" : "Subir imágenes";
  const showUploadControls = !readOnly;

  const visibleItems =
    mode === "photos"
      ? items.filter((item) => isImageMimetype(item.mimetype))
      : items;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files?.length) onFilesSelected(files);
    event.target.value = "";
  };

  const openFilePicker = () => {
    if (!interactionDisabled) fileInputRef.current?.click();
  };

  const openCamera = () => {
    if (!interactionDisabled) cameraInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!hideTitle && showUploadControls ? (
        <p className="text-sm font-medium">{title}</p>
      ) : !hideTitle && (visibleItems.length > 0 || loadingList) ? (
        <p className="text-xs font-medium text-muted-foreground">Adjuntos</p>
      ) : null}

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        className="sr-only"
        {...(mode === "photos" ? { accept: PHOTOS_ACCEPT } : {})}
        multiple={multiple}
        disabled={interactionDisabled}
        onChange={handleInputChange}
      />

      {showUploadControls ? (
        mode === "photos" ? (
          <>
            {!hideCamera ? (
              <input
                ref={cameraInputRef}
                type="file"
                className="sr-only"
                accept="image/*"
                capture="environment"
                disabled={interactionDisabled}
                onChange={handleInputChange}
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              {!hideCamera ? (
                <PillButton disabled={interactionDisabled} onClick={openCamera}>
                  <Camera className="size-4" aria-hidden />
                  Cámara
                </PillButton>
              ) : null}
              <PillButton disabled={interactionDisabled} onClick={openFilePicker}>
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-4" aria-hidden />
                )}
                {hideCamera ? "Subir imagen" : "Álbum de imágenes"}
              </PillButton>
            </div>
          </>
        ) : (
          <PillButton disabled={interactionDisabled} className="flex items-center gap-2" onClick={openFilePicker}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-4" aria-hidden />
            )}
            Archivos
          </PillButton>
        )
      ) : null}

      {loadingList ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Cargando…
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <ul className="flex flex-wrap gap-4 pt-1">
          {visibleItems.map((item) => (
            <UploadItemTile
              key={item._id}
              item={item}
              useFileIconForNonImages={mode === "files"}
              readOnly={readOnly}
              onPreview={setPreviewTarget}
              onDelete={onDeleteRequest}
            />
          ))}
        </ul>
      ) : null}

      <FilePreviewDialog
        open={Boolean(previewTarget)}
        file={previewTarget}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
      />
    </div>
  );
}
