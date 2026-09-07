"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  FileUploadView,
  type FileUploadListItem,
  isImageMimetype,
} from "@/components/storage/FileUploadView";
import { deleteStorageFile, listStorageFiles, uploadFileToStorage } from "@/lib/storage";
import { fetchApiV1, queries } from "@/lib/Fetching";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 20;

type ProductPhotosFieldProps = {
  businessId: string;
  businessIdDoc?: string | null;
  productId?: string | null;
  defaultVariantId?: string | null;
  disabled?: boolean;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
};

function variantImageToItem(url: string, index: number): FileUploadListItem {
  return {
    _id: `variant-image-${index}`,
    originalName: `foto-${index + 1}`,
    mimetype: "image/jpeg",
    size: 0,
    visibility: "PRIVATE",
    previewUrl: url,
    openUrl: url,
    publicUrl: url,
  };
}

export async function uploadProductPhotos(input: {
  businessId: string;
  businessIdDoc: string;
  productId: string;
  files: File[];
  defaultVariantId?: string | null;
}): Promise<string | null> {
  if (input.files.length === 0) return null;

  let primaryUrl: string | null = null;
  for (const file of input.files) {
    const record = await uploadFileToStorage({
      businessId: input.businessId,
      file,
      category: `product-${input.productId}`,
      tags: [`product:${input.productId}`],
    });
    if (!primaryUrl) primaryUrl = record.url;
  }

  if (primaryUrl && input.defaultVariantId) {
    await fetchApiV1({
      query: queries.updateProductVariant,
      type: "json",
      variables: {
        id: input.businessIdDoc,
        _id: input.defaultVariantId,
        args: { image_url: primaryUrl },
      },
    });
  }

  return primaryUrl;
}

