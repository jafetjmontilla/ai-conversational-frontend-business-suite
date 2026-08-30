"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileUploadView,
  type FileUploadListItem,
  isImageMimetype,
} from "@/components/storage/FileUploadView";

const MAX_BYTES = 100_000_000;

const DEMO_PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#14532d"/>
      <text x="60" y="68" text-anchor="middle" fill="#86efac" font-size="28" font-family="system-ui">ct</text>
    </svg>`,
  );

const DEMO_INITIAL_PHOTOS: FileUploadListItem[] = [
  {
    _id: "demo-photo-1",
    originalName: "Imagen-cb730b.png",
    mimetype: "image/png",
    size: 245_760,
    visibility: "PRIVATE",
    previewUrl: DEMO_PLACEHOLDER_IMAGE,
  },
];

const DEMO_INITIAL_FILES: FileUploadListItem[] = [
  {
    _id: "demo-file-1",
    originalName: "informe-anual.pdf",
    mimetype: "application/pdf",
    size: 512_000,
    visibility: "PRIVATE",
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function useDemoUpload(initialItems: FileUploadListItem[]) {
  const [items, setItems] = useState<FileUploadListItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: supera 100 MB`);
        return;
      }
    }

    setUploading(true);
    const placeholders: FileUploadListItem[] = files.map((file) => ({
      _id: `demo-pending-${Date.now()}-${Math.random()}`,
      originalName: file.name,
      mimetype: file.type || "application/octet-stream",
      size: file.size,
      visibility: "PRIVATE",
      uploading: true,
      previewUrl: isImageMimetype(file.type) ? URL.createObjectURL(file) : undefined,
      openUrl: URL.createObjectURL(file),
    }));

    setItems((prev) => [...placeholders, ...prev]);
    await delay(600);

    const uploaded: FileUploadListItem[] = placeholders.map((p, i) => ({
      ...p,
      _id: `demo-${Date.now()}-${i}`,
      uploading: false,
    }));

    setItems((prev) => {
      const rest = prev.filter((item) => !placeholders.some((pl) => pl._id === item._id));
      return [...uploaded, ...rest];
    });
    setUploading(false);
  };

  const removeItem = (item: FileUploadListItem) => {
    if (item.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
    if (item.openUrl?.startsWith("blob:")) URL.revokeObjectURL(item.openUrl);
    setItems((prev) => prev.filter((entry) => entry._id !== item._id));
  };

  return { items, uploading, processFiles, removeItem };
}

/** Demo local para la galería /ui — sin backend. */
export function FileUploadDemo({ className }: { className?: string }) {
  const photos = useDemoUpload(DEMO_INITIAL_PHOTOS);
  const files = useDemoUpload(DEMO_INITIAL_FILES);

  return (
    <div className={className}>
      <div className="grid gap-8 lg:grid-cols-2">
        <FileUploadView
          mode="files"
          items={files.items}
          uploading={files.uploading}
          onFilesSelected={(selected) => void files.processFiles(selected)}
          onDeleteRequest={files.removeItem}
        />
        <FileUploadView
          mode="photos"
          items={photos.items}
          uploading={photos.uploading}
          onFilesSelected={(selected) => void photos.processFiles(selected)}
          onDeleteRequest={photos.removeItem}
        />
      </div>
    </div>
  );
}
