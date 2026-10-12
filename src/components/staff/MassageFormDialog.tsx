import { useState, useEffect, FormEvent } from 'react';
import MediaUploader from '@/components/MediaUploader';
import {
  X,
  Save,
  Sparkles,
  Video,
  Plus,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  MessageCircle,
  Clock,
  Tag,
  Layers,
  Globe,
  FileText,
} from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { formatPrice } from '@/lib/format';

export interface MassageVideoItem {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  description?: string;
  commentsEnabled?: boolean;
  visibility: 'sheet_only' | 'both';
  format?: 'short' | 'long';
  likes?: number;
  created_at?: string;
}

interface MassageFormDialogProps {
  isOpen: boolean;
  initialData?: any;
  onClose: () => void;
  onSave: (data: any, isEdit: boolean) => Promise<void>;
}

export default function MassageFormDialog({
  isOpen,
  initialData,
  onClose,
  onSave,
}: MassageFormDialogProps) {
  const [formData, setFormData] = useState<any>({
    name: '',
    tagline: '',
    description: '',
    role: '',
    objective: '',
    benefits: '',
    duration_min: 60,
    price: 15000,
    image_url: '',
    order: 1,
    bulk_min_qty: 10,
    bulk_discount_percent: 10,
    videos: [] as MassageVideoItem[],
  });

  const [activeTab, setActiveTab] = useState<'info' | 'videos'>('info');
  const [saving, setSaving] = useState(false);

  // Sous-formulaire d'ajout / édition de vidéo
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [videoCoverEnabled, setVideoCoverEnabled] = useState<boolean>(false);
  const [videoExtractedThumb, setVideoExtractedThumb] = useState<string>('');
  const [videoFormData, setVideoFormData] = useState<MassageVideoItem>({
    id: '',
    title: '',
    video_url: '',
    thumbnail_url: '',
    description: '',
    commentsEnabled: true,
    visibility: 'sheet_only',
    format: 'short',
  });

  useEffect(() => {
    if (initialData) {
      let benefitsStr = '';
      if (Array.isArray(initialData.benefits)) {
        benefitsStr = initialData.benefits.join('\n');
      } else if (typeof initialData.benefits === 'string') {
        benefitsStr = initialData.benefits;
      }

      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        tagline: initialData.tagline || '',
        description: initialData.description || '',
        role: initialData.role || '',
        objective: initialData.objective || '',
        benefits: benefitsStr,
        duration_min: initialData.duration_min ?? 60,
        price: initialData.price ?? 15000,
        image_url: initialData.image_url || '',
        order: initialData.order ?? 1,
        bulk_min_qty: initialData.bulk_min_qty ?? 10,
        bulk_discount_percent: initialData.bulk_discount_percent ?? 10,
        videos: Array.isArray(initialData.videos) ? initialData.videos : [],
        active: initialData.active ?? true,
      });
    } else {
      setFormData({
        name: '',
        tagline: '',
        description: '',
        role: '',
        objective: '',
        benefits: '',
        duration_min: 60,
        price: 15000,
        image_url: '',
        order: 1,
        bulk_min_qty: 10,
        bulk_discount_percent: 10,
        videos: [],
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Gestion des vidéos associées
  const handleOpenAddVideo = () => {
    setEditingVideoIndex(null);
    setVideoCoverEnabled(false);
    setVideoExtractedThumb('');
    setVideoFormData({
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: formData.name ? `Capsule • ${formData.name}` : '',
      video_url: '',
      thumbnail_url: '',
      description: '',
      commentsEnabled: true,
      visibility: 'sheet_only',
      format: 'short',
    });
    setVideoModalOpen(true);
  };

  const handleOpenEditVideo = (index: number) => {
    const vid = formData.videos[index];
    setEditingVideoIndex(index);
    setVideoCoverEnabled(Boolean(vid?.thumbnail_url && vid?.thumbnail_url.trim()));
    setVideoExtractedThumb('');
    setVideoFormData({ ...vid });
    setVideoModalOpen(true);
  };

  const handleSaveVideoItem = () => {
    if (!videoFormData.title.trim() || !videoFormData.video_url.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez saisir au minimum un titre et une vidéo.',
        variant: 'destructive',
      });
      return;
    }

    const updatedVideos = [...(formData.videos || [])];
    if (editingVideoIndex !== null && editingVideoIndex >= 0) {
      updatedVideos[editingVideoIndex] = { ...videoFormData };
    } else {
      updatedVideos.push({
        ...videoFormData,
        id: videoFormData.id || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    }

    setFormData((prev: any) => ({ ...prev, videos: updatedVideos }));
    setVideoModalOpen(false);
    toast({
      title: editingVideoIndex !== null ? 'Vidéo modifiée' : 'Vidéo ajoutée au soin',
      variant: 'success',
    });
  };

  const handleDeleteVideoItem = (index: number) => {
    const updated = (formData.videos || []).filter((_: any, idx: number) => idx !== index);
    setFormData((prev: any) => ({ ...prev, videos: updated }));
    toast({ title: 'Vidéo retirée du soin', variant: 'default' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Nom du soin requis', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const benefitsArray = typeof formData.benefits === 'string'
        ? formData.benefits.split('\n').map((b: string) => b.trim()).filter(Boolean)
        : formData.benefits;

      const payload = {
        ...formData,
        name: formData.name.trim(),
        benefits: benefitsArray,
        duration_min: Number(formData.duration_min) || 60,
        price: Number(formData.price) || 0,
        order: Number(formData.order) || 1,
        bulk_min_qty: Number(formData.bulk_min_qty) || 10,
        bulk_discount_percent: Number(formData.bulk_discount_percent) || 0,
      };

      await onSave(payload, Boolean(initialData?.id));
      onClose();
    } catch {
      toast({ title: 'Erreur d\'enregistrement', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-md overflow-y-auto">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden font-body"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-cacao/10 dark:border-white/10 flex items-center justify-between gap-3 bg-white/60 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-gold flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="eyebrow block mb-0.5">Catalogue des Massages</span>
              <h3 className="font-display font-medium text-xl sm:text-2xl text-cacao dark:text-sand">
                {initialData?.id ? 'Modifier le Soin' : 'Nouveau Soin & Réflexologie'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cacao/10 dark:hover:bg-white/10 text-cacao/60 dark:text-sand/60 hover:text-cacao dark:hover:text-sand transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-1 border-b border-cacao/10 bg-white/30 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-cacao text-sand shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Fiche & Tarifs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-gold text-stone-950 font-black shadow-sm'
                : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>2. Capsules Vidéos Courtes ({formData.videos?.length || 0})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: INFORMATIONS GÉNÉRALES */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8">
                  <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                    Nom du soin *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Réflexologie Plantaire Thaïlandaise"
                    className="field text-xs sm:text-sm py-2.5"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="field text-xs sm:text-sm py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                  Accroche courte (citation)
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Ex: L'art ancestral de stimuler les zones réflexes pour libérer l'énergie vitale"
                  className="field text-xs sm:text-sm py-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                  Description détaillée
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Expliquez le déroulement et la philosophie du soin..."
                  className="field text-xs sm:text-sm py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                    Action principale (Rôle)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Détoxification organique et régulation du sommeil"
                    className="field text-xs sm:text-sm py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                    Objectif visé
                  </label>
                  <textarea
                    rows={2}
                    value={formData.objective || ''}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    placeholder="Ex: Dissoudre les tensions nerveuses accumulées"
                    className="field text-xs sm:text-sm py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                  Bienfaits constatés (un par ligne)
                </label>
                <textarea
                  rows={3}
                  value={formData.benefits || ''}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Stimulation de la circulation sanguine&#10;Soulagement des jambes lourdes&#10;Réduction de l'anxiété"
                  className="field text-xs sm:text-sm py-2"
                />
              </div>

              {/* Durée & Tarifs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10">
                <div>
                  <label className="text-xs font-semibold text-cacao/80 dark:text-sand/80 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>Durée (minutes) *</span>
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    required
                    value={formData.duration_min ?? 60}
                    onChange={(e) => setFormData({ ...formData, duration_min: Number(e.target.value) })}
                    className="field text-xs sm:text-sm py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-cacao/80 dark:text-sand/80 block mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-gold" />
                    <span>Prix (FCFA) *</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.price ?? 15000}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="field text-xs sm:text-sm py-2 font-bold text-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-cacao/80 dark:text-sand/80 block mb-1">
                    Remise forfait (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.bulk_discount_percent ?? 0}
                    onChange={(e) => setFormData({ ...formData, bulk_discount_percent: Number(e.target.value) })}
                    className="field text-xs sm:text-sm py-2"
                  />
                </div>
              </div>

              {/* Photo du soin */}
              <div>
                <MediaUploader
                  label="Photo principale du soin (Format paysage recommandé)"
                  hint="Sélectionnez une image de présentation ou saisissez une URL."
                  mediaType="image"
                  value={formData.image_url || ''}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CAPSULES VIDÉOS COURTES DU SOIN */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-gold" />
                    <span>Capsules Vidéos Courtes Associées à ce Soin</span>
                  </h4>
                  <p className="text-[11px] text-cacao/70 dark:text-sand/70">
                    Ajoutez plusieurs capsules vidéo immersives. Pour chaque vidéo, vous choisissez si elle apparaît uniquement dans le tiroir du soin ou aussi dans le flux public TikTok.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddVideo}
                  className="btn-gold py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une capsule</span>
                </button>
              </div>

              {/* Liste des vidéos associées */}
              {(!formData.videos || formData.videos.length === 0) ? (
                <div className="card-soft p-10 text-center space-y-3 border-dashed border-2 border-cacao/20">
                  <Video className="w-10 h-10 text-gold/60 mx-auto" />
                  <h5 className="font-display font-medium text-base text-cacao dark:text-sand">
                    Aucune vidéo capsule associée
                  </h5>
                  <p className="text-xs text-cacao/65 dark:text-sand/65 max-w-sm mx-auto">
                    Associez des vidéos de démonstration à ce massage pour enrichir la fiche détaillée client et dynamiser l'accueil.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddVideo}
                    className="btn-soft py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer la première vidéo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.videos.map((vid: MassageVideoItem, index: number) => (
                    <div
                      key={vid.id || index}
                      className="card-soft p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cacao/10 dark:border-white/10 bg-white/70 dark:bg-stone-900/70"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-20 rounded-xl overflow-hidden bg-stone-900 shrink-0 relative">
                          {Boolean(vid.thumbnail_url && vid.thumbnail_url.trim()) ? (
                            <img
                              src={vid.thumbnail_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : vid.video_url ? (
                            <video
                              src={vid.video_url}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              <Video className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white/80" />
                          </div>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <h5 className="font-semibold text-sm text-cacao dark:text-sand truncate">
                            {vid.title}
                          </h5>

                          <div className="flex flex-wrap items-center gap-2">
                            {vid.visibility === 'both' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold text-stone-950 inline-flex items-center gap-1 shadow-xs">
                                <Globe className="w-3 h-3" />
                                <span>Fiche Soin + Espace TikTok</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                <span>Fiche Soin uniquement (Accueil)</span>
                              </span>
                            )}

                            {vid.commentsEnabled !== false && (
                              <span className="text-[10px] text-cacao/60 dark:text-sand/60 inline-flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-gold" />
                                <span>Avis activés</span>
                              </span>
                            )}
                          </div>

                          {vid.description && (
                            <p className="text-xs text-cacao/60 dark:text-sand/60 line-clamp-1">
                              {vid.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditVideo(index)}
                          className="p-2 rounded-xl text-cacao/70 hover:text-cacao hover:bg-cacao/10 transition cursor-pointer"
                          title="Modifier cette vidéo"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideoItem(index)}
                          className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Supprimer cette vidéo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-cacao/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-soft py-2.5 px-5 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gold py-2.5 px-7 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Enregistrement...' : 'Enregistrer le soin'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SOUS-MODALE D'AJOUT / ÉDITION DE VIDÉO */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            style={{
              backgroundColor: 'rgb(var(--sand))',
              color: 'rgb(var(--cacao))',
              borderColor: 'rgb(var(--cacao) / 0.18)',
            }}
            className="card-soft w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 rounded-3xl border shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gold" />
                <h4 className="font-display font-medium text-lg text-cacao dark:text-sand">
                  {editingVideoIndex !== null ? 'Modifier la capsule vidéo' : 'Ajouter une capsule vidéo'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1 rounded-full text-cacao/60 hover:text-cacao"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-body">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                  Titre de la capsule *
                </label>
                <input
                  type="text"
                  required
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  placeholder="Ex: Démonstration des points réflexes de la voûte"
                  className="field text-xs sm:text-sm py-2"
                />
              </div>

              {/* SÉLECTEUR DE VISIBILITÉ DU SOIN */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-gold/30">
                <label className="text-xs font-bold uppercase tracking-wider text-gold block">
                  Visibilité de la vidéo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      videoFormData.visibility === 'sheet_only'
                        ? 'bg-emerald-500/10 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200'
                        : 'border-cacao/10 bg-white/60 dark:bg-white/5 text-cacao/70 dark:text-sand/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="video_visibility"
                      checked={videoFormData.visibility === 'sheet_only'}
                      onChange={() => setVideoFormData({ ...videoFormData, visibility: 'sheet_only' })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block">Fiche Soin uniquement</span>
                      <span className="text-[10px] font-normal opacity-80 block mt-0.5">
                        Visible dans le sheet de détail sur l'accueil.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      videoFormData.visibility === 'both'
                        ? 'bg-amber-500/15 border-amber-500 font-bold text-amber-950 dark:text-amber-200 shadow-sm'
                        : 'border-cacao/10 bg-white/60 dark:bg-white/5 text-cacao/70 dark:text-sand/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="video_visibility"
                      checked={videoFormData.visibility === 'both'}
                      onChange={() => setVideoFormData({ ...videoFormData, visibility: 'both' })}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="block">Fiche Soin + Espace TikTok</span>
                      <span className="text-[10px] font-normal opacity-80 block mt-0.5">
                        Visible dans le sheet ET dans l'onglet Vidéos.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <MediaUploader
                  label="Fichier Vidéo (MP4, WebM, MOV) *"
                  hint="Téléversez un fichier vidéo depuis votre appareil."
                  mediaType="video"
                  value={videoFormData.video_url || ''}
                  onChange={(url) => setVideoFormData({ ...videoFormData, video_url: url })}
                  onThumbnailGenerated={(thumb: string) => {
                    setVideoExtractedThumb(thumb);
                  }}
                />
              </div>

              {/* Toggle Couverture Fixe */}
              <div className="p-3.5 rounded-2xl border border-cacao/15 bg-white/70 dark:bg-stone-800/80 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-cacao dark:text-sand block">
                      Image de couverture fixe (Vignette / Poster)
                    </span>
                    <span className="text-[11px] text-cacao/65 dark:text-sand/65 block">
                      {videoCoverEnabled
                        ? 'Une photo statique sera affichée avant le clic sur lecture.'
                        : '🎬 Sans couverture fixe : la vidéo jouera directement en Autoplay muet dans les cartes.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={videoCoverEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setVideoCoverEnabled(enabled);
                      if (!enabled) {
                        setVideoFormData((prev: any) => ({ ...prev, thumbnail_url: '' }));
                      } else if (videoExtractedThumb && !videoFormData.thumbnail_url) {
                        setVideoFormData((prev: any) => ({ ...prev, thumbnail_url: videoExtractedThumb }));
                      }
                    }}
                    className="w-4 h-4 rounded border-cacao/30 text-gold focus:ring-gold accent-gold cursor-pointer"
                  />
                </label>

                {videoCoverEnabled && (
                  <div className="pt-2 border-t border-cacao/10 space-y-2">
                    {videoExtractedThumb && videoFormData.thumbnail_url !== videoExtractedThumb && (
                      <button
                        type="button"
                        onClick={() => setVideoFormData((prev: any) => ({ ...prev, thumbnail_url: videoExtractedThumb }))}
                        className="py-1 px-2.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-amber-900 dark:text-amber-200 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer border border-gold/30"
                      >
                        <Sparkles className="w-3 h-3 text-gold" />
                        <span>🪄 Appliquer la miniature YouTube / Média détectée</span>
                      </button>
                    )}

                    <MediaUploader
                      label="Vignette / Poster de la vidéo (Image 9:16)"
                      hint="Image d'aperçu affichée avant la lecture."
                      mediaType="image"
                      value={videoFormData.thumbnail_url || ''}
                      onChange={(url) => setVideoFormData({ ...videoFormData, thumbnail_url: url })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                  Description / Conseils de la capsule
                </label>
                <textarea
                  rows={2}
                  value={videoFormData.description || ''}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                  placeholder="Points de pression recommandés, durée idéale..."
                  className="field text-xs sm:text-sm py-2"
                />
              </div>

              {/* Switch Commentaires */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-cacao/10 bg-white/60 dark:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gold" />
                  <span className="text-xs font-semibold text-cacao dark:text-sand">
                    Autoriser les commentaires sous cette vidéo
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={videoFormData.commentsEnabled !== false}
                  onChange={(e) => setVideoFormData({ ...videoFormData, commentsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-cacao/10 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="btn-soft py-2 px-4 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveVideoItem}
                className="btn-gold py-2 px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider la vidéo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
