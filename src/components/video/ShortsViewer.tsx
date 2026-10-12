import { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import ShortItem from './ShortItem';

interface ShortsViewerProps {
  videos: any[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ShortsViewer({
  videos,
  initialIndex = 0,
  onClose,
}: ShortsViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Son prioritaire : vérifie si l'utilisateur a déjà activé le son dans une session précédente
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('brm-video-sound-enabled') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSound = (forcedState?: boolean) => {
    const nextState = typeof forcedState === 'boolean' ? forcedState : !soundEnabled;
    setSoundEnabled(nextState);
    try {
      localStorage.setItem('brm-video-sound-enabled', nextState ? 'true' : 'false');
    } catch {}

    // Débloquer immédiatement la balise vidéo active dans le lecteur
    const activeVideoEl = itemRefs.current[activeIndex]?.querySelector('video');
    if (activeVideoEl) {
      activeVideoEl.muted = !nextState;
      activeVideoEl.defaultMuted = !nextState;
      if (nextState) {
        activeVideoEl.play().catch(() => {});
      }
    }
  };

  // Arrêter toutes les vidéos en arrière-plan à l'ouverture du lecteur plein écran
  useEffect(() => {
    document.querySelectorAll('video').forEach((v) => {
      v.pause();
    });
  }, []);

  // Setup IntersectionObserver for physical snap detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.6,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos.length]);

  // Initial scroll to selected video
  useEffect(() => {
    if (initialIndex > 0 && itemRefs.current[initialIndex]) {
      itemRefs.current[initialIndex]?.scrollIntoView({ behavior: 'auto' });
    }
  }, [initialIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp') handlePrev();
      if (e.key === 'ArrowDown') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, videos.length]);

  const handleNext = () => {
    if (activeIndex < videos.length - 1) {
      itemRefs.current[activeIndex + 1]?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Si c'est la dernière vidéo → boucle sur la première
      itemRefs.current[0]?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      itemRefs.current[activeIndex - 1]?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black overflow-y-scroll snap-y snap-mandatory overscroll-y-contain scroll-smooth touch-pan-y no-scrollbar h-[100dvh] w-screen select-none"
      style={{
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Top Left Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-5 left-5 z-40 p-3 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/85 active:scale-90 transition shadow-2xl border border-white/10"
        title="Fermer la vidéo"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Top Right Counter Indicator */}
      <div className="fixed top-6 right-5 z-40 px-3.5 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md border border-white/15 select-none shadow-xl tracking-wider">
        {activeIndex + 1} / {videos.length}
      </div>

      {/* Desktop Video Navigator Arrows */}
      <div className="hidden sm:flex flex-col gap-3 fixed right-6 top-1/2 -translate-y-1/2 z-40">
        <button
          type="button"
          disabled={activeIndex === 0}
          onClick={handlePrev}
          className="p-3.5 rounded-full bg-stone-900/80 text-white hover:bg-stone-800 disabled:opacity-20 transition active:scale-95 backdrop-blur-md shadow-2xl border border-white/10"
          title="Vidéo précédente (Flèche haut)"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          type="button"
          disabled={activeIndex === videos.length - 1}
          onClick={handleNext}
          className="p-3.5 rounded-full bg-stone-900/80 text-white hover:bg-stone-800 disabled:opacity-20 transition active:scale-95 backdrop-blur-md shadow-2xl border border-white/10"
          title="Vidéo suivante (Flèche bas)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Vertical Snap Slides */}
      {videos.map((video, idx) => (
        <div
          key={video.id ? `${video.id}-${idx}` : `short-${idx}`}
          ref={(el) => {
            itemRefs.current[idx] = el;
          }}
          data-index={idx}
          className="w-full h-[100dvh] snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden"
        >
          <div className="w-full h-full max-w-lg md:max-w-xl flex items-center justify-center relative shadow-2xl">
            <ShortItem
              video={video}
              isActive={idx === activeIndex}
              onClose={onClose}
              onNextVideo={handleNext}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
