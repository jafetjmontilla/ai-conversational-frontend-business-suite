import { getIdToken } from './firebase';

const apiBase = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2005';

export interface StorageFileRecord {
  _id: string;
  businessId?: string;
  objectKey?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  path: string;
  url: string;
  uploadedBy?: string;
  category?: string;
  description?: string;
  tags?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PresignResponse {
  storageId: string;
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresIn: number;
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getIdToken();
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  if (init?.body && !(init.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  return res;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body as { message?: string }).message || `Error ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

/** Sube un archivo a R2 vía presigned URL (presign → PUT → confirm). */
export async function uploadFileToStorage(input: {
  businessId: string;
  file: File;
  category?: string;
  description?: string;
  tags?: string[];
}): Promise<StorageFileRecord> {
  const presign = await parseJson<PresignResponse>(
    await authFetch('/api/storage/presign', {
      method: 'POST',
      body: JSON.stringify({
        businessId: input.businessId,
        filename: input.file.name,
        mimeType: input.file.type || 'application/octet-stream',
        size: input.file.size,
        category: input.category,
        description: input.description,
        tags: input.tags
      })
    })
  );

  const putRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': input.file.type || 'application/octet-stream'
    },
    body: input.file
  });

  if (!putRes.ok) {
    throw new Error(`Error al subir a R2 (${putRes.status})`);
  }

  return parseJson<StorageFileRecord>(
    await authFetch('/api/storage/confirm', {
      method: 'POST',
      body: JSON.stringify({ storageId: presign.storageId })
    })
  );
}

export async function deleteStorageFile(storageId: string): Promise<void> {
  await parseJson<{ ok: boolean }>(
    await authFetch(`/api/storage/${storageId}`, { method: 'DELETE' })
  );
}

export async function listStorageFiles(input: {
  businessId: string;
  skip?: number;
  limit?: number;
  category?: string;
}): Promise<{ total: number; results: StorageFileRecord[] }> {
  const params = new URLSearchParams();
  if (input.skip != null) params.set('skip', String(input.skip));
  if (input.limit != null) params.set('limit', String(input.limit));
  if (input.category) params.set('category', input.category);
  const qs = params.toString();
  return parseJson(
    await authFetch(`/api/storage/${encodeURIComponent(input.businessId)}${qs ? `?${qs}` : ''}`)
  );
}

/** Sube una imagen (con resize opcional) y devuelve la URL pública. */
export async function uploadImageToStorage(input: {
  businessId: string;
  file: File;
  category?: string;
  maxWidth?: number;
}): Promise<string> {
  let file = input.file;
  if (input.maxWidth && file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    file = await resizeImageFile(file, input.maxWidth);
  }
  const record = await uploadFileToStorage({
    businessId: input.businessId,
    file,
    category: input.category || 'image'
  });
  return record.url;
}

async function resizeImageFile(file: File, maxWidth: number): Promise<File> {
  if (typeof document === 'undefined') return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxWidth) {
          resolve(file);
          return;
        }
        height = (height * maxWidth) / width;
        width = maxWidth;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo comprimir la imagen'));
              return;
            }
            resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
          },
          file.type,
          0.85
        );
      };
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}
