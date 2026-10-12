import { useState, useEffect, FormEvent } from 'react';
import { useMassages, useProducts, useVideos, useAppSettings } from '@/lib/queries';
import { formatPrice } from '@/lib/format';
import MediaUploader from '@/components/MediaUploader';
import {
  X,
  Save,
  Megaphone,
  Sparkles,
  CalendarHeart,
  ShoppingBag,
  Video,
  MessageCircle,
  Clock,
  Pin,
  Image as ImageIcon,
} from 'lucide-react';

interface AnnouncementFormProps {
  initialData?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  userRole?: string;
  userName?: string;
}

export default function AnnouncementForm({
  initialData,
  isOpen,
  onClose,
  onSave,
  userRole = 'secretary',
  userName = 'Secrétariat',
}: AnnouncementFormProps) {
  const { data: massages = [] } = useMassages();
  const { data: products = [] } = useProducts();
  const { data: videos = [] } = useVideos();
  const { data: settings } = useAppSettings();

  const defaultPhone =
    settings?.whatsapp?.replace(/[^0-9]/g, '') ||
    settings?.center_phone?.replace(/[^0-9]/g, '') ||
    settings?.momo_number ||
    '22997000000';

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tone, setTone] = useState<'gold' | 'sage' | 'clay' | 'cacao'>('gold');
  const [linkType, setLinkType] = useState<
    'none' | 'massage' | 'product' | 'video' | 'appointment' | 'whatsapp'
  >('none');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkTargetName, setLinkTargetName] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(defaultPhone);
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [active, setActive] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setText(initialData.text || '');
      setImageUrl(initialData.image_url || '');
      setTone(initialData.tone || 'gold');
      setLinkType(initialData.link_type || (initialData.link_url ? 'appointment' : 'none'));
      setLinkTargetId(initialData.link_target_id || '');
      setLinkTargetName(initialData.link_target_name || '');
      setButtonLabel(initialData.button_label || initialData.link_label || '');
      setWhatsappNumber(initialData.whatsapp_number || defaultPhone);
      setPublishAt(
        initialData.publish_at ? new Date(initialData.publish_at).toISOString().slice(0, 16) : ''
      );
      setExpiresAt(
        initialData.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : ''
      );
      setActive(initialData.active !== false);
      setPinned(Boolean(initialData.pinned));
    } else {
      setTitle('');
      setText('');
      setImageUrl('');
      setTone('gold');
      setLinkType('none');
      setLinkTargetId('');
      setLinkTargetName('');
      setButtonLabel('');
      setWhatsappNumber(defaultPhone);
      setPublishAt('');
      setExpiresAt('');
      setActive(true);
      setPinned(false);
    }
  }, [initialData, isOpen, defaultPhone]);

  if (!isOpen) return null;

  // Auto-fill button label suggestion when linkType or target changes
  const handleLinkTypeChange = (type: any) => {
    setLinkType(type);
    setLinkTargetId('');
    setLinkTargetName('');

    if (type === 'massage') setButtonLabel('Réserver ce soin');
    else if (type === 'product') setButtonLabel('Acheter en boutique');
    else if (type === 'video') setButtonLabel('Voir le tutoriel');
    else if (type === 'appointment') setButtonLabel('Prendre Rendez-vous');
    else if (type === 'whatsapp') setButtonLabel('Discuter sur WhatsApp');
    else setButtonLabel('');
  };

  const handleMassageTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const found = massages.find((m: any) => m.name === name);
    setLinkTargetName(name);
    setLinkTargetId(found?.id || '');
    if (name) {
      setButtonLabel(`Réserver ${name}`);
    }
  };

  const handleProductTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const found = products.find((p: any) => p.name === name);
    setLinkTargetName(name);
    setLinkTargetId(found?.id || '');
    if (name) {
      setButtonLabel(`Commander ${name}`);
    }
  };

  const handleVideoTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const titleVal = e.target.value;
    const found = videos.find((v: any) => v.title === titleVal);
    setLinkTargetName(titleVal);
    setLinkTargetId(found?.id || '');
    if (titleVal) {
      setButtonLabel('Regarder la capsule vidéo');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      // Build link_url fallback
      let linkUrl = '';
      if (linkType === 'massage') {
        linkUrl = `/rendez-vous?tab=book${linkTargetName ? `&massage=${encodeURIComponent(linkTargetName)}` : ''}`;
      } else if (linkType === 'product') {
        linkUrl = `/boutique${linkTargetName ? `?search=${encodeURIComponent(linkTargetName)}` : ''}`;
      } else if (linkType === 'video') {
        linkUrl = '/decouvertes';
      } else if (linkType === 'appointment') {
        linkUrl = '/rendez-vous';
      }

      await onSave({
        title: title.trim() || undefined,
        text: text.trim(),
        image_url: imageUrl.trim() || undefined,
        kind: 'status',
        tone,
        format: 'grand',
        author_name: userName || 'Bénin Réflexologie',
        author_role: userRole,
        link_type: linkType,
        link_target_id: linkTargetId || undefined,
        link_target_name: linkTargetName || undefined,
        button_label: buttonLabel.trim() || undefined,
        whatsapp_number: linkType === 'whatsapp' ? whatsappNumber.trim() : undefined,
        link_url: linkUrl || undefined,
        link_label: buttonLabel.trim() || undefined,
        publish_at: publishAt ? new Date(publishAt).toISOString() : undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        active,
        pinned,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 font-body shadow-2xl border"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cacao text-sand">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-cacao font-medium">
                {initialData ? 'Modifier le Statut / Story' : 'Créer un Statut / Story Instagram'}
              </h3>
              <p className="text-xs text-cacao/60 font-body">
                S'affichera dans le carrousel circulaire d'accueil avec une visionneuse interactive.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-cacao/60 hover:text-cacao hover:bg-cacao/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          {/* Section 1: Contenu du Statut */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-white/60 border border-cacao/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-gold" />
              <span>1. Contenu & Présentation</span>
            </h4>

            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Titre court (affiché sous le cercle avatar) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Offre Découverte, Huile Divine..."
                className="field py-2.5"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Message / Texte complet de la story <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: Profitez de 20% de remise sur votre première séance de Réflexologie..."
                className="field resize-none leading-relaxed py-2.5"
              />
            </div>

            <div className="space-y-3 pt-1">
              <MediaUploader
                label="Image ou Photo de la Story"
                mediaType="image"
                accept="image/*"
                value={imageUrl}
                onChange={(url: string) => setImageUrl(url)}
                hint="Choisissez une image depuis votre galerie (compressée en WebP 0.8) ou saisissez une URL directe."
              />

              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Nuance d'ambiance visuelle
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="field py-2.5 cursor-pointer bg-white"
                >
                  <option value="gold">Or Impérial (Chaleur & éclat)</option>
                  <option value="sage">Sauge Thérapeutique (Vert équilibre)</option>
                  <option value="clay">Argile & Terre (Terracotta relaxant)</option>
                  <option value="cacao">Cacao Sombre (Nuit & sérénité)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Déclencheurs d'Action Intelligents (Smart CTA) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-white/60 border border-cacao/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cacao/80 flex items-center gap-1.5">
              <CalendarHeart className="w-3.5 h-3.5 text-gold" />
              <span>2. Bouton d'Action & Ressource Cible (Smart CTA)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Type de déclencheur (<code className="text-amber-700">link_type</code>)
                </label>
                <select
                  value={linkType}
                  onChange={(e) => handleLinkTypeChange(e.target.value)}
                  className="field py-2.5 cursor-pointer bg-white"
                >
                  <option value="none">Aucun bouton d'action</option>
                  <option value="massage">Lier un Soin & Réflexologie (MassageType)</option>
                  <option value="product">Lier un Produit Boutique (Product)</option>
                  <option value="video">Lier une Vidéo / Capsule (Video)</option>
                  <option value="appointment">Prise de Rendez-vous direct</option>
                  <option value="whatsapp">Discussion WhatsApp direct</option>
                </select>
              </div>

              {/* Dynamic Target Selector for Massage */}
              {linkType === 'massage' && (
                <div>
                  <label className="text-xs font-semibold text-cacao/80 block mb-1">
                    Sélectionner le Soin associé
                  </label>
                  <select
                    value={linkTargetName}
                    onChange={handleMassageTargetChange}
                    className="field py-2.5 cursor-pointer bg-white"
                  >
                    <option value="">-- Choisir un soin --</option>
                    {massages.map((m: any) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({formatPrice(m.price)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Target Selector for Product */}
              {linkType === 'product' && (
                <div>
                  <label className="text-xs font-semibold text-cacao/80 block mb-1">
                    Sélectionner le Produit associé
                  </label>
                  <select
                    value={linkTargetName}
                    onChange={handleProductTargetChange}
                    className="field py-2.5 cursor-pointer bg-white"
                  >
                    <option value="">-- Choisir un produit --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({formatPrice(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Target Selector for Video */}
              {linkType === 'video' && (
                <div>
                  <label className="text-xs font-semibold text-cacao/80 block mb-1">
                    Sélectionner la Vidéo associée
                  </label>
                  <select
                    value={linkTargetName}
                    onChange={handleVideoTargetChange}
                    className="field py-2.5 cursor-pointer bg-white"
                  >
                    <option value="">-- Choisir une vidéo --</option>
                    {videos.map((v: any) => (
                      <option key={v.id} value={v.title}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* WhatsApp phone input */}
              {linkType === 'whatsapp' && (
                <div>
                  <label className="text-xs font-semibold text-cacao/80 block mb-1">
                    Numéro WhatsApp cible
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="22997000000"
                    className="field py-2.5"
                  />
                </div>
              )}
            </div>

            {linkType !== 'none' && (
              <div>
                <label className="text-xs font-semibold text-cacao/80 block mb-1">
                  Libellé personnalisé du bouton d'action (<code className="text-amber-700">button_label</code>)
                </label>
                <input
                  type="text"
                  value={buttonLabel}
                  onChange={(e) => setButtonLabel(e.target.value)}
                  placeholder="Ex: Réserver la Réflexologie, Acheter l'Huile..."
                  className="field py-2.5"
                />
              </div>
            )}
          </div>

          {/* Section 3: Planification & Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/60 border border-cacao/10">
            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Publication programmée (laisser vide pour immédiat)
              </label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="field py-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-cacao/80 block mb-1">
                Expiration automatique (facultatif)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="field py-2"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs font-semibold text-cacao">Statut Actif</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs font-semibold text-cacao">Épinglé en premier (prioritaire)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-cacao/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-soft py-2.5 px-4 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="btn-gold py-2.5 px-6 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publication...' : 'Publier le Statut / Story'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
