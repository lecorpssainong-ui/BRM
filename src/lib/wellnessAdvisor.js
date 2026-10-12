/**
 * BÉNIN RÉFLEXOLOGIE MASSAGE — CONSEILLER SANTÉ & BIEN-ÊTRE IA (GEMINI API)
 * Module Backend & Logique Métier de Recommandation Thérapeutique
 * 
 * 1. Appel Gemini Flash via @google/genai avec Structured Output (JSON Schema)
 * 2. System Prompt spécialisé en réflexologie, massothérapie et naturopathie
 * 3. Mode dégradé instantané (Regex local) en cas de coupure réseau ou absence de clé
 */

import { GoogleGenAI, Type } from '@google/genai';

// Mapping des soins fondamentaux du centre avec leurs IDs et mots-clés
export const MASSAGE_CATALOG = [
  {
    id: 'm1',
    name: 'Réflexologie Plantaire Thérapeutique',
    slug: 'reflexologie-plantaire',
    keywords: ['pied', 'pieds', 'voute', 'plante', 'organe', 'detox', 'drainage', 'tension', 'fatigue', 'equilibre', 'anxiete', 'stress', 'sommeil', 'insomnie', 'sciatique'],
    category: 'reflexologie',
    duration_min: 60,
    price: 15000,
    tagline: 'Harmonie et stimulation des zones réflexes podales'
  },
  {
    id: 'm2',
    name: 'Massage Suédois Relaxant',
    slug: 'massage-suedois',
    keywords: ['dos', 'lombaire', 'lombalgie', 'muscle', 'courbature', 'epaule', 'trapeze', 'tension', 'noeud', 'contracture', 'sport', 'recuperation', 'detente'],
    category: 'massage',
    duration_min: 75,
    price: 20000,
    tagline: 'Dénouement musculaire profond et lâcher-prise'
  },
  {
    id: 'm3',
    name: 'Réflexologie Palmaire & Crânienne',
    slug: 'palmaire-cranienne',
    keywords: ['tete', 'migraine', 'cephalee', 'nuque', 'cervicale', 'cou', 'yeux', 'ecran', 'machoires', 'bruxisme', 'mental', 'burnout', 'surmenage', 'main', 'poignet'],
    category: 'reflexologie',
    duration_min: 45,
    price: 12000,
    tagline: 'Clarté d\'esprit, soulagement des céphalées et repos oculaire'
  },
  {
    id: 'm4',
    name: 'Massage Détox & Drainage Lymphatique',
    slug: 'drainage-lymphatique',
    keywords: ['jambe', 'jambes', 'lourdeur', 'gonflement', 'oedeme', 'cellulite', 'circulation', 'retention', 'toxine', 'veine', 'varice', 'eau', 'ventre', 'ballonnement'],
    category: 'drainage',
    duration_min: 75,
    price: 25000,
    tagline: 'Allègement circulatoire et détoxification profonde'
  },
  {
    id: 'm5',
    name: 'Rituel Signature Reconnexion',
    slug: 'rituel-signature',
    keywords: ['complet', 'signature', 'profond', 'renaissance', 'holistique', 'cadeau', 'anniversaire', 'luxe', 'anti-stress', 'energie', 'vitalite', 'deprime'],
    category: 'rituel',
    duration_min: 90,
    price: 35000,
    tagline: 'L\'expérience ultime d\'harmonisation corporelle et sensorielle'
  }
];

// Catalogue des produits bien-être pour suggestions croisées
export const PRODUCT_CATALOG = [
  {
    id: 'p1',
    name: 'Huile Thérapeutique d\'Arnica & Eucalyptus',
    keywords: ['dos', 'muscle', 'courbature', 'douleur', 'articulation', 'sport', 'trapeze', 'raideur'],
    price: 8500
  },
  {
    id: 'p2',
    name: 'Baume Réflexologique Karité & Menthe Sauvage',
    keywords: ['pied', 'pieds', 'talon', 'voute', 'marche', 'gonflement', 'echauffement', 'crevasse'],
    price: 6500
  },
  {
    id: 'p3',
    name: 'Infusion Sérénité & Sommeil Réparateur',
    keywords: ['sommeil', 'insomnie', 'nuit', 'anxiete', 'stress', 'apaisement', 'nerveux'],
    price: 4500
  },
  {
    id: 'p4',
    name: 'Huile de Massage Drainante au Pamplemousse Rose',
    keywords: ['jambe', 'jambes', 'circulation', 'retention', 'cellulite', 'minceur', 'drainage'],
    price: 9000
  }
];

