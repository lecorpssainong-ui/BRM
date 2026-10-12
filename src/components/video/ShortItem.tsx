import { useState, useRef, useEffect } from 'react';
import { useResolvedMediaUrl, saveVideo, hasVideo } from '@/lib/videoStore';
import { useDataPref, canCacheOnView } from '@/lib/dataPref';
import { parseMediaUrl, sendIframeCommand } from '@/lib/mediaUtils';
import {
  Play,
  Volume2,
  VolumeX,
  CalendarHeart,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import VideoActions from './VideoActions';
import VideoBookingDrawer from './VideoBookingDrawer';
import VideoAiDrawer from './VideoAiDrawer';
import VideoShopDrawer from './VideoShopDrawer';

interface ShortItemProps {
  video: any;
  isActive: boolean;
  onClose: () => void;
  onNextVideo?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: (forcedState?: boolean) => void;
}

export default function ShortItem({
  video,
  isActive,
  onClose,
  onNextVideo,
  soundEnabled: propSoundEnabled,
  onToggleSound,
}: ShortItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof propSoundEnabled === 'boolean') {
      return !propSoundEnabled;
    }
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('brm-video-sound-enabled') !== 'true';
    } catch {
      return true;
    }
  });

  // Synchronisation avec la session globale du viewer
  useEffect(() => {
    if (typeof propSoundEnabled === 'boolean') {
      setIsMuted(!propSoundEnabled);
    }
  }, [propSoundEnabled]);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [pref] = useDataPref();

  // Drawers opened from bottom quick link pills or side actions
  const [showBooking, setShowBooking] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false);

  // Double tap detection
  const [doubleTapTrigger, setDoubleTapTrigger] = useState<number>(0);
  const lastTapRef = useRef<number>(0);

  const isAnyDrawerOpen = showBooking || showAi || showShop || isActionDrawerOpen;

  const resolvedVideoSrc = useResolvedMediaUrl(video?.video_url);
  const resolvedPosterSrc = useResolvedMediaUrl(video?.thumbnail_url);

  const rawSrc = resolvedVideoSrc || video?.video_url;
  const isIdbUnresolved =
    !rawSrc ||
    (typeof rawSrc === 'string' &&
      (rawSrc.startsWith('idb://') || rawSrc.includes('commondatastorage.googleapis.com')));
  const safeSrc = isIdbUnresolved ? '' : rawSrc;

  const parsedMedia = parseMediaUrl(safeSrc, { autoPlay: isPlaying, muted: isMuted, loop: true });
  const isEmbed = parsedMedia.type === 'youtube' || parsedMedia.type === 'vimeo';

  // Libération propre des ressources au démontage du composant
  useEffect(() => {
    const vid = videoRef.current;
    return () => {
      if (vid) {
        vid.pause();
        try {
          vid.removeAttribute('src');
          vid.load();
        } catch {}
      }
    };
  }, []);

  // Cache video when viewed according to data preference (for direct http links)
  useEffect(() => {
    if (isActive && video?.id && safeSrc && safeSrc.startsWith('http') && !isEmbed && canCacheOnView(pref)) {
      hasVideo(video.id).then((cached) => {
        if (!cached) {
          saveVideo(video.id, safeSrc);
        }
      });
    }
  }, [isActive, video?.id, safeSrc, pref, isEmbed]);

  // Pause/Play handling when drawers or slide changes
  useEffect(() => {
    if (isEmbed) {
      if (isAnyDrawerOpen || !isActive) {
        sendIframeCommand(iframeRef.current, 'pause', parsedMedia.type as 'youtube' | 'vimeo');
        setIsPlaying(false);
      } else if (isActive && !videoError) {
        sendIframeCommand(iframeRef.current, 'play', parsedMedia.type as 'youtube' | 'vimeo');
        sendIframeCommand(iframeRef.current, isMuted ? 'mute' : 'unmute', parsedMedia.type as 'youtube' | 'vimeo');
        setIsPlaying(true);
      }
      return;
    }

    const vid = videoRef.current;
    if (!vid) return;

    if (isAnyDrawerOpen || !isActive) {
      vid.pause();
      setIsPlaying(false);
      return;
    }

    if (isActive && !videoError) {
      // 3. Stop des conflits de lecture : pause TOUTES les autres vidéos
      document.querySelectorAll('video').forEach((v) => {
        if (v !== vid) {
          v.pause();
        }
      });

      vid.defaultMuted = isMuted;
      vid.muted = isMuted;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.info('[ShortItem] Autoplay rejeté avec son, passage en muet pour démarrage:', err);
            vid.muted = true;
            vid
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    }
  }, [isAnyDrawerOpen, isActive, videoError, isEmbed, parsedMedia.type, isMuted, safeSrc]);

  // Click & Double Tap Handler
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isEmbed && videoRef.current && !isMuted && videoRef.current.muted) {
      videoRef.current.muted = false;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setDoubleTapTrigger((prev) => prev + 1);
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const togglePlay = () => {
    if (isEmbed) {
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      sendIframeCommand(iframeRef.current, nextPlaying ? 'play' : 'pause', parsedMedia.type as 'youtube' | 'vimeo');
      return;
    }

    const vid = videoRef.current;
    if (!vid) return;

    if (videoError) {
      return;
    }

    if (vid.paused) {
      vid.muted = isMuted;
      const p = vid.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch((err) => {
          console.warn('[ShortItem] Autoplay restriction on user click, retrying muted:', err);
          vid.muted = true;
          setIsMuted(true);
          vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      }
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleEnableSound = () => {
    if (typeof onToggleSound === 'function') {
      onToggleSound(true);
    } else {
      setIsMuted(false);
      try {
        localStorage.setItem('brm-video-sound-enabled', 'true');
      } catch {}
    }

    const vid = videoRef.current;
    if (vid) {
      vid.muted = false;
      vid.defaultMuted = false;
      vid.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('[ShortItem] Erreur lecture avec son:', err);
      });
    }

    if (isEmbed) {
      sendIframeCommand(iframeRef.current, 'unmute', parsedMedia.type as 'youtube' | 'vimeo');
    }
  };

  const toggleSound = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const nextSoundEnabled = isMuted; // si muet, on active le son
    if (typeof onToggleSound === 'function') {
      onToggleSound(nextSoundEnabled);
    } else {
      setIsMuted(!nextSoundEnabled);
      try {
        localStorage.setItem('brm-video-sound-enabled', nextSoundEnabled ? 'true' : 'false');
      } catch {}
    }

    if (isEmbed) {
      sendIframeCommand(iframeRef.current, nextSoundEnabled ? 'unmute' : 'mute', parsedMedia.type as 'youtube' | 'vimeo');
    } else if (videoRef.current) {
      videoRef.current.muted = !nextSoundEnabled;
      videoRef.current.defaultMuted = !nextSoundEnabled;
      if (nextSoundEnabled) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleVideoError = () => {
    console.warn('[ShortItem] Erreur de lecture vidéo:', rawSrc);
    setVideoError(true);
    setIsPlaying(false);
  };

  const handleVideoEnded = () => {
    if (typeof onNextVideo === 'function') {
      onNextVideo();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !duration || isNaN(duration)) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = clickRatio * duration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none"
    >
      {/* Media Player: Either Clean iFrame Embed or Native HTML5 Video */}
      {isEmbed ? (
        <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
          <iframe
            ref={iframeRef}
            src={parsedMedia.embedUrl || undefined}
            title={video?.title || 'Vidéo'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute inset-0 w-full h-full object-cover scale-125 sm:scale-[1.18] pointer-events-none border-0 select-none"
            style={{ border: 0 }}
          />
        </div>
      ) : safeSrc ? (
        <video
          ref={videoRef}
          src={safeSrc}
          poster={resolvedPosterSrc || video?.thumbnail_url || undefined}
          autoPlay
          muted={isMuted}
          playsInline
          preload="metadata"
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setCurrentTime(v.currentTime);
            if (v.duration && !isNaN(v.duration)) {
              setDuration(v.duration);
            }
          }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.duration && !isNaN(v.duration)) {
              setDuration(v.duration);
            }
          }}
          className="w-full h-full object-cover"
        />
      ) : null}

      {/* Dark overlay gradients for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

      {/* Fallback card if video completely fails or has no source */}
      {(videoError || (!isEmbed && !safeSrc)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900 text-white z-10">
          <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-3">
            <Play className="w-8 h-8 opacity-40 ml-1" />
          </div>
          <p className="text-sm font-semibold mb-1">Vidéo indisponible, veuillez re-uploader</p>
          <p className="text-xs text-sand/70 max-w-xs">{video?.title}</p>
        </div>
      )}

      {/* Play/Pause overlay indicator */}
      {!isPlaying && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20">
            <Play className="w-8 h-8 ml-1 fill-current" />
          </div>
        </div>
      )}

      {/* Top Controls: Mute toggle */}
      <div className="absolute top-5 right-16 z-30">
        <button
          type="button"
          onClick={toggleSound}
          className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/85 transition cursor-pointer border border-white/15 shadow-xl"
          title={isMuted ? 'Activer le son (🔊)' : 'Couper le son (🔇)'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-300" /> : <Volume2 className="w-5 h-5 text-emerald-300" />}
        </button>
      </div>

      {/* 1. Premier lancement — GROS bouton central "Touchez pour activer le son" */}
      {isActive && isMuted && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleEnableSound();
          }}
          className="absolute inset-0 flex items-center justify-center z-35 cursor-pointer bg-black/35 backdrop-blur-[2px] transition-all"
        >
          <div
            className="flex flex-col items-center justify-center gap-3.5 px-8 py-7 sm:px-10 sm:py-8 rounded-full bg-black/85 text-white border-2 border-gold shadow-[0_0_45px_rgba(217,119,6,0.75)] animate-pulse hover:scale-105 active:scale-95 transition-all select-none"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold/25 text-gold flex items-center justify-center border border-gold/70 shadow-[0_0_25px_rgba(217,119,6,0.6)]">
              <Volume2 className="w-9 h-9 sm:w-11 sm:h-11 text-gold animate-bounce" />
            </div>
            <div className="text-center space-y-1">
              <span className="font-display font-semibold text-sm sm:text-base text-white tracking-wide block drop-shadow-md">
                Touchez pour activer le son
              </span>
              <span className="text-[11px] text-amber-200/90 font-medium block">
                🔊 Audio activé pour toutes les vidéos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bouton flottant permanent en bas à droite (🔊 / 🔇) */}
      <div className="absolute right-3.5 bottom-5 z-40">
        <button
          type="button"
          onClick={toggleSound}
          className={`w-11 h-11 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer border shadow-2xl flex items-center justify-center ${
            isMuted
              ? 'bg-black/80 text-amber-300 border-amber-400/40 hover:bg-black/95'
              : 'bg-emerald-600/90 text-white border-emerald-400/50 hover:bg-emerald-500'
          }`}
          title={isMuted ? 'Activer le son (🔊)' : 'Couper le son (🔇)'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-300" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Floating Right Interaction Sidebar directly overlaid on Video */}
      <div className="absolute right-3.5 bottom-20 sm:bottom-24 z-30">
        <VideoActions
          video={video}
          onClose={onClose}
          onDrawerStateChange={setIsActionDrawerOpen}
          doubleTapTrigger={doubleTapTrigger}
        />
      </div>

      {/* Bottom Info & Title & High-Contrast Quick Action Links */}
      <div className="absolute bottom-6 left-4 right-20 z-20 text-white font-body space-y-2">
        {video.playlist && (
          <span className="px-2.5 py-0.5 rounded-full bg-black/70 border border-amber-400/30 text-[10px] font-bold uppercase tracking-widest text-amber-300 inline-block backdrop-blur-md shadow-sm">
            {video.playlist}
          </span>
        )}
        <h3 className="font-display font-medium text-lg sm:text-2xl leading-snug drop-shadow-lg line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs sm:text-sm text-sand/90 line-clamp-2 drop-shadow-md font-body leading-relaxed max-w-sm">
            {video.description}
          </p>
        )}

        {/* High-Contrast Action Shortcut Pills with Solid Glassmorphic Backgrounds */}
        <div className="flex flex-wrap items-center gap-2 pt-1.5">
          {video.action_booking !== false && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowBooking(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-gold text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-xl active:scale-95 transition cursor-pointer border border-white/30"
            >
              <CalendarHeart className="w-3.5 h-3.5" />
              <span>Réserver {video.massage_name ? `• ${video.massage_name}` : 'ce soin'}</span>
            </button>
          )}

          {video.action_chat !== false && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowAi(true);
              }}
              className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-sand border border-white/30 text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-md shadow-xl active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Conseillère Rébecca</span>
            </button>
          )}

          {(video.action_shop !== false || video.product_name) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowShop(true);
              }}
              className="px-3 py-1.5 rounded-full bg-emerald-700/85 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 backdrop-blur-md shadow-xl active:scale-95 transition cursor-pointer border border-emerald-400/40"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Boutique {video.product_name ? `• ${video.product_name}` : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Bottom Drawers without quitting the video */}
      <VideoBookingDrawer
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        initialMassageName={video.massage_name}
        initialMassageId={video.massage_id}
      />

      <VideoAiDrawer
        isOpen={showAi}
        onClose={() => setShowAi(false)}
        video={video}
      />

      <VideoShopDrawer
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        productName={video.product_name}
        productId={video.product_id}
      />

      {/* Barre de Progression Épurée Style TikTok / Reels */}
      <div
        ref={progressBarRef}
        onClick={handleSeek}
        onTouchStart={handleSeek}
        onTouchMove={handleSeek}
        className="absolute bottom-0 left-0 right-0 z-40 h-3 flex items-end cursor-pointer group/bar px-0 select-none"
        title="Progression"
      >
        <div className="w-full bg-white/20 h-1 group-hover/bar:h-2 transition-all relative overflow-visible">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-gold to-amber-300 rounded-r-full relative transition-all duration-75"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, duration > 0 ? (currentTime / duration) * 100 : 0)
              )}%`,
            }}
          >
            {/* Curseur au survol */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg scale-0 group-hover/bar:scale-100 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
