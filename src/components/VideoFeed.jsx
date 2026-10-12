import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Heart,
  Share2,
  Trash2,
  Sparkles,
  Film,
  Volume2,
  VolumeX,
  X,
  Check,
  MessageCircle,
} from 'lucide-react';
import { mockStore, useMockStore } from '@/lib/mockStore';
import { useVideos } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import VideoCommentsDrawer from '@/components/video/VideoCommentsDrawer';
import ShortsViewer from '@/components/video/ShortsViewer';
import AutoMedia from '@/components/shared/AutoMedia';

/**
 * VIDEO FEED — FLUX VIDÉO & PLAYLISTS HAUTE FLUIDITÉ (ZÉRO BUG)
 * Actions Like, Partage et Suppression protégées par e.stopPropagation() & e.preventDefault()
 * Rendu anti-crash garanti avec (videos || []).map et chaînage optionnel.
 */
export default function VideoFeed({ isStaffMode = false, videos: propVideos }) {
  const qc = useQueryClient();
  const [selectedPlaylist, setSelectedPlaylist] = useState('all');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [activeCommentVideo, setActiveCommentVideo] = useState(null);
  const [likedVideoIds, setLikedVideoIds] = useState([]);

  // Chargement réactif depuis le mockStore et react-query
  const { data: storeVideos = [], refetch } = useMockStore(
    'videos',
    (store) => store.getVideos()
  );
  const { data: queryVideos = [] } = useVideos();

  const [localVideos, setLocalVideos] = useState([]);

  useEffect(() => {
    const list = propVideos || (queryVideos && queryVideos.length > 0 ? queryVideos : storeVideos) || [];
    setLocalVideos(list);
  }, [propVideos, queryVideos, storeVideos]);

  // Playlists uniques
  const playlists = [
    'all',
    ...new Set((Array.isArray(localVideos) ? localVideos : []).map((v) => v?.playlist).filter(Boolean)),
  ];

  // Action Like avec e.stopPropagation() & mise à jour optimiste
  const handleLike = (e, video) => {
    e.stopPropagation();
    e.preventDefault();

    if (!video) return;

    const isAlreadyLiked = likedVideoIds.includes(video.id);
    const updatedIds = isAlreadyLiked
      ? likedVideoIds.filter((id) => id !== video.id)
      : [...likedVideoIds, video.id];

    setLikedVideoIds(updatedIds);

    // Optimistic Update du compteur
    setLocalVideos((prev) =>
      (prev || []).map((v) =>
        v.id === video.id
          ? { ...v, likes: isAlreadyLiked ? Math.max(0, (v.likes || 1) - 1) : (v.likes || 0) + 1 }
          : v
      )
    );

    toast.success(
      isAlreadyLiked ? 'Mention j\'aime retirée' : 'Merci pour votre soutien !',
      video.title
    );
  };

  // Action Partage avec e.stopPropagation()
  const handleShare = async (e, video) => {
    e.stopPropagation();
    e.preventDefault();

    if (!video) return;

    const shareUrl = `${window.location.origin}/decouvertes?video=${video.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Lien copié dans le presse-papier !', 'Partagez cette vidéo bien-être.');
      } else {
        toast.info('Lien vidéo :', shareUrl);
      }
    } catch {
      toast.info('Lien vidéo :', shareUrl);
    }
  };

  // Action Supprimer Vidéo (Staff Mode)
  const handleDeleteVideo = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    // Optimistic update
    setLocalVideos((prev) => (prev || []).filter((v) => v.id !== id));

    try {
      await mockStore.deleteVideo(id);
      qc.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vidéo supprimée avec succès !');
    } catch (err) {
      console.error('Erreur suppression vidéo:', err);
      toast.error('Erreur lors de la suppression.');
      refetch();
    }
  };

  // Action Supprimer Playlist (Staff Mode)
  const handleDeletePlaylist = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedPlaylist || selectedPlaylist === 'all') return;

    try {
      await mockStore.deletePlaylist(selectedPlaylist);
      setSelectedPlaylist('all');
      refetch();
      toast.success('Playlist supprimée avec succès !');
    } catch (err) {
      console.error('Erreur suppression playlist:', err);
      toast.error('Impossible de supprimer la playlist.');
    }
  };

  // Filtrage sécurisé anti-crash
  const filteredVideos = (localVideos || []).filter((v) => {
    if (!v) return false;
    if (selectedPlaylist !== 'all' && v.playlist !== selectedPlaylist) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-body text-cacao dark:text-sand">
      {/* Onglets Playlists */}
      <div className="flex items-center justify-between gap-2 pb-1 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          {playlists.map((pl) => (
            <button
              key={pl}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSelectedPlaylist(pl);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                selectedPlaylist === pl
                  ? 'bg-gold text-stone-950 font-bold shadow-md'
                  : 'bg-white/60 dark:bg-stone-900/60 hover:bg-white text-cacao/70 dark:text-sand/70'
              }`}
            >
              {pl === 'all' ? 'Toutes les vidéos' : pl}
            </button>
          ))}
        </div>

        {/* Bouton supprimer playlist pour staff */}
        {isStaffMode && selectedPlaylist !== 'all' && (
          <button
            type="button"
            onClick={handleDeletePlaylist}
            className="px-3 py-1.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            title="Supprimer cette playlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer "{selectedPlaylist}"</span>
          </button>
        )}
      </div>

      {/* Grille Vidéos Format TikTok / Short */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {(filteredVideos || []).map((video, idx) => {
          const isLiked = likedVideoIds.includes(video.id);

          return (
            <motion.div
              key={video.id || idx}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedVideoIndex(idx)}
              className="group relative aspect-9/16 rounded-3xl overflow-hidden bg-stone-900 border border-amber-500/20 shadow-lg cursor-pointer"
            >
              {/* Vignette / Vidéo Poster */}
              <AutoMedia
                url={video.thumbnail_url}
                videoUrl={video.video_url}
                poster={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

              {/* Badge Format / Playlist */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-sand border border-white/10 uppercase tracking-wider">
                {video.format === 'short' ? 'Short' : 'Masterclass'}
              </div>

              {/* Icône Play centrale */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Barre d'Actions Latérales (ZÉRO BUG : e.stopPropagation()) */}
              <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3 z-10">
                {/* Like */}
                <button
                  type="button"
                  onClick={(e) => handleLike(e, video)}
                  className={`w-9 h-9 rounded-full flex flex-col items-center justify-center transition active:scale-80 cursor-pointer shadow-lg backdrop-blur-md ${
                    isLiked
                      ? 'bg-rose-600 text-white'
                      : 'bg-black/50 text-white hover:text-rose-400'
                  }`}
                  title="J'aime"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[10px] font-bold text-white shadow-xs">
                  {video.likes || 0}
                </span>

                {/* Share */}
                <button
                  type="button"
                  onClick={(e) => handleShare(e, video)}
                  className="w-9 h-9 rounded-full bg-black/50 hover:bg-gold/80 text-white hover:text-stone-950 flex items-center justify-center transition active:scale-80 cursor-pointer shadow-lg backdrop-blur-md"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Commentaires (si activés) */}
                {(video.commentsEnabled !== false && video.comments_enabled !== false) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveCommentVideo(video);
                    }}
                    className="w-9 h-9 rounded-full bg-black/50 hover:bg-gold/80 text-white hover:text-stone-950 flex items-center justify-center transition active:scale-80 cursor-pointer shadow-lg backdrop-blur-md"
                    title="Commentaires et avis"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}

                {/* Supprimer (Staff) */}
                {isStaffMode && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteVideo(e, video.id)}
                    className="w-9 h-9 rounded-full bg-rose-950/80 hover:bg-rose-600 text-rose-200 flex items-center justify-center transition active:scale-80 cursor-pointer shadow-lg"
                    title="Supprimer la vidéo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Titre et Détails en bas */}
              <div className="absolute bottom-3 left-3 right-14 text-white z-10 space-y-1">
                <h4 className="font-display font-medium text-xs sm:text-sm line-clamp-2 leading-tight">
                  {video.title}
                </h4>
                <p className="text-[10px] text-white/70 line-clamp-1">
                  {video.playlist || video.category}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lecteur Plein Écran TikTok Immersif */}
      {selectedVideoIndex !== null && filteredVideos[selectedVideoIndex] && (
        <ShortsViewer
          videos={filteredVideos}
          initialIndex={selectedVideoIndex}
          onClose={() => setSelectedVideoIndex(null)}
        />
      )}

      {/* Tiroir / Modale des commentaires vidéo */}
      {activeCommentVideo && (
        <VideoCommentsDrawer
          isOpen={Boolean(activeCommentVideo)}
          videoId={activeCommentVideo.id}
          videoTitle={activeCommentVideo.title}
          commentsEnabled={activeCommentVideo.commentsEnabled !== false && activeCommentVideo.comments_enabled !== false}
          onClose={() => setActiveCommentVideo(null)}
        />
      )}
    </div>
  );
}
