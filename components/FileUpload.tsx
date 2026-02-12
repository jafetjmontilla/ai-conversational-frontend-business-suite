'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApiJaihomV1, fetchApiV1, queries } from '@/lib/Fetching';

export interface UploadedFile {
  _id: string;
  lote?: string;
  path: string;
  createdAt?: string;
  // Campos adicionales para compatibilidad
  filename?: string;
  originalName?: string;
  url?: string;
  size?: number;
  mimeType?: string;
}

export interface FileUploadRef {
  uploadFiles: () => Promise<UploadedFile[]>;
  getSelectedFiles: () => File[];
  getUploadedFiles: () => UploadedFile[];
}

interface FileUploadProps {
  label?: string;
  multiple?: boolean;
  acceptedTypes?: string;
  maxSize?: number; // en MB
  category?: string;
  description?: string;
  tags?: string[];
  onFilesChange?: (files: UploadedFile[]) => void;
  onSelectedFilesChange?: (files: File[]) => void; // Para modo uploadOnSave
  existingFiles?: UploadedFile[];
  disabled?: boolean;
  uploadOnSave?: boolean; // Si es true, los archivos se suben al guardar el formulario
}

// Extensiones soportadas por la API de Jaihom
const SUPPORTED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'jfif', 'svg',
  'mp4', 'mp3',
  'xlsx', 'xls',
  'pdf',
  'docx', 'doc',
  'pptx', 'ppt',
  'txt', 'csv', 'json'
];

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(({
  label = 'Archivos adjuntos',
  multiple = true,
  acceptedTypes,
  maxSize = 10, // 10MB por defecto
  category,
  description,
  tags,
  onFilesChange,
  onSelectedFilesChange,
  existingFiles = [],
  disabled = false,
  uploadOnSave = false, // Por defecto sube inmediatamente
}, ref) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar extensión de archivos
    const invalidExtensionFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const ext = fileName.split('.').pop() || '';
      return !SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (invalidExtensionFiles.length > 0) {
      toast.error(`Algunos archivos tienen extensiones no soportadas. Extensiones permitidas: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validar tamaño de archivos
    const invalidFiles = files.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      return fileSizeMB > maxSize;
    });

    if (invalidFiles.length > 0) {
      toast.error(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`);
      return;
    }

    if (multiple) {
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);
      // Si está en modo uploadOnSave, notificar al padre
      if (uploadOnSave) {
        onSelectedFilesChange?.(newFiles);
      }
    } else {
      setSelectedFiles(files);
      // Si está en modo uploadOnSave, notificar al padre
      if (uploadOnSave) {
        onSelectedFilesChange?.(files);
      }
    }

    // Resetear el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    // Si está en modo uploadOnSave, notificar al padre
    if (uploadOnSave) {
      onSelectedFilesChange?.(newFiles);
    }
  };

  const removeUploadedFile = async (fileId: string) => {
    try {
      // Buscar el archivo para verificar si tiene _id (ya fue subido)
      const fileToDelete = uploadedFiles.find(f => f._id === fileId);

      if (!fileToDelete) {
        toast.error('Archivo no encontrado');
        return;
      }

      // Verificar si el archivo fue subido al backend
      // Los archivos subidos tienen _id que no es temporal (no empieza con "existing-")
      // y tienen un path que indica que está en el servidor
      const isUploadedFile = fileToDelete._id &&
        !fileToDelete._id.startsWith('existing-') &&
        fileToDelete.path;

      // Si el archivo fue subido al backend, eliminarlo del backend y la base de datos
      if (isUploadedFile) {
        try {
          await fetchApiV1({
            query: queries.deleteStorage,
            type: 'json',
            variables: {
              _id: fileToDelete._id,
            },
          });
        } catch (deleteError: any) {
          // Si falla la eliminación en el backend, aún así eliminamos del estado local
          console.error('Error al eliminar archivo del backend:', deleteError);
          toast.warning('Archivo eliminado de la lista, pero hubo un error al eliminarlo del servidor');
        }
      }

      // Actualizar el estado local
      const updatedFiles = uploadedFiles.filter(f => f._id !== fileId);
      setUploadedFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
      toast.success('Archivo eliminado correctamente');
    } catch (error: any) {
      toast.error(`Error al eliminar archivo: ${error.message || 'Error desconocido'}`);
    }
  };

  const uploadFiles = async (): Promise<UploadedFile[]> => {
    if (selectedFiles.length === 0) {
      return [];
    }

    setUploading(true);
    const newUploadedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileId = `${Date.now()}-${i}`;

        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Construir args como objeto para la API
          const argsObj: any = {};
          if (category) argsObj.category = category;
          if (description) argsObj.description = description;
          if (tags && tags.length > 0) argsObj.tags = tags;

          const response = await fetchApiV1({
            query: queries.uploadFile,
            type: 'formData',
            variables: {
              file: file,
              args: Object.keys(argsObj).length > 0 ? argsObj : null,
            },
          });

          // Agregar el archivo subido exitosamente al array
          if (response && response._id) {
            newUploadedFiles.push(response);
          }
        } catch (error: any) {
          console.error(`Error al subir archivo ${file.name}:`, error);
          toast.error(`Error al subir ${file.name}: ${error.message || 'Error desconocido'}`);
        }
      }

      const allFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(allFiles);
      setSelectedFiles([]);
      onFilesChange?.(allFiles);

      // Si está en modo uploadOnSave, limpiar también la notificación de archivos seleccionados
      if (uploadOnSave) {
        onSelectedFilesChange?.([]);
      }

      if (!uploadOnSave) {
        toast.success(`${newUploadedFiles.length} archivo(s) subido(s) correctamente`);
      }

      return newUploadedFiles;
    } catch (error: any) {
      toast.error(`Error al subir archivos: ${error.message || 'Error desconocido'}`);
      return [];
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Exponer funciones mediante ref cuando está en modo uploadOnSave
  useImperativeHandle(ref, () => ({
    uploadFiles,
    getSelectedFiles: () => selectedFiles,
    getUploadedFiles: () => uploadedFiles,
  }), [selectedFiles, uploadedFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const totalFiles = selectedFiles.length + uploadedFiles.length;

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes || SUPPORTED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="file-upload-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Seleccionar archivos
          </Button>
          {selectedFiles.length > 0 && !uploadOnSave && (
            <Button
              type="button"
              onClick={uploadFiles}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir {selectedFiles.length} archivo(s)
                </>
              )}
            </Button>
          )}
          {selectedFiles.length > 0 && uploadOnSave && (
            <span className="text-sm text-muted-foreground">
              {selectedFiles.length} archivo(s) pendiente(s) de subir
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Tamaño máximo: {maxSize}MB
          {acceptedTypes && ` • Tipos permitidos: ${acceptedTypes}`}
          {!acceptedTypes && ` • Extensiones permitidas: ${SUPPORTED_EXTENSIONS.join(', ')}`}
        </p>
      </div>

      {/* Archivos seleccionados (pendientes de subir) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Archivos seleccionados ({selectedFiles.length})</Label>
          <div className="space-y-2 border rounded-md p-3 bg-muted/50">
            {selectedFiles.map((file, index) => (
              <div
                key={`selected-${index}`}
                className="flex items-center justify-between p-2 bg-background rounded border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSelectedFile(index)}
                  disabled={uploading}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Archivos adjuntos ({uploadedFiles.length})</Label>
          <div className="space-y-2 border rounded-md p-3 bg-muted/50">
            {uploadedFiles.map((file) => (
              <div
                key={file._id}
                className="flex items-center justify-between p-2 bg-background rounded border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">{getFileIcon(file.mimeType || '')}</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={file.url || (file.path ? `${process.env.NEXT_PUBLIC_API_JAIHOM_URL || 'http://localhost:5500'}${file.path}` : '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium truncate hover:underline block"
                    >
                      {file.originalName || file.filename || `Archivo ${file._id}`}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {file.size ? formatFileSize(file.size) : (file.path || 'Sin información')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUploadedFile(file._id)}
                  disabled={disabled || uploading}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalFiles === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay archivos seleccionados
        </p>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';
