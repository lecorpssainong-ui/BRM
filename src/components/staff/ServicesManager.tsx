import { useState, useEffect } from 'react';
import { useMassages, useVideos, useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { mockStore, useMockStore } from '@/lib/mockStore';
import MassageFormDialog from './MassageFormDialog';
import VideoFormDialog from './VideoFormDialog';
import { formatPrice } from '@/lib/format';
import AutoMedia from '@/components/shared/AutoMedia';
import HealingRain from '@/components/video/HealingRain';
import {
  Sparkles,
  Video,
  Pencil,
  Trash2,
  Plus,
  Heart,
  Droplets,
  Flower2,
  Leaf,
  Star,
  Clock,
  Play,
  Check,
  Save,
  ShoppingBag,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { deleteRecordWithConfirm } from '@/lib/deleteHelper';

const AVAILABLE_STICKER_TYPES = [
  { id: 'hearts', label: 'Cœurs d\'Amour & Vitalité', emojis: '❤️ 💖 💕 💓', icon: Heart, color: 'text-rose-500' },
  { id: 'leaves', label: 'Feuilles & Plantes Médicinales', emojis: '🍃 🌿 🌱 🪴 🍀', icon: Leaf, color: 'text-emerald-500' },
  { id: 'water', label: 'Eau Pure & Rafraîchissement', emojis: '💧 🫧 🌊 💦', icon: Droplets, color: 'text-sky-500' },
  { id: 'lotus', label: 'Fleurs de Lotus & Sérénité', emojis: '🪷 🌸 🌺 🌼', icon: Flower2, color: 'text-pink-400' },
  { id: 'stars', label: 'Étoiles & Éclats de Guérison', emojis: '✨ ⭐ 🌟 💫', icon: Star, color: 'text-amber-400' },
];

export default function ServicesManager() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'massages' | 'videos' | 'rain_settings'>('massages');

  // Massage dialog state
  const [massageDialogOpen, setMassageDialogOpen] = useState(false);
  const [editingMassage, setEditingMassage] = useState<any | null>(null);

  // Video dialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);

  const { data: dbMassages = [], refetch: refetchMassages } = useMassages();
  const { data: dbVideos = [], refetch: refetchVideos } = useVideos();
  const { data: settings } = useAppSettings();

  const { data: mockMassages = [] } = useMockStore('services', (store: any) => store.getServices());
  const { data: mockVideos = [] } = useMockStore('videos', (store: any) => store.getVideos());

  const [localMassages, setLocalMassages] = useState<any[]>([]);
  const [localVideos, setLocalVideos] = useState<any[]>([]);

  // Healing Rain Staff Settings
  const [selectedStickers, setSelectedStickers] = useState<string[]>([
    'hearts',
    'leaves',
    'water',
    'lotus',
    'stars',
  ]);
  const [rainDuration, setRainDuration] = useState<number>(5);
  const [testRainTrigger, setTestRainTrigger] = useState<number>(0);
  const [savingRainSettings, setSavingRainSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      if (Array.isArray(settings.healing_rain_stickers) && settings.healing_rain_stickers.length > 0) {
        setSelectedStickers(settings.healing_rain_stickers);
      }
      if (settings.healing_rain_duration) {
        setRainDuration(settings.healing_rain_duration);
      }
    }
  }, [settings]);

  // Hybrid merge without duplicate IDs
  useEffect(() => {
    const mMap = new Map<string, any>();
    (mockMassages || []).forEach((m: any) => {
      if (m?.id) mMap.set(m.id, m);
    });
    (dbMassages || []).forEach((m: any) => {
      if (m?.id) mMap.set(m.id, m);
    });
    setLocalMassages(Array.from(mMap.values()));
  }, [dbMassages, mockMassages]);

  useEffect(() => {
    const vMap = new Map<string, any>();
    (mockVideos || []).forEach((v: any) => {
      if (v?.id) vMap.set(v.id, v);
    });
    (dbVideos || []).forEach((v: any) => {
      if (v?.id) vMap.set(v.id, v);
    });
    setLocalVideos(Array.from(vMap.values()));
  }, [dbVideos, mockVideos]);

  const handleOpenCreateMassage = () => {
    setEditingMassage(null);
    setMassageDialogOpen(true);
  };

  const handleOpenEditMassage = (massage: any) => {
    setEditingMassage(massage);
    setMassageDialogOpen(true);
  };

  const handleSaveMassage = async (data: any, isEdit: boolean) => {
    try {
      // 1. Colonnes Supabase officielles STRICTES : title, description, price, duration, image_url
      // Pas de category, video_url, is_active, ni display_order
      const sbService = {
        title: (data.title || data.name || 'Nouveau soin').trim(),
        description: data.description ? String(data.description).trim() : '',
        price: Number(data.price) || 0,
        duration: String(data.duration_min || data.duration || '60'),
        image_url: data.image_url ? String(data.image_url).trim() : '',
      };

      let savedRecord: any = null;

      if (isEdit && data.id) {
        const { data: updated, error: updateError } = await supabase
          .from('services')
          .update(sbService)
          .eq('id', data.id)
          .select()
          .single();

        console.log('Update service:', { data: updated, error: updateError });
        if (updateError) {
          console.error('Erreur Supabase update service:', updateError);
          if (navigator.onLine) {
            throw updateError;
          }
        }
        savedRecord = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('services')
          .insert(sbService)
          .select()
          .single();

        console.log('Insert service:', { data: inserted, error: insertError });
        if (insertError) {
          console.error('Erreur Supabase insert service:', insertError);
          if (navigator.onLine) {
            throw insertError;
          }
        }
        savedRecord = inserted;
      }

      const finalId = savedRecord?.id || data.id || crypto.randomUUID();
      const payload = {
        ...data,
        id: finalId,
        title: sbService.title,
        name: sbService.title,
        price: sbService.price,
        duration: sbService.duration,
        image_url: sbService.image_url,
      };

      // Miroir local Base44 & mockStore pour synchronisation instantanée du composant
      try {
        if (isEdit && data.id) {
          await base44.entities.MassageType.update(data.id, payload);
        } else {
          await base44.entities.MassageType.create(payload);
        }
        await mockStore.saveService(payload);
      } catch (localErr) {
        console.warn('[ServicesManager] Miroir local:', localErr);
      }

      // Synchronisation des capsules vidéos associées
      const massageVideos: any[] = Array.isArray(data.videos) ? data.videos : [];
      for (const vid of massageVideos) {
        if (vid.visibility === 'both') {
          const videoPayload = {
            id: vid.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: vid.title,
            video_url: vid.video_url,
            thumbnail_url: vid.thumbnail_url || '',
            description: vid.description || '',
            playlist: 'Soins & Massages',
            format: 'short',
            massage_id: finalId,
            massage_name: payload.name,
            action_booking: true,
            action_chat: true,
            commentsEnabled: vid.commentsEnabled !== false,
            comments_enabled: vid.commentsEnabled !== false,
          };

          try {
            const existing = await base44.entities.Video.get(vid.id);
            if (existing) {
              await base44.entities.Video.update(vid.id, videoPayload);
            } else {
              await base44.entities.Video.create(videoPayload);
            }
          } catch {
            await base44.entities.Video.create(videoPayload);
          }
          await mockStore.saveVideo(videoPayload);
        } else if (vid.visibility === 'sheet_only') {
          try {
            await base44.entities.Video.delete(vid.id);
            await mockStore.deleteVideo(vid.id);
          } catch {}
        }
      }

      qc.invalidateQueries({ queryKey: ['massages'] });
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
      refetchMassages();
      refetchVideos();

      toast({
        title: isEdit ? 'Soin mis à jour dans Supabase !' : 'Nouveau soin créé dans Supabase !',
        variant: 'success',
      });
      setMassageDialogOpen(false);
    } catch (err: any) {
      console.error('[ServicesManager] Save massage error:', err);
      toast({
        title: "Erreur d'enregistrement Supabase",
        description: err?.message || "Impossible d'enregistrer le soin dans la base de données.",
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMassage = async (id: string) => {
    try {
      const { data, error } = await supabase.from('services').delete().eq('id', id);
      console.log('Delete service:', { data, error });
      if (error) {
        console.error('Erreur Supabase delete service:', error);
        if (navigator.onLine) {
          throw error;
        }
      }
    } catch (err: any) {
      if (navigator.onLine) {
        toast({
          title: 'Erreur de suppression Supabase',
          description: err?.message || 'Impossible de supprimer le soin dans Supabase.',
          variant: 'destructive',
        });
        return;
      }
    }
    await deleteRecordWithConfirm(id, {
      tableName: 'services',
      base44Entity: 'MassageType',
      successMessage: 'Soin retiré du catalogue.',
    });
    await mockStore.deleteService(id);
    qc.invalidateQueries({ queryKey: ['massages'] });
    qc.invalidateQueries({ queryKey: ['services'] });
    refetchMassages();
  };

  const handleOpenCreateVideo = () => {
    setEditingVideo(null);
    setVideoDialogOpen(true);
  };

  const handleOpenEditVideo = (video: any) => {
    setEditingVideo(video);
    setVideoDialogOpen(true);
  };

  const handleQuickReuploadVideo = async (video: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const cleanName = file.name.replace(/\s+/g, '_');
      const filePath = `videos/${Date.now()}-${cleanName}`;

      toast({
        title: 'Téléversement en cours...',
        description: `Téléversement de "${file.name}" vers Supabase Storage...`,
      });

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('media')
        .upload(filePath, file, { contentType: file.type || 'video/mp4', upsert: false });

      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        throw uploadErr;
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { error: updateErr } = await supabase
        .from('media')
        .update({ video_url: publicUrl })
        .eq('id', video.id);

      if (updateErr) {
        console.error('Update Supabase media error:', updateErr);
        throw updateErr;
      }

      try {
        await base44.entities.Video.update(video.id, { ...video, video_url: publicUrl });
        await mockStore.saveVideo({ ...video, video_url: publicUrl });
      } catch (mirrorErr) {
        console.warn('Miroir local error:', mirrorErr);
      }

      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
      refetchVideos();

      toast({
        title: 'Vidéo migrée avec succès !',
        description: 'La vidéo est maintenant stockée sur Supabase Storage.',
        variant: 'success',
      });
    } catch (err: any) {
      console.error('[ServicesManager] Quick reupload error:', err);
      toast({
        title: 'Échec du téléversement',
        description: err?.message || 'Impossible de migrer la vidéo vers Supabase Storage.',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveVideo = async (data: any) => {
    try {
      let videoUrl = String(data.video_url || '').trim();
      let thumbnailUrl = data.thumbnail_url ? String(data.thumbnail_url).trim() : '';

      if (data.video_file instanceof File) {
        const cleanName = data.video_file.name.replace(/\s+/g, '_');
        const filePath = `videos/${Date.now()}-${cleanName}`;
        const { error: uploadErr } = await supabase.storage
          .from('media')
          .upload(filePath, data.video_file, { contentType: data.video_file.type || 'video/mp4', upsert: false });
        if (uploadErr) {
          console.error('[Supabase Storage] Upload error:', uploadErr);
          throw uploadErr;
        }
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        videoUrl = urlData.publicUrl;
      }

      if (data.thumbnail_file instanceof File) {
        const cleanName = data.thumbnail_file.name.replace(/\s+/g, '_');
        const filePath = `images/${Date.now()}-${cleanName}`;
        const { error: thumbErr } = await supabase.storage
          .from('media')
          .upload(filePath, data.thumbnail_file, { contentType: data.thumbnail_file.type || 'image/webp', upsert: false });
        if (!thumbErr) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
          thumbnailUrl = urlData.publicUrl;
        }
      }

      const sbMedia = {
        title: (data.title || 'Capsule vidéo').trim(),
        description: data.description ? String(data.description).trim() : '',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        playlist: data.playlist ? String(data.playlist).trim() : 'Soins & Massages',
        massage_name: data.massage_name ? String(data.massage_name).trim() : null,
      };

      let savedRecord: any = null;

      if (editingVideo && editingVideo.id) {
        const { data: updated, error: updateError } = await supabase
          .from('media')
          .update(sbMedia)
          .eq('id', editingVideo.id)
          .select()
          .single();

        console.log('Update video:', { data: updated, error: updateError });
        if (updateError) {
          console.error('Erreur Supabase update video:', updateError);
          if (navigator.onLine) {
            throw updateError;
          }
        }
        savedRecord = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('media')
          .insert(sbMedia)
          .select()
          .single();

        console.log('Insert video:', { data: inserted, error: insertError });
        if (insertError) {
          console.error('Erreur Supabase insert video:', insertError);
          if (navigator.onLine) {
            throw insertError;
          }
        }
        savedRecord = inserted;
      }

      const finalId = savedRecord?.id || editingVideo?.id || crypto.randomUUID();
      const payload = {
        ...data,
        id: finalId,
        title: sbMedia.title,
        video_url: sbMedia.video_url,
        thumbnail_url: sbMedia.thumbnail_url,
        description: sbMedia.description,
        playlist: sbMedia.playlist,
        massage_name: sbMedia.massage_name,
      };

      try {
        if (editingVideo && editingVideo.id) {
          await base44.entities.Video.update(editingVideo.id, payload);
          await mockStore.saveVideo(payload);
        } else {
          await base44.entities.Video.create(payload);
          await mockStore.saveVideo(payload);
        }
      } catch (localErr) {
        console.warn('[ServicesManager] Miroir local video:', localErr);
      }

      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
      refetchVideos();

      toast({
        title: editingVideo ? 'Vidéo mise à jour dans Supabase !' : 'Nouvelle vidéo publiée dans Supabase !',
        variant: 'success',
      });
      setVideoDialogOpen(false);
    } catch (err: any) {
      console.error('[ServicesManager] Save video error:', err);
      toast({
        title: "Erreur d'enregistrement Supabase",
        description: err?.message || "Impossible d'enregistrer la vidéo dans la base de données.",
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { data, error } = await supabase.from('media').delete().eq('id', id);
      console.log('Delete video:', { data, error });
      if (error) {
        console.error('Erreur Supabase delete video:', error);
        if (navigator.onLine) {
          throw error;
        }
      }
    } catch (err: any) {
      if (navigator.onLine) {
        toast({
          title: 'Erreur de suppression Supabase',
          description: err?.message || 'Impossible de supprimer la vidéo dans Supabase.',
          variant: 'destructive',
        });
        return;
      }
    }

    const success = await deleteRecordWithConfirm(id, {
      tableName: 'media',
      base44Entity: 'Video',
      successMessage: 'Vidéo supprimée de la galerie.',
    });
    if (success) {
      await mockStore.deleteVideo(id);
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['videos'] });
      refetchVideos();
    }
  };

  const toggleSticker = (id: string) => {
    setSelectedStickers((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((s) => s !== id) : prev) : [...prev, id]
    );
  };

  const handleSaveRainSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRainSettings(true);
    try {
      const payload = {
        healing_rain_stickers: selectedStickers,
        healing_rain_duration: Number(rainDuration),
      };

      try {
        await base44.entities.AppSettings.update('settings_default', payload);
      } catch {}
      await (mockStore as any).saveAppSettings(payload);

      qc.invalidateQueries({ queryKey: ['app_settings'] });
      toast({
        title: 'Animation enregistrée !',
        description: `La pluie de guérison dure désormais ${rainDuration}s avec les stickers choisis.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de sauvegarder.',
        variant: 'destructive',
      });
    } finally {
      setSavingRainSettings(false);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Live test rain overlay */}
      <HealingRain
        triggerKey={testRainTrigger}
        duration={rainDuration}
        stickers={selectedStickers}
      />

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cacao/10 dark:border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab('massages')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            tab === 'massages'
              ? 'bg-cacao text-sand shadow-sm'
              : 'text-cacao/70 dark:text-sand/70 hover:bg-cacao/5 dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span>Soins & Massages ({localMassages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('videos')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            tab === 'videos'
              ? 'bg-gold text-stone-950 font-black shadow-sm'
              : 'text-cacao/70 dark:text-sand/70 hover:bg-cacao/5 dark:hover:bg-white/5'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Vidéos & Capsules ({localVideos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('rain_settings')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            tab === 'rain_settings'
              ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black shadow-md'
              : 'text-cacao/70 dark:text-sand/70 hover:bg-cacao/5 dark:hover:bg-white/5'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span>Animation « À ma santé » (Stickers & Pluie)</span>
        </button>
      </div>

      {tab === 'massages' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
                Gestion des Soins & Massages
              </h3>
              <p className="text-xs text-cacao/60 dark:text-sand/60 mt-0.5 font-body">
                Gérez vos prestations, tarifs, remises et associez des capsules vidéos style TikTok à chaque soin.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateMassage}
              className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un soin</span>
            </button>
          </div>

          {localMassages.length === 0 ? (
            <div className="card-soft p-10 text-center text-xs text-cacao/60">
              Aucun soin enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {localMassages.map((massage: any, idx: number) => {
                const videoCount = Array.isArray(massage.videos) ? massage.videos.length : 0;

                return (
                  <div
                    key={massage.id ? `${massage.id}-${idx}` : `s-${idx}`}
                    className="card-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body border border-cacao/10 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-cacao/10">
                        <AutoMedia
                          url={massage.image_url}
                          alt={massage.name}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-medium text-base sm:text-lg text-cacao dark:text-sand truncate">
                            {massage.name}
                          </h4>

                          {videoCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30 inline-flex items-center gap-1">
                              <Video className="w-3 h-3 text-gold" />
                              <span>{videoCount} capsule{videoCount > 1 ? 's' : ''}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-cacao/60 dark:text-sand/60">
                          <span>{massage.duration_min || 60} min</span>
                          <span>•</span>
                          <span className="font-bold text-gold">{formatPrice(massage.price)}</span>
                          {Number(massage.bulk_discount_percent) > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                              -{massage.bulk_discount_percent}% dès {massage.bulk_min_qty || 10} séances
                            </span>
                          )}
                        </div>

                        {massage.tagline && (
                          <p className="text-xs text-cacao/70 dark:text-sand/70 line-clamp-1 italic">
                            « {massage.tagline} »
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMassage(massage)}
                        className="p-2 rounded-xl text-cacao/70 hover:text-cacao hover:bg-cacao/10 transition cursor-pointer"
                        title="Modifier le soin & ses vidéos"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMassage(massage.id);
                        }}
                        className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Supprimer le soin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Massage Form Dialog avec gestion des vidéos capsules */}
          <MassageFormDialog
            isOpen={massageDialogOpen}
            initialData={editingMassage}
            onClose={() => setMassageDialogOpen(false)}
            onSave={handleSaveMassage}
          />
        </div>
      ) : tab === 'videos' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
                Médiathèque Vidéos & Capsules TikTok
              </h3>
              <p className="text-xs text-cacao/60 dark:text-sand/60 mt-0.5 font-body">
                Gérez les capsules TikTok et tutoriels avec sélecteurs de soins et boutons de raccourcis.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateVideo}
              className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une vidéo</span>
            </button>
          </div>

          {(() => {
            const outdatedVideos = localVideos.filter(
              (v: any) => v.video_url && typeof v.video_url === 'string' && v.video_url.startsWith('idb://')
            );
            if (outdatedVideos.length === 0) return null;
            return (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">
                    ⚠️ Migration requise : {outdatedVideos.length} vidéo(s) au format local (IndexedDB)
                  </p>
                  <p className="opacity-90">
                    Ces vidéos ne sont visibles que sur l'appareil où elles ont été téléversées. Cliquez sur le bouton « Re-uploader » pour les enregistrer de manière permanente et publique sur Supabase Storage.
                  </p>
                </div>
              </div>
            );
          })()}

          {localVideos.length === 0 ? (
            <div className="card-soft p-10 text-center text-xs text-cacao/60">
              Aucune vidéo enregistrée pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {localVideos.map((video: any, idx: number) => (
                <div
                  key={video.id ? `${video.id}-${idx}` : `vid-${idx}`}
                  className="card-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body border border-cacao/10 dark:border-white/10"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-14 rounded-xl overflow-hidden bg-stone-900 shrink-0 relative border border-cacao/10">
                      <AutoMedia
                        url={video.thumbnail_url || video.video_url}
                        alt=""
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        fallbackIcon={<Video className="w-5 h-5 text-white/40" />}
                      />
                      {video.format === 'short' && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] text-white font-mono pointer-events-none">
                          9:16
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-medium text-base text-cacao dark:text-sand truncate">
                          {video.title}
                        </h4>
                        {video.playlist && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                            {video.playlist}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-cacao/60 dark:text-sand/60">
                        {video.massage_name && (
                          <span className="inline-flex items-center gap-1 text-gold font-semibold">
                            <Sparkles className="w-3 h-3" />
                            <span>Soin : {video.massage_name}</span>
                          </span>
                        )}
                        {video.product_name && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <ShoppingBag className="w-3 h-3" />
                            <span>Produit : {video.product_name}</span>
                          </span>
                        )}
                        {video.views !== undefined && <span>• {video.views} vues</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                    {video.video_url && typeof video.video_url === 'string' && video.video_url.startsWith('idb://') && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>⚠️ À re-uploader</span>
                        </span>
                        <label
                          className="px-3 py-1.5 rounded-xl bg-gold text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-gold/90 transition shadow-xs cursor-pointer"
                          title="Re-uploader ce fichier vidéo vers Supabase Storage"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Re-uploader</span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => handleQuickReuploadVideo(video, e)}
                          />
                        </label>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEditVideo(video)}
                      className="p-2 rounded-xl text-cacao/70 hover:text-cacao hover:bg-cacao/10 transition cursor-pointer"
                      title="Modifier la vidéo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVideo(video.id);
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Supprimer la vidéo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Video Form Dialog */}
          <VideoFormDialog
            isOpen={videoDialogOpen}
            initialData={editingVideo}
            onClose={() => setVideoDialogOpen(false)}
            onSave={handleSaveVideo}
          />
        </div>
      ) : (
        /* TAB 3: ANIMATION PLUIE DE GUÉRISON CONFIGURATION */
        <div className="space-y-6">
          <div className="card-soft p-5 sm:p-7 border border-cacao/10 dark:border-white/10 space-y-6 bg-white/70 dark:bg-stone-900/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="font-display font-medium text-xl sm:text-2xl text-cacao dark:text-sand">
                  Configuration de la Pluie de Guérison (« À ma santé »)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-cacao/70 dark:text-sand/70 max-w-2xl">
                Personnalisez les particules et stickers qui tombent en cascade sur l'écran du client lorsqu'il clique sur le bouton « À ma santé » dans le lecteur TikTok.
              </p>
            </div>

            <form onSubmit={handleSaveRainSettings} className="space-y-6">
              {/* 1. Sélection des stickers */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand block">
                  1. Types de stickers animés autorisés
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_STICKER_TYPES.map((st) => {
                    const isChecked = selectedStickers.includes(st.id);
                    const Icon = st.icon;

                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleSticker(st.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'bg-amber-500/10 border-gold shadow-xs dark:bg-amber-500/20'
                            : 'bg-white/50 dark:bg-stone-800/50 border-cacao/10 dark:border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl bg-black/5 dark:bg-white/5 ${st.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-cacao dark:text-sand">
                              {st.label}
                            </h5>
                            <span className="text-sm">{st.emojis}</span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                            isChecked ? 'bg-gold text-stone-950 font-bold' : 'border border-cacao/30'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Durée de la pluie en secondes */}
              <div className="space-y-3 p-4 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 dark:border-white/10">
                <label className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand block flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>2. Durée de l'animation sur l'écran</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {[3, 5, 8, 10].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setRainDuration(dur)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                        rainDuration === dur
                          ? 'bg-gold text-stone-950 border-gold shadow-md font-black'
                          : 'bg-white dark:bg-stone-900 text-cacao/70 dark:text-sand/70 border-cacao/15'
                      }`}
                    >
                      {dur} secondes {dur === 5 ? '(Recommandé)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTestRainTrigger((prev) => prev + 1)}
                  className="btn-soft py-2.5 px-4 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition"
                >
                  <Play className="w-4 h-4 text-gold fill-current" />
                  <span>Tester la pluie de guérison en direct ({rainDuration}s)</span>
                </button>

                <button
                  type="submit"
                  disabled={savingRainSettings}
                  className="btn-gold py-2.5 px-6 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingRainSettings ? 'Enregistrement...' : 'Enregistrer les réglages'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