/**
 * Normalisation textuelle pour le moteur Regex
 */
function cleanQuery(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mode Dégradé : Moteur Regex d'analyse locale
 * Exécuté instantanément en cas d'erreur API, panne réseau ou absence de clé.
 *
 * @param {string} query - Question de l'utilisateur
 * @returns {object} Réponse structurée respectant le schéma JSON imposé
 */
export function getLocalFallbackAdvice(query) {
  const cleaned = cleanQuery(query);
  const words = cleaned.split(' ').filter((w) => w.length >= 3);

  // Détection des correspondances pour les soins
  const massageScores = {};
  MASSAGE_CATALOG.forEach((massage) => {
    let score = 0;
    massage.keywords.forEach((kw) => {
      const reg = new RegExp(`\\b${kw}\\b`, 'i');
      if (reg.test(cleaned)) {
        score += 2;
      }
    });
    words.forEach((w) => {
      if (massage.keywords.some((kw) => kw.includes(w) || w.includes(kw))) {
        score += 1;
      }
    });
    if (score > 0) {
      massageScores[massage.id] = score;
    }
  });

  // Sélection des 2 meilleurs soins
  const sortedMassageIds = Object.keys(massageScores)
    .sort((a, b) => massageScores[b] - massageScores[a]);
  const recommended_massage_ids = sortedMassageIds.length > 0
    ? sortedMassageIds.slice(0, 2)
    : ['m1', 'm2']; // Soins phares par défaut

  // Détection des produits suggérés
  const suggested_products = PRODUCT_CATALOG
    .filter((prod) => prod.keywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(cleaned)))
    .map((p) => p.id);

  if (suggested_products.length === 0) {
    suggested_products.push('p1');
  }

  // Synthèse bienveillante contextualisée
  let analysis = '';
  const isBackPain = /\b(dos|lombaire|lombalgie|colonne|trapeze|nuque|epaule)\b/i.test(cleaned);
  const isStress = /\b(stress|angoisse|anxiete|surmenage|burnout|fatigue|sommeil|insomnie)\b/i.test(cleaned);
  const isLegs = /\b(jambe|jambes|pied|pieds|lourdeur|gonfle|circulation)\b/i.test(cleaned);
  const isHead = /\b(tete|migraine|cephalee|yeux|machoires|cervicale)\b/i.test(cleaned);

  if (isBackPain && isStress) {
    analysis = "Vos tensions au dos et au niveau des trapèzes sont souvent le reflet d'une accumulation de stress et de charge posturale. Notre recommandation prioritaire combine un dénouement musculaire ciblé et une action réflexologique pour réguler votre système nerveux autonome.";
  } else if (isBackPain) {
    analysis = "Les raideurs dorsales et lombaires nécessitent une détente des chaînes musculaires profondes afin de restaurer la mobilité vertébrale et libérer les blocages de la colonne.";
  } else if (isStress) {
    analysis = "Le surmenage et les troubles du sommeil créent une suractivité nerveuse. La réflexologie plantaire permet d'apaiser le système sympathique et d'induire un lâcher-prise réparateur dès la première séance.";
  } else if (isLegs) {
    analysis = "La sensation de jambes lourdes ou d'inconfort circulatoire répond particulièrement bien au drainage lymphatique et à la stimulation des points réflexes de détoxification.";
  } else if (isHead) {
    analysis = "Les céphalées de tension et la fatigue oculaire proviennent fréquemment de crispations cervicales et du travail prolongé sur écran. Notre soin crânien et palmaire apporte un soulagement quasi immédiat.";
  } else {
    analysis = "Pour prendre soin de votre équilibre global et vous offrir une parenthèse de ressourcement, nos thérapeutes certifiés adaptent chaque manœuvre à votre écoute et à vos besoins corporels du moment.";
  }

  const primaryMassage = MASSAGE_CATALOG.find((m) => m.id === recommended_massage_ids[0]) || MASSAGE_CATALOG[0];

  return {
    analysis,
    recommended_massage_ids,
    suggested_products,
    lifestyle_advice: [
      "Hydratez-vous abondamment (1,5 L d'eau tiède ou infusion) pour faciliter l'élimination des toxines.",
      "Pratiquez 5 minutes de respiration ventrale profonde avant le coucher pour décrisper le diaphragme.",
      "Accordez-vous 10 minutes de repos au calme après votre séance de massage."
    ],
    urgency_level: isBackPain || isHead ? 'moderate' : 'low',
    fallback_used: true,
    // Compatibilité étendue pour les composants frontend (UI)
    answer: analysis,
    suggestions: [
      "Quels sont les bienfaits de la réflexologie plantaire ?",
      "Combien coûte une séance et comment réserver ?",
      "Avez-vous des contre-indications médicales ?"
    ],
    actions: [
      {
        kind: 'appointment',
        label: `Réserver : ${primaryMassage.name}`,
        value: primaryMassage.name
      },
      {
        kind: 'product',
        label: 'Découvrir nos huiles de soin'
      }
    ]
  };
}

