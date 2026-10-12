import { useState } from 'react';
import { useVideos } from '@/lib/queries';
import { Play, Video, Heart, Share2 } from 'lucide-react';
import AutoMedia from '@/components/shared/AutoMedia';
import { toast } from '@/components/ui/toaster';

interface MassageVideoStripProps {
  massageName: string;
  massageId?: string;
  massageVideos?: any[];
  onSelectVideo?: (v: any, relatedVideos: any[]) => void;
}

export default function MassageVideoStrip({
  massageName,
  massageId,
  massageVideos = [],
  onSelectVideo,
}: MassageVideoStripProps) {
  const { data: globalVideos = [] } = useVideos();
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // 1. Vidéos attachées directement au soin (y compris sheet_only)
  const directVideos = (Array.isArray(massageVideos) ? massageVideos : []).map((v) => ({
    ...v,
    format: v.format || 'short',
    massage_name: massageName,
    massage_id: massageId,
    commentsEnabled: v.commentsEnabled !== false,
  }));

  // 2. Vidéos globales correspondant au soin
  const matchingGlobal = globalVideos.filter(
    (v: any) =>
      (v.massage_name && v.massage_name.toLowerCase() === massageName.toLowerCase()) ||
      (massageId && v.massage_id && v.massage_id === massageId)
  );

  // 3. Fusion et déduplication par id / video_url
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const combinedVideos: any[] = [];

  for (const v of [...directVideos, ...matchingGlobal]) {
    if (!v) continue;
    if (v.id && seenIds.has(v.id)) continue;
    if (v.video_url && seenUrls.has(v.video_url)) continue;
    if (v.id) seenIds.add(v.id);
    if (v.video_url) seenUrls.add(v.video_url);
    combinedVideos.push(v);
  }

  if (combinedVideos.length === 0) return null;

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
          title: v.title || 'Capsule de soin',
          text: `Découvrez ce geste de soin : ${v.title}`,
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Lien copié !',
          description: 'Lien de la capsule copié.',
          variant: 'success',
        });
      }
    } catch {
      // Ignorer annulation
    }
  };

  return (
    <div className="space-y-3 pt-2 font-body">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" />
          <span>Capsules Vidéos du Soin</span>
        </h4>
        <span className="text-[11px] text-cacao/60 dark:text-sand/60">
          {combinedVideos.length} capsule{combinedVideos.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Défilement horizontal des miniatures 9:16 compactes */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 snap-x snap-mandatory">
        {combinedVideos.map((v: any, idx: number) => {
          const vidId = v.id || v.video_url;
          const isLiked = likedIds.includes(vidId);

          return (
            <div
              key={v.id ? `${v.id}-${idx}` : `vstrip-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectVideo?.(v, combinedVideos);
              }}
              className="w-32 sm:w-36 shrink-0 group cursor-pointer rounded-2xl overflow-hidden bg-stone-950 border border-cacao/10 dark:border-white/10 shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-95 snap-start select-none"
            >
              {/* Vignette compacte 9:16 */}
              <div className="relative aspect-[9/15] bg-stone-900 overflow-hidden">
                <AutoMedia
                  url={v.thumbnail_url}
                  videoUrl={v.video_url}
                  poster={v.thumbnail_url}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500 pointer-events-none"
                  autoPlay
                  loop
                  muted
                  playsInline
                  fallbackIcon={<Video className="w-6 h-6 text-white/40" />}
                />

                {/* Gradient sombre pour lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 pointer-events-none" />

                {/* Badge Play pulsant */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-gold/90 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-115 transition-transform duration-300 backdrop-blur-xs">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Micro-actions en haut à droite */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => handleLike(e, v)}
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
                    onClick={(e) => handleShare(e, v)}
                    className="w-7 h-7 rounded-full bg-black/50 hover:bg-gold text-white hover:text-stone-950 flex items-center justify-center backdrop-blur-md shadow-md transition active:scale-80"
                    title="Partager"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Titre en bas de vignette */}
                <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                  <h5 className="text-[11px] font-bold line-clamp-2 leading-tight drop-shadow">
                    {v.title}
                  </h5>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
