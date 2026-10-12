import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarHeart, MessageCircle, Sparkles } from 'lucide-react';
import { useAppSettings } from '@/lib/queries';
import { useTranslation } from '@/lib/i18n';

interface HeroSectionProps {
  name?: string;
}

export default function HeroSection({ name }: HeroSectionProps) {
  const { data: settings } = useAppSettings();
  const { t, currentLang } = useTranslation();

  // Dynamic time-based greeting calculation
  const getGreeting = (userName?: string) => {
    const hour = new Date().getHours();
    let prefix = t('home.greetingMorning');
    if (hour >= 5 && hour < 12) {
      prefix = t('home.greetingMorning');
    } else if (hour >= 12 && hour < 17) {
      prefix = t('home.greetingAfternoon');
    } else if (hour >= 17 && hour < 22) {
      prefix = t('home.greetingEvening');
    } else {
      prefix = t('home.greetingNight');
    }

    const firstName = userName ? userName.trim().split(' ')[0] : null;
    return firstName ? `${prefix} ${firstName}` : `${prefix}`;
  };

  const timeGreeting = getGreeting(name);

  // Defaults fallback to translation dictionary when language is non-French or default
  const isFrench = currentLang === 'fr';
  const defaultEyebrow = 'Sanctuaire de Bien-être';
  const defaultTitle = "L'art du toucher";
  const defaultHighlight = 'qui libère.';
  const defaultSubtitle =
    "Réflexologie plantaire, massages thérapeutiques et soins traditionnels au cœur du Bénin pour restaurer l'harmonie du corps et de l'esprit.";

  const eyebrow =
    !isFrench || !settings?.hero_eyebrow || settings.hero_eyebrow === defaultEyebrow
      ? t('hero.eyebrow')
      : settings.hero_eyebrow;

  const title =
    !isFrench || !settings?.hero_title || settings.hero_title === defaultTitle
      ? t('hero.title')
      : settings.hero_title;

  const highlight =
    !isFrench || (!settings?.hero_highlight && !settings?.hero_title_em) || (settings?.hero_highlight === defaultHighlight)
      ? t('hero.titleEm')
      : (settings?.hero_highlight || settings?.hero_title_em);

  const subtitle =
    !isFrench || !settings?.hero_subtitle || settings.hero_subtitle === defaultSubtitle
      ? t('hero.subtitle')
      : settings.hero_subtitle;

  const mediaUrl =
    settings?.hero_media_url ||
    settings?.hero_image_url ||
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80';

  const mediaType =
    settings?.hero_media_type ||
    (mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('video'))
      ? 'video'
      : 'image');

  return (
    <div className="relative w-full rounded-[2.5rem] overflow-hidden min-h-[480px] md:min-h-[540px] flex items-end p-5 sm:p-8 md:p-12 shadow-2xl">
      {/* Background image or video with subtle zoom animation */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 -z-10 overflow-hidden bg-stone-900"
      >
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Hero Sanctuaire"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback image si le lien est invalide
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80';
            }}
          />
        )}
      </motion.div>

      {/* Light subtle gradient scrim so hero background media stays crisp & visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent -z-10 pointer-events-none" />

      {/* Hero content - Clean, borderless text elements directly over image/video */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl w-full text-sand space-y-3.5 z-10"
      >
        {/* Greeting & Eyebrow */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-xs text-amber-300 text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>{timeGreeting}</span>
          </span>
          <span
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
            className="text-amber-100/90 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-xs"
          >
            • {eyebrow}
          </span>
        </div>

        {/* Main Title - Borderless with crisp text drop shadow */}
        <h1
          style={{ textShadow: '0 3px 14px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)' }}
          className="font-display text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.1] tracking-tight text-white"
        >
          {title}{' '}
          <span className="italic text-gold font-serif drop-shadow-lg">{highlight}</span>
        </h1>

        {/* Description Subtitle - Borderless with subtle inline translucent backdrop for contrast */}
        <div className="inline-block bg-black/35 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl max-w-xl">
          <p
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95)' }}
            className="text-amber-50 text-sm sm:text-base leading-relaxed font-body font-medium"
          >
            {subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 pt-1">
          <Link
            to="/rendez-vous?tab=book"
            className="btn-gold inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-2xl active:scale-95 transition"
          >
            <CalendarHeart className="w-4 h-4" />
            <span>{t('hero.bookSession')}</span>
          </Link>

          <Link
            to="/messages"
            className="btn-ghost inline-flex items-center gap-2 text-sm sm:text-base font-semibold shadow-xl active:scale-95 transition bg-black/40 backdrop-blur-xs hover:bg-black/60 text-sand border-none"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('hero.contactCenter')}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