export function ProductPhotosField({
  businessId,
  businessIdDoc,
  productId,
  defaultVariantId,
  disabled = false,
  pendingFiles = [],
  onPendingFilesChange,
}: ProductPhotosFieldProps) {
  const [items, setItems] = useState<FileUploadListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const blobUrlsRef = useRef<string[]>([]);

  const isCreate = !productId;
  const category = productId ? `product-${productId}` : undefined;

  useEffect(
    () => () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    },
    [],
  );

  const syncPendingItems = useCallback((files: File[]) => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
    setItems(
      files.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        blobUrlsRef.current.push(previewUrl);
        return {
          _id: `pending-${index}-${file.name}`,
          originalName: file.name,
          mimetype: file.type || "image/jpeg",
          size: file.size,
          visibility: "PRIVATE" as const,
          previewUrl,
          openUrl: previewUrl,
        };
      }),
    );
  }, []);

  useEffect(() => {
    if (!isCreate) return;
    syncPendingItems(pendingFiles);
  }, [isCreate, pendingFiles, syncPendingItems]);

  const syncPrimaryVariantImage = async (url: string | null) => {
    if (!businessIdDoc || !defaultVariantId) return;
    try {
      await fetchApiV1({
        query: queries.updateProductVariant,
        type: "json",
        variables: {
          id: businessIdDoc,
          _id: defaultVariantId,
          args: { image_url: url },
        },
      });
    } catch {
      // La foto quedó en storage; la variante se puede actualizar manualmente.
    }
  };

  useEffect(() => {
    if (!productId || !businessId) return;
    let cancelled = false;
    setLoadingList(true);

    (async () => {
      try {
        const result = await listStorageFiles({
          businessId,
          category,
          limit: MAX_FILES,
        });
        if (cancelled) return;

        const fromStorage = result.results.map((file) => ({
          _id: file._id,
          originalName: file.originalName || file.filename || "foto",
          mimetype: file.mimeType || "image/jpeg",
          size: file.size ?? 0,
          visibility: "PRIVATE" as const,
          publicUrl: file.url,
          previewUrl: file.url,
          openUrl: file.url,
        }));

        if (fromStorage.length > 0) {
          setItems(fromStorage);
          return;
        }

        if (!businessIdDoc) return;
        const product = (await fetchApiV1({
          query: queries.getProduct,
          type: "json",
          variables: { id: businessIdDoc, _id: productId },
        })) as { variants?: { image_url?: string | null }[] } | null;
        if (cancelled || !product?.variants?.length) return;

        const legacyUrls = [
          ...new Set(
            product.variants
              .map((v) => v.image_url?.trim())
              .filter((url): url is string => Boolean(url)),
          ),
        ];
        setItems(legacyUrls.map((url, index) => variantImageToItem(url, index)));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, businessIdDoc, category, productId]);

  const validateFiles = (files: File[]) => {
    for (const file of files) {
      if (!isImageMimetype(file.type)) {
        toast.error(`${file.name}: solo se permiten imágenes`);
        return false;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: supera 10 MB`);
        return false;
      }
    }
    return true;
  };

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0 || disabled) return;

    if (isCreate) {
      if (!validateFiles(incoming)) return;
      const remaining = MAX_FILES - pendingFiles.length;
      if (remaining <= 0) {
        toast.error(`Máximo ${MAX_FILES} fotografías`);
        return;
      }
      onPendingFilesChange?.([...pendingFiles, ...incoming.slice(0, remaining)]);
      return;
    }

    if (!productId) return;
    const currentCount = items.filter((item) => !item.uploading).length;
    const remaining = MAX_FILES - currentCount;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_FILES} fotografías`);
      return;
    }

    const toUpload = incoming.slice(0, remaining);
    if (!validateFiles(toUpload)) return;

    setUploading(true);
    const placeholders: FileUploadListItem[] = toUpload.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      blobUrlsRef.current.push(previewUrl);
      return {
        _id: `pending-${file.name}-${Date.now()}-${Math.random()}`,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        visibility: "PRIVATE",
        uploading: true,
        previewUrl,
        openUrl: previewUrl,
      };
    });
    setItems((prev) => [...placeholders, ...prev]);

    try {
      let primaryUrl: string | null = null;
      const uploaded: FileUploadListItem[] = [];
      const hadPhotos = currentCount > 0;

      for (const file of toUpload) {
        const record = await uploadFileToStorage({
          businessId,
          file,
          category: category!,
          tags: [`product:${productId}`],
        });
        uploaded.push({
          _id: record._id,
          originalName: record.originalName || record.filename || file.name,
          mimetype: record.mimeType || file.type,
          size: record.size ?? file.size,
          visibility: "PRIVATE",
          publicUrl: record.url,
          previewUrl: record.url,
          openUrl: record.url,
        });
        if (!primaryUrl) primaryUrl = record.url;
      }

      placeholders.forEach((p) => {
        if (p.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
      });

      setItems((prev) => {
        const withoutPlaceholders = prev.filter(
          (item) => !placeholders.some((p) => p._id === item._id),
        );
        return [...uploaded, ...withoutPlaceholders];
      });

      if (!hadPhotos && primaryUrl) {
        await syncPrimaryVariantImage(primaryUrl);
      }

      toast.success(
        uploaded.length === 1 ? "Fotografía subida" : `${uploaded.length} fotografías subidas`,
      );
    } catch (err: unknown) {
      placeholders.forEach((p) => {
        if (p.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
      });
      setItems((prev) => prev.filter((item) => !placeholders.some((p) => p._id === item._id)));
      toast.error(err instanceof Error ? err.message : "Error al subir fotografías");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: FileUploadListItem) => {
    if (item.uploading || disabled) return;

    if (isCreate) {
      const index = items.findIndex((entry) => entry._id === item._id);
      if (index < 0) return;
      onPendingFilesChange?.(pendingFiles.filter((_, i) => i !== index));
      return;
    }

    if (item._id.startsWith("variant-image-")) {
      setItems((prev) => {
        const next = prev.filter((entry) => entry._id !== item._id);
        const nextPrimary = next.find((entry) => entry.publicUrl)?.publicUrl ?? null;
        void syncPrimaryVariantImage(nextPrimary);
        return next;
      });
      return;
    }

    try {
      await deleteStorageFile(item._id);
      setItems((prev) => {
        const next = prev.filter((entry) => entry._id !== item._id);
        const nextPrimary = next.find((entry) => entry.publicUrl)?.publicUrl ?? null;
        void syncPrimaryVariantImage(nextPrimary);
        return next;
      });
      toast.success("Fotografía eliminada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <Label>Fotografías del producto</Label>
      <FileUploadView
        mode="photos"
        items={items}
        uploading={uploading}
        loadingList={loadingList}
        disabled={disabled || uploading}
        multiple
        hideTitle
        onFilesSelected={(files) => void handleFilesSelected(files)}
        onDeleteRequest={(item) => void handleDelete(item)}
      />
      {isCreate ? (
        <p className="text-xs text-muted-foreground">
          Se subirán al guardar el producto. La primera foto se usará como imagen principal del catálogo.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          La primera fotografía se sincroniza como imagen principal del producto en el catálogo.
        </p>
      )}
    </div>
  );
}
