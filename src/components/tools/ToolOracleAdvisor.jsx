import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  CalendarHeart,
  ShoppingBag,
  CheckCircle2,
  BookmarkPlus,
  RotateCcw,
  HeartPulse,
  Flame,
  Droplets,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { askGeminiAdvisor } from '@/lib/client';
import { mockStore } from '@/lib/mockStore';
import { useCart } from '@/lib/useCart';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';

/**
 * COMPOSANT ORACLE IA & ORDONNANCE BIEN-ÊTRE PERSONNALISÉE
 * 
 * @param {object} props
 * @param {string} props.toolId - Identifiant de l'outil (ex: 'imc', 'hydration', 'cardio')
 * @param {string} props.toolTitle - Titre de l'outil (ex: 'Indice de Masse Corporelle')
 * @param {object} props.metrics - Données et scores calculés
 * @param {string} props.primaryScore - Score principal affiché (ex: "23.4 kg/m²")
 * @param {string} props.categoryLabel - Catégorie (ex: "Poids normal")
 */
export default function ToolOracleAdvisor({
  toolId,
  toolTitle,
  metrics = {},
  primaryScore = '',
  categoryLabel = '',
}) {
  const profile = useProfile();
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [oracleResult, setOracleResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleGenerateOracle = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const metricLines = Object.entries(metrics)
        .map(([k, v]) => `• ${k}: ${v}`)
        .join('\n');

      const userPrompt = `Voici mon évaluation sur l'outil de santé "${toolTitle}" de Bénin Réflexologie Massage :\n${metricLines}\nScore Principal : ${primaryScore} (${categoryLabel}).\n\nÉtablis mon Ordonnance Bien-Être personnalisée en recommandant le soin de massage et l'huile ou le produit le plus adapté.`;

      const res = await askGeminiAdvisor(userPrompt, {
        client_key: profile?.client_key || 'client_demo',
      });

      setOracleResult(res);
      toast.success('Ordonnance Bien-Être générée !', 'Votre analyse holistique personnalisée est prête.');
    } catch (err) {
      console.error('Erreur Oracle IA:', err);
      toast.error('Erreur de génération', 'Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    try {
      const reportPayload = {
        tool_id: toolId,
        tool_title: toolTitle,
        client_key: profile?.client_key || 'client_demo',
        client_name: user?.nom || profile?.name || 'Inès Lawson',
        client_phone: user?.telephone || profile?.phone || '+229 97 00 00 00',
        primary_score: primaryScore,
        category_label: categoryLabel,
        metrics: metrics,
        oracle_analysis: oracleResult?.answer || oracleResult?.analysis || '',
        recommended_massage_ids: oracleResult?.recommended_massage_ids || [],
        suggested_products: oracleResult?.suggested_products || [],
        created_at: new Date().toISOString(),
      };

      // 1. Sauvegarde dans la table 'health_reports' de Supabase
      if (user?.id) {
        try {
          const { error: sbHealthErr } = await supabase.from('health_reports').insert({
            user_id: user.id,
            tool_type: toolId,
            report_data: {
              tool_title: toolTitle,
              primary_score: primaryScore,
              category_label: categoryLabel,
              metrics: metrics,
              recommended_massage_ids: oracleResult?.recommended_massage_ids || [],
              suggested_products: oracleResult?.suggested_products || [],
              client_name: user.nom || profile?.name || 'Client',
              client_phone: user.telephone || profile?.phone || '',
            },
            ai_prescription: oracleResult?.answer || oracleResult?.analysis || '',
          });

          if (sbHealthErr) {
            console.warn('[Supabase] Erreur insertion health_reports:', sbHealthErr.message);
          }
        } catch (e) {
          console.warn('[Supabase] Exception health_reports:', e);
        }
      }

      // 2. Sauvegarde de secours locale
      await mockStore.saveHealthReport(reportPayload);
      setSaved(true);
      toast.success('Bilan de santé sauvegardé !', 'Disponible dans votre dossier et pour vos prochaines séances.');
    } catch (err) {
      console.error('Erreur sauvegarde bilan:', err);
      toast.error('Échec de sauvegarde du rapport.');
    }
  };

  const handleAddToCart = (prod) => {
    cart.add({
      id: prod.id,
      name: prod.name,
      price: Number(prod.price) || 0,
      image_url: prod.image_url,
    });
    toast.success('Produit ajouté au panier !', `${prod.name} (${Number(prod.price || 0).toLocaleString('fr-FR')} FCFA)`);
  };

  return (
    <div className="space-y-4 font-body">
      {!oracleResult && !loading && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#160D08]/90 to-amber-950/30 border border-amber-500/30 text-sand text-center space-y-3 backdrop-blur-xl shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 text-stone-950 flex items-center justify-center mx-auto shadow-md animate-pulse">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>

          <div>
            <h4 className="font-display font-medium text-lg text-sand">
              Consulter l'Oracle IA Thérapeutique
            </h4>
            <p className="text-xs text-sand/70 max-w-md mx-auto mt-1 leading-relaxed">
              Analysez vos métriques actuelles ({primaryScore}) grâce à l'intelligence holistique du centre pour obtenir une ordonnance bien-être sur-mesure.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateOracle}
            className="btn-gold py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-xl inline-flex items-center gap-2 cursor-pointer active:scale-95 transition"
          >
            <Bot className="w-4 h-4 text-stone-950" />
            <span>Générer mon Ordonnance Bien-Être</span>
          </button>
        </div>
      )}

      {/* SKELETON LOADER ANIMÉ (Pulsation d'énergie cosmique) */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-[#160D08]/95 border border-amber-500/40 text-sand space-y-4 shadow-2xl backdrop-blur-2xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />

          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-300 text-stone-950 flex items-center justify-center mx-auto shadow-xl ring-4 ring-gold/20 animate-spin">
            <Sparkles className="w-7 h-7 fill-current" />
          </div>

          <div className="space-y-1.5">
            <h4 className="font-display font-medium text-lg text-sand">
              Diagnostic Holistique en cours...
            </h4>
            <p className="text-xs text-gold/80 font-mono">
              Analyse des points réflexes, de la charge métabolique et des synergies végétales
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2 pt-2">
            <div className="h-3 w-3/4 mx-auto rounded-full bg-white/15 animate-pulse" />
            <div className="h-3 w-5/6 mx-auto rounded-full bg-white/10 animate-pulse delay-100" />
            <div className="h-3 w-2/3 mx-auto rounded-full bg-white/15 animate-pulse delay-200" />
          </div>
        </motion.div>
      )}

      {/* RÉSULTAT DE L'ORDONNANCE BIEN-ÊTRE */}
      {oracleResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white/90 dark:bg-[#160D08]/95 border border-amber-500/30 text-cacao dark:text-sand space-y-5 shadow-2xl backdrop-blur-2xl"
        >
          {/* En-tête Ordonnance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gold/20 text-gold flex items-center justify-center">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                  Bénin Réflexologie • Oracle Santé
                </span>
                <h4 className="font-display font-medium text-lg leading-tight">
                  Ordonnance Holistique Personnalisée
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleGenerateOracle}
                className="p-2 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-gold/20 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Régénérer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gold" />
                <span className="hidden sm:inline">Régénérer</span>
              </button>

              <button
                type="button"
                disabled={saved}
                onClick={handleSaveReport}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sauvegardé</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diagnostic Textuel */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <span className="text-[10px] uppercase font-bold text-gold tracking-wider block">
              Synthèse & Recommandations Cliniques :
            </span>
            <p className="text-xs sm:text-sm text-cacao/80 dark:text-sand/90 leading-relaxed whitespace-pre-line">
              {oracleResult.answer || oracleResult.analysis || oracleResult.lifestyle_advice}
            </p>
          </div>

          {/* Recommandation de Soins du Centre */}
          {oracleResult.recommended_massage_ids && oracleResult.recommended_massage_ids.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gold tracking-wider flex items-center gap-1.5">
                <CalendarHeart className="w-3.5 h-3.5" />
                <span>Soin Recommandé par le Centre</span>
              </span>

              <div className="space-y-2">
                {oracleResult.recommended_massage_ids.map((massage, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-cacao/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="font-display font-medium text-sm sm:text-base text-cacao dark:text-sand">
                        {typeof massage === 'string' ? massage : massage.name || 'Massage Décontractant'}
                      </h5>
                      <p className="text-xs text-cacao/65 dark:text-sand/65">
                        {massage.duration_min ? `${massage.duration_min} min` : 'Séance complète'} • {massage.price ? `${Number(massage.price).toLocaleString('fr-FR')} FCFA` : 'Sur devis'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/rendez-vous?tab=book&massage=${encodeURIComponent(typeof massage === 'string' ? massage : massage.name)}`)}
                      className="btn-gold py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      <CalendarHeart className="w-3.5 h-3.5" />
                      <span>Réserver ce soin</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produits Suggérés de la Boutique */}
          {oracleResult.suggested_products && oracleResult.suggested_products.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gold tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Synergie Végétale & Huiles Conseillées</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {oracleResult.suggested_products.map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-cacao/10 dark:border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h6 className="font-medium text-xs text-cacao dark:text-sand truncate">
                        {prod.name}
                      </h6>
                      <span className="text-[11px] font-bold text-gold">
                        {Number(prod.price || 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(prod)}
                      className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-gold transition cursor-pointer shrink-0"
                      title="Ajouter au panier"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
