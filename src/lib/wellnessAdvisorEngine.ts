import { base44 } from '@/api/base44Client';
import { formatPrice, formatDate } from './format';
import { loyaltyState } from './invoice';

const STOP_WORDS = new Set([
  'les', 'des', 'pour', 'que', 'qui', 'dans', 'avec', 'sur', 'par', 'est', 'une', 'un',
  'mon', 'mes', 'ton', 'tes', 'son', 'ses', 'nos', 'vos', 'leur', 'leurs', 'aux', 'ces',
  'cet', 'cette', 'tout', 'tous', 'toute', 'toutes', 'mais', 'donc', 'car', 'bonjour',
  'salut', 'merci', 's\'il', 'vous', 'plaît', 'plait', 'comment', 'faire', 'avoir', 'etre',
  'suis', 'sommes', 'sont', 'avez', 'nous', 'vous', 'elle', 'elles', 'ils', 'bien', 'tres',
  'plus', 'sans', 'sous', 'vers', 'chez', 'peut', 'peux', 'pouvez', 'veux', 'voudrais',
  'aimerais', 'besoin', 'aussi', 'comme', 'autre', 'autres', 'meme', 'quel', 'quels',
  'quelle', 'quelles', 'quand', 'pourquoi', 'combien'
]);

const THEMES: Record<string, string[]> = {
  dos: ['dos', 'lombaire', 'lombalgie', 'nuque', 'cervicale', 'colonne', 'epaule', 'omoplate', 'sciatique', 'raideur', 'bloque'],
  stress: ['stress', 'anxiete', 'angoisse', 'nerveux', 'surmenage', 'burnout', 'panique', 'deprime', 'moral', 'tension'],
  sommeil: ['sommeil', 'dormir', 'insomnie', 'reveil', 'nuit', 'fatigue', 'epuise', 'energie', 'vitalite'],
  jambes: ['jambe', 'pied', 'cheville', 'mollet', 'cuisse', 'circulation', 'lourdeur', 'varices', 'retention', 'gonflement'],
  tete: ['tete', 'migraine', 'cephalee', 'sinus', 'concentration', 'memoire', 'vertige', 'yeux'],
  ventre: ['ventre', 'digestion', 'estomac', 'ballonnement', 'constipation', 'intestin', 'nausee', 'transit', 'foie'],
  detente: ['detente', 'relaxer', 'calme', 'repos', 'bien-etre', 'cadeau', 'offrir', 'anniversaire', 'zen'],
  peau: ['peau', 'visage', 'eclat', 'rides', 'secheresse', 'acne', 'teint', 'fermete', 'cellulite', 'vergeture'],
  sport: ['sport', 'muscle', 'courbature', 'recuperation', 'entrainement', 'fitness', 'marathon', 'course', 'tonus'],
  femme: ['regles', 'menstruation', 'cycle', 'grossesse', 'enceinte', 'menopause', 'premenstruel', 'hormonal'],
  enfant: ['enfant', 'bebe', 'nourrisson', 'adolescent'],
  senior: ['age', 'senior', 'arthrose', 'arthrite', 'rhumatisme', 'mobilite'],
  respir: ['respiration', 'poumon', 'asthme', 'rhume', 'bronches', 'souffle']
};

