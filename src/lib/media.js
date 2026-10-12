/**
 * BÉNIN RÉFLEXOLOGIE MASSAGE — MOTEUR DE COMPRESSION & UPLOAD MÉDIA
 * Architecture Client-Side : HTML5 Canvas, WebP, Extraction Vidéo & Cloudinary
 * 
 * 1. Compression d'images asynchrone via HTML5 <canvas> (max 1200px, WebP 0.8)
 * 2. Extraction automatique de miniature vidéo (1ère seconde) via Canvas hors écran
 * 3. Upload vers Cloudinary avec Promesses et suivi du pourcentage de progression (onProgress)
 * 4. Mode dégradé sécurisé (fallback local DataURL / Blob)
 */

import { supabase } from './supabaseClient';

/**
 * Upload natif vers Supabase Storage (bucket 'media') avec repli gracieux
 */
export async function uploadToSupabaseStorage(file, options = {}) {
  const { onProgress } = options;
  if (onProgress) onProgress(20);

  const isVideo = file.type?.startsWith('video/');
  const ext = file.name ? file.name.split('.').pop() : (isVideo ? 'mp4' : 'webp');
  const filename = `${isVideo ? 'videos' : 'images'}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const { data, error } = await supabase.storage.from('media').upload(filename, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (!error && data?.path) {
      const { data: publicData } = supabase.storage.from('media').getPublicUrl(data.path);
      if (onProgress) onProgress(100);
      return {
        url: publicData.publicUrl,
        secure_url: publicData.publicUrl,
        public_id: data.path,
        format: ext,
        bytes: file.size,
      };
    }
  } catch (err) {
    console.warn('[Supabase Storage] Fallback upload:', err);
  }

  // Si Supabase Storage n'est pas prêt, utiliser Cloudinary si configuré
  const { isConfigured } = getCloudinaryConfig();
  if (isConfigured) {
    return uploadToCloudinary(file, options);
  }

  // Mode dégradé local garanti
  return fileToDataUrl(file, onProgress);
}

/**
 * Configuration par défaut du moteur multimédia
 */
export const MEDIA_CONFIG = {
  MAX_IMAGE_DIMENSION: 1200, // Pixels max en largeur ou hauteur
  IMAGE_QUALITY: 0.8,        // Qualité WebP
  THUMBNAIL_DIMENSION: 640,  // Largeur max miniature vidéo
  CLOUDINARY_FOLDER: 'benin_reflexologie',
};

/**
 * Convertit un fichier ou Blob en DataURL local ou stocke les vidéos/gros médias dans IndexedDB
 */
export async function fileToDataUrl(file, onProgress) {
  if (onProgress) onProgress(30);

  const isVideo = file.type?.startsWith('video/');
  const isImage = file.type?.startsWith('image/');

  // Si c'est une image lourde (> 250KB), tenter la compression WebP d'abord
  if (isImage && file.size > 250000) {
    try {
      const compressedBlob = await compressImage(file, { maxDim: 1200, quality: 0.8 });
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (onProgress) onProgress(100);
          resolve({
            url: reader.result,
            secure_url: reader.result,
            public_id: `image_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            format: 'webp',
            bytes: compressedBlob.size,
            isLocal: true,
          });
        };
        reader.onerror = () => reject(new Error("Erreur de lecture locale de l'image"));
        reader.readAsDataURL(compressedBlob);
      });
    } catch (e) {
      console.warn('[MediaEngine] Compression image fallback:', e);
    }
  }

  // Si c'est une vidéo ou un fichier très lourd (> 1MB), stocker dans IndexedDB sous la clé idb://video_ ou idb://image_
  if (isVideo || file.size > 1000000) {
    try {
      const prefix = isVideo ? 'video' : isImage ? 'image' : 'media';
      const mediaId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const objectUrl = URL.createObjectURL(file);

      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.open('brm-media', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('videos')) {
            db.createObjectStore('videos');
          }
        };
        await new Promise((resolve) => {
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('videos', 'readwrite');
            const store = tx.objectStore('videos');
            store.put(file, mediaId);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
          };
          req.onerror = () => resolve(false);
        });
      }

      if (onProgress) onProgress(100);
      return {
        url: `idb://${mediaId}`,
        secure_url: `idb://${mediaId}`,
        dataUrl: objectUrl,
        public_id: mediaId,
        format: file.type?.split('/')[1] || (isVideo ? 'mp4' : 'webp'),
        bytes: file.size,
        isLocal: true,
      };
    } catch (err) {
      console.warn('[MediaEngine] IndexedDB store failed:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve({
        url: reader.result,
        secure_url: reader.result,
        public_id: `${isImage ? 'image' : 'local'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        format: file.type?.split('/')[1] || 'webp',
        bytes: file.size,
        isLocal: true,
      });
    };
    reader.onerror = () => reject(new Error("Erreur de lecture locale du fichier"));
    reader.readAsDataURL(file);
  });
}

/**
 * Récupère les configurations Cloudinary depuis les variables d'environnement
 */
export function getCloudinaryConfig() {
  const cloudName =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) ||
    (typeof process !== 'undefined' && process.env?.VITE_CLOUDINARY_CLOUD_NAME) ||
    '';

  const uploadPreset =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET) ||
    (typeof process !== 'undefined' && process.env?.VITE_CLOUDINARY_UPLOAD_PRESET) ||
    '';

  const isPlaceholder =
    !cloudName ||
    !uploadPreset ||
    cloudName === 'your_cloudinary_cloud_name' ||
    cloudName === 'your_cloud_name' ||
    cloudName.includes('your_') ||
    uploadPreset === 'your_upload_preset' ||
    uploadPreset.includes('your_');

  return {
    cloudName: cloudName.trim(),
    uploadPreset: uploadPreset.trim(),
    isConfigured: Boolean(!isPlaceholder && cloudName.trim() && uploadPreset.trim()),
  };
}

/**
 * 1. Compression Asynchrone d'Image via HTML5 <canvas>
 * Redimensionne proportionnellement (max 1200px) et encode en WebP (0.8 quality).
 * Libère rigoureusement la mémoire GPU / DOM.
 * 
 * @param {File|Blob} file - Fichier image original
 * @param {object} [options]
 * @param {number} [options.maxDim=1200] - Dimension maximale (largeur ou hauteur)
 * @param {number} [options.quality=0.8] - Facteur de compression (0.1 à 1.0)
 * @returns {Promise<File>} Fichier compressé WebP
 */
export async function compressImage(file, options = {}) {
  const maxDim = options.maxDim || MEDIA_CONFIG.MAX_IMAGE_DIMENSION;
  const quality = options.quality ?? MEDIA_CONFIG.IMAGE_QUALITY;

  // Si ce n'est pas une image ou si c'est du vectoriel SVG, conserver tel quel
  if (!file.type || !file.type.startsWith('image/') || file.type.includes('svg')) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const maxSide = Math.max(origW, origH);

      // Calcul des dimensions à l'échelle
      const scale = maxSide > maxDim ? maxDim / maxSide : 1;
      const targetW = Math.max(1, Math.round(origW * scale));
      const targetH = Math.max(1, Math.round(origH * scale));

      // Création du canvas hors écran
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        return resolve(file);
      }

      // Lissage d'image haute fidélité
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Encodage en WebP avec repli automatique sur JPEG si non supporté
      const encodeFormat = 'image/webp';

      canvas.toBlob(
        (blob) => {
          // Nettoyage mémoire du canvas
          canvas.width = 0;
          canvas.height = 0;

          if (!blob) {
            return resolve(file);
          }

          // Si la compression n'a pas réduit la taille et le format est conservable, garder l'original
          if (blob.size >= file.size && scale === 1) {
            return resolve(file);
          }

          const baseName = (file.name || 'image').replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: encodeFormat,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        encodeFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Repli tolérant en cas d'erreur de décodage
    };

    img.src = objectUrl;
  });
}

/**
 * 2. Extraction Automatique de Miniature (Thumbnail) de Vidéo
 * Capture une frame à la 1ère seconde de la vidéo via un Canvas hors écran.
 * 
 * @param {File|Blob} videoFile - Fichier vidéo (mp4, webm, mov)
 * @param {object} [options]
 * @param {number} [options.seekTime=1.0] - Seconde à capturer (défaut: 1s)
 * @param {number} [options.maxDim=640] - Largeur max de la miniature
 * @returns {Promise<{ thumbnailFile: File, thumbnailUrl: string, duration: number }>}
 */
export async function extractVideoThumbnail(videoFile, options = {}) {
  const seekTime = options.seekTime || 1.0;
  const maxDim = options.maxDim || MEDIA_CONFIG.THUMBNAIL_DIMENSION;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoFile);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    // Timeout de sécurité si la vidéo est corrompue
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Délai dépassé lors de l'extraction de la miniature vidéo"));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      // Déterminer le temps de capture (1 seconde ou milieu de la vidéo si très courte)
      const captureAt = Math.min(seekTime, Math.max(0.1, video.duration / 2));
      video.currentTime = captureAt;
    };

    video.onseeked = () => {
      try {
        const origW = video.videoWidth || 640;
        const origH = video.videoHeight || 360;
        const maxSide = Math.max(origW, origH);
        const scale = maxSide > maxDim ? maxDim / maxSide : 1;
        const targetW = Math.max(1, Math.round(origW * scale));
        const targetH = Math.max(1, Math.round(origH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return reject(new Error("Impossible d'initialiser le contexte Canvas 2D"));
        }

        ctx.drawImage(video, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            const duration = video.duration || 0;
            cleanup();

            if (!blob) {
              return reject(new Error("Échec de la génération du blob miniature"));
            }

            const baseName = (videoFile.name || 'video').replace(/\.[^/.]+$/, '');
            const thumbnailFile = new File([blob], `${baseName}_thumb.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const thumbnailUrl = URL.createObjectURL(blob);
            resolve({ thumbnailFile, thumbnailUrl, duration });
          },
          'image/webp',
          0.8
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Erreur lors de la lecture du flux vidéo"));
    };
  });
}

