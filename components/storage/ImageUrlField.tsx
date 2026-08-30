'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImageToStorage } from '@/lib/storage';

interface ImageUrlFieldProps {
  businessId: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  category?: string;
  disabled?: boolean;
}

export function ImageUrlField({
  businessId,
  value,
  onChange,
  placeholder = 'URL de la imagen',
  category = 'logo',
  disabled = false
}: ImageUrlFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToStorage({
        businessId,
        file,
        category,
        maxWidth: category === 'logo' ? 640 : undefined
      });
      onChange(url);
      toast.success('Imagen subida correctamente');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir imagen';
      toast.error(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || uploading}
        className="flex-1"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleUpload}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </div>
  );
}
