import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const DB_NAME = 'brm-media';
const STORE_NAME = 'videos';

const urlCache = new Map<string, string>();

/**
 * Upload direct vers Supabase Storage (bucket 'media')
 * Stockage cloud permanent et universellement accessible.
 */
export async function uploadMediaToStorage(
  file: File | Blob,
  folder: 'videos' | 'images' = 'videos',
  customFileName?: string
): Promise<{ publicUrl: string; filePath: string }> {
  const originalName =
    file instanceof File
      ? file.name
      : (customFileName || `media_${Date.now()}.${folder === 'videos' ? 'mp4' : 'webp'}`);
  const cleanName = originalName.replace(/\s+/g, '_');
  const filePath = `${folder}/${Date.now()}-${cleanName}`;
  const contentType =
    file.type || (folder === 'videos' ? 'video/mp4' : 'image/webp');

  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, { contentType, upsert: false });

  if (error) {
    console.error('[Supabase Storage] Erreur upload:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  return { publicUrl, filePath };
}

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideo(id: string, url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export async function hasVideo(id: string): Promise<boolean> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function saveMediaBlob(id: string, blob: Blob): Promise<string> {
  const db = await getDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(blob, id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
  const objectUrl = URL.createObjectURL(blob);
  urlCache.set(id, objectUrl);
  return objectUrl;
}

export async function getMediaBlobUrl(idOrUrl: string): Promise<string> {
  if (!idOrUrl || typeof idOrUrl !== 'string') return '';

  if (
    idOrUrl.startsWith('http://') ||
    idOrUrl.startsWith('https://') ||
    idOrUrl.startsWith('/') ||
    idOrUrl.startsWith('data:') ||
    idOrUrl.startsWith('blob:')
  ) {
    return idOrUrl;
  }

  const cleanId = idOrUrl.replace(/^idb:\/\//, '');
  if (urlCache.has(cleanId)) {
    return urlCache.get(cleanId)!;
  }

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cleanId);
      req.onsuccess = () => {
        const res = req.result;
        if (res instanceof Blob || res instanceof File || (res && typeof res === 'object' && 'size' in res)) {
          const u = URL.createObjectURL(res);
          urlCache.set(cleanId, u);
          resolve(u);
        } else if (typeof res === 'string' && res.startsWith('blob:')) {
          resolve(res);
        } else {
          resolve('');
        }
      };
      req.onerror = () => resolve('');
    });
  } catch {
    return '';
  }
}

export function useResolvedMediaUrl(mediaUrl?: string): string {
  const isDirectUrl = Boolean(
    mediaUrl &&
      (mediaUrl.startsWith('http://') ||
        mediaUrl.startsWith('https://') ||
        mediaUrl.startsWith('/') ||
        mediaUrl.startsWith('data:') ||
        mediaUrl.startsWith('blob:'))
  );

  const [resolved, setResolved] = useState<string>(() => {
    if (!mediaUrl) return '';
    if (isDirectUrl) return mediaUrl;
    return '';
  });

  useEffect(() => {
    let active = true;
    if (!mediaUrl || isDirectUrl) {
      setResolved(mediaUrl || '');
      return;
    }

    getMediaBlobUrl(mediaUrl).then((res) => {
      if (active) {
        setResolved(res || '');
      }
    });

    return () => {
      active = false;
    };
  }, [mediaUrl, isDirectUrl]);

  return isDirectUrl ? (mediaUrl as string) : resolved;
}

export async function dropVideo(id: string): Promise<boolean> {
  if (urlCache.has(id)) {
    URL.revokeObjectURL(urlCache.get(id)!);
    urlCache.delete(id);
  }
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function storedCount(): Promise<number> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function clearVideoStore(): Promise<boolean> {
  for (const [, url] of urlCache) {
    URL.revokeObjectURL(url);
  }
  urlCache.clear();
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export function useOfflineVideo(video: { id?: string; video_url?: string } | null | undefined): string {
  const [src, setSrc] = useState(video?.video_url || '');

  useEffect(() => {
    let active = true;
    if (!video?.id) {
      setSrc(video?.video_url || '');
      return;
    }
    getMediaBlobUrl(video.id).then((local: string) => {
      if (active) {
        setSrc(local || video.video_url || '');
      }
    });
    return () => {
      active = false;
    };
  }, [video?.id, video?.video_url]);

  return src;
}