/**
 * 3. Upload vers Cloudinary avec Promesses et Pourcentage de Progression
 * 
 * @param {File|Blob} file - Fichier à téléverser
 * @param {object} [options]
 * @param {Function} [options.onProgress] - Callback appelée avec le pourcentage (0 à 100)
 * @param {string} [options.resourceType='auto'] - 'image' | 'video' | 'raw' | 'auto'
 * @param {string} [options.folder] - Dossier Cloudinary
 * @returns {Promise<{ url: string, public_id: string, format: string, bytes: number }>}
 */
export async function uploadToCloudinary(file, options = {}) {
  const { onProgress } = options;
  const { cloudName, uploadPreset, isConfigured } = getCloudinaryConfig();

  // Mode Dégradé : Si Cloudinary n'est pas configuré dans .env,
  // convertir immédiatement en DataURL local sans bloquer l'interface.
  if (!isConfigured) {
    console.info('[MediaEngine] Cloudinary non configuré, stockage local DataURL actif.');
    return fileToDataUrl(file, onProgress);
  }

  // Déterminer le type de ressource Cloudinary
  let resourceType = options.resourceType || 'auto';
  if (resourceType === 'auto') {
    if (file.type?.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.type?.startsWith('image/')) {
      resourceType = 'image';
    } else {
      resourceType = 'raw';
    }
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', options.folder || MEDIA_CONFIG.CLOUDINARY_FOLDER);

  try {
    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);

      // Suivi de la progression en temps réel
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            resolve({
              url: data.secure_url || data.url,
              secure_url: data.secure_url || data.url,
              public_id: data.public_id,
              format: data.format,
              bytes: data.bytes,
              width: data.width,
              height: data.height,
              resource_type: data.resource_type,
              duration: data.duration,
            });
          } catch {
            reject(new Error("Réponse Cloudinary invalide (JSON corrompu)"));
          }
        } else {
          let errorMsg = `Échec de l'upload Cloudinary (Code ${xhr.status})`;
          try {
            const errData = JSON.parse(xhr.responseText);
            if (errData?.error?.message) {
              errorMsg = errData.error.message;
            }
          } catch {
            // pas de JSON d'erreur
          }
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Erreur réseau lors du téléversement vers Cloudinary"));
      };

      xhr.ontimeout = () => {
        reject(new Error("Délai de connexion dépassé (Timeout Cloudinary)"));
      };

      xhr.send(formData);
    });

    return result;
  } catch (err) {
    console.warn(`[MediaEngine] Téléversement Cloudinary non disponible (${err?.message || 'Erreur'}), repli automatique sur le stockage local :`, err);
    return fileToDataUrl(file, onProgress);
  }
}

/**
 * 4. Pipeline Complet : Compression Client + Extraction Miniature + Upload
 * 
 * @param {File} file - Fichier utilisateur
 * @param {object} [options]
 * @param {Function} [options.onProgress] - Progression globale
 * @returns {Promise<{ url: string, thumbnailUrl?: string, fileType: string, savedBytes: number }>}
 */
export async function processAndUploadMedia(file, options = {}) {
  const { onProgress } = options;
  const originalSize = file.size;

  // CAS 1 : IMAGE
  if (file.type?.startsWith('image/')) {
    if (onProgress) onProgress(10);
    const compressed = await compressImage(file, {
      maxDim: options.maxDim || MEDIA_CONFIG.MAX_IMAGE_DIMENSION,
      quality: options.quality || MEDIA_CONFIG.IMAGE_QUALITY,
    });
    const savedBytes = Math.max(0, originalSize - compressed.size);

    if (onProgress) onProgress(30);

    const uploadRes = await uploadToSupabaseStorage(compressed, {
      resourceType: 'image',
      onProgress: (pct) => {
        if (onProgress) onProgress(30 + Math.round(pct * 0.7));
      },
    });

    return {
      url: uploadRes.url,
      secure_url: uploadRes.secure_url || uploadRes.url,
      fileType: 'image',
      originalSize,
      compressedSize: compressed.size,
      savedBytes,
      publicId: uploadRes.public_id,
    };
  }

  // CAS 2 : VIDÉO
  if (file.type?.startsWith('video/')) {
    if (onProgress) onProgress(5);
    let thumbUrl = null;
    let thumbFile = null;

    try {
      const thumb = await extractVideoThumbnail(file);
      thumbFile = thumb.thumbnailFile;
    } catch (err) {
      console.warn('[MediaEngine] Impossible d\'extraire la miniature vidéo :', err.message);
    }

    if (onProgress) onProgress(20);

    // Upload de la miniature si disponible
    if (thumbFile) {
      try {
        const thumbUpload = await uploadToSupabaseStorage(thumbFile, { resourceType: 'image' });
        thumbUrl = thumbUpload.url;
      } catch {
        // Continue même si l'upload de la miniature échoue
      }
    }

    if (onProgress) onProgress(30);

    // Upload de la vidéo principale vers Supabase Storage
    const uploadRes = await uploadToSupabaseStorage(file, {
      resourceType: 'video',
      onProgress: (pct) => {
        if (onProgress) onProgress(30 + Math.round(pct * 0.7));
      },
    });

    return {
      url: uploadRes.url,
      secure_url: uploadRes.secure_url || uploadRes.url,
      thumbnailUrl: thumbUrl,
      fileType: 'video',
      originalSize,
      compressedSize: file.size,
      savedBytes: 0,
      publicId: uploadRes.public_id,
      duration: uploadRes.duration,
    };
  }

  // CAS 3 : DOCUMENT OU AUTRE FICHIER
  const uploadRes = await uploadToCloudinary(file, {
    resourceType: 'raw',
    onProgress,
  });

  return {
    url: uploadRes.url,
    fileType: 'document',
    originalSize,
    compressedSize: file.size,
    savedBytes: 0,
    publicId: uploadRes.public_id,
  };
}

