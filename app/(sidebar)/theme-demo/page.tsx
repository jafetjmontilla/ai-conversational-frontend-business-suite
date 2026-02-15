'use client';

import { ThemeDemo } from '@/components/ThemeDemo';
import { CommentsPanel } from '@/components/CommentsPanel';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

function getDeviceType(width: number): string {
  if (width < 640) return 'Móvil';
  if (width < 1024) return 'Tablet';
  return 'Escritorio';
}

interface Comment {
  _id?: string
  comment?: string
  attachments?: Array<{ name: string; size: number }>
  createdAt?: string
  uid?: string
  displayName?: string
}

export default function ThemeDemoPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [disableAttachments, setDisableAttachments] = useState(false);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [deviceType, setDeviceType] = useState('');

  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 0;
      const h = typeof window !== 'undefined' ? window.innerHeight : 0;
      setResolution({ width: w, height: h });
      setDeviceType(w > 0 ? getDeviceType(w) : '');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleCommentAdded = (comment: Comment) => {
    const newComment: Comment = {
      ...comment,
      uid: 'current-user-id', // En producción esto vendría del contexto de autenticación
      displayName: 'Usuario Actual'
    };
    setComments(prev => [...prev, newComment]);
  };

  const handleDeleteComment = (commentId?: string) => {
    if (commentId) {
      setComments(prev => prev.filter(c => c._id !== commentId));
    }
  };

  const handleDownloadFile = (fileName: string) => {
    console.log('Descargar archivo:', fileName);
    // Aquí implementarías la lógica de descarga
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <Label className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground">
        Resolución: {resolution.width || '—'} × {resolution.height || '—'} px · Dispositivo: {deviceType || '—'}
      </Label>
      <ThemeDemo />

      <Card>
        <CardHeader>
          <CardTitle>InputComments Component</CardTitle>
          <CardDescription>
            Componente de comentarios con editor Quill, soporte para archivos adjuntos y emojis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-600">Deshabilitar comentarios</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={disableAttachments}
                onChange={(e) => setDisableAttachments(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-600">Deshabilitar archivos adjuntos</span>
            </label>
          </div>
          <CommentsPanel
            comments={comments}
            disabled={disabled}
            disableAttachments={disableAttachments}
            onCommentAdded={handleCommentAdded}
            onDeleteComment={handleDeleteComment}
            onDownloadFile={handleDownloadFile}
            currentUserId="current-user-id"
          />
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <a
          href="/"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  );
}