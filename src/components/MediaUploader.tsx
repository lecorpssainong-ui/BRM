import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  CheckCircle2,
  Loader2,
  Film,
  FolderOpen,
  Link as LinkIcon,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useResolvedMediaUrl } from '@/lib/videoStore';
import { isMediaVideo, parseMediaUrl, extractYouTubeId } from '@/lib/mediaUtils';
import { toast } from '@/components/ui/toaster';

export interface MediaUploaderProps {
  value?: string;
  onChange?: (val: string) => void;
  accept?: string;
  mediaType?: 'image' | 'video' | 'any';
  label?: string;
  hint?: string;
  required?: boolean;
  presetType?: string;
  onThumbnailGenerated?: (thumb: string) => void;
}

async function extractThumbnailBlob(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      }, 6000);

      video.onloadeddata = () => {
        try {
          video.currentTime = Math.min(1, Math.max(0.1, (video.duration || 1) / 4));
        } catch {
          // ignore
        }
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 640;
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 360;
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(objectUrl);
                resolve(blob);
              },
              'image/webp',
              0.8
            );
            return;
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export default function MediaUploader({
  value = '',
  onChange,
  accept = 'image/*,video/*',
  mediaType = 'any',
  label = 'Média (Image ou Vidéo)',
  hint = 'Téléversez un fichier ou collez un lien (YouTube, image web, etc.).',
  required = false,
  onThumbnailGenerated,
}: MediaUploaderProps) {
  const [sourceMode, setSourceMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const resolvedPreviewUrl = useResolvedMediaUrl(previewUrl);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreviewUrl(value || '');
    setVideoError(false);
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      setUrlInput(value);
    }
  }, [value]);

  const activeSrc = resolvedPreviewUrl || previewUrl;
  const parsed = parseMediaUrl(activeSrc, { autoPlay: true, muted: true, loop: true });
  const isVideo =
    mediaType === 'video' ||
    parsed.type === 'youtube' ||
    parsed.type === 'vimeo' ||
    parsed.type === 'direct_video' ||
    isMediaVideo(activeSrc);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(15);
    setVideoError(false);

    try {
      const isVideoFile = file.type.startsWith('video/');
      const isImageFile = file.type.startsWith('image/');

      if (mediaType === 'image' && !isImageFile) {
        toast({
          title: 'Format invalide',
          description: 'Veuillez sélectionner un fichier image (JPG, PNG, WebP).',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      if (mediaType === 'video' && !isVideoFile) {
        toast({
          title: 'Format invalide',
          description: 'Veuillez sélectionner un fichier vidéo (MP4, MOV, WebM).',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      const cleanFileName = file.name.replace(/\s+/g, '_');
      const folder = isVideoFile ? 'videos' : 'images';
      const filePath = `${folder}/${Date.now()}-${cleanFileName}`;

      setUploadProgress(35);

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          contentType: file.type || (isVideoFile ? 'video/mp4' : 'image/jpeg'),
          upsert: false,
        });

      if (error) {
        console.error('[Supabase Storage] Upload error:', error);
        throw error;
      }

      setUploadProgress(75);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Si c'est une vidéo, extraction automatique et upload de la miniature
      if (isVideoFile && typeof onThumbnailGenerated === 'function') {
        try {
          const thumbBlob = await extractThumbnailBlob(file);
          if (thumbBlob) {
            const thumbPath = `images/${Date.now()}-thumb_${cleanFileName.split('.')[0]}.webp`;
            const { error: thumbErr } = await supabase.storage
              .from('media')
              .upload(thumbPath, thumbBlob, {
                contentType: 'image/webp',
                upsert: false,
              });

            if (!thumbErr) {
              const { data: thumbData } = supabase.storage.from('media').getPublicUrl(thumbPath);
              if (thumbData?.publicUrl) {
                onThumbnailGenerated(thumbData.publicUrl);
              }
            }
          }
        } catch (thumbErr) {
          console.warn('[MediaUploader] Miniature vidéo:', thumbErr);
        }
      }

      setUploadProgress(100);
      setPreviewUrl(publicUrl);
      setUrlInput('');

      if (typeof onChange === 'function') {
        onChange(publicUrl);
      }

      toast({
        title: 'Média téléversé avec succès',
        description: isVideoFile
          ? 'Vidéo enregistrée sur Supabase Storage.'
          : 'Image enregistrée sur Supabase Storage.',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('[MediaUploader] Upload error:', error);
      toast({
        title: 'Erreur lors du téléversement',
        description: error?.message || 'Impossible de téléverser le fichier sur Supabase Storage.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = (inputVal?: string) => {
    const targetUrl = (inputVal !== undefined ? inputVal : urlInput).trim();
    if (!targetUrl) {
      toast({
        title: 'Lien vide',
        description: 'Veuillez coller un lien valide (URL YouTube, image web ou vidéo).',
        variant: 'destructive',
      });
      return;
    }

    setPreviewUrl(targetUrl);
    setVideoError(false);
    if (typeof onChange === 'function') {
      onChange(targetUrl);
    }

    // Auto-extraction miniature pour YouTube
    const ytId = extractYouTubeId(targetUrl);
    if (ytId && typeof onThumbnailGenerated === 'function') {
      const ytThumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      onThumbnailGenerated(ytThumb);
    }

    toast({
      title: 'Lien appliqué',
      description: 'Le média est maintenant configuré.',
      variant: 'success',
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    setUrlInput('');
    setVideoError(false);
    if (typeof onChange === 'function') {
      onChange('');
    }
  };

  return (
    <div className="space-y-2.5 font-body">
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        {previewUrl && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Média prêt</span>
          </span>
        )}
      </div>

      {/* Input de fichier natif invisible déclenché par clic */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Zone de prévisualisation si média déjà présent */}
      {previewUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-cacao/15 dark:border-stone-700 bg-black/5 dark:bg-stone-900 aspect-video max-h-64 flex items-center justify-center">
          {parsed.type === 'youtube' || parsed.type === 'vimeo' ? (
            parsed.embedUrl ? (
              <iframe
                src={parsed.embedUrl}
                title="Aperçu vidéo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full object-cover scale-125 pointer-events-none border-0"
              />
            ) : null
          ) : isVideo ? (
            videoError || !activeSrc || !activeSrc.trim() ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-stone-900 text-stone-200 text-center gap-2">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-xs font-semibold">Vidéo indisponible, veuillez re-uploader</p>
              </div>
            ) : (
              <video
                src={activeSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => {
                  setVideoError(true);
                }}
                className="w-full h-full object-cover rounded-2xl pointer-events-none"
              />
            )
          ) : activeSrc && activeSrc.trim() ? (
            <img
              src={activeSrc}
              alt="Média"
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-stone-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}

          {/* Overlay de contrôle au survol */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => {
                setSourceMode('file');
                fileInputRef.current?.click();
              }}
              className="px-3.5 py-2 rounded-xl bg-white/95 text-cacao font-bold text-xs flex items-center gap-1.5 hover:bg-white shadow-lg cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-gold" />
              <span>Galerie</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                setSourceMode('url');
              }}
              className="px-3.5 py-2 rounded-xl bg-gold text-stone-950 font-bold text-xs flex items-center gap-1.5 hover:bg-gold/90 shadow-lg cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Coller un lien</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-rose-700 shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          </div>

          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            {isVideo ? <Film className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}
            <span>{isVideo ? 'Vidéo animée' : 'Image'}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sélecteur de mode : Galerie vs Lien URL */}
          <div className="flex p-1 rounded-xl bg-sand/60 dark:bg-stone-900 border border-cacao/10 dark:border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSourceMode('file')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sourceMode === 'file'
                  ? 'bg-cacao text-sand dark:bg-gold dark:text-cacao font-bold shadow-xs'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao dark:hover:text-sand'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Depuis Galerie / Fichier</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('url')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sourceMode === 'url'
                  ? 'bg-cacao text-sand dark:bg-gold dark:text-cacao font-bold shadow-xs'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao dark:hover:text-sand'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Coller un lien (URL / YouTube)</span>
            </button>
          </div>

          {sourceMode === 'file' ? (
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                isUploading
                  ? 'border-gold bg-gold/5 cursor-wait'
                  : 'border-cacao/20 dark:border-stone-700 bg-sand/30 dark:bg-stone-900/60 hover:border-gold hover:bg-sand/60 dark:hover:bg-stone-900'
              }`}
            >
              {isUploading ? (
                <div className="space-y-3 py-4 w-full max-w-xs mx-auto">
                  <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
                  <p className="text-xs font-bold text-cacao dark:text-sand">
                    Téléversement vers Supabase Storage... {uploadProgress > 0 && `${uploadProgress}%`}
                  </p>
                  <div className="w-full bg-cacao/10 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gold h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.max(10, uploadProgress)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center shadow-inner">
                    {mediaType === 'video' ? (
                      <VideoIcon className="w-6 h-6" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-cacao dark:text-sand">
                      Cliquez pour choisir un fichier depuis votre appareil
                    </p>
                    <p className="text-[11px] text-cacao/60 dark:text-sand/60">
                      {hint}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-sand/30 dark:bg-stone-900/60 border border-cacao/15 dark:border-stone-800 space-y-2.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-gold absolute left-3 top-3" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyUrl();
                      }
                    }}
                    placeholder={
                      mediaType === 'video'
                        ? 'Ex: https://www.youtube.com/watch?v=... ou https://.../video.mp4'
                        : 'Ex: https://.../image.jpg ou lien Google'
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-cacao/20 dark:border-stone-700 text-cacao dark:text-sand focus:ring-2 focus:ring-gold/60 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyUrl()}
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-gold text-stone-950 font-bold text-xs hover:bg-gold/90 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Valider
                </button>
              </div>
              <p className="text-[11px] text-cacao/60 dark:text-sand/60">
                {mediaType === 'video'
                  ? 'Compatible YouTube, Vimeo, MP4 direct. La vidéo sera animée en boucle continue.'
                  : 'Collez une adresse URL d\'image (JPG, PNG, WebP) ou lien direct.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