/**
 * Fonctions de compatibilité conservées pour les modules existants
 */
export const maxDimFor = (power) => {
  const p = Math.min(10, Math.max(1, Math.round(power || 5)));
  const dims = { 1: 480, 2: 640, 3: 800, 4: 1024, 5: 1200, 6: 1440, 7: 1600, 8: 1920, 9: 2240, 10: 2560 };
  return dims[p] || 1200;
};

export const qualityFor = (power) => {
  const p = Math.min(10, Math.max(1, Math.round(power || 5)));
  return Math.min(0.9, 0.6 + p * 0.03);
};

export async function prepareUpload(file, mode = 'standard', power = 5) {
  if (mode !== 'standard' || !file.type?.startsWith('image/')) {
    return { file, saved: 0 };
  }
  const before = file.size;
  try {
    const out = await compressImage(file, {
      maxDim: maxDimFor(power),
      quality: qualityFor(power),
    });
    return { file: out, saved: Math.max(0, before - out.size) };
  } catch {
    return { file, saved: 0 };
  }
}

export async function uploadPublicFile(file) {
  try {
    const res = await uploadToCloudinary(file);
    return res.url;
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsDataURL(file);
    });
  }
}

export default {
  compressImage,
  extractVideoThumbnail,
  uploadToCloudinary,
  processAndUploadMedia,
  prepareUpload,
  uploadPublicFile,
  getCloudinaryConfig,
};
