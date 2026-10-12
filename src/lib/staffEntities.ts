export interface EntityField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'list' | 'datetime' | 'media' | 'image' | 'video';
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  hint?: string;
}

export const MASSAGE_FIELDS: EntityField[] = [
  { name: 'name', label: 'Nom du soin', type: 'text', required: true },
  { name: 'tagline', label: 'Accroche courte', type: 'text' },
  { name: 'description', label: 'Description détaillée', type: 'textarea' },
  { name: 'role', label: 'Rôle du soin', type: 'textarea' },
  { name: 'objective', label: 'Objectif visé', type: 'textarea' },
  { name: 'benefits', label: 'Bienfaits (un par ligne)', type: 'list' },
  { name: 'duration_min', label: 'Durée (minutes)', type: 'number', defaultValue: 60 },
  { name: 'price', label: 'Prix (FCFA)', type: 'number', required: true, defaultValue: 15000 },
  { name: 'image_url', label: 'Photo du soin', type: 'image', hint: 'Fichier image (JPG, PNG, WebP) depuis votre appareil' },
  { name: 'order', label: 'Ordre d\'affichage', type: 'number', defaultValue: 1 },
  { name: 'bulk_min_qty', label: 'Quantité minimale pour remise forfait', type: 'number', defaultValue: 10 },
  { name: 'bulk_discount_percent', label: 'Remise forfait (%)', type: 'number', defaultValue: 10 },
];

export const VIDEO_FIELDS: EntityField[] = [
  { name: 'title', label: 'Titre de la vidéo', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'video_url', label: 'Fichier Vidéo (MP4, WebM)', type: 'video', required: true, hint: 'Fichier vidéo depuis votre appareil' },
  { name: 'thumbnail_url', label: 'Image de couverture', type: 'image', hint: 'Image statique (facultative)' },
  { name: 'playlist', label: 'Nom de la playlist (facultatif)', type: 'text' },
  { name: 'massage_name', label: 'Soin associé (ex: Réflexologie Plantaire)', type: 'text' },
  { name: 'product_name', label: 'Produit boutique associé (facultatif)', type: 'text' },
  { name: 'whatsapp_number', label: 'Numéro WhatsApp direct (facultatif)', type: 'text' },
  {
    name: 'format',
    label: 'Format',
    type: 'select',
    defaultValue: 'short',
    options: [
      { value: 'short', label: 'Courte (fil vertical)' },
      { value: 'long', label: 'Longue (playlists uniquement)' }
    ]
  },
];

export const PRODUCT_FIELDS: EntityField[] = [
  { name: 'name', label: 'Nom du produit', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'original_price', label: 'Prix Normal / Initial (FCFA)', type: 'number', hint: 'Prix d\'origine avant promotion.' },
  { name: 'price', label: 'Prix de Vente / Promo (FCFA)', type: 'number', required: true, defaultValue: 5000 },
  { name: 'discount_percent', label: 'Pourcentage de Remise (%)', type: 'number', hint: 'Facultatif : calculé automatiquement.' },
  { name: 'image_url', label: 'Média Produit (Image ou Vidéo)', type: 'media', hint: 'Téléversez une photo ou une courte vidéo MP4 (jouée en boucle muette).' },
  { name: 'category', label: 'Catégorie de produit', type: 'text', hint: 'Ex: Huiles & Baumes, Tisanes, Accessoires' },
  { name: 'stock', label: 'Quantité en stock', type: 'number', defaultValue: 10 },
  { name: 'active', label: 'Actif en boutique', type: 'boolean', defaultValue: true },
];

export const ANNOUNCEMENT_FIELDS: EntityField[] = [
  { name: 'text', label: 'Texte de l\'annonce', type: 'textarea', required: true },
  { name: 'image_url', label: 'Image du statut / story', type: 'image', hint: 'Image illustrant le statut' },
  {
    name: 'kind',
    label: 'Type',
    type: 'select',
    defaultValue: 'banner',
    options: [
      { value: 'banner', label: 'Bandeau du centre' },
      { value: 'status', label: 'Statut d\'équipe' }
    ]
  },
  {
    name: 'tone',
    label: 'Nuance visuelle',
    type: 'select',
    defaultValue: 'gold',
    options: [
      { value: 'gold', label: 'Or' },
      { value: 'sage', label: 'Sauge (Vert)' },
      { value: 'clay', label: 'Argile (Terracotta)' },
      { value: 'cacao', label: 'Cacao' }
    ]
  },
  {
    name: 'format',
    label: 'Format',
    type: 'select',
    defaultValue: 'compact',
    options: [
      { value: 'compact', label: 'Compact (Bande discrète)' },
      { value: 'moyen', label: 'Moyen (Bande illustrée)' },
      { value: 'grand', label: 'Grand (Grande carte)' }
    ]
  },
  {
    name: 'image_fit',
    label: 'Ajustement de l\'image',
    type: 'select',
    defaultValue: 'cover',
    options: [
      { value: 'cover', label: 'Remplir le cadre (cover)' },
      { value: 'contain', label: 'Entière (contain)' }
    ]
  },
  { name: 'author_name', label: 'Nom de l\'auteur', type: 'text' },
  {
    name: 'author_role',
    label: 'Rôle de l\'auteur',
    type: 'select',
    defaultValue: 'moderator',
    options: [
      { value: 'moderator', label: 'Modérateur' },
      { value: 'secretary', label: 'Secrétariat' }
    ]
  },
  { name: 'publish_at', label: 'Date de publication (vide = immédiat)', type: 'datetime' },
  { name: 'expires_at', label: 'Date d\'expiration (facultatif)', type: 'datetime' },
  { name: 'active', label: 'Actif', type: 'boolean', defaultValue: true },
  { name: 'pinned', label: 'Épinglé en tête', type: 'boolean', defaultValue: false },
  { name: 'link_url', label: 'Lien du bouton (ex: /rendez-vous)', type: 'text' },
  { name: 'link_label', label: 'Libellé du bouton', type: 'text' },
];