/**
 * Schéma JSON strict imposé au modèle Gemini pour le formatage de sortie et l'exécution d'actions
 */
const WELLNESS_ADVISOR_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "Diagnostic holistique bienveillant, analyse des symptômes décrits et explications thérapeutiques en français."
    },
    answer: {
      type: Type.STRING,
      description: "Message de réponse complet, empathique, direct et chaleureux adressé au client en français."
    },
    recommended_massage_ids: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Identifiants des soins suggérés parmi : 'm1' (Réflexologie Plantaire), 'm2' (Massage Suédois), 'm3' (Réflexologie Palmaire & Crânienne), 'm4' (Drainage Lymphatique), 'm5' (Rituel Signature Reconnexion)."
    },
    suggested_products: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Identifiants de produits complémentaires parmi : 'p1' (Huile Arnica & Eucalyptus), 'p2' (Baume Karité & Menthe), 'p3' (Infusion Sérénité), 'p4' (Huile Drainante Pamplemousse)."
    },
    lifestyle_advice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 à 4 conseils d'hygiène de vie, d'auto-massage ou d'étirements simples."
    },
    urgency_level: {
      type: Type.STRING,
      enum: ['low', 'moderate', 'high', 'urgent'],
      description: "Niveau de tension ou de priorité du besoin ('low', 'moderate', 'high' ou 'urgent')."
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 à 4 courtes questions ou requêtes suggérées au client pour poursuivre la conversation."
    },
    executed_action: {
      type: Type.OBJECT,
      properties: {
        action_type: {
          type: Type.STRING,
          enum: ['NONE', 'BOOK_APPOINTMENT', 'MANAGE_CART', 'ALERT_SECRETARY'],
          description: "Action concrète déclenchée si le client exprime une intention claire de réservation, d'achat ou d'urgence."
        },
        appointment_data: {
          type: Type.OBJECT,
          properties: {
            massage_name: { type: Type.STRING },
            date_time_suggestion: { type: Type.STRING },
            notes: { type: Type.STRING }
          }
        },
        cart_data: {
          type: Type.OBJECT,
          properties: {
            product_id: { type: Type.STRING },
            product_name: { type: Type.STRING },
            quantity: { type: Type.INTEGER },
            discount_percent: { type: Type.INTEGER }
          }
        },
        secretary_alert: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            urgency: { type: Type.STRING },
            notes: { type: Type.STRING }
          }
        }
      }
    }
  },
  required: ['analysis', 'answer', 'recommended_massage_ids', 'suggested_products']
};

/**
 * System Prompt d'expertise médicale et réflexologique (Dynamique et personnalisable via Studio IA)
 */
