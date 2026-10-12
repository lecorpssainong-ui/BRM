import React, { useRef, useEffect } from 'react';
import { useResolvedMediaUrl } from '@/lib/videoStore';
import { ShoppingBag } from 'lucide-react';
import { isMediaVideo, parseMediaUrl, extractYouTubeId } from '@/lib/mediaUtils';

export { isMediaVideo };

export interface AutoMediaProps {
  url?: string;
  videoUrl?: string;
  poster?: string;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  aspectRatioClass?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  fallbackImage?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function AutoMedia({
  url = '',
  videoUrl = '',
  poster = '',
  alt = 'Média',
  className = 'w-full h-full object-cover',
  fallbackIcon,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  controls = false,
  fallbackImage = '',
  onClick,
}: AutoMediaProps) {
  const resolvedUrl = useResolvedMediaUrl(url);
  const resolvedVideoUrl = useResolvedMediaUrl(videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Si videoUrl est passé explicitement ou si url est une vidéo, prioriser le flux vidéo
  const effectiveVideo = resolvedVideoUrl || videoUrl || (isMediaVideo(resolvedUrl || url) ? (resolvedUrl || url) : '');
  const effectivePoster = poster || (!isMediaVideo(resolvedUrl || url) ? (resolvedUrl || url) : '') || fallbackImage;

  const rawEffectiveUrl = effectiveVideo || resolvedUrl || url || fallbackImage;
  const safeEffectiveUrl =
    typeof rawEffectiveUrl === 'string' && rawEffectiveUrl.startsWith('idb://')
      ? ''
      : rawEffectiveUrl;

  const ytId = extractYouTubeId(safeEffectiveUrl);
  const parsed = parseMediaUrl(safeEffectiveUrl, { autoPlay, muted, loop });

  // Autoplay garanti en DOM direct pour contourner les restrictions strictes des navigateurs
  useEffect(() => {
    const vid = videoRef.current;
    if (vid && autoPlay && (parsed.type === 'direct_video' || isMediaVideo(safeEffectiveUrl))) {
      vid.defaultMuted = true;
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay bloqué en direct, réessai au focus ou premier clic
        });
      }
    }
  }, [safeEffectiveUrl, autoPlay, parsed.type]);

  if (!url && !videoUrl && !fallbackImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-gold">
        {fallbackIcon || <ShoppingBag className="w-6 h-6" />}
      </div>
    );
  }

  // CAS 1 & 2: YouTube ou Vimeo Embed (Épuré sans filigranes ni contrôles)
  if (parsed.type === 'youtube' || parsed.type === 'vimeo') {
    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full overflow-hidden bg-black flex items-center justify-center ${onClick ? 'cursor-pointer' : ''}`}
      >
        <iframe
          src={parsed.embedUrl}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-125 sm:scale-[1.18] pointer-events-none border-0 select-none"
          style={{ border: 0 }}
        />
        {onClick && <div className="absolute inset-0 z-10" />}
      </div>
    );
  }

  // CAS 3: Vidéo Directe (MP4, WebM, IndexedDB, Blob)
  if (parsed.type === 'direct_video' || isMediaVideo(safeEffectiveUrl) || Boolean(effectiveVideo)) {
    if (!safeEffectiveUrl || !safeEffectiveUrl.trim()) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-gold">
          {fallbackIcon || <ShoppingBag className="w-6 h-6" />}
        </div>
      );
    }
    return (
      <video
        ref={videoRef}
        src={safeEffectiveUrl}
        poster={effectivePoster || undefined}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        preload="metadata"
        controls={controls}
        onClick={onClick}
        onError={(e) => {
          console.warn('[AutoMedia] Erreur de lecture vidéo:', safeEffectiveUrl);
        }}
        className={`${className} ${!controls ? 'pointer-events-none' : ''}`}
      />
    );
  }

  // CAS 4: Image (ou YouTube/Vimeo converti en miniature d'image)
  const rawImage = ytId
    ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    : rawEffectiveUrl || fallbackImage;

  const validImageSrc = typeof rawImage === 'string' && rawImage.trim() ? rawImage.trim() : null;

  if (!validImageSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 text-gold">
        {fallbackIcon || <ShoppingBag className="w-6 h-6" />}
      </div>
    );
  }

  return (
    <img
      src={validImageSrc}
      alt={alt}
      loading="lazy"
      onClick={onClick}
      className={className}
      onError={(e) => {
        const target = e.currentTarget;
        if (ytId && target.src.includes('maxresdefault')) {
          target.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          return;
        }
        if (fallbackImage && target.src !== fallbackImage) {
          target.src = fallbackImage;
        }
      }}
    />
  );
}