const INTENTIONS: Record<string, string[]> = {
  prix: ['prix', 'tarif', 'coute', 'fcfa', 'budget', 'payer', 'cher', 'combien'],
  forfait: ['forfait', 'reduction', 'remise', 'pack', 'lot', 'seances', 'economie'],
  fidelite: ['fidelite', 'fidele', 'bonus', 'onzieme', 'dixieme', 'carte'],
  lieu: ['adresse', 'situe', 'localisation', 'quartier', 'venir', 'trouver', 'itineraire', 'repere'],
  horaires: ['horaire', 'ouvert', 'ferme', 'ouverture', 'dimanche', 'samedi', 'soir', 'matin'],
  contact: ['telephone', 'numero', 'appeler', 'whatsapp', 'contact', 'joindre', 'email'],
  reserver: ['reserver', 'rendez-vous', 'planifier', 'booker', 'creneau', 'disponibilite'],
  annuler: ['annuler', 'decaler', 'reporter', 'changer', 'modifier', 'supprimer'],
  boutique: ['produit', 'acheter', 'boutique', 'huile', 'commander', 'article', 'stock', 'beurre'],
  duree: ['dure', 'duree', 'temps', 'minutes'],
  prepa: ['preparer', 'preparation', 'apporter', 'venir', 'manger', 'tenue'],
  apres: ['apres', 'suite', 'lendemain', 'conseil', 'maison'],
  contre: ['contre-indication', 'deconseille', 'interdit', 'danger', 'risque', 'operation', 'fievre'],
  seance: ['rendez-vous', 'seance', 'prochain', 'reserve', 'reservation'],
  facture: ['facture', 'recu', 'dois', 'reste', 'paiement'],
  humain: ['humain', 'quelqu\'un', 'personne', 'secretariat', 'responsable', 'vrai']
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWords(text: string): string[] {
  const norm = normalizeText(text);
  return norm.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

export interface WellnessAdvisorResponse {
  answer: string;
  suggestions: string[];
  actions: Array<{ kind: 'appointment' | 'product' | 'tools' | 'messages'; label: string; value?: string }>;
  mode: 'standard' | 'integration';
  source?: string;
}

export async function runWellnessAdvisor(payload: {
  question: string;
  history?: Array<{ role: string; text: string }>;
  client_key?: string;
}): Promise<WellnessAdvisorResponse> {
  const question = String(payload?.question || '').trim().slice(0, 1200);
  if (!question) {
    throw new Error('Question vide');
  }

  const [settingsList, massages, products] = await Promise.all([
    base44.asServiceRole.entities.AppSettings.list(),
    base44.asServiceRole.entities.MassageType.list('order', 30),
    base44.asServiceRole.entities.Product.filter({ active: true }, '-created_date', 40),
  ]);

  const settings = settingsList[0] || {};
  const isIntegrationMode = settings.ai_mode === 'integration';

  // Read personal client context if client_key provided
  let clientAppointments: any[] = [];
  let clientInvoices: any[] = [];
  let loyaltyInfo: any = null;

  if (payload.client_key) {
    try {
      const [appts, invs] = await Promise.all([
        base44.entities.Appointment.filter({ client_key: payload.client_key }),
        base44.entities.Invoice.filter({ client_key: payload.client_key }),
      ]);
      clientAppointments = appts.filter((a: any) => !['cancelled', 'refused'].includes(a.status));
      clientInvoices = invs;
      loyaltyInfo = loyaltyState(clientInvoices, settings.loyalty_threshold || 11);
    } catch {
      // offline fallback
    }
  }

  // If Gemini API key is available, call Gemini
  const geminiApiKey =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
    '';

  if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
      let chatResponse: any = null;

      const systemPrompt = `Tu es ${settings.ai_name || 'Awa'}, conseiller bien-être de ${settings.center_name || 'Bénin Réflexologie Massage'} à Cotonou, Bénin.
Langue : Français. Ton : ${settings.ai_tone || 'chaleureux'} et bienveillant.
Règles strictes :
- Jamais de diagnostic médical ni de médicament.
- En cas de douleur aiguë ou contre-indication, orienter vers un médecin.
- Ne conseiller QUE les soins du centre suivants : ${massages.map((m: any) => `${m.name} (${formatPrice(m.price)})`).join(', ')}.
- Produits disponibles : ${products.map((p: any) => `${p.name} (${formatPrice(p.price)})`).join(', ')}.
- Coordonnées officielles : Adresse : ${settings.address || 'Cotonou Haie Vive'}. Téléphone/WhatsApp : ${settings.center_phone || '+229 97 00 00 00'}.
- Horaires : ${settings.opening_hours || '08h-20h'}.
- Réponses concises (90 à 140 mots).
Renvoie EXCLUSIVEMENT un JSON valide de la forme :
{
  "answer": "Texte de ta réponse...",
  "suggestions": ["Question 1 ?", "Question 2 ?"],
  "actions": [{"kind": "appointment", "label": "Réserver ce soin", "value": "Nom du soin"}]
}`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nClient : ${question}\n\nRenvoie EXCLUSIVEMENT un JSON valide avec les clés "answer", "suggestions", "actions".`,
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

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Gemini error:', errText, 'Status:', res.status);
      } else {
        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText.trim());
          return {
            answer: parsed.answer || 'Prenez soin de vous.',
            suggestions: parsed.suggestions || [],
            actions: parsed.actions || [],
            mode: 'integration',
          };
        }
      }
    } catch (error: any) {
      console.error('Gemini error:', error, 'Status:', error?.status);
      // fallback to standard engine seamlessly
    }
  }

  // ── STANDARD 0-CREDIT ENGINE (Local NLP) ──
  const normalizedQ = normalizeText(question);
  const words = extractWords(question);

  // Detect matching themes
  const matchedThemes = new Set<string>();
  for (const [theme, kwList] of Object.entries(THEMES)) {
    for (const kw of kwList) {
      if (normalizedQ.includes(kw)) {
        matchedThemes.add(theme);
        break;
      }
    }
  }

  // Detect matching intentions
  const matchedIntentions = new Set<string>();
  for (const [intent, kwList] of Object.entries(INTENTIONS)) {
    for (const kw of kwList) {
      if (normalizedQ.includes(kw)) {
        matchedIntentions.add(intent);
        break;
      }
    }
  }

  // Score massages
  const scoredMassages: Array<{ item: any; score: number }> = massages.map((m: any) => {
    let score = 0;
    const normName = normalizeText(m.name || '');
    const normDesc = normalizeText(`${m.tagline || ''} ${m.description || ''} ${m.role || ''} ${m.objective || ''} ${(m.benefits || []).join(' ')}`);

    // +4 per theme found in question that relates to this massage
    for (const theme of matchedThemes) {
      for (const kw of THEMES[theme]) {
        if (normDesc.includes(kw) || normName.includes(kw)) {
          score += 4;
          break;
        }
      }
    }

    // +5 if massage name words are found in question
    const nameWords = extractWords(m.name || '');
    for (const nw of nameWords) {
      if (normalizedQ.includes(nw)) score += 5;
    }

    // +3 for general question words in massage description
    for (const w of words) {
      if (normDesc.includes(w)) score += 3;
    }

    score += (Number(m.likes) || 0) * 0.01;
    return { item: m, score };
  });

  scoredMassages.sort((a, b) => b.score - a.score);
  const topMassages = scoredMassages.filter((sm) => sm.score >= 4).slice(0, 2).map((sm) => sm.item);

  // Score products
  const scoredProducts: Array<{ item: any; score: number }> = products.map((p: any) => {
    let score = 0;
    const nameWords = extractWords(p.name || '');
    for (const nw of nameWords) {
      if (normalizedQ.includes(nw)) score += 6;
    }
    return { item: p, score };
  });
  scoredProducts.sort((a, b) => b.score - a.score);
  const topProduct = scoredProducts[0]?.score >= 6 ? scoredProducts[0].item : null;

  // Check FAQ
  let faqMatch: string | null = null;
  const faqList = settings.ai_faq || [];
  for (const item of faqList) {
    const qWords = extractWords(`${item.q} ${item.keywords || ''}`);
    let matchCount = 0;
    for (const qw of qWords) {
      if (normalizedQ.includes(qw)) matchCount += qw.length >= 6 ? 2 : 1;
    }
    if (matchCount >= 2) {
      faqMatch = item.a;
      break;
    }
  }

  // Build answer
  const answerParagraphs: string[] = [];
  const actions: Array<{ kind: 'appointment' | 'product' | 'tools' | 'messages'; label: string; value?: string }> = [];
  const suggestions: string[] = [];

  // Check personal inquiries first
  if (matchedIntentions.has('seance') && clientAppointments.length > 0) {
    const next = clientAppointments[0];
    answerParagraphs.push(
      `Votre prochain rendez-vous pour « ${next.massage_name} » est prévu le ${formatDate(next.date)} (statut : ${next.status === 'accepted' ? 'confirmé' : 'en attente de confirmation'}).`
    );
    actions.push({ kind: 'appointment', label: 'Voir mes rendez-vous' });
  } else if (matchedIntentions.has('fidelite') && loyaltyInfo) {
    if (loyaltyInfo.isDue) {
      answerParagraphs.push(
        `Félicitations ! Vous avez réalisé ${loyaltyInfo.done} séances. Votre toute prochaine séance déclenchera votre remise fidélité de ${settings.loyalty_percent || 15}% !`
      );
    } else {
      answerParagraphs.push(
        `Vous cumulez actuellement ${loyaltyInfo.total} séance(s) au centre. Il vous reste ${loyaltyInfo.remaining} séance(s) avant de débloquer votre réduction fidélité de ${settings.loyalty_percent || 15}%.`
      );
    }
  } else if (matchedIntentions.has('lieu')) {
    answerParagraphs.push(
      `Le centre ${settings.center_name || 'Bénin Réflexologie'} est situé à ${settings.center_city || 'Cotonou'}, ${settings.center_landmark || 'quartier Haie Vive'}. Adresse exacte : ${settings.address || 'Rue 340'}.`
    );
  } else if (matchedIntentions.has('horaires')) {
    answerParagraphs.push(`Nos portes vous sont ouvertes : ${settings.opening_hours || 'Du lundi au samedi de 08h00 à 20h00'}.`);
  } else if (matchedIntentions.has('contact') || matchedIntentions.has('humain')) {
    answerParagraphs.push(
      `Vous pouvez échanger directement avec notre secrétariat par messagerie privée ou par téléphone/WhatsApp au ${settings.center_phone || '+229 97 00 00 00'}.`
    );
    actions.push({ kind: 'messages', label: 'Écrire au secrétariat' });
  } else if (faqMatch) {
    answerParagraphs.push(faqMatch);
  } else if (topMassages.length > 0) {
    const best = topMassages[0];
    answerParagraphs.push(
      `D'après ce que vous décrivez, je vous oriente en priorité vers le soin « ${best.name} » (${best.duration_min} min • ${formatPrice(best.price)}).`
    );
    if (best.role) {
      answerParagraphs.push(`${best.role}. Il vise tout particulièrement : ${best.objective || best.tagline}.`);
    }
    if (best.benefits && best.benefits.length > 0) {
      answerParagraphs.push(`Bienfaits clés : ${best.benefits.slice(0, 3).join(', ')}.`);
    }
    actions.push({ kind: 'appointment', label: `Réserver « ${best.name} »`, value: best.name });
  } else {
    // General orientation
    answerParagraphs.push(
      `Pour retrouver équilibre et vitalité, je vous invite à découvrir notre soin signature « Réflexologie Plantaire Thérapeutique » (15 000 FCFA), idéal pour relâcher les tensions profondes et stimuler l'organisme.`
    );
    actions.push({ kind: 'appointment', label: 'Planifier une séance' });
  }

  // Suggest product if relevant
  if (topProduct && settings.ai_allow_shop !== false) {
    answerParagraphs.push(
      `Pour prolonger les bienfaits à la maison, notre « ${topProduct.name} » (${formatPrice(topProduct.price)}) est parfaitement indiqué.`
    );
    actions.push({ kind: 'product', label: 'Voir en boutique' });
  }

  // Suggest health tool if body measurements mentioned
  if (matchedThemes.has('ventre') || matchedThemes.has('sport') || normalizedQ.includes('poids') || normalizedQ.includes('eau')) {
    actions.push({ kind: 'tools', label: 'Calculateurs bien-être' });
  }

  // Generate suggestions
  if (settings.ai_suggestion_mode === 'fixed' && Array.isArray(settings.ai_fixed_suggestions) && settings.ai_fixed_suggestions.length > 0) {
    suggestions.push(...settings.ai_fixed_suggestions.slice(0, 3));
  } else if (settings.ai_suggestion_mode !== 'off') {
    if (topMassages.length > 0) {
      suggestions.push(`Combien de temps dure « ${topMassages[0].name} » ?`);
      suggestions.push('Proposez-vous des forfaits 10 séances ?');
      suggestions.push('Quels sont les créneaux disponibles ?');
    } else {
      suggestions.push('Quels sont vos forfaits de réflexologie ?');
      suggestions.push('Comment se déroule une première séance ?');
      suggestions.push('Où trouver le centre à Cotonou ?');
    }
  }

  return {
    answer: answerParagraphs.join('\n\n'),
    suggestions: suggestions.slice(0, 3),
    actions: actions.slice(0, 3),
    mode: 'standard',
  };
}
