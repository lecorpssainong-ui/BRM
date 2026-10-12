import { useState, useEffect, FormEvent } from 'react';
import { useMassages, useProducts, useAppSettings, useVideos } from '@/lib/queries';
import { formatPrice } from '@/lib/format';
import MediaUploader from '@/components/MediaUploader';
import {
  X,
  Save,
  Video,
  Sparkles,
  ShoppingBag,
  CalendarHeart,
  MessageCircle,
  MessageSquare,
  CheckSquare,
  Square,
  FolderPlus,
  ListVideo,
  Plus,
} from 'lucide-react';

interface VideoFormDialogProps {
  isOpen: boolean;
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function VideoFormDialog({
  isOpen,
  initialData,
  onClose,
  onSave,
}: VideoFormDialogProps) {
  const { data: massages = [] } = useMassages();
  const { data: products = [] } = useProducts();
  const { data: settings } = useAppSettings();
  const { data: allVideos = [] } = useVideos();

  // Liste des playlists uniques existantes
  const existingPlaylists = Array.from(
    new Set((allVideos || []).map((v: any) => v.playlist && v.playlist.trim()).filter(Boolean))
  ) as string[];

  const [isCreatingNewPlaylist, setIsCreatingNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const defaultPhone =
    settings?.whatsapp?.replace(/[^0-9]/g, '') ||
    settings?.center_phone?.replace(/[^0-9]/g, '') ||
    settings?.momo_number ||
    '22997000000';

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    playlist: '',
    format: 'short',
    massage_id: '',
    massage_name: '',
    product_id: '',
    product_name: '',
    whatsapp_number: '',
    action_booking: true,
    action_whatsapp: true,
    action_chat: true,
    action_shop: true,
    commentsEnabled: true,
    comments_enabled: true,
  });

