import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVideos } from '@/lib/queries';
import { Play, Heart, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShortsViewer from '@/components/video/ShortsViewer';
import AutoMedia from '@/components/shared/AutoMedia';
import { toast } from '@/components/ui/toaster';
import { useTranslation } from '@/lib/i18n';

export default function VideoStrip() {
  const { t } = useTranslation();
  const { data: videos = [] } = useVideos();
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  if (videos.length === 0) return null;

  const handleLike = (e: React.MouseEvent, v: any) => {
    e.stopPropagation();
    e.preventDefault();
    const vidId = v.id || v.video_url;
    const isLiked = likedIds.includes(vidId);
    setLikedIds(isLiked ? likedIds.filter((id) => id !== vidId) : [...likedIds, vidId]);
    toast({
      title: !isLiked ? 'Coup de cœur enregistré !' : 'J\'aime retiré',
      description: v.title,
      variant: 'default',
    });
  };

  const handleShare = async (e: React.MouseEvent, v: any) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = `${window.location.origin}/decouvertes?video=${v.id || ''}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: v.title || 'Capsule bien-être',
          text: `Découvrez cette vidéo : ${v.title}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Lien copié !',
          description: 'Lien de la vidéo copié dans votre presse-papier.',
          variant: 'success',
        });
      }
    } catch {
      // Ignorer
    }
  };

  return (
    <section className="space-y-4 font-body">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow block mb-1">{t('home.videosEyebrow')}</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            {t('home.videosTitle')}
          </h2>
        </div>
        <Link
          to="/decouvertes"
          className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1"
        >
          <span>{t('discover.tabVideos')}</span>
          <span>→</span>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
        {videos.map((video: any, i: number) => {
          const vidId = video.id || video.video_url;
          const isLiked = likedIds.includes(vidId);

          return (
            <motion.div
              key={video.id ? `${video.id}-${i}` : `vstrip-${i}`}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveVideoIndex(i)}
              className="w-48 sm:w-56 shrink-0 card-soft overflow-hidden group cursor-pointer border border-cacao/10 dark:border-white/10 shadow-md hover:shadow-2xl transition-all duration-300 select-none snap-start relative flex flex-col bg-white dark:bg-stone-900"
            >
              <div className="relative aspect-[9/14] bg-stone-950 overflow-hidden">
                <AutoMedia
                  url={video.thumbnail_url}
                  videoUrl={video.video_url}
                  poster={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-11 h-11 rounded-full bg-gold/90 text-stone-950 flex items-center justify-center shadow-xl group-hover:scale-115 transition duration-300 backdrop-blur-xs">
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                </div>

                {/* Micro-actions directes */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => handleLike(e, video)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition active:scale-80 ${
                      isLiked
                        ? 'bg-rose-600 text-white'
                        : 'bg-black/50 text-white hover:bg-rose-500'
                    }`}
                    title="J'aime"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleShare(e, video)}
                    className="w-7 h-7 rounded-full bg-black/50 hover:bg-gold text-white hover:text-stone-950 flex items-center justify-center backdrop-blur-md shadow-md transition active:scale-80"
                    title="Partager"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>

                {video.format === 'short' && (
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full bg-gold/90 text-stone-950 text-[9px] font-black uppercase tracking-wider shadow-xs pointer-events-none">
                    Short
                  </div>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-display font-medium text-xs sm:text-sm text-cacao dark:text-sand line-clamp-2 leading-tight group-hover:text-gold transition">
                  {video.title}
                </h4>
              </div>
            </motion.div>
          );
        })}
      </div>

      {activeVideoIndex !== null && (
        <ShortsViewer
          videos={videos}
          initialIndex={activeVideoIndex}
          onClose={() => setActiveVideoIndex(null)}
        />
      )}
    </section>
  );
}
