'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  FileUploadView,
  type FileUploadListItem,
  isImageMimetype,
} from '@/components/storage/FileUploadView';
import { uploadImageToStorage } from '@/lib/storage';

export interface LogoUploadFieldRef {
  uploadPendingIfAny: () => Promise<string | undefined>;
  hasPendingFile: () => boolean;
  reset: () => void;
}

interface LogoUploadFieldProps {
  businessId: string;
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  onPendingChange?: (hasPendingChanges: boolean) => void;
  disabled?: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024;

export const LogoUploadField = forwardRef<LogoUploadFieldRef, LogoUploadFieldProps>(
  function LogoUploadField(
    { businessId, logoUrl, onLogoUrlChange, onPendingChange, disabled = false },
    ref,
  ) {
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    const clearPendingPreview = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPendingPreviewUrl(null);
    };

    const resetLocalState = () => {
      clearPendingPreview();
      setPendingFile(null);
    };

    useEffect(
      () => () => {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      },
      [],
    );

    useEffect(() => {
      onPendingChange?.(pendingFile !== null);
    }, [pendingFile, onPendingChange]);

    const items = useMemo((): FileUploadListItem[] => {
      if (pendingFile && pendingPreviewUrl) {
        return [
          {
            _id: 'pending-logo',
            originalName: pendingFile.name,
            mimetype: pendingFile.type || 'image/png',
            size: pendingFile.size,
            visibility: 'PRIVATE',
            previewUrl: pendingPreviewUrl,
            openUrl: pendingPreviewUrl,
          },
        ];
      }
      if (logoUrl.trim()) {
        return [
          {
            _id: 'saved-logo',
            originalName: 'logo',
            mimetype: 'image/png',
            size: 0,
            visibility: 'PRIVATE',
            previewUrl: logoUrl,
            openUrl: logoUrl,
            publicUrl: logoUrl,
          },
        ];
      }
      return [];
    }, [pendingFile, pendingPreviewUrl, logoUrl]);

    useImperativeHandle(ref, () => ({
      uploadPendingIfAny: async () => {
        if (!pendingFile) return undefined;
        return uploadImageToStorage({
          businessId,
          file: pendingFile,
          category: 'logo',
          maxWidth: 640,
        });
      },
      hasPendingFile: () => pendingFile !== null,
      reset: resetLocalState,
    }));

    const handleFilesSelected = (fileList: FileList | File[]) => {
      const file = Array.from(fileList)[0];
      if (!file) return;
      if (!isImageMimetype(file.type)) {
        toast.error('Selecciona un archivo de imagen');
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error('El logo no puede superar 2 MB');
        return;
      }
      clearPendingPreview();
      const preview = URL.createObjectURL(file);
      blobUrlRef.current = preview;
      setPendingPreviewUrl(preview);
      setPendingFile(file);
    };

    const handleDelete = (item: FileUploadListItem) => {
      if (item._id === 'pending-logo') {
        clearPendingPreview();
        setPendingFile(null);
        return;
      }
      if (item._id === 'saved-logo') {
        onLogoUrlChange('');
      }
    };

    const handleUrlChange = (value: string) => {
      clearPendingPreview();
      setPendingFile(null);
      onLogoUrlChange(value);
    };

    return (
      <div className="space-y-3">
        <Input
          value={logoUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="URL de la imagen (externa o tras guardar)"
          disabled={disabled}
        />
        <FileUploadView
          mode="photos"
          items={items}
          multiple={false}
          hideCamera
          hideTitle
          disabled={disabled}
          onFilesSelected={handleFilesSelected}
          onDeleteRequest={handleDelete}
        />
      </div>
    );
  },
);
