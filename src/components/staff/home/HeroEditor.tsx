import { useState, useEffect, useRef } from 'react';
import { useAppSettings } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';
import { Save, Sparkles, Upload, Link as LinkIcon, Image as ImageIcon, Video as VideoIcon, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function HeroEditor() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [form, setForm] = useState({
    hero_eyebrow: '',
    hero_title: '',
    hero_highlight: '',
    hero_subtitle: '',
    hero_media_url: '',
    hero_media_type: 'image' as 'image' | 'video',
  });

  const [saving, setSaving] = useState(false);
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      const mediaUrl = settings.hero_media_url || settings.hero_image_url || '';
      const detectedType =
        settings.hero_media_type ||
        (mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('video'))
          ? 'video'
          : 'image');

      setForm({
        hero_eyebrow: settings.hero_eyebrow || 'Sanctuaire de Bien-être',
        hero_title: settings.hero_title || "L'art du toucher",
        hero_highlight: settings.hero_highlight || settings.hero_title_em || 'qui libère.',
        hero_subtitle:
          settings.hero_subtitle ||
          "Réflexologie plantaire, massages thérapeutiques et soins traditionnels au cœur du Bénin pour restaurer l'harmonie du corps et de l'esprit.",
        hero_media_url: mediaUrl,
        hero_media_type: detectedType as 'image' | 'video',
      });
    }
  }, [
    settings?.hero_eyebrow,
    settings?.hero_title,
    settings?.hero_highlight,
    settings?.hero_title_em,
    settings?.hero_subtitle,
    settings?.hero_media_url,
    settings?.hero_image_url,
    settings?.hero_media_type,
  ]);

  // Détection automatique du type de média lors d'un changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image');
    const isVid = file.type.startsWith('video');

    const determinedType: 'image' | 'video' = isImg ? 'image' : isVid ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((prev) => ({
        ...prev,
        hero_media_url: result,
        hero_media_type: determinedType,
      }));
      toast({
        title: `${determinedType === 'video' ? 'Vidéo' : 'Image'} chargée avec succès`,
        description: `Format : ${file.type} (${(file.size / (1024 * 1024)).toFixed(2)} Mo)`,
        variant: 'default',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    const cleanUrl = url.trim();
    let detectedType: 'image' | 'video' = form.hero_media_type;
    if (cleanUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      detectedType = 'video';
    } else if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)) {
      detectedType = 'image';
    }
    setForm((prev) => ({
      ...prev,
      hero_media_url: cleanUrl,
      hero_media_type: detectedType,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      hero_eyebrow: form.hero_eyebrow,
      hero_title: form.hero_title,
      hero_highlight: form.hero_highlight,
      hero_subtitle: form.hero_subtitle,
      hero_media_url: form.hero_media_url,
      hero_media_type: form.hero_media_type,
    };

    // 1. Sauvegarde locale immédiate (fallback garanti)
    try {
      localStorage.setItem('brm_hero_settings_override', JSON.stringify(payload));
    } catch (storageErr) {
      console.warn('Hero fallback localStorage warning:', storageErr);
    }

    // 2. Sauvegarde Supabase dans app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          hero_eyebrow: payload.hero_eyebrow,
          hero_title: payload.hero_title,
          hero_highlight: payload.hero_highlight,
          hero_subtitle: payload.hero_subtitle,
          hero_media_url: payload.hero_media_url,
          hero_media_type: payload.hero_media_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'a0000000-0000-0000-0000-000000000001')
        .select()
        .single();

      if (error) {
        console.error('Missing hero column:', error.message || error);
        // Si la colonne n'existe pas encore en BDD Supabase, tentative avec fallback ui_customization sans bloquer
        try {
          await supabase
            .from('app_settings')
            .update({
              ui_customization: {
                ...((settings as any)?.ui_customization || {}),
                hero_eyebrow: payload.hero_eyebrow,
                hero_title: payload.hero_title,
                hero_highlight: payload.hero_highlight,
                hero_title_em: payload.hero_highlight,
                hero_subtitle: payload.hero_subtitle,
                hero_media_url: payload.hero_media_url,
                hero_media_type: payload.hero_media_type,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'a0000000-0000-0000-0000-000000000001');
        } catch (uiErr) {
          console.warn('Fallback ui_customization save warning:', uiErr);
        }
      } else {
        console.log('Update app_settings Hero successful:', data);
      }
    } catch (err: any) {
      console.error('Missing hero column:', err?.message || err);
    }

    // 3. Mise à jour Base44 / Store local pour synchronisation interne
    try {
      const list = await base44.entities.AppSettings.list();
      const mainSettings = list[0];
      const base44Payload = {
        hero_eyebrow: payload.hero_eyebrow,
        hero_title: payload.hero_title,
        hero_title_em: payload.hero_highlight,
        hero_highlight: payload.hero_highlight,
        hero_subtitle: payload.hero_subtitle,
        hero_image_url: payload.hero_media_url,
        hero_media_url: payload.hero_media_url,
        hero_media_type: payload.hero_media_type,
      };

      if (mainSettings?.id) {
        await base44.entities.AppSettings.update(mainSettings.id, base44Payload);
      } else {
        await base44.entities.AppSettings.create({
          id: 'settings_default',
          ...base44Payload,
        });
      }
    } catch (base44Err) {
      console.warn('Base44 AppSettings sync warning:', base44Err);
    }

    // 4. Invalider ['app-settings'] et ['settings'] + événement local
    window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'AppSettings' } }));
    qc.invalidateQueries({ queryKey: ['app-settings'] });
    qc.invalidateQueries({ queryKey: ['settings'] });

    // 5. Toast de confirmation
    toast({
      title: 'Bandeau Hero enregistré avec succès !',
      description: 'Les modifications sont appliquées pour tous les visiteurs et clients.',
      variant: 'success',
    });

    setSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="card-soft p-6 sm:p-8 space-y-6 font-body">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-gold" />
          <h4 className="font-display text-xl text-cacao font-medium">
            Personnalisation du Hero (Bandeau d'accueil)
          </h4>
        </div>
        <p className="text-xs text-cacao/60">
          Personnalisez en direct le sur-titre, le titre, le mot or, la description et le média de fond (photo ou vidéo muette en boucle).
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm">
        {/* 1. Sur-titre (hero_eyebrow) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
            Sur-titre (hero_eyebrow)
          </label>
          <input
            type="text"
            value={form.hero_eyebrow}
            onChange={(e) => setForm({ ...form, hero_eyebrow: e.target.value })}
            placeholder="Ex: Sanctuaire de Bien-être"
            className="field"
          />
        </div>

        {/* 2. Titre principal & Mot en or (hero_title & hero_highlight) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Titre principal (hero_title)
            </label>
            <input
              type="text"
              value={form.hero_title}
              onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
              placeholder="Ex: L'art du toucher"
              className="field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Mot mis en valeur — italique or (hero_highlight)
            </label>
            <input
              type="text"
              value={form.hero_highlight}
              onChange={(e) => setForm({ ...form, hero_highlight: e.target.value })}
              placeholder="Ex: qui libère."
              className="field"
            />
          </div>
        </div>

        {/* 3. Sous-titre descriptif (hero_subtitle) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
            Sous-titre descriptif (hero_subtitle)
          </label>
          <textarea
            rows={3}
            value={form.hero_subtitle}
            onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
            placeholder="Description élégante des rituels et soins de bien-être..."
            className="field resize-none leading-relaxed"
          />
        </div>

        {/* 4. Upload Média (hero_media_url & hero_media_type) */}
        <div className="border border-stone-200/80 rounded-2xl p-4 bg-stone-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 block">
              Média d'arrière-plan du Hero (Image ou Vidéo MP4/WebM)
            </label>
            <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setMediaMode('upload')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  mediaMode === 'upload' ? 'bg-white text-cacao shadow-xs' : 'text-cacao/60 hover:text-cacao'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Fichier</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaMode('url')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  mediaMode === 'url' ? 'bg-white text-cacao shadow-xs' : 'text-cacao/60 hover:text-cacao'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Coller URL</span>
              </button>
            </div>
          </div>

          {mediaMode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white transition hover:bg-amber-50/20"
              >
                <Upload className="w-6 h-6 text-amber-600" />
                <span className="text-xs font-medium text-stone-700">
                  Cliquez pour choisir une photo ou une vidéo (MP4, WebM)
                </span>
                <span className="text-[11px] text-stone-400">
                  Détection automatique du format (Image ou Vidéo)
                </span>
              </button>
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={form.hero_media_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/... ou https://.../video.mp4"
                className="field"
              />
            </div>
          )}

          {/* Type sélecteur explicite / ajustement */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-stone-500 font-medium">Type de média détecté :</span>
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, hero_media_type: 'image' })}
                className={`px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                  form.hero_media_type === 'image'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, hero_media_type: 'video' })}
                className={`px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer ${
                  form.hero_media_type === 'video'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>Vidéo (muette en boucle)</span>
              </button>
            </div>
          </div>

          {/* Prévisualisation immédiate */}
          {form.hero_media_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-stone-200 bg-stone-900 relative aspect-video max-h-56 flex items-center justify-center">
              {form.hero_media_type === 'video' ? (
                <video
                  src={form.hero_media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={form.hero_media_url}
                  alt="Aperçu Hero"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-gold" />
                <span>Aperçu immédiat : {form.hero_media_type === 'video' ? 'Vidéo' : 'Image'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer le Hero'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
