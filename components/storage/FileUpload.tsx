"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteStorageFile,
  listStorageFiles,
  uploadFileToStorage,
  type StorageFileRecord,
} from "@/lib/storage";
import {
  FileUploadView,
  type FileUploadListItem,
  type FileUploadMode,
  isImageMimetype,
} from "@/components/storage/FileUploadView";

const MAX_BYTES = 10 * 1024 * 1024;

function toListItem(file: StorageFileRecord): FileUploadListItem {
  const mimetype = file.mimeType || "application/octet-stream";
  const url = file.url;
  return {
    _id: file._id,
    originalName: file.originalName || file.filename || "archivo",
    mimetype,
    size: file.size ?? 0,
    visibility: "PRIVATE",
    publicUrl: url,
    previewUrl: isImageMimetype(mimetype) ? url : undefined,
    openUrl: url,
  };
}

export interface FileUploadProps {
  businessId: string;
  mode?: FileUploadMode;
  value?: string[];
  onChange?: (storageIds: string[]) => void;
  category?: string;
  multiple?: boolean;
  maxFiles?: number;
  loadExisting?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  businessId,
  mode = "photos",
  value,
  onChange,
  category,
  multiple = true,
  maxFiles = 20,
  loadExisting = true,
  readOnly = false,
  disabled = false,
  className,
}: FileUploadProps) {
  const { authUser, loading: authLoading } = useAuth();
  const isControlled = value !== undefined && (onChange !== undefined || readOnly);

  const [items, setItems] = useState<FileUploadListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const blobUrlsRef = useRef<string[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const controlledIds = value ?? [];
  const controlledIdsKey = controlledIds.join("|");
  const canUseBackendUpload = Boolean(authUser);

  const loadControlledItems = useCallback(async () => {
    if (!isControlled || controlledIds.length === 0) {
      if (isControlled) setItems([]);
      return;
    }

    setLoadingList(true);
    try {
      const loaded: FileUploadListItem[] = [];
      for (const id of controlledIds) {
        const cached = itemsRef.current.find((item) => item._id === id);
        if (cached) {
          loaded.push(cached);
          continue;
        }
      }
      if (loaded.length === controlledIds.length) {
        setItems(loaded);
        return;
      }
      setItems(loaded);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar archivos");
    } finally {
      setLoadingList(false);
    }
  }, [controlledIds, isControlled]);

  useEffect(() => {
    if (isControlled) void loadControlledItems();
  }, [isControlled, controlledIdsKey, loadControlledItems]);

  const refreshList = useCallback(async () => {
    if (isControlled || !loadExisting || !businessId) return;
    setLoadingList(true);
    try {
      const result = await listStorageFiles({
        businessId,
        limit: maxFiles,
        category,
      });
      setItems(result.results.map(toListItem));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar archivos");
    } finally {
      setLoadingList(false);
    }
  }, [businessId, category, isControlled, loadExisting, maxFiles]);

  useEffect(() => {
    if (isControlled || !loadExisting || !authUser) {
      if (!isControlled) setLoadingList(false);
      return;
    }
    void refreshList();
  }, [authUser, isControlled, loadExisting, refreshList]);

  useEffect(
    () => () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    },
    [],
  );

  const trackBlobUrl = (url: string) => {
    blobUrlsRef.current.push(url);
  };

  const updateControlledValue = (nextIds: string[]) => {
    onChange?.(nextIds);
  };

  const processFiles = async (fileList: FileList | File[]) => {
    if (readOnly || disabled) return;

    const files = Array.from(fileList);
    if (files.length === 0) return;

    const currentCount = isControlled ? controlledIds.length : items.filter((i) => !i.uploading).length;
    const remaining = maxFiles - currentCount;
    if (remaining <= 0) {
      toast.error(`Máximo ${maxFiles} archivos`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    for (const file of toUpload) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: supera 10 MB`);
        return;
      }
    }

    if (!canUseBackendUpload) {
      toast.error("Inicia sesión para subir archivos");
      return;
    }

    setUploading(true);
    const placeholders: FileUploadListItem[] = toUpload.map((file) => {
      const previewUrl = isImageMimetype(file.type) ? URL.createObjectURL(file) : undefined;
      const openUrl = URL.createObjectURL(file);
      if (previewUrl) trackBlobUrl(previewUrl);
      trackBlobUrl(openUrl);
      return {
        _id: `pending-${file.name}-${Date.now()}-${Math.random()}`,
        originalName: file.name,
        mimetype: file.type || "application/octet-stream",
        size: file.size,
        visibility: "PRIVATE" as const,
        uploading: true,
        previewUrl,
        openUrl,
      };
    });

    setItems((prev) => [...placeholders, ...prev]);

    try {
      const uploaded: FileUploadListItem[] = [];
      for (const file of toUpload) {
        const record = await uploadFileToStorage({
          businessId,
          file,
          category: category || (mode === "photos" ? "image" : "attachment"),
        });
        uploaded.push(toListItem(record));
      }

      placeholders.forEach((p) => {
        if (p.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
        if (p.openUrl?.startsWith("blob:")) URL.revokeObjectURL(p.openUrl);
      });

      if (isControlled) {
        updateControlledValue([...uploaded.map((f) => f._id), ...controlledIds]);
        setItems((prev) => {
          const withoutPlaceholders = prev.filter(
            (item) => !placeholders.some((p) => p._id === item._id),
          );
          return [...uploaded, ...withoutPlaceholders];
        });
      } else {
        setItems((prev) => {
          const withoutPlaceholders = prev.filter(
            (item) => !placeholders.some((p) => p._id === item._id),
          );
          return [...uploaded, ...withoutPlaceholders];
        });
      }

      toast.success(
        uploaded.length === 1 ? "Archivo subido" : `${uploaded.length} archivos subidos`,
      );
    } catch (err: unknown) {
      placeholders.forEach((p) => {
        if (p.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
        if (p.openUrl?.startsWith("blob:")) URL.revokeObjectURL(p.openUrl);
      });
      setItems((prev) => prev.filter((item) => !placeholders.some((p) => p._id === item._id)));
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: FileUploadListItem) => {
    if (item.uploading || readOnly || disabled) return;

    try {
      if (!item._id.startsWith("pending-") && !item._id.startsWith("demo-")) {
        await deleteStorageFile(item._id);
      }
      if (item.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      if (item.openUrl?.startsWith("blob:")) URL.revokeObjectURL(item.openUrl);
      if (isControlled) {
        updateControlledValue(controlledIds.filter((id) => id !== item._id));
      }
      setItems((prev) => prev.filter((entry) => entry._id !== item._id));
      toast.success("Archivo eliminado");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  const interactionDisabled = disabled || readOnly || uploading || !canUseBackendUpload;

  return (
    <div className={className}>
      {!authUser && !authLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Inicia sesión para subir archivos al negocio{" "}
          <span className="font-mono">{businessId}</span>.
        </p>
      ) : null}
      <FileUploadView
        mode={mode}
        items={items}
        uploading={uploading}
        loadingList={loadingList}
        disabled={interactionDisabled}
        readOnly={readOnly}
        multiple={multiple}
        onFilesSelected={(files) => void processFiles(files)}
        onDeleteRequest={(item) => void handleDelete(item)}
      />
    </div>
  );
}
