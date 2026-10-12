import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarHeart,
  ShoppingBag,
  Video,
  MessageCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/format';

interface StatusStoryViewerProps {
  stories: any[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

const TONES_BG: Record<string, string> = {
  gold: 'from-amber-950 via-[#2E1A11] to-black',
  sage: 'from-emerald-950 via-[#13281E] to-black',
  clay: 'from-orange-950 via-[#361715] to-black',
  cacao: 'from-[#2B1D16] via-[#1A110D] to-black',
};

const TONES_ACCENT: Record<string, string> = {
  gold: 'text-amber-400 bg-amber-500/20 border-amber-400/40',
  sage: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40',
  clay: 'text-orange-400 bg-orange-500/20 border-orange-400/40',
  cacao: 'text-amber-300 bg-amber-500/20 border-amber-400/30',
};

export default function StatusStoryViewer({
  stories,
  initialIndex = 0,
  isOpen,
  onClose,
}: StatusStoryViewerProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);
  pauseRef.current = isPaused;

  const currentStory = stories[currentIndex] || stories[0];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  // Safely defer onClose to prevent updating parent component during render cycle
  const handleClose = useCallback(() => {
    setIsPaused(true);
    setTimeout(() => {
      onClose();
    }, 0);
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  }, [currentIndex, stories.length, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [currentIndex]);

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  // Handle auto-advance with progress timer
  useEffect(() => {
    if (!isOpen || stories.length === 0) return;

    setProgress(0);
    const intervalTime = 50; // update every 50ms
    const step = 100 / (STORY_DURATION / intervalTime);

    const timer = setInterval(() => {
      if (pauseRef.current) return;

      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          handleNextRef.current();
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentIndex, isOpen, stories.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') setIsPaused((p) => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !currentStory) return null;

  const toneBg = TONES_BG[currentStory.tone || 'gold'] || TONES_BG.gold;
  const toneAccent = TONES_ACCENT[currentStory.tone || 'gold'] || TONES_ACCENT.gold;

  // Handle CTA button click
  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();

    const linkType = currentStory.link_type;
    const targetName = currentStory.link_target_name || currentStory.link_target_id || '';

    if (linkType === 'massage') {
      navigate(
        `/rendez-vous?tab=book${targetName ? `&massage=${encodeURIComponent(targetName)}` : ''}`
      );
    } else if (linkType === 'product') {
      navigate(`/boutique${targetName ? `?search=${encodeURIComponent(targetName)}` : ''}`);
    } else if (linkType === 'video') {
      navigate('/decouvertes');
    } else if (linkType === 'appointment') {
      navigate('/rendez-vous');
    } else if (linkType === 'whatsapp') {
      const phone = currentStory.whatsapp_number || '22997000000';
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(
          `Bonjour Bénin Réflexologie, j'ai vu votre statut "${currentStory.title || currentStory.text.slice(0, 30)}" et je souhaite en savoir plus.`
        )}`,
        '_blank'
      );
    } else if (currentStory.link_url) {
      if (currentStory.link_url.startsWith('http')) {
        window.open(currentStory.link_url, '_blank');
      } else {
        navigate(currentStory.link_url);
      }
    } else {
      navigate('/rendez-vous');
    }
  };

  // Determine CTA label & icon
  let ctaLabel = currentStory.button_label;
  let CtaIcon = ArrowRight;

  if (!ctaLabel) {
    if (currentStory.link_type === 'massage') {
      ctaLabel = currentStory.link_target_name
        ? `Réserver ${currentStory.link_target_name}`
        : 'Découvrir ce soin';
      CtaIcon = CalendarHeart;
    } else if (currentStory.link_type === 'product') {
      ctaLabel = currentStory.link_target_name
        ? `Acheter ${currentStory.link_target_name}`
        : 'Voir en boutique';
      CtaIcon = ShoppingBag;
    } else if (currentStory.link_type === 'video') {
      ctaLabel = 'Voir la vidéo / tutoriel';
      CtaIcon = Video;
    } else if (currentStory.link_type === 'whatsapp') {
      ctaLabel = 'Discuter sur WhatsApp';
      CtaIcon = MessageCircle;
    } else if (currentStory.link_type === 'appointment') {
      ctaLabel = 'Prendre Rendez-vous';
      CtaIcon = CalendarHeart;
    } else if (currentStory.link_label) {
      ctaLabel = currentStory.link_label;
    } else {
      ctaLabel = 'En savoir plus';
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none">
      {/* Animated and Draggable Modal Container */}
      <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 400) {
              handleClose();
            }
          }}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className={`relative w-full max-w-md h-[100dvh] sm:h-[88vh] sm:rounded-[2.5rem] overflow-hidden flex flex-col justify-between shadow-2xl bg-gradient-to-b ${toneBg} border border-white/10`}
        >
          {/* Background Image / Texture if available */}
          {Boolean(currentStory.image_url && currentStory.image_url.trim()) ? (
            <div className="absolute inset-0 -z-10">
              <img
                src={currentStory.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-950/50 to-stone-950/95" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none -z-10" />
          )}

          {/* TOP SECTION: Progress bars + Author & Close button */}
          <div className="p-4 sm:p-6 space-y-3 z-30">
            {/* Progress Bars */}
            <div className="flex items-center gap-1.5 w-full">
              {stories.map((s, idx) => {
                let barProgress = 0;
                if (idx < currentIndex) barProgress = 100;
                else if (idx === currentIndex) barProgress = progress;
                else barProgress = 0;

                return (
                  <div
                    key={s.id || idx}
                    className="h-1 bg-white/25 rounded-full flex-1 overflow-hidden"
                  >
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-75"
                      style={{ width: `${barProgress}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Author Header */}
            <div className="flex items-center justify-between text-white pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-400 to-amber-600 ring-2 ring-amber-400/40 overflow-hidden shrink-0">
                  {Boolean(currentStory.image_url && currentStory.image_url.trim()) ? (
                    <img
                      src={currentStory.image_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#3D2619] flex items-center justify-center font-bold text-xs text-amber-300">
                      BR
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-medium text-sm text-white truncate">
                      {currentStory.author_name || 'Bénin Réflexologie'}
                    </span>
                    <span className="px-2 py-0.2 text-[9px] rounded-full uppercase tracking-wider font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Statut
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60 block font-body">
                    {currentStory.created_date
                      ? formatTimeAgo(currentStory.created_date)
                      : 'Statut du jour'}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-2 rounded-full bg-black/40 text-white/90 hover:text-white hover:bg-black/60 transition backdrop-blur-md cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MIDDLE SECTION: Interactive Tap Areas (Left 30% = prev, Right 70% = next) & Content */}
          <div className="relative flex-1 flex flex-col justify-center px-6 sm:px-8 py-4 z-20">
            {/* Invisible Tap Zones */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-0 top-0 bottom-0 w-[35%] z-10 cursor-pointer"
              title="Statut précédent"
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-0 top-0 bottom-0 w-[65%] z-10 cursor-pointer"
              title="Statut suivant"
            />

            {/* Story Card Content */}
            <div className="relative z-20 space-y-4 max-w-sm mx-auto text-center pointer-events-none">
              {currentStory.title && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${toneAccent}`}>
                  {currentStory.title}
                </span>
              )}

              <h2 className="font-display text-2xl sm:text-3xl font-medium text-white leading-tight drop-shadow-md">
                {currentStory.title ? currentStory.title : 'Bénin Réflexologie'}
              </h2>

              <div className="p-5 sm:p-6 rounded-3xl bg-black/45 backdrop-blur-xl border border-white/15 text-sand/90 font-body text-sm sm:text-base leading-relaxed drop-shadow-lg space-y-3">
                <p className="whitespace-pre-line font-medium">
                  {currentStory.text}
                </p>

                {currentStory.link_type && currentStory.link_type !== 'none' && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-amber-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Action rapide disponible ci-dessous</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Styled Smart CTA Button & Navigation Helper */}
          <div className="p-6 sm:p-8 pt-0 space-y-3 z-30 flex flex-col items-center">
            {currentStory.link_type !== 'none' && (
              <button
                type="button"
                onClick={handleCtaClick}
                className="btn-gold w-full max-w-xs py-3.5 px-6 rounded-full font-bold text-sm text-stone-950 inline-flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all cursor-pointer"
              >
                <CtaIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{ctaLabel}</span>
              </button>
            )}

            <p className="text-[10px] text-white/45 font-medium tracking-wide">
              Glissez vers le bas pour fermer • Tapez à gauche ou à droite
            </p>
          </div>

          {/* Desktop Chevron Navigation Buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            disabled={currentIndex === 0}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/75 disabled:opacity-20 transition backdrop-blur-md cursor-pointer"
            title="Précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={currentIndex === stories.length - 1}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/75 disabled:opacity-20 transition backdrop-blur-md cursor-pointer"
            title="Suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
  );
}
