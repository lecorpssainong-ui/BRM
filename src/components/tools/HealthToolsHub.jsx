import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Droplet,
  HeartPulse,
  Moon,
  UserCheck,
  Footprints,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Activity,
  BookmarkPlus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Sliders,
  History,
} from 'lucide-react';
import ImcTool from './ImcTool';
import HydrationTool from './HydrationTool';
import CardioStressTool from './CardioStressTool';
import SleepEnergyTool from './SleepEnergyTool';
import PostureErgoTool from './PostureErgoTool';
import FootTensionTool from './FootTensionTool';
import { mockStore, useMockStore } from '@/lib/mockStore';
import { useProfile } from '@/lib/clientProfile';
import { toast } from '@/components/ui/toaster';

export const HEALTH_TOOLS_LIST = [
  {
    id: 'imc',
    title: 'IMC & Composition Corporelle',
    subtitle: 'Masse grasse estimée, ratio taille/hanches et analyse morphologique complète.',
    icon: Scale,
    color: 'from-amber-600 to-amber-700',
    borderColor: 'border-amber-500/30',
    glowColor: 'bg-amber-500/15',
    component: ImcTool,
    tag: 'Morphologie',
  },
  {
    id: 'hydration',
    title: 'Hydratation & Électrolytes',
    subtitle: 'Besoins en eau selon le climat tropical de Cotonou, sport et recharge minérale.',
    icon: Droplet,
    color: 'from-sky-600 to-cyan-700',
    borderColor: 'border-sky-500/30',
    glowColor: 'bg-sky-500/15',
    component: HydrationTool,
    tag: 'Métabolisme',
  },
  {
    id: 'cardio',
    title: 'Cardio-Respiratoire & Stress',
    subtitle: 'Fréquence de repos, variabilité cardiaque et score de résilience neuro-végétatif.',
    icon: HeartPulse,
    color: 'from-rose-600 to-red-700',
    borderColor: 'border-rose-500/30',
    glowColor: 'bg-rose-500/15',
    component: CardioStressTool,
    tag: 'Système Nerveux',
  },
  {
    id: 'sleep',
    title: 'Énergie Vitale & Sommeil',
    subtitle: 'Cycles circadiens, qualité de récupération et jauge d\'énergie vitale sur 100%.',
    icon: Moon,
    color: 'from-purple-600 to-indigo-800',
    borderColor: 'border-purple-500/30',
    glowColor: 'bg-purple-500/15',
    component: SleepEnergyTool,
    tag: 'Chronobiologie',
  },
  {
    id: 'posture',
    title: 'Score Postural & Ergonomie',
    subtitle: 'Impact du travail devant écran, contractures cervicales et décompression vertébrale.',
    icon: UserCheck,
    color: 'from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500/30',
    glowColor: 'bg-emerald-500/15',
    component: PostureErgoTool,
    tag: 'Biomécanique',
  },
  {
    id: 'foot',
    title: 'Cartographie Tension Podale',
    subtitle: 'Pression des appuis, type de chaussures et bilan réflexologique des zones réflexes.',
    icon: Footprints,
    color: 'from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/30',
    glowColor: 'bg-amber-500/15',
    component: FootTensionTool,
    tag: 'Spécialité BRM',
  },
];

