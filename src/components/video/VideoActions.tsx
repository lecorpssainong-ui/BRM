import { useEffect, useState, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  CalendarHeart,
  Download,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useLike } from '@/lib/useLike';
import { useResolvedMediaUrl } from '@/lib/videoStore';
import { useAuth } from '@/lib/AuthContext';
import { openAuthModal } from '@/lib/authModalHelper';
import { toast } from '@/components/ui/toaster';
import { copyToClipboard } from '@/lib/clipboard';
import VideoCommentsDrawer from './VideoCommentsDrawer';
import VideoBookingDrawer from './VideoBookingDrawer';
import VideoAiDrawer from './VideoAiDrawer';
import VideoShopDrawer from './VideoShopDrawer';
import HealingRain from './HealingRain';
import { useAppSettings } from '@/lib/queries';

interface VideoActionsProps {
  video: any;
  onClose?: () => void;
  onDrawerStateChange?: (isOpen: boolean) => void;
  doubleTapTrigger?: number;
}

export default function VideoActions({
  video,
  onClose,
  onDrawerStateChange,
  doubleTapTrigger = 0,
}: VideoActionsProps) {
  const { user } = useAuth();
  const { hasLiked, count, toggleLike } = useLike('Video', video);
  const { data: settings } = useAppSettings();

  // Drawers State
  const [showComments, setShowComments] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Healing Rain Particles Trigger
  const [rainTrigger, setRainTrigger] = useState<number>(0);

  const resolvedVideoUrl = useResolvedMediaUrl(video?.video_url);
  const commentsActive = video.commentsEnabled !== false && video.comments_enabled !== false;

  const onDrawerStateChangeRef = useRef(onDrawerStateChange);
  onDrawerStateChangeRef.current = onDrawerStateChange;

  // Inform parent when any drawer opens/closes
  useEffect(() => {
    const isAnyOpen = showComments || showBooking || showAi || showShop;
    onDrawerStateChangeRef.current?.(isAnyOpen);
  }, [showComments, showBooking, showAi, showShop]);

  // Double tap from parent video container
  useEffect(() => {
    if (doubleTapTrigger > 0) {
      const willBeLiked = !hasLiked;
      toggleLike();
      if (willBeLiked) {
        setRainTrigger((prev) => prev + 1);
      }
    }
  }, [doubleTapTrigger]);

  // 1. Bouton "À ma santé" (Like + Pluie de guérison SEULEMENT si liked = true)
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      openAuthModal({
        reason: 'Pour enregistrer vos bienfaits et apprécier cette vidéo, veuillez vous identifier.',
        onSuccess: () => {
          const willBeLiked = !hasLiked;
          toggleLike();
          if (willBeLiked) {
            setRainTrigger((prev) => prev + 1);
          }
        },
      });
      return;
    }
    const willBeLiked = !hasLiked;
    toggleLike();
    if (willBeLiked) {
      setRainTrigger((prev) => prev + 1);
    }
  };

  // 2. Bouton "Avis / Mon souffle"
  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      openAuthModal({
        reason: 'Pour échanger avec la communauté et publier un avis, veuillez vous identifier.',
        onSuccess: () => setShowComments(true),
      });
      return;
    }
    setShowComments(true);
  };

  // 3. Bouton "Réserver une séance"
  const handleOpenBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      openAuthModal({
        reason: 'Pour planifier votre rendez-vous et séance de réflexologie, veuillez vous identifier.',
        onSuccess: () => setShowBooking(true),
      });
      return;
    }
    setShowBooking(true);
  };

  // 2. Bouton "Aidez les autres" (Partager)
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || `Découvrez cette vidéo de bien-être sur Bénin Réflexologie Massage`,
          url: window.location.href,
        });
        return;
      } catch {
        // Ignorer si annulé
      }
    }
    await copyToClipboard(window.location.href);
    toast({
      title: 'Lien copié !',
      description: 'Partagez cette vidéo avec vos proches.',
      variant: 'success',
    });
  };

  // 3. Bouton "Utile" (Téléchargement direct)
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = resolvedVideoUrl || video?.video_url;
    if (!url) {
      toast({ title: 'Téléchargement indisponible', variant: 'destructive' });
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(video.title || 'video_benin_reflexologie').replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: 'Vidéo enregistrée !',
        description: 'La vidéo a été téléchargée dans votre galerie.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Téléchargement',
        description: 'Fichier vidéo accessible.',
        variant: 'default',
      });
    }
  };

  const rainDuration = settings?.healing_rain_duration || 5;
  const rainStickers = settings?.healing_rain_stickers || ['hearts', 'leaves', 'water', 'lotus', 'stars'];

  return (
    <>
      {/* Pluie de guérison animée déclenchée par "À ma santé" */}
      <HealingRain
        triggerKey={rainTrigger}
        duration={rainDuration}
        stickers={rainStickers}
      />

      {/* Floating Right Overlay Action Buttons */}
      <div className="flex flex-col items-center gap-3 sm:gap-3.5 text-white font-body select-none">
        {/* 1. À ma santé (Like & Pluie de guérison) */}
        <button
          type="button"
          onClick={handleLike}
          className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
          title="À ma santé"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition group-hover:bg-black/70 shadow-xl">
            <Heart
              className={`w-5 h-5 transition-transform duration-300 ${
                hasLiked
                  ? 'fill-rose-500 text-rose-500 scale-110'
                  : 'text-white group-hover:text-rose-300'
              }`}
            />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md text-center leading-tight">
            {count > 0 ? count : 'À ma santé'}
          </span>
        </button>

        {/* 2. Mon souffle (Avis / Commentaires) */}
        <button
          type="button"
          onClick={handleOpenComments}
          className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
          title="Mon souffle (Avis & Commentaires)"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition group-hover:bg-black/70 shadow-xl relative">
            <MessageCircle className="w-5 h-5 text-white" />
            {!commentsActive && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-stone-500 rounded-full border border-sand" />
            )}
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md text-center leading-tight">
            Mon souffle
          </span>
        </button>

        {/* 3. Aidez les autres (Partager) */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
          title="Aidez les autres (Partager)"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition group-hover:bg-black/70 shadow-xl">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md text-center leading-tight">
            Aidez
          </span>
        </button>

        {/* 4. Réserver (Booking embedded) */}
        <button
          type="button"
          onClick={handleOpenBooking}
          className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
          title="Réserver une séance"
        >
          <div className="w-11 h-11 rounded-full bg-gold/90 text-stone-950 flex items-center justify-center shadow-xl transition group-hover:bg-amber-400">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-gold drop-shadow-md text-center leading-tight">
            Réserver
          </span>
        </button>

        {/* 5. Utile (Télécharger directement la vidéo) */}
        <button
          type="button"
          onClick={handleDownload}
          className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
          title="Utile (Télécharger dans la galerie)"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center transition group-hover:bg-black/70 shadow-xl">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md text-center leading-tight">
            Utile
          </span>
        </button>

        {/* 6. Rébecca (Conseillère IA Bien-être) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowAi(true);
          }}
          className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
          title="Rébecca (Conseillère IA)"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 via-rose-600 to-amber-400 text-white flex items-center justify-center shadow-xl transition group-hover:scale-105 border border-white/20">
            <Sparkles className="w-5 h-5 text-amber-100" />
          </div>
          <span className="text-[10px] font-bold text-amber-200 drop-shadow-md text-center leading-tight">
            Rébecca
          </span>
        </button>

        {/* 7. Boutique (Optionnel si produit lié ou accès shop) */}
        {(video.action_shop !== false || video.product_name) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowShop(true);
            }}
            className="flex flex-col items-center gap-0.5 group active:scale-90 transition cursor-pointer"
            title="Boutique & Huiles"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-xl transition group-hover:bg-emerald-500 border border-white/15">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-300 drop-shadow-md text-center leading-tight">
              Boutique
            </span>
          </button>
        )}
      </div>

      {/* Embedded Drawers directly over Video */}
      <VideoCommentsDrawer
        videoId={video.id}
        videoTitle={video.title}
        commentsEnabled={commentsActive}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

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
    </>
  );
}
