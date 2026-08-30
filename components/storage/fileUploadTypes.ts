export type StorageVisibility = "PRIVATE" | "PUBLIC";

export type FileUploadMode = "files" | "photos";

export type FileUploadListItem = {
  _id: string;
  originalName: string;
  mimetype: string;
  size: number;
  visibility: StorageVisibility;
  publicUrl?: string | null;
  previewUrl?: string;
  openUrl?: string;
  uploading?: boolean;
};

export function isImageMimetype(mimetype: string): boolean {
  return mimetype.trim().toLowerCase().startsWith("image/");
}