export default function HealthToolsHub() {
  const profile = useProfile();
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Lecture réactive des bilans sauvegardés
  const { data: savedReports, refetch: refetchReports } = useMockStore(
    'health_reports',
    (store) => store.getHealthReports(profile?.client_key)
  );

  const reportsList = Array.isArray(savedReports) ? savedReports : [];

  const activeTool = HEALTH_TOOLS_LIST.find((t) => t.id === selectedToolId);
  const ActiveComponent = activeTool ? activeTool.component : null;

  const handleDeleteReport = async (e, id) => {
    e.stopPropagation();
    try {
      await mockStore.deleteHealthReport(id);
      toast.success('Évaluation retirée de l\'historique.');
      refetchReports();
    } catch (err) {
      toast.error('Erreur de suppression.');
    }
  };

  return (
    <div className="space-y-6 font-body text-cacao dark:text-sand">
      {/* EN-TÊTE DU HUB DE SANTÉ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biométrie & Bilans Thérapeutiques • Sanctuaire BRM</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-medium text-cacao dark:text-sand mt-0.5">
            Hub de Santé Holistique & Oracle IA
          </h2>
          <p className="text-xs text-cacao/65 dark:text-sand/65 mt-1 max-w-xl leading-relaxed">
            Mesurez vos biomarqueurs essentiels à l'aide de curseurs dynamiques, visualisez vos jauges en temps réel et activez l'Oracle IA pour générer votre ordonnance personnalisée.
          </p>
        </div>

        {/* Bouton Historique des Bilans */}
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-stone-800/80 hover:bg-gold/20 text-xs font-bold transition flex items-center gap-2 border border-cacao/10 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-gold" />
          <span>Mes Bilans ({reportsList.length})</span>
        </button>
      </div>

      {/* VUE GRILLE DES 6 OUTILS (SI AUCUN OUTIL SÉLECTIONNÉ) */}
      {!selectedToolId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {HEALTH_TOOLS_LIST.map((tool) => {
            const Icon = tool.icon;

            return (
              <motion.div
                key={tool.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedToolId(tool.id)}
                className={`p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border ${tool.borderColor} shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden group`}
              >
                {/* Lueur de fond subtile */}
                <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${tool.glowColor} blur-2xl group-hover:scale-125 transition-transform duration-500`} />

                <div className="space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/60 dark:bg-stone-800 text-cacao/70 dark:text-sand/70 border border-cacao/5">
                      {tool.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-medium text-lg text-cacao dark:text-sand group-hover:text-gold transition">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-cacao/65 dark:text-sand/65 mt-1 leading-relaxed">
                      {tool.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-cacao/10 dark:border-white/10 flex items-center justify-between text-xs font-bold text-gold z-10">
                  <span>Calculer & Analyser</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* VUE DÉTAILLÉE DE L'OUTIL SÉLECTIONNÉ */}
      {selectedToolId && activeTool && (
        <motion.div
          key={selectedToolId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {/* Barre de navigation & retour */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-cacao/10 shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedToolId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-cacao/80 dark:text-sand/80 hover:text-gold transition cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la grille des outils</span>
            </button>

            {/* Sélecteur rapide d'outils */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {HEALTH_TOOLS_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedToolId(t.id)}
                  className={`p-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedToolId === t.id
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                      : 'bg-white/40 dark:bg-stone-800 text-cacao/70 dark:text-sand/70 hover:bg-white/70'
                  }`}
                  title={t.title}
                >
                  <t.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Rendu dynamique de l'outil interactif */}
          {ActiveComponent && <ActiveComponent />}
        </motion.div>
      )}

      {/* MODAL HISTORIQUE DES BILANS DE SANTÉ */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowHistoryModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: 'rgb(var(--sand))',
              color: 'rgb(var(--cacao))',
              borderColor: 'rgb(var(--cacao) / 0.18)',
            }}
            className="relative z-10 max-w-2xl w-full p-6 sm:p-7 rounded-3xl border shadow-2xl backdrop-blur-2xl space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-cacao/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gold" />
                <h3 className="font-display font-medium text-lg">
                  Historique de vos Bilans & Évaluations ({reportsList.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-cacao/60 dark:text-sand/60 hover:text-gold text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {reportsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-cacao/60 dark:text-sand/60 space-y-1">
                <p>Aucune évaluation sauvegardée pour le moment.</p>
                <p>Utilisez l'un des 6 outils et cliquez sur "Sauvegarder" dans l'Oracle IA pour archiver vos résultats.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportsList.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-cacao/10 dark:border-white/10 flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-display text-gold">{rep.tool_title || rep.tool_id}</strong>
                      <span className="text-[10px] text-cacao/50 dark:text-sand/50">
                        {rep.created_at ? new Date(rep.created_at).toLocaleDateString('fr-FR') : 'Récent'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-gold font-bold font-mono">
                        {rep.primary_score}
                      </span>
                      <span className="font-semibold text-cacao/80 dark:text-sand/80">
                        {rep.category_label}
                      </span>
                    </div>

                    {rep.oracle_analysis && (
                      <p className="text-xs text-cacao/70 dark:text-sand/70 line-clamp-2 italic pt-1 border-t border-cacao/5 dark:border-white/5">
                        « {rep.oracle_analysis} »
                      </p>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReport(e, rep.id)}
                        className="text-rose-500 hover:text-rose-400 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