export function buildSystemPrompt(customConfig = null) {
  const centerName = customConfig?.center_info?.name || "Bénin Réflexologie Massage - ONG Le Corps Sain";
  const city = customConfig?.center_info?.city || "Quartier Haie Vive, Cotonou, Bénin";
  const phone = customConfig?.center_info?.phone || customConfig?.center_info?.whatsapp || "+229 97 00 00 00";
  const hours = customConfig?.center_info?.hours || "Lundi au Samedi : 08h00 - 20h00, Dimanche sur rendez-vous";
  const mapsUrl = customConfig?.center_info?.maps_url || "";
  const servicesSummary = customConfig?.center_info?.services_summary || "Réflexologie plantaire (15 000 FCFA), Massage suédois (20 000 FCFA), Réflexologie palmaire & crânienne (12 000 FCFA), Drainage lymphatique (25 000 FCFA), Rituel Signature (35 000 FCFA).";
  
  const aiName = customConfig?.persona?.ai_name || "Awa";
  const tone = customConfig?.persona?.tone || "chaleureux, empathique, accueillant et professionnel";
  const complexCase = customConfig?.persona?.complex_case_behavior || "Orienter avec précaution vers une consultation médicale ou un rendez-vous personnalisé en centre.";
  const salesFocus = customConfig?.persona?.sales_focus || "Encourager la réservation d'une séance de réflexologie en mettant en avant les bienfaits thérapeutiques durables sur le corps.";
  const emergencyBehavior = customConfig?.persona?.emergency_behavior || "En cas de douleur aiguë inhabituelle ou urgence médicale, conseiller avec calme de consulter un médecin d'urgence avant tout massage et alerter le secrétariat.";
  const objectionsBehavior = customConfig?.persona?.objections_behavior || "Rassurer sur la douceur des pressions adaptées, la qualification des thérapeutes certifiés et l'hygiène du centre.";
  const fallbackBehavior = customConfig?.persona?.fallback_behavior || "Proposer des gestes d'auto-massage doux et orienter vers les soins proches du catalogue officiel.";
  const maxDiscount = Number(customConfig?.max_discount_percent ?? customConfig?.discount_cap ?? 15);

  return `Tu es ${aiName}, conseillère santé et experte en réflexologie & massothérapie de "${centerName}", centre thérapeutique de référence situé à ${city}.
Coordonnées & Horaires du centre :
- Contact / WhatsApp : ${phone}
- Horaires d'ouverture : ${hours}
${mapsUrl ? `- Localisation Google Maps : ${mapsUrl}` : ''}
- Catalogue officiel & tarifs : ${servicesSummary}
- Plafond maximal de remise commerciale autorisé par la direction : ${maxDiscount}% (Ne jamais dépasser cette limite !).

Ton tempérament & posture : ${tone}.
Directives commerciales & orientation : ${salesFocus}.

Ta mission :
1. Écouter avec empathie, bienveillance et rigueur professionnelle les maux exprimés par le client (douleurs de dos, stress, migraines, jambes lourdes, fatigue, digestion, insomnies).
2. Analyser les causes probables selon la réflexologie et l'anatomie fonctionnelle.
3. Rédiger une réponse complète, claire et encourageante dans le champ "answer".
4. Recommander les soins les plus adaptés parmi le catalogue officiel du centre :
   - m1 : Réflexologie Plantaire Thérapeutique (pieds, stimulation des organes, stress, digestion, insomnie)
   - m2 : Massage Suédois Relaxant (dos, trapèzes, nœuds musculaires, courbatures, sport)
   - m3 : Réflexologie Palmaire & Crânienne (migraines, céphalées, nuque, travail sur écran, anxiété)
   - m4 : Massage Détox & Drainage Lymphatique (jambes lourdes, rétention d'eau, œdèmes, élimination toxines)
   - m5 : Rituel Signature Reconnexion (soin complet premium 90 min, lâcher-prise total, rééquilibrage holistique)
5. Proposer 1 ou 2 produits d'accompagnement à domicile (p1: Huile Arnica & Eucalyptus, p2: Baume Karité Pieds, p3: Infusion Sérénité, p4: Huile Drainante).
6. Fournir des conseils d'hygiène de vie naturels et concrets (étirements, respiration, points d'acupression).

CAPACITÉS D'ACTION DIRECTE (champ "executed_action") :
- Si le client valide explicitement une séance de soin ou donne un créneau : Déclenche l'action "BOOK_APPOINTMENT" avec massage_name et date_time_suggestion.
- Si le client accepte d'acheter un produit (ou négocie une réduction dans la limite stricte de ${maxDiscount}%) : Déclenche l'action "MANAGE_CART" avec product_id, product_name, quantity: 1, discount_percent: (0 à ${maxDiscount}).
- Si le client est en crise aiguë, douleur intolérable ou demande à parler d'urgence à un humain : Déclenche l'action "ALERT_SECRETARY" avec subject et notes de synthèse.
- Sinon : action_type = 'NONE'.

7. Protocole face aux cas d'urgence / douleurs aiguës : ${emergencyBehavior}
8. Traitement des objections & craintes du client : ${objectionsBehavior}
9. En cas de cas complexe : ${complexCase}
10. Si un soin spécifique demandé n'est pas au catalogue : ${fallbackBehavior}

RÈGLE ABSOLUE : Tu DOIS répondre STRICTEMENT au format JSON conformément au schéma demandé. Pas de texte avant, pas de markdown autour.`;
}

const DEFAULT_SYSTEM_PROMPT = buildSystemPrompt();

/**
 * Fonction Principale d'appel au Conseiller Bien-être (Gemini API Flash avec Mode Dégradé)
 * 
 * @param {object} payload - Données de la requête client
 * @param {string} payload.question - Texte exprimé par le client
 * @param {Array} [payload.history] - Historique de la conversation
 * @param {string} [payload.client_key] - Clé anonyme ou identifiant du client
 * @returns {Promise<object>} Réponse structurée garantie
 */