  const [saving, setSaving] = useState(false);
  const [enableCoverImage, setEnableCoverImage] = useState<boolean>(false);
  const [extractedThumbUrl, setExtractedThumbUrl] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      const hasThumb = Boolean(initialData.thumbnail_url && initialData.thumbnail_url.trim());
      setEnableCoverImage(hasThumb);
      setExtractedThumbUrl('');
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        video_url: initialData.video_url || '',
        thumbnail_url: initialData.thumbnail_url || '',
        playlist: initialData.playlist || '',
        format: initialData.format || 'short',
        massage_id: initialData.massage_id || '',
        massage_name: initialData.massage_name || '',
        product_id: initialData.product_id || '',
        product_name: initialData.product_name || '',
        whatsapp_number: initialData.whatsapp_number || defaultPhone || '',
        action_booking: initialData.action_booking !== false,
        action_whatsapp: initialData.action_whatsapp !== false,
        action_chat: initialData.action_chat !== false,
        action_shop: initialData.action_shop !== false,
        commentsEnabled: initialData.commentsEnabled !== false && initialData.comments_enabled !== false,
        comments_enabled: initialData.commentsEnabled !== false && initialData.comments_enabled !== false,
      });
    } else {
      setEnableCoverImage(false);
      setExtractedThumbUrl('');
      setFormData({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        playlist: '',
        format: 'short',
        massage_id: '',
        massage_name: '',
        product_id: '',
        product_name: '',
        whatsapp_number: defaultPhone,
        action_booking: true,
        action_whatsapp: true,
        action_chat: true,
        action_shop: true,
        commentsEnabled: true,
        comments_enabled: true,
      });
    }
  }, [initialData, isOpen, defaultPhone]);

  if (!isOpen) return null;

  const handleMassageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    if (!selectedName) {
      setFormData((prev: any) => ({
        ...prev,
        massage_name: '',
        massage_id: '',
      }));
    } else {
      const found = massages.find((m: any) => m.name === selectedName);
      setFormData((prev: any) => ({
        ...prev,
        massage_name: selectedName,
        massage_id: found ? found.id : '',
        action_booking: true,
      }));
    }
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    if (!selectedName) {
      setFormData((prev: any) => ({
        ...prev,
        product_name: '',
        product_id: '',
      }));
    } else {
      const found = products.find((p: any) => p.name === selectedName);
      setFormData((prev: any) => ({
        ...prev,
        product_name: selectedName,
        product_id: found ? found.id : '',
        action_shop: true,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cacao text-sand">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-cacao font-medium">
                {initialData ? 'Modifier la vidéo' : 'Créer une vidéo capsule (TikTok / Reels)'}
              </h3>
              <p className="text-xs text-cacao/60 font-body">
                Associez dynamiquement un soin, un produit et activez des actions rapides.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-cacao/60 hover:text-cacao hover:bg-cacao/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 font-body">
          {/* Section 1: Informations principales */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-white/60 border border-cacao/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-gold" />
              <span>1. Contenu de la vidéo</span>
            </h4>

            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Titre de la vidéo <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Auto-massage express des trapèzes en 3 min"
                className="field text-xs sm:text-sm py-2.5"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Description / Conseils
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explications des bienfaits et étapes du geste..."
                className="field text-xs sm:text-sm py-2 resize-none"
              />
            </div>

            <div className="space-y-4 pt-1">
              <MediaUploader
                label="Fichier Vidéo Capsule (MP4, WebM, MOV)"
                mediaType="video"
                accept="video/*"
                required={true}
                value={formData.video_url}
                onChange={(url: string) => setFormData((prev: any) => ({ ...prev, video_url: url }))}
                onThumbnailGenerated={(thumb: string) => {
                  setExtractedThumbUrl(thumb);
                }}
                hint="Choisissez un fichier vidéo (.mp4, .webm) depuis votre appareil."
              />

              {/* Toggle Couverture Fixe */}
              <div className="p-3.5 rounded-2xl border border-cacao/15 bg-white/70 dark:bg-stone-800/80 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-cacao dark:text-sand block">
                      Image de couverture fixe (Vignette / Poster)
                    </span>
                    <span className="text-[11px] text-cacao/65 dark:text-sand/65 block">
                      {enableCoverImage
                        ? 'Une photo statique sera affichée avant le clic sur lecture.'
                        : '🎬 Sans couverture fixe : la vidéo jouera directement en Autoplay muet dans les cartes.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableCoverImage}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setEnableCoverImage(enabled);
                      if (!enabled) {
                        setFormData((prev: any) => ({ ...prev, thumbnail_url: '' }));
                      } else if (extractedThumbUrl && !formData.thumbnail_url) {
                        setFormData((prev: any) => ({ ...prev, thumbnail_url: extractedThumbUrl }));
                      }
                    }}
                    className="w-4 h-4 rounded border-cacao/30 text-gold focus:ring-gold accent-gold cursor-pointer"
                  />
                </label>

                {enableCoverImage && (
                  <div className="pt-2 border-t border-cacao/10 space-y-2">
                    {extractedThumbUrl && formData.thumbnail_url !== extractedThumbUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, thumbnail_url: extractedThumbUrl }))}
                        className="py-1 px-2.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-amber-900 dark:text-amber-200 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer border border-gold/30"
                      >
                        <Sparkles className="w-3 h-3 text-gold" />
                        <span>🪄 Appliquer la miniature YouTube / Média détectée</span>
                      </button>
                    )}

                    <MediaUploader
                      label="Photo de Couverture / Poster (9:16)"
                      mediaType="image"
                      accept="image/*"
                      value={formData.thumbnail_url}
                      onChange={(url: string) => setFormData((prev: any) => ({ ...prev, thumbnail_url: url }))}
                      hint="Téléversez une photo personnalisée depuis votre appareil."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ListVideo className="w-3.5 h-3.5 text-gold" />
                    <span>Groupe / Sous-Tab Playlist</span>
                  </span>
                  {!isCreatingNewPlaylist && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewPlaylist(true);
                        setFormData((prev: any) => ({ ...prev, playlist: '' }));
                      }}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nouveau sous-Tab</span>
                    </button>
                  )}
                </label>

                {isCreatingNewPlaylist ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={formData.playlist || ''}
                      onChange={(e) => setFormData({ ...formData, playlist: e.target.value })}
                      placeholder="Nom du nouveau sous-Tab (ex: Sommeil Profond)..."
                      className="field text-xs sm:text-sm py-2.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewPlaylist(false)}
                      className="px-2.5 py-2.5 rounded-xl bg-cacao/10 text-cacao text-xs font-bold hover:bg-cacao/20 transition cursor-pointer"
                    >
                      Liste
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.playlist || ''}
                    onChange={(e) => {
                      if (e.target.value === '__NEW_PLAYLIST__') {
                        setIsCreatingNewPlaylist(true);
                        setFormData((prev: any) => ({ ...prev, playlist: '' }));
                      } else {
                        setFormData((prev: any) => ({ ...prev, playlist: e.target.value }));
                      }
                    }}
                    className="field text-xs sm:text-sm py-2.5 cursor-pointer bg-white"
                  >
                    <option value="">-- Sans Playlist (Capsule unique) --</option>
                    {existingPlaylists.map((pl) => (
                      <option key={pl} value={pl}>
                        📁 {pl}
                      </option>
                    ))}
                    <option value="__NEW_PLAYLIST__">➕ Créer un nouveau sous-Tab / Playlist...</option>
                  </select>
                )}
                <p className="text-[10px] text-cacao/60 mt-1">
                  Permet de classer cette vidéo dans un sous-Tab thématique ordonné.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Format de diffusion
                </label>
                <select
                  value={formData.format || 'short'}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="field text-xs sm:text-sm py-2.5 cursor-pointer bg-white"
                >
                  <option value="short">Capsule Courte (Fil TikTok / Plein écran vertical 9:16)</option>
                  <option value="long">Format Long (Playlist Tutoriels & Masterclass)</option>
                </select>
                <p className="text-[10px] text-cacao/60 mt-1">
                  Définit si la vidéo est une capsule dynamique ou un cours complet.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Liaisons dynamiques (Soin & Produit) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-white/60 border border-cacao/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>2. Liaisons Catalogue (Sélecteurs dynamiques)</span>
            </h4>

            {/* Select Soin / Massage */}
            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Soin & Réflexologie associé (MassageType)
              </label>
              <select
                value={formData.massage_name || ''}
                onChange={handleMassageSelect}
                className="field text-xs sm:text-sm py-2.5 cursor-pointer bg-white"
              >
                <option value="">-- Aucun soin associé --</option>
                {massages.map((m: any) => (
                  <option key={m.id} value={m.name}>
                    {m.name} — {formatPrice(m.price)} ({m.duration_min || 60} min)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-cacao/60 mt-1">
                Lorsque ce soin est sélectionné, cette vidéo sera automatiquement listée dans la fiche détaillée de ce soin.
              </p>
            </div>

            {/* Select Produit Boutique */}
            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Produit boutique associé (Product)
              </label>
              <select
                value={formData.product_name || ''}
                onChange={handleProductSelect}
                className="field text-xs sm:text-sm py-2.5 cursor-pointer bg-white"
              >
                <option value="">-- Aucun produit associé --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — {formatPrice(p.price)} {p.category ? `(${p.category})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Boutons d'actions rapides (Overlay lecteur TikTok) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/60 border border-cacao/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 flex items-center gap-1.5">
              <CalendarHeart className="w-3.5 h-3.5 text-gold" />
              <span>3. Boutons d'actions rapides sur la vidéo (Overlay)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Action: Booking */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-cacao/10 bg-white/80 cursor-pointer hover:bg-white transition text-xs">
                <input
                  type="checkbox"
                  checked={formData.action_booking}
                  onChange={(e) => setFormData({ ...formData, action_booking: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="flex items-center gap-1.5 font-semibold text-cacao">
                  <CalendarHeart className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bouton Réservation directe</span>
                </div>
              </label>

              {/* Action: WhatsApp */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-cacao/10 bg-white/80 cursor-pointer hover:bg-white transition text-xs">
                <input
                  type="checkbox"
                  checked={formData.action_whatsapp}
                  onChange={(e) => setFormData({ ...formData, action_whatsapp: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-1.5 font-semibold text-cacao">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bouton WhatsApp direct</span>
                </div>
              </label>

              {/* Action: Messaging */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-cacao/10 bg-white/80 cursor-pointer hover:bg-white transition text-xs">
                <input
                  type="checkbox"
                  checked={formData.action_chat}
                  onChange={(e) => setFormData({ ...formData, action_chat: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="flex items-center gap-1.5 font-semibold text-cacao">
                  <MessageSquare className="w-3.5 h-3.5 text-cacao" />
                  <span>Bouton Messagerie interne</span>
                </div>
              </label>

              {/* Action: Shop Product */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-cacao/10 bg-white/80 cursor-pointer hover:bg-white transition text-xs">
                <input
                  type="checkbox"
                  checked={formData.action_shop}
                  onChange={(e) => setFormData({ ...formData, action_shop: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="flex items-center gap-1.5 font-semibold text-cacao">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bouton Lien Boutique</span>
                </div>
              </label>
            </div>

            {formData.action_whatsapp && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Numéro WhatsApp cible (format international sans +)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_number || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="22997000000"
                  className="field text-xs sm:text-sm py-2"
                />
              </div>
            )}

            {/* Option: Commentaires sous la vidéo */}
            <div className="pt-3 border-t border-cacao/10">
              <label className="flex items-center justify-between p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-gold flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cacao block">
                      Autoriser les commentaires sous cette vidéo
                    </span>
                    <span className="text-[11px] text-cacao/65">
                      Les clients pourront commenter, poser des questions et échanger.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.commentsEnabled !== false && formData.comments_enabled !== false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commentsEnabled: e.target.checked,
                      comments_enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-cacao/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-soft py-2.5 px-4 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gold py-2.5 px-6 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer la vidéo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
