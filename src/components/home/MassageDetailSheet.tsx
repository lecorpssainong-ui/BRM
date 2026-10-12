import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Heart, Check, CalendarHeart, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useLike } from '@/lib/useLike';
import { useAuth } from '@/lib/AuthContext';
import { openAuthModal } from '@/lib/authModalHelper';
import MassageVideoStrip from './MassageVideoStrip';
import AutoMedia from '@/components/shared/AutoMedia';

interface MassageDetailSheetProps {
  massage: any | null;
  onClose: () => void;
  onSelectVideo?: (v: any, relatedVideos?: any[]) => void;
}

export default function MassageDetailSheet({
  massage,
  onClose,
  onSelectVideo,
}: MassageDetailSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasLiked, count, toggleLike } = useLike('MassageType', massage);

  // Scroll Bleed Fix: Lock background body scroll while sheet is open
  useEffect(() => {
    if (!massage) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [massage]);

  if (!massage) return null;

  const handleBook = () => {
    if (!user) {
      openAuthModal({
        reason: 'Pour planifier votre séance de massage et gérer vos réservations, veuillez vous identifier.',
        onSuccess: () => {
          onClose();
          navigate(`/rendez-vous?tab=book&massage=${encodeURIComponent(massage.name)}`);
        },
      });
      return;
    }
    onClose();
    navigate(`/rendez-vous?tab=book&massage=${encodeURIComponent(massage.name)}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal({
        reason: 'Pour enregistrer vos préférences et coups de cœur sur ce massage, veuillez vous identifier.',
        onSuccess: () => toggleLike(),
      });
      return;
    }
    toggleLike();
  };

  const benefits: string[] = Array.isArray(massage.benefits)
    ? massage.benefits
    : typeof massage.benefits === 'string'
    ? massage.benefits.split('\n').filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-md -z-10"
        />

        {/* Modal / Sheet Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            backgroundColor: 'rgb(var(--sand))',
            color: 'rgb(var(--cacao))',
            borderColor: 'rgb(var(--cacao) / 0.18)',
          }}
          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border backdrop-blur-xl flex flex-col z-10"
        >
          {/* Hero Image (Header Gap Fix: Flush at the top without any space) */}
          <div className="relative w-full h-48 md:h-64 shrink-0 overflow-hidden rounded-t-[2rem] bg-stone-900">
            {/* Top handle overlay for mobile */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/60 rounded-full z-20 sm:hidden pointer-events-none" />

            <AutoMedia
              url={massage.image_url}
              alt={massage.name}
              fallbackImage="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
              className="w-full h-48 md:h-64 object-cover inset-0 rounded-t-[2rem]"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-stone-950/30 rounded-t-[2rem]" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/55 text-white hover:bg-black/80 transition backdrop-blur-md shadow-lg z-20"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Like button */}
            <button
              type="button"
              onClick={handleLike}
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 text-white hover:bg-black/80 transition backdrop-blur-md text-xs font-semibold shadow-lg z-20"
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
              <span>{count}</span>
            </button>

            {/* Bottom info banner over image */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-sand z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold shadow-md">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>{massage.duration_min || 60} minutes</span>
              </div>
              <span className="font-display text-2xl sm:text-3xl font-bold text-amber-300 drop-shadow-md">
                {formatPrice(massage.price)}
              </span>
            </div>
          </div>

          {/* Content details */}
          <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto font-body">
            <div>
              <span className="eyebrow block mb-1">Détail du soin</span>
              <h2 className="font-display text-2xl sm:text-4xl text-cacao font-medium">
                {massage.name}
              </h2>
              {massage.tagline && (
                <p className="text-sm font-semibold text-gold mt-1 italic font-serif">
                  « {massage.tagline} »
                </p>
              )}
            </div>

            {/* Description */}
            {massage.description && (
              <p className="text-sm sm:text-base text-cacao/75 leading-relaxed">
                {massage.description}
              </p>
            )}

            {/* Role & Objective */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {massage.role && (
                <div className="p-4 rounded-2xl bg-white/60 border border-cacao/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gold block mb-1">
                    Action principale
                  </span>
                  <p className="text-xs sm:text-sm text-cacao/80 leading-snug">
                    {massage.role}
                  </p>
                </div>
              )}
              {massage.objective && (
                <div className="p-4 rounded-2xl bg-white/60 border border-cacao/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gold block mb-1">
                    Objectif visé
                  </span>
                  <p className="text-xs sm:text-sm text-cacao/80 leading-snug">
                    {massage.objective}
                  </p>
                </div>
              )}
            </div>

            {/* Benefits List */}
            {benefits.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold">
                  Bienfaits constatés
                </h4>
                <div className="space-y-2">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-cacao/80">
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk discount notice */}
            {Number(massage.bulk_discount_percent) > 0 && (
              <div className="p-4 rounded-2xl bg-gold/15 border border-gold/30 flex items-center gap-3">
                <Tag className="w-5 h-5 text-gold shrink-0" />
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-cacao block">Offre forfait avantageuse</span>
                  <span className="text-cacao/75">
                    Profitez de -{massage.bulk_discount_percent}% de remise dès {massage.bulk_min_qty || 10} séances réservées.
                  </span>
                </div>
              </div>
            )}

            {/* Associated Video Strip */}
            <MassageVideoStrip
              massageName={massage.name}
              massageId={massage.id}
              massageVideos={massage.videos}
              onSelectVideo={onSelectVideo}
            />

            {/* Actions */}
            <div className="pt-4 border-t border-cacao/10 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleBook}
                className="btn-gold w-full sm:flex-1 py-3.5 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
              >
                <CalendarHeart className="w-4 h-4" />
                <span>Réserver ce soin ({formatPrice(massage.price)})</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn-soft w-full sm:w-auto py-3.5 px-6 text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
