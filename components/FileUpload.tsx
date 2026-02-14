'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, CloudUpload } from 'lucide-react';
import { FileIcon, defaultStyles } from 'react-file-icon';
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

  const getExtension = (filename: string): string => {
    const name = (filename || '').toLowerCase();
    const ext = name.split('.').pop() || '';
    return ext;
  };

  const getFileIconStyles = (extension: string) => {
    const ext = extension.toLowerCase();
    const key = ext as keyof typeof defaultStyles;
    return defaultStyles[key] || {};
  };

  const totalFiles = selectedFiles.length + uploadedFiles.length;

  const renderFileThumbnail = (
    type: 'selected' | 'uploaded',
    payload: { file?: File; uploaded?: UploadedFile; index?: number }
  ) => {
    const isSelected = type === 'selected';
    const name = isSelected
      ? (payload.file as File).name
      : (payload.uploaded as UploadedFile).originalName || (payload.uploaded as UploadedFile).filename || `Archivo`;
    const ext = getExtension(name);
    const styles = getFileIconStyles(ext);

    const content = (
      <div className="flex flex-col items-center gap-1 w-16 min-w-0 flex-shrink-0">
        <div className="relative group">
          <div className="w-8 h-10 flex items-center justify-center [&>svg]:w-8 [&>svg]:h-10">
            <FileIcon extension={ext} {...styles} />
          </div>
          {isSelected && (
            <span
              className="absolute -bottom-0.5 -left-0.5 rounded-full bg-amber-500/90 p-0.5 text-white shadow-sm"
              title="Pendiente de subir"
            >
              <CloudUpload className="h-3 w-3" />
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-90 hover:opacity-100 shadow-sm z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isSelected && payload.index !== undefined) removeSelectedFile(payload.index);
              if (!isSelected && payload.uploaded) removeUploadedFile(payload.uploaded._id);
            }}
            disabled={disabled || uploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-[10px] font-medium text-center truncate w-full max-w-[4rem]" title={name}>
          {name}
        </span>
      </div>
    );

    if (!isSelected && payload.uploaded) {
      const url = payload.uploaded.url || (payload.uploaded.path ? `${process.env.NEXT_PUBLIC_API_JAIHOM_URL || 'http://localhost:5500'}${payload.uploaded.path}` : null);
      if (url) {
        return (
          <a
            key={payload.uploaded._id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-90 transition-opacity"
          >
            {content}
          </a>
        );
      }
    }
    return <div key={isSelected ? `selected-${payload.index}` : payload.uploaded?._id}>{content}</div>;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2">
          {label}
          <span className="text-xs text-muted-foreground">
            Tamaño máximo: {maxSize}MB
          </span>
        </Label>
        <div className="mt-2 flex flex-wrap items-start gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
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
          </div>

          {/* Contenedor de miniaturas al lado del botón */}
          <div className="flex flex-wrap gap-3 items-start">
            {selectedFiles.map((file, index) => renderFileThumbnail('selected', { file, index }))}
            {uploadedFiles.map((file) => renderFileThumbnail('uploaded', { uploaded: file }))}
          </div>
        </div>
      </div>

      {totalFiles === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay archivos seleccionados
        </p>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';
