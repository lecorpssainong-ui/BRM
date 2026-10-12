import { useState, useEffect } from 'react';
import { useAppSettings, useMassages } from '@/lib/queries';
import { formatPrice } from '@/lib/format';
import { base44 } from '@/api/base44Client';
import ListEditor from './ListEditor';
import FaqEditor from './FaqEditor';
import SuggestionEditor from './SuggestionEditor';
import AiTester from './AiTester';
import {
  Save,
  Bot,
  Sparkles,
  Building2,
  Phone,
  Clock,
  MapPin,
  Sliders,
  ShieldAlert,
  HelpCircle,
  BrainCircuit,
  Flame,
  CheckCircle2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export function generateCatalogSummary(massagesList: any[]): string {
  if (!massagesList || massagesList.length === 0) {
    return 'Réflexologie plantaire (15 000 FCFA • 60 min), Massage suédois décontractant (20 000 FCFA • 60 min), Drainage lymphatique (25 000 FCFA • 75 min).';
  }
  return massagesList
    .filter((m) => m && m.name && m.active !== false)
    .map((m) => {
      const priceStr = formatPrice(Number(m.price) || 0);
      const durationStr = m.duration_min ? `${m.duration_min} min` : '60 min';
      return `${m.name} (${priceStr} • ${durationStr})`;
    })
    .join(', ');
}

export default function AiStudio() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();
  const { data: massages = [] } = useMassages();

  const [activeTab, setActiveTab] = useState<'identity' | 'directives' | 'memory' | 'faq' | 'tester'>('identity');

  const [form, setForm] = useState<any>({
    // Center Info
    center_name: 'Bénin Réflexologie Massage - ONG Le Corps Sain',
    center_address: 'Quartier Haie Vive, Cotonou, Bénin',
    center_phone: '+229 97 00 00 00',
    center_whatsapp: '+229 97 00 00 00',
    center_hours: 'Lundi au Samedi : 08h00 - 20h00, Dimanche sur rendez-vous',
    center_maps_url: 'https://maps.google.com/?q=Cotonou+Benin+Reflexologie',
    center_services_summary:
      'Réflexologie plantaire (15 000 FCFA), Massage suédois décontractant (20 000 FCFA), Réflexologie palmaire & crânienne (12 000 FCFA), Drainage lymphatique (25 000 FCFA), Rituel Signature Reconnexion (35 000 FCFA).',

    // Identity & Persona
    ai_name: 'Awa',
    ai_tone: 'chaleureux',
    ai_greeting:
      'Bonjour et bienvenue chez Bénin Réflexologie Massage ! Je suis Awa, votre conseillère santé et bien-être. Quel inconfort ou besoin ressentez-vous aujourd\'hui ?',
    ai_instructions:
      'Accueillir avec empathie et bienveillance. Analyser les zones réflexes concernées. Orienter systématiquement vers la prise de rendez-vous pour un soin personnalisé au centre ou proposer des huiles thérapeutiques.',
    ai_sales_focus:
      'Encourager la réservation en séance de réflexologie en mettant en avant les bienfaits durables sur le sommeil, le stress et la vitalité.',
    ai_emergency_responses:
      'En cas de douleur aiguë inhabituelle, fièvre élevée, traumatisme récent ou urgence médicale, conseiller avec calme et fermeté de consulter un médecin d\'urgence avant tout massage.',
    ai_objections_responses:
      'Rassurer sur la douceur des pressions adaptées, la qualification des thérapeutes certifiés et l\'hygiène irréprochable de notre centre à Cotonou.',

    // Short-term Memory Sliding Window (2 to 15 messages)
    memory_limit: 6,
    max_discount_percent: 15,

    // Toggles & Lists
    ai_allow_booking: true,
    ai_allow_shop: true,
    ai_suggestion_mode: 'auto',
    ai_topics: [
      'Soulager le mal de dos et les trapèzes tendus',
      'Améliorer la qualité de mon sommeil et stopper les insomnies',
      'Soulager les jambes lourdes et la rétention d\'eau',
      'Apaiser le stress, les migraines et la fatigue mentale',
    ],
    ai_rules: [
      'Ne jamais prétendre remplacer un médecin ou prescrire de médicaments',
      'Toujours parler avec respect, chaleur et écoute active',
      'Mettre en avant les soins du centre en FCFA',
    ],
    ai_fixed_suggestions: [],
    ai_faq: [],
    ai_mode: 'standard',
    ai_power: 7,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      const aiCfg = s.ai_config || {};
      const aiSysCfg = s.ai_system_config || {};

      setForm((prev: any) => ({
        ...prev,
        // Center Info from settings / ai_config
        center_name:
          aiCfg.center_info?.name ||
          s.center_name ||
          prev.center_name,
        center_address:
          aiCfg.center_info?.city ||
          s.center_address ||
          prev.center_address,
        center_phone:
          aiCfg.center_info?.phone ||
          s.center_phone ||
          s.phone ||
          prev.center_phone,
        center_whatsapp:
          aiCfg.center_info?.whatsapp ||
          s.whatsapp ||
          prev.center_whatsapp,
        center_hours:
          aiCfg.center_info?.hours ||
          s.center_hours ||
          s.opening_hours ||
          prev.center_hours,
        center_maps_url:
          aiCfg.center_info?.maps_url ||
          s.maps_url ||
          prev.center_maps_url,
        center_services_summary:
          aiCfg.center_info?.services_summary ||
          prev.center_services_summary,

        // Identity & Persona
        ai_name: s.ai_name || aiCfg.persona?.ai_name || 'Awa',
        ai_tone: s.ai_tone || aiCfg.persona?.tone || 'chaleureux',
        ai_greeting:
          s.ai_greeting ||
          aiCfg.persona?.greeting ||
          prev.ai_greeting,
        ai_instructions:
          s.ai_instructions ||
          aiCfg.persona?.complex_case_behavior ||
          prev.ai_instructions,
        ai_sales_focus:
          aiCfg.persona?.sales_focus || prev.ai_sales_focus,
        ai_emergency_responses:
          aiCfg.persona?.emergency_behavior || prev.ai_emergency_responses,
        ai_objections_responses:
          aiCfg.persona?.objections_behavior || prev.ai_objections_responses,

        // Memory Limit & Discount Cap
        memory_limit: Number(
          aiCfg.memory_limit ??
            s.ai_memory_limit ??
            aiSysCfg.memory_limit ??
            6
        ),
        max_discount_percent: Number(
          aiCfg.max_discount_percent ??
            s.max_discount_percent ??
            aiSysCfg.max_discount_percent ??
            15
        ),

        // Lists & Toggles
        ai_topics: Array.isArray(s.ai_topics) && s.ai_topics.length > 0 ? s.ai_topics : prev.ai_topics,
        ai_rules: Array.isArray(s.ai_rules) && s.ai_rules.length > 0 ? s.ai_rules : prev.ai_rules,
        ai_allow_booking: s.ai_allow_booking !== false,
        ai_allow_shop: s.ai_allow_shop !== false,
        ai_suggestion_mode: s.ai_suggestion_mode || 'auto',
        ai_fixed_suggestions: Array.isArray(s.ai_fixed_suggestions) ? s.ai_fixed_suggestions : [],
        ai_faq: Array.isArray(s.ai_faq) ? s.ai_faq : [],
        ai_mode: s.ai_mode || 'standard',
        ai_power: s.ai_power ?? 7,
      }));
    }
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const compiledAiConfig = {
      center_info: {
        name: form.center_name,
        city: form.center_address,
        phone: form.center_phone,
        whatsapp: form.center_whatsapp,
        hours: form.center_hours,
        maps_url: form.center_maps_url,
        services_summary: form.center_services_summary,
      },
      persona: {
        ai_name: form.ai_name,
        tone: form.ai_tone,
        greeting: form.ai_greeting,
        complex_case_behavior: form.ai_instructions,
        sales_focus: form.ai_sales_focus,
        emergency_behavior: form.ai_emergency_responses,
        objections_behavior: form.ai_objections_responses,
        fallback_behavior: form.ai_instructions,
      },
      memory_limit: form.memory_limit,
      max_discount_percent: form.max_discount_percent,
      discount_cap: form.max_discount_percent,
      allow_booking: form.ai_allow_booking,
      allow_shop: form.ai_allow_shop,
    };

    const payload = {
      ...form,
      ai_config: compiledAiConfig,
      ai_system_config: compiledAiConfig,
      ai_memory_limit: form.memory_limit,
    };

    try {
      // 0. Persistance locale garantie même sans accès réseau/base de données
      try {
        localStorage.setItem('brm_local_ai_config', JSON.stringify(compiledAiConfig));
        localStorage.setItem('brm_app_settings_override', JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('brm_ai_config_updated', { detail: compiledAiConfig }));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }

      // 1. Sauvegarde Supabase prioritaire dans app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        if (supabase) {
          const supabasePayload: Record<string, any> = {
            ai_name: (form.ai_name || 'Rébecca la lionne').trim(),
            updated_at: new Date().toISOString(),
          };
          if (form.ai_greeting) {
            supabasePayload.ai_greeting = form.ai_greeting.trim();
          }
          const { data, error } = await supabase
            .from('app_settings')
            .update(supabasePayload)
            .eq('id', 'a0000000-0000-0000-0000-000000000001')
            .select()
            .single();
          console.log('Update app_settings:', { data, error });
        }
      } catch (err) {
        console.warn('Supabase app_settings update warning:', err);
      }

      // 2. Sauvegarde Base44

      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, payload);
      } else {
        await base44.entities.AppSettings.create(payload);
      }

      toast({
        title: 'Studio IA calibré & enregistré !',
        description: 'La mémoire contextuelle, les directives et les coordonnées sont à jour.',
        variant: 'success',
      });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'enregistrement',
        description: error?.message || 'Impossible d\'enregistrer le Studio IA.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Calibrage Gemini & Intelligence Métier</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-gold" />
            <span>Studio IA — Cerveau du Conseiller</span>
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 mt-0.5">
            Pilotez les connaissances du centre, le ton commercial, la mémoire à court terme et les réponses aux objections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-md active:scale-95 transition"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer le Studio IA'}</span>
        </button>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 backdrop-blur-md text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'identity'
              ? 'bg-cacao text-sand shadow-sm'
              : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
          }`}
        >
          <Building2 className="w-4 h-4 text-gold" />
          <span>1. Centre & Coordonnées</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('directives')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'directives'
              ? 'bg-cacao text-sand shadow-sm'
              : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
          }`}
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span>2. Directives, Ton & Vente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('memory')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'memory'
              ? 'bg-cacao text-sand shadow-sm'
              : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
          }`}
        >
          <Sliders className="w-4 h-4 text-gold" />
          <span>3. Mémoire & Tokens ({form.memory_limit} msg)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'faq'
              ? 'bg-cacao text-sand shadow-sm'
              : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-gold" />
          <span>4. Sujets, Règles & FAQ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tester')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tester'
              ? 'bg-amber-600 text-white shadow-sm font-bold'
              : 'text-amber-800 dark:text-amber-300 hover:text-amber-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>5. Simulateur en direct</span>
        </button>
      </div>

      {/* Tab 1: Coordonnées & Infos Officielles du Centre */}
      {activeTab === 'identity' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10 bg-[#FAF6F0] dark:bg-[#1C1410]"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-cacao/10">
            <Building2 className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                Coordonnées & Références du Centre
              </h3>
              <p className="text-xs text-cacao/65 dark:text-sand/65">
                Ces informations sont injectées dynamiquement dans l'instruction système de Gemini pour guider précisément les clients.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Nom officiel de l'établissement
              </label>
              <input
                type="text"
                value={form.center_name || ''}
                onChange={(e) => setForm({ ...form, center_name: e.target.value })}
                placeholder="Ex: Bénin Réflexologie Massage"
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Ville / Adresse physique
              </label>
              <input
                type="text"
                value={form.center_address || ''}
                onChange={(e) => setForm({ ...form, center_address: e.target.value })}
                placeholder="Ex: Quartier Haie Vive, Cotonou, Bénin"
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Téléphone d'appel & Accueil
              </label>
              <input
                type="text"
                value={form.center_phone || ''}
                onChange={(e) => setForm({ ...form, center_phone: e.target.value })}
                placeholder="Ex: +229 97 00 00 00"
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Numéro WhatsApp officiel
              </label>
              <input
                type="text"
                value={form.center_whatsapp || ''}
                onChange={(e) => setForm({ ...form, center_whatsapp: e.target.value })}
                placeholder="Ex: +229 97 00 00 00"
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Horaires d'ouverture
              </label>
              <input
                type="text"
                value={form.center_hours || ''}
                onChange={(e) => setForm({ ...form, center_hours: e.target.value })}
                placeholder="Ex: Lundi au Samedi : 08h00 - 20h00"
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Lien de géolocalisation Google Maps
              </label>
              <input
                type="url"
                value={form.center_maps_url || ''}
                onChange={(e) => setForm({ ...form, center_maps_url: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="field"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span>Résumé du catalogue des soins & tarifs (Auto-synchronisé)</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const generated = generateCatalogSummary(massages);
                  setForm((prev: any) => ({ ...prev, center_services_summary: generated }));
                  toast({
                    title: 'Catalogue des soins synchronisé !',
                    description: `${massages.length} soin(s) extrait(s) et injecté(s) dans le prompt de l'IA.`,
                    variant: 'success',
                  });
                }}
                className="text-xs text-gold hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser depuis le catalogue</span>
              </button>
            </div>

            <textarea
              rows={3}
              readOnly
              value={form.center_services_summary || ''}
              placeholder="Génération automatique du catalogue..."
              className="field text-xs sm:text-sm resize-none leading-relaxed bg-stone-100/80 dark:bg-stone-800/80 cursor-default font-mono text-cacao/90 dark:text-sand/90 border-gold/30"
            />
            <p className="text-[11px] text-cacao/60 dark:text-sand/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold" />
              <span>Généré automatiquement en combinant les noms de soins, durées et prix en FCFA pour le conseiller IA.</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Directives, Ton Comportemental & Vente */}
      {activeTab === 'directives' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10 bg-[#FAF6F0] dark:bg-[#1C1410]"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-cacao/10">
            <Sparkles className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                Directives Système, Ton & Stratégie Commerciale
              </h3>
              <p className="text-xs text-cacao/65 dark:text-sand/65">
                Définissez l'identité du conseiller (ex: Rébecca la lionne), les consignes d'orientation vers la réservation et la gestion des objections.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Nom affiché du conseiller IA
              </label>
              <input
                type="text"
                required
                value={form.ai_name || ''}
                onChange={(e) => setForm({ ...form, ai_name: e.target.value })}
                placeholder="Ex: Rébecca la lionne"
                className="field"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
                Ton du discours & style d'expression
              </label>
              <select
                value={form.ai_tone || 'chaleureux'}
                onChange={(e) => setForm({ ...form, ai_tone: e.target.value })}
                className="field"
              >
                <option value="chaleureux">Chaleureux, Empathique & Bienveillant (Recommandé)</option>
                <option value="professionnel">Professionnel, Thérapeutique & Scientifique</option>
                <option value="doux">Doux, Apaisant & Holistique</option>
                <option value="dynamique">Dynamique, Énergisant & Positif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
              Message d'accueil inaugural
            </label>
            <textarea
              rows={2}
              value={form.ai_greeting || ''}
              onChange={(e) => setForm({ ...form, ai_greeting: e.target.value })}
              placeholder="Bonjour, je suis Awa, conseillère bien-être..."
              className="field text-xs sm:text-sm resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/80 dark:text-sand/80 block mb-1">
              Directives comportementales & orientation vente / prise de rendez-vous
            </label>
            <textarea
              rows={3}
              value={form.ai_sales_focus || ''}
              onChange={(e) => setForm({ ...form, ai_sales_focus: e.target.value })}
              placeholder="Consignes pour orienter naturellement vers la réservation en ligne..."
              className="field text-xs sm:text-sm resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Réponse face aux cas d'urgence & douleurs aiguës</span>
              </label>
              <textarea
                rows={3}
                value={form.ai_emergency_responses || ''}
                onChange={(e) => setForm({ ...form, ai_emergency_responses: e.target.value })}
                placeholder="Protocole en cas de fièvre, entorse grave ou crise cardiaque..."
                className="field text-xs sm:text-sm resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Traitement des objections & doutes clients</span>
              </label>
              <textarea
                rows={3}
                value={form.ai_objections_responses || ''}
                onChange={(e) => setForm({ ...form, ai_objections_responses: e.target.value })}
                placeholder="Arguments rassurants sur la douleur des massages, les tarifs, l'hygiène..."
                className="field text-xs sm:text-sm resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Discount Negotiation Cap */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Plafond de remise commerciale négociable par l'IA
                </span>
                <span className="text-[11px] text-cacao/65 dark:text-sand/65">
                  L'IA ne pourra jamais accorder une remise supérieure à ce pourcentage lors des échanges.
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 font-bold font-mono text-sm">
                Max -{form.max_discount_percent}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={form.max_discount_percent}
              onChange={(e) => setForm({ ...form, max_discount_percent: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-cacao/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ai_allow_booking}
                onChange={(e) => setForm({ ...form, ai_allow_booking: e.target.checked })}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs text-cacao dark:text-sand font-medium">
                Générer les boutons d'action « Réserver ce soin »
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ai_allow_shop}
                onChange={(e) => setForm({ ...form, ai_allow_shop: e.target.checked })}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs text-cacao dark:text-sand font-medium">
                Générer les boutons d'action « Voir en boutique »
              </span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Mémoire à court terme & Économie de Tokens */}
      {activeTab === 'memory' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10 bg-[#FAF6F0] dark:bg-[#1C1410]"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-cacao/10">
            <Sliders className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                Gestion de la Mémoire à Court Terme (Sliding Window)
              </h3>
              <p className="text-xs text-cacao/65 dark:text-sand/65">
                Ajustez le nombre d'échanges récents transmis dans le contexte de Gemini pour équilibrer pertinence et consommation de tokens.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-cacao dark:text-sand block">
                  Fenêtre glissante de messages mémorisés
                </span>
                <span className="text-xs text-cacao/60 dark:text-sand/60">
                  {form.memory_limit <= 4
                    ? 'Mode ultra-économique (300-600 tokens)'
                    : form.memory_limit <= 8
                    ? 'Équilibre parfait mémoire / coût (Recommandé)'
                    : 'Mémoire longue conversationnelle (1200-2500 tokens)'}
                </span>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-amber-500 text-stone-950 font-mono font-bold text-base shadow-sm">
                {form.memory_limit} messages
              </span>
            </div>

            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={form.memory_limit}
              onChange={(e) => setForm({ ...form, memory_limit: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] text-cacao/50 dark:text-sand/50 font-mono">
              <span>2 msg (Minimal)</span>
              <span>6 msg (Standard)</span>
              <span>10 msg (Étendu)</span>
              <span>15 msg (Maxi)</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 4: Sujets, Règles & FAQ */}
      {activeTab === 'faq' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-soft p-6 sm:p-7 bg-[#FAF6F0] dark:bg-[#1C1410] border border-cacao/10">
              <ListEditor
                title="Questions suggérées d'accueil (Bulles rapides)"
                items={form.ai_topics}
                onChange={(topics) => setForm({ ...form, ai_topics: topics })}
                placeholder="Ex: J'ai mal au dos après le travail"
              />
            </div>

            <div className="card-soft p-6 sm:p-7 bg-[#FAF6F0] dark:bg-[#1C1410] border border-cacao/10">
              <ListEditor
                title="Règles strictes & Interdictions"
                items={form.ai_rules}
                onChange={(rules) => setForm({ ...form, ai_rules: rules })}
                placeholder="Ex: Ne jamais poser de diagnostic médical formel"
              />
            </div>
          </div>

          <div className="card-soft p-6 sm:p-7 bg-[#FAF6F0] dark:bg-[#1C1410] border border-cacao/10">
            <SuggestionEditor
              mode={form.ai_suggestion_mode}
              fixedSuggestions={form.ai_fixed_suggestions}
              onModeChange={(m) => setForm({ ...form, ai_suggestion_mode: m })}
              onFixedChange={(s) => setForm({ ...form, ai_fixed_suggestions: s })}
            />
          </div>

          <div className="card-soft p-6 sm:p-7 bg-[#FAF6F0] dark:bg-[#1C1410] border border-cacao/10">
            <FaqEditor
              faq={form.ai_faq}
              onChange={(faqList) => setForm({ ...form, ai_faq: faqList })}
            />
          </div>
        </motion.div>
      )}

      {/* Tab 5: Live Interactive Tester */}
      {activeTab === 'tester' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AiTester />
        </motion.div>
      )}
    </div>
  );
}
