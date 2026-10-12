import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, Heart, Share2, MessageCircle } from 'lucide-react';
import { useLike } from '@/lib/useLike';
import AutoMedia from '@/components/shared/AutoMedia';
import VideoCommentsDrawer from './VideoCommentsDrawer';
import { toast } from '@/components/ui/toaster';

interface VideoThumbProps {
  video: any;
  onClick: () => void;
}

export default function VideoThumb({ video, onClick }: VideoThumbProps) {
  const { hasLiked, count, toggleLike } = useLike('Video', video);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLikeAnim(true);
    toggleLike();
    setTimeout(() => setLikeAnim(false), 600);
    toast({
      title: !hasLiked ? 'Coup de cœur enregistré !' : 'Mention J\'aime retirée',
      description: video?.title || 'Capsule bien-être',
      variant: 'default',
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = `${window.location.origin}/decouvertes?video=${video?.id || ''}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: video?.title || 'Bénin Réflexologie Massage',
          text: `Découvrez cette capsule bien-être : ${video?.title}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Lien copié !',
          description: 'Le lien de la vidéo a été copié dans votre presse-papier.',
          variant: 'success',
        });
      }
    } catch {
      // Annulation ou non supporté
    }
  };

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsCommentsOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        onClick={onClick}
        className="card-soft overflow-hidden group cursor-pointer border border-cacao/10 dark:border-white/10 bg-white dark:bg-stone-900 shadow-md hover:shadow-2xl transition-all duration-300 select-none relative flex flex-col"
      >
        <div className="relative aspect-[9/15] bg-stone-950 overflow-hidden">
          {/* Lecteur Vidéo fluide miniature en Autoplay / Muted / Loop */}
          <AutoMedia
            url={video.thumbnail_url}
            videoUrl={video.video_url}
            poster={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Dégradé de lisibilité élégant */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

          {/* Play Icon central fluide au hover */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-gold/90 text-stone-950 flex items-center justify-center shadow-xl group-hover:scale-115 transition-transform duration-300 backdrop-blur-md">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
          </div>

          {/* Barre d'Actions Interactives Directes dans la miniature */}
          <div className="absolute right-2 bottom-12 flex flex-col items-center gap-2.5 z-20">
            {/* Like direct */}
            <button
              type="button"
              onClick={handleLike}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md ${
                hasLiked
                  ? 'bg-rose-600 text-white scale-105'
                  : 'bg-black/60 text-white/90 hover:bg-rose-500 hover:text-white active:scale-85'
              }`}
              title="J'aime"
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  likeAnim ? 'scale-135' : ''
                } ${hasLiked ? 'fill-current' : ''}`}
              />
            </button>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {count}
            </span>

            {/* Share direct */}
            <button
              type="button"
              onClick={handleShare}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-gold/90 text-white hover:text-stone-950 flex items-center justify-center transition-all active:scale-85 cursor-pointer shadow-lg backdrop-blur-md"
              title="Partager cette vidéo"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Commentaires direct */}
            {video.commentsEnabled !== false && video.comments_enabled !== false && (
              <button
                type="button"
                onClick={handleOpenComments}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-gold/90 text-white hover:text-stone-950 flex items-center justify-center transition-all active:scale-85 cursor-pointer shadow-lg backdrop-blur-md"
                title="Commentaires et réactions"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Meta badges bas gauche */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 text-[11px] text-sand/90 font-medium pointer-events-none drop-shadow">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{video.views || 0}</span>
            </div>
            {video.format === 'short' && (
              <span className="px-1.5 py-0.5 rounded-full bg-gold/90 text-stone-950 font-black text-[9px] uppercase tracking-wider">
                Short
              </span>
            )}
          </div>
        </div>

        <div className="p-3">
          <h4 className="font-display font-medium text-xs sm:text-sm text-cacao dark:text-sand line-clamp-2 leading-tight group-hover:text-gold transition-colors">
            {video.title}
          </h4>
          {video.playlist && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gold block mt-1">
              {video.playlist}
            </span>
          )}
        </div>
      </motion.div>

      {/* Tiroir de Commentaires interactif déclenché depuis la miniature */}
      <AnimatePresence>
        {isCommentsOpen && (
          <VideoCommentsDrawer
            videoId={video.id || video.video_url}
            videoTitle={video.title}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