export async function runWellnessAdvisor(payload) {
  const question = String(payload?.question || '').trim().slice(0, 1500);

  if (!question) {
    return getLocalFallbackAdvice("conseil général bien-être");
  }

  // Récupération de la clé API Gemini
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
    '';

  // Si aucune clé n'est configurée, bascule directe et instantanée sur le mode dégradé (0 coût, 0 latence)
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return getLocalFallbackAdvice(question);
  }

  try {
    // Construction du prompt contextuel avec historique éventuel (limite configurable de 2 à 15 messages)
    const memoryLimit = Math.max(2, Math.min(15, Number(payload?.ai_config?.memory_limit ?? 6)));
    let userPromptContent = `Question du client : "${question}"`;
    if (Array.isArray(payload.history) && payload.history.length > 0) {
      const recentHistory = payload.history
        .slice(-memoryLimit)
        .map((h) => `${h.role === 'user' ? 'Client' : 'Conseiller'}: ${h.text}`)
        .join('\n');
      userPromptContent = `Historique récent :\n${recentHistory}\n\nNouvelle question du client : "${question}"`;
    }

    // Système dynamique compilé d'après la configuration de app_settings
    const systemPrompt = buildSystemPrompt(payload?.ai_config);

    // Appel REST officiel Google Gemini (gemini-2.5-flash avec fallback automatique)
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];
    let data = null;

    for (const model of candidateModels) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\n${userPromptContent}\n\nRéponds EXCLUSIVEMENT sous la forme d'un objet JSON strict avec les champs: analysis, answer, recommended_massage_ids (liste parmi m1, m2, m3, m4, m5), suggested_products (liste parmi p1, p2, p3, p4), lifestyle_advice (liste de conseils), urgency_level ('low', 'moderate', 'high'), suggestions (questions courtes), executed_action ({ action_type: 'NONE' | 'BOOK_APPOINTMENT' | 'MANAGE_CART' | 'ALERT_SECRETARY' }).`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          data = await res.json();
          break;
        } else {
          const errBody = await res.text().catch(() => '');
          console.error('Gemini error:', errBody, 'Status:', res?.status);
          if (res.status !== 404) {
            break;
          }
        }
      } catch (networkErr) {
        console.error('Gemini error:', networkErr);
        break;
      }
    }

    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return getLocalFallbackAdvice(question);
    }

    const parsed = JSON.parse(candidateText.trim());

    // Enrichissement des actions UI pour les composants frontend (boutons de réservation)
    const recommendedIds =
      Array.isArray(parsed.recommended_massage_ids) && parsed.recommended_massage_ids.length > 0
        ? parsed.recommended_massage_ids
        : ['m1'];

    const primaryMassage =
      MASSAGE_CATALOG.find((m) => m.id === recommendedIds[0]) || MASSAGE_CATALOG[0];

    const actions = [
      {
        kind: 'appointment',
        label: `Réserver : ${primaryMassage.name}`,
        value: primaryMassage.name,
      },
      {
        kind: 'product',
        label: 'Consulter la boutique bien-être',
      },
    ];

    const suggestions =
      Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
        ? parsed.suggestions
        : [
            'Quelles sont les contre-indications de ce soin ?',
            'Combien de séances recommandez-vous ?',
            'Puis-je combiner avec de la réflexologie plantaire ?',
          ];

    return {
      analysis: parsed.analysis || 'Analyse thérapeutique réalisée avec succès.',
      answer: parsed.answer || parsed.analysis || 'Voici nos recommandations personnalisées pour votre bien-être.',
      recommended_massage_ids: recommendedIds,
      suggested_products: parsed.suggested_products || ['p1'],
      lifestyle_advice: parsed.lifestyle_advice || [
        "Buvez beaucoup d'eau tiède pour favoriser l'élimination des toxines.",
        'Évitez les efforts physiques violents immédiatement après le soin.',
      ],
      urgency_level: parsed.urgency_level || 'low',
      fallback_used: false,
      suggestions,
      actions,
      executed_action: parsed.executed_action || { action_type: 'NONE' },
    };
  } catch (error) {
    console.error('Gemini error:', error, 'Status:', error?.status);
    return getLocalFallbackAdvice(question);
  }
}

// Export par défaut
export default {
  runWellnessAdvisor,
  getLocalFallbackAdvice,
  MASSAGE_CATALOG,
  PRODUCT_CATALOG
};
