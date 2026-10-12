import { useState, useMemo } from 'react';
import { ListVideo, Play, Sparkles, Clock, Film, Trash2, FolderPlus } from 'lucide-react';
import SegmentedTabs, { TabItem } from '@/components/shared/SegmentedTabs';
import ShortsViewer from '@/components/video/ShortsViewer';
import { useAuth } from '@/lib/AuthContext';
import { mockStore } from '@/lib/mockStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import AutoMedia from '@/components/shared/AutoMedia';

interface PlaylistsProps {
  videos: any[];
}

export default function Playlists({ videos }: PlaylistsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isStaff = user && ['admin', 'moderator', 'secretary'].includes(user.role);

  const [selectedPlaylistVideo, setSelectedPlaylistVideo] = useState<{
    list: any[];
    index: number;
  } | null>(null);

  // Group videos by playlist
  const playlistsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    (videos || []).forEach((v) => {
      const pl = (v.playlist && v.playlist.trim()) || 'Général & Conseils';
      if (!map[pl]) map[pl] = [];
      map[pl].push(v);
    });
    return map;
  }, [videos]);

  const playlistNames = Object.keys(playlistsMap);
  const [activeTab, setActiveTab] = useState<string>('all');

  const tabs: TabItem[] = useMemo(() => {
    return [
      { value: 'all', label: 'Toutes les séries', icon: ListVideo },
      ...playlistNames.map((name) => ({
        value: name,
        label: `${name} (${playlistsMap[name]?.length || 0})`,
        icon: Film,
      })),
    ];
  }, [playlistNames, playlistsMap]);

  const displayedPlaylists = activeTab === 'all'
    ? playlistNames
    : playlistNames.filter((name) => name === activeTab);

  const handleDeletePlaylist = async (name: string) => {
    if (!window.confirm(`Voulez-vous dissocier la playlist "${name}" ? Les vidéos seront conservées dans le flux général.`)) {
      return;
    }
    try {
      await mockStore.deletePlaylist(name);
      qc.invalidateQueries({ queryKey: ['videos'] });
      setActiveTab('all');
      toast({ title: 'Playlist supprimée', variant: 'default' });
    } catch {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
    }
  };

  if (playlistNames.length === 0) {
    return (
      <div className="card-soft p-12 text-center max-w-md mx-auto my-6 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-gold flex items-center justify-center mx-auto">
          <ListVideo className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h4 className="font-display text-xl text-stone-900 dark:text-sand font-medium">
          Aucun sous-Tab / Playlist créée
        </h4>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          Les séries thématiques et masterclass organisées en sous-Tabs apparaîtront ici dès leur création.
        </p>
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '1:30';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 font-body">
      {/* Category Sub-Tabs */}
      <div className="pb-1">
        <SegmentedTabs
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
          id="playlists-tabs"
        />
      </div>

      {/* Vertical List of Playlists */}
      <div className="space-y-10">
        {displayedPlaylists.map((name) => {
          const list = playlistsMap[name] || [];
          const totalDurationSec = list.reduce((acc, v) => acc + (v.duration || 120), 0);
          const totalMinutes = Math.round(totalDurationSec / 60);

          return (
            <div key={name} className="space-y-4">
              {/* Playlist Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 text-gold">
                    <ListVideo className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl text-stone-900 dark:text-sand font-medium">
                      {name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                      <span>{list.length} vidéo{list.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>~{totalMinutes} min de visionnage</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => handleDeletePlaylist(name)}
                      className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                      title="Supprimer cette playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer playlist</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPlaylistVideo({ list, index: 0 })}
                    className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tout regarder ({list.length})</span>
                  </button>
                </div>
              </div>

              {/* Grid of Video Thumbnails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((video, idx) => (
                  <div
                    key={video.id || idx}
                    onClick={() => setSelectedPlaylistVideo({ list, index: idx })}
                    className="card-soft overflow-hidden group cursor-pointer p-0 hover:shadow-lg transition-all duration-300 flex flex-col border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
                  >
                    {/* Thumbnail banner with duration badge */}
                    <div className="relative aspect-video w-full bg-stone-900 overflow-hidden">
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
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Tag */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-300" />
                        <span>{formatDuration(video.duration)}</span>
                      </div>

                      {/* Format Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-amber-200 text-[10px] font-bold uppercase tracking-wider">
                        {video.format === 'long' ? 'Masterclass' : 'Capsule Short'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-display font-medium text-base text-stone-900 dark:text-sand leading-snug group-hover:text-gold transition line-clamp-2">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {video.massage_name && (
                        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <Sparkles className="w-3 h-3 text-gold shrink-0" />
                          <span className="truncate">{video.massage_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Video Player */}
      {selectedPlaylistVideo && (
        <ShortsViewer
          videos={selectedPlaylistVideo.list}
          initialIndex={selectedPlaylistVideo.index}
          onClose={() => setSelectedPlaylistVideo(null)}
        />
      )}
    </div>
  );
}
