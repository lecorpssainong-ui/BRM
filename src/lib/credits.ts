export interface ToolDefinition {
  key: string;
  label: string;
  standard: string;
  integration: string;
  powerLabel: string;
  hint?: string;
}

export const TOOLS: ToolDefinition[] = [
  {
    key: 'ai',
    label: 'Conseiller IA (réponses aux clients)',
    standard: 'Moteur local gratuit, instantané, 0 crédit. Connaît l\'intégralité des soins, tarifs, forfaits, FAQ et le dossier du client.',
    integration: 'Modèle de langage externe pour des formulations plus libres et des nuances avancées.',
    powerLabel: 'Profondeur des réponses',
    hint: 'Le mode standard reste totalement gratuit et sans limite : vous pouvez le laisser ainsi pour toujours.'
  },
  {
    key: 'messages',
    label: 'Messagerie (pièces jointes des clients)',
    standard: 'Les photos sont compressées sur l\'appareil du client avant l\'envoi (gain de données, gratuit). Vidéos désactivées en standard.',
    integration: 'Fichiers transmis en qualité d\'origine sans limitation de format.',
    powerLabel: 'Qualité conservée'
  },
  {
    key: 'upload',
    label: 'Envoi de fichiers (photos du centre, produits, vidéos)',
    standard: 'Visuels réduits sur l\'appareil avant publication. Gratuit, instantané et chargement rapide pour les clients.',
    integration: 'Publication des fichiers média en qualité native.',
    powerLabel: 'Qualité conservée'
  },
  {
    key: 'announcements',
    label: 'Annonces & statuts',
    standard: 'Rédaction assistée par modèles locaux pré-enregistrés, directement dans le navigateur.',
    integration: 'Rédaction et reformulations automatiques par IA.',
    powerLabel: 'Créativité demandée'
  },
  {
    key: 'image',
    label: 'Images IA (génération de visuels)',
    standard: 'Désactivée — le centre publie ses propres photos réelles, 100% gratuit et fidèle.',
    integration: 'Génération de visuels et illustrations par IA.',
    powerLabel: 'Qualité visée'
  },
];

export const FREE_TOOLS = [
  {
    label: 'Factures & PDF',
    detail: 'Création, calculs des remises, fidélité, logo, filigrane et export PDF : tout est calculé localement sur l\'appareil sans surcoût.'
  },
  {
    label: 'Messages texte',
    detail: 'L\'envoi et la réception de messages écrits transitent uniquement par la base de données sans aucun service tiers.'
  },
  {
    label: 'Rendez-vous, boutique, commandes',
    detail: 'Toute la gestion opérationnelle est stockée et affichée sans aucun appel externe payant.'
  },
];

export const modeOf = (settings: any, key: string): 'standard' | 'integration' =>
  settings?.[`${key}_mode`] === 'integration' ? 'integration' : 'standard';

export const powerOf = (settings: any, key: string): number => {
  const v = Number(settings?.[`${key}_power`]);
  return Number.isFinite(v) ? Math.min(10, Math.max(1, v)) : 5;
};

export const isIntegration = (settings: any, key: string): boolean =>
  modeOf(settings, key) === 'integration';
