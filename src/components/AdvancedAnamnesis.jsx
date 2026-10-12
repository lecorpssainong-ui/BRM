import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Sparkles,
  HeartPulse,
  Flame,
  Moon,
  Zap,
  Activity,
  Compass,
  CheckCircle2,
  FileDown,
  Share2,
  CalendarHeart,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { mockStore } from '@/lib/mockStore';
import { generateLuxuryAnamnesisPdf } from '@/lib/pdfReportGenerator';
import { toast } from '@/components/ui/toaster';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Pathologies pré-définies avec protocoles cliniques ciblés
const PATHOLOGY_OPTIONS = [
  {
    id: 'stress',
    title: 'Stress & Surcharge Mentale',
    subtitle: 'Nervosité, palpitations, tensions posturales et oppression',
    icon: Flame,
    color: 'from-amber-600 to-orange-700',
    symptomsList: [
      'Oppression thoracique et souffle court',
      'Tensions permanentes dans les trapèzes et la nuque',
      'Pensées incessantes et irritabilité',
      'Crispation des mâchoires (bruxisme)',
      'Perte d\'appétit ou fringales émotionnelles',
    ],
    defaultZones: ['Trapèzes & Nuque', 'Plexus Solaire', 'Crâne & Tempes'],
    recommendedMassage: 'Réflexologie Palmaire & Massage Crânien (45 min)',
    role: 'Apaisement immédiat du système nerveux central et relâchement oculaire',
  },
  {
    id: 'sleep',
    title: 'Insomnie & Sommeil Agité',
    subtitle: 'Endormissement difficile, réveils nocturnes et fatigue matinale',
    icon: Moon,
    color: 'from-indigo-600 to-purple-800',
    symptomsList: [
      'Plus de 45 minutes pour trouver le sommeil',
      'Réveils nocturnes fréquents entre 3h et 5h du matin',
      'Sensation de fatigue intense dès le réveil',
      'Cauchemars ou sommeil agité',
      'Agitation des jambes au coucher',
    ],
    defaultZones: ['Voûte Plantaire (Zone Épiphyse)', 'Nuque', 'Pieds & Chevilles'],
    recommendedMassage: 'Réflexologie Plantaire Thérapeutique (60 min)',
    role: 'Harmonisation neuro-végétative et réactivation des cycles de mélatonine',
  },
  {
    id: 'back',
    title: 'Douleurs Lombaires & Articulaires',
    subtitle: 'Bas du dos bloqué, sciatique, raideurs et courbatures',
    icon: Activity,
    color: 'from-emerald-700 to-teal-900',
    symptomsList: [
      'Douleur sourde ou élancement dans le bas du dos',
      'Irradiation dans la fesse ou la jambe (nerf sciatique)',
      'Difficulté à se pencher ou se redresser le matin',
      'Raideurs au niveau des épaules et du bassin',
      'Douleurs accentuées par la posture assise prolongée',
    ],
    defaultZones: ['Lombaires (Bas du dos)', 'Hanches & Fessiers', 'Colonne Vertébrale'],
    recommendedMassage: 'Massage Suédois Relaxant & Décontractant (75 min)',
    role: 'Dénouement des nœuds myo-fasciaux, oxygénation et libération articulaire',
  },
  {
    id: 'digest',
    title: 'Troubles Digestifs & Viscéraux',
    subtitle: 'Ballonnements, spasmes intestinaux, transit ralenti et stress au ventre',
    icon: Compass,
    color: 'from-amber-700 to-yellow-800',
    symptomsList: [
      'Ventre gonflé ou douloureux après chaque repas',
      'Transit irrégulier ou paresse intestinale',
      'Nœud permanent logé au creux de l\'estomac',
      'Digestion lourde et reflux gastriques',
      'Respiration bloquée dans le haut du thorax',
    ],
    defaultZones: ['Abdomen (Autour du nombril)', 'Plexus Solaire', 'Zones Réflexes Digestives du Pied'],
    recommendedMassage: 'Massage Abdominal Énergétique Chi Nei Tsang (60 min)',
    role: 'Détoxification des viscères, libération émotionnelle et relance du péristaltisme',
  },
  {
    id: 'fatigue',
    title: 'Fatigue Chronique & Épuisement',
    subtitle: 'Baisse d\'immunité, sensation de corps lourd et manque de tonus',
    icon: Zap,
    color: 'from-rose-700 to-red-900',
    symptomsList: [
      'Épuisement physique persistant malgré le repos',
      'Baisse de concentration et mémoire embrumée',
      'Sensibilité accrue aux maux de tête et rhumes',
      'Courbatures diffuses dans l\'ensemble du corps',
      'Manque d\'entrain et de motivation globale',
    ],
    defaultZones: ['Plante des Pieds (Zone Reins/Surrénales)', 'Colonne Vertébrale', 'Crâne'],
    recommendedMassage: 'Réflexologie Plantaire Thérapeutique (60 min)',
    role: 'Stimulation des glandes surrénales et recharge de l\'énergie vitale',
  },
  {
    id: 'circul',
    title: 'Mauvaise Circulation & Jambes Lourdes',
    subtitle: 'Chevilles gonflées, rétention d\'eau et engourdissements',
    icon: HeartPulse,
    color: 'from-cyan-700 to-blue-900',
    symptomsList: [
      'Pieds et chevilles gonflés en fin d\'après-midi',
      'Sensation de pesanteur et picotements dans les mollets',
      'Extrémités (mains et pieds) souvent froides',
      'Traces visibles de chaussettes ou chaussures serrées',
      'Engourdissements fréquents en position immobile',
    ],
    defaultZones: ['Mollets & Tibias', 'Chevilles & Tendons d\'Achille', 'Plante des Pieds'],
    recommendedMassage: 'Drainage Lymphatique Méthode Douce (75 min)',
    role: 'Désengorgement des membres inférieurs, activation du retour veineux et purification',
  },
];

const ALL_BODY_ZONES = [
  'Voûte plantaire (pieds)',
  'Chevilles & Tendons',
  'Mollets & Jambes',
  'Bas du dos (Lombaires)',
  'Haut du dos & Omoplates',
  'Trapèzes & Nuque',
  'Abdomen & Estomac',
  'Plexus Solaire',
  'Crâne & Tempes',
  'Mains & Poignets',
];

export default function AdvancedAnamnesis({ onComplete = () => {} }) {
  const profile = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [protocols, setProtocols] = useState(PATHOLOGY_OPTIONS);
  const [step, setStep] = useState(1); // 1: Pathologie, 2: Symptômes, 3: Intensité & Zones, 4: Antécédents, 5: Synthèse & Export
  const [selectedPathology, setSelectedPathology] = useState(PATHOLOGY_OPTIONS[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [intensity, setIntensity] = useState(7);
  const [selectedZones, setSelectedZones] = useState(PATHOLOGY_OPTIONS[0].defaultZones);
  const [precautions, setPrecautions] = useState('');
  const [isPregnantOrSurgery, setIsPregnantOrSurgery] = useState('non');
  const [savedReport, setSavedReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Chargement réactif des protocoles enregistrés dans le mockStore
  useEffect(() => {
    mockStore.getAnamnesisProtocols?.().then((list) => {
      if (list && list.length > 0) {
        const iconMap = {
          Flame,
          Moon,
          Activity,
          Compass,
          Zap,
          HeartPulse,
        };

        const mapped = list.map((p) => {
          let IconComp = Flame;
          if (p.icon) IconComp = p.icon;
          else if (p.icon_name && iconMap[p.icon_name]) IconComp = iconMap[p.icon_name];
          else if (p.id === 'sleep') IconComp = Moon;
          else if (p.id === 'back') IconComp = Activity;
          else if (p.id === 'digest') IconComp = Compass;
          else if (p.id === 'fatigue') IconComp = Zap;
          else if (p.id === 'circul') IconComp = HeartPulse;

          return { ...p, icon: IconComp };
        });

        setProtocols(mapped);
        setSelectedPathology(mapped[0]);
        setSelectedZones(mapped[0].defaultZones || []);
      }
    });
  }, []);

  // Initialisation des symptômes par défaut lors du choix de pathologie
  const handleSelectPathology = (patho) => {
    setSelectedPathology(patho);
    setSelectedSymptoms([patho.symptomsList[0], patho.symptomsList[1]]);
    setSelectedZones(patho.defaultZones);
    setStep(2);
  };

  const toggleSymptom = (symp) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symp) ? prev.filter((s) => s !== symp) : [...prev, symp]
    );
  };

  const toggleZone = (zone) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  // Finalisation du bilan clinique
  const handleFinalizeAnamnesis = async () => {
    setIsExporting(true);

    const clientName = profile?.name || 'Inès Lawson';
    const clientPhone = profile?.phone || '+229 97 00 00 00';
    const clientKey = profile?.client_key || 'client_demo';

    const reportData = {
      id: `anam-${Date.now()}`,
      reference: `BRM-ANAM-${Date.now().toString().slice(-6)}`,
      client_key: clientKey,
      client_name: clientName,
      client_phone: clientPhone,
      pathology: selectedPathology.title,
      intensity: Number(intensity),
      symptoms: selectedSymptoms,
      pain_zones: selectedZones,
      precautions: isPregnantOrSurgery === 'oui' ? `Signalé : ${precautions || 'Grossesse / Intervention'}` : 'Aucune contre-indication majeure',
      recommended_care: selectedPathology.recommendedMassage,
      role: selectedPathology.role,
      created_at: new Date().toISOString(),
    };

    try {
      // 1. Sauvegarde dans la table officielle 'anamneses' de Supabase
      if (user?.id) {
        try {
          const bodyMapNotes = selectedZones.map((zoneName) => ({
            zone: zoneName,
            intensity: Number(intensity),
            side: 'front',
            timestamp: new Date().toISOString(),
          }));

          const { error: sbAnamErr } = await supabase.from('anamneses').insert({
            user_id: user.id,
            patient_name: clientName,
            patient_phone: clientPhone,
            patient_email: user.email || null,
            data: reportData,
            body_map_notes: bodyMapNotes,
            therapist_notes: isPregnantOrSurgery === 'oui' ? `Signalé : ${precautions || 'Grossesse / Intervention'}` : null,
            protocol_recommended: selectedPathology.recommendedMassage,
          });

          if (sbAnamErr) {
            console.warn('[Supabase] Erreur enregistrement anamnèse:', sbAnamErr.message);
          }
        } catch (err) {
          console.warn('[Supabase] Exception anamnèse:', err);
        }
      }

      // 2. Sauvegarde de secours dans le mockStore
      await mockStore.saveAnamnesisEntry(reportData);

      setSavedReport(reportData);
      setStep(5);
      toast.success('Bilan clinique enregistré avec succès !', 'Disponible en PDF et archivé dans votre dossier patient.');

      onComplete?.(reportData);
    } catch (err) {
      console.error('Erreur enregistrement anamnèse:', err);
      toast.error('Erreur lors de la sauvegarde du bilan.');
    } finally {
      setIsExporting(false);
    }
  };

  // Téléchargement direct du PDF Luxueux
  const handleDownloadPdf = () => {
    if (!savedReport) return;
    try {
      const doc = generateLuxuryAnamnesisPdf(savedReport);
      doc.save(`Bilan-Vitalite-BRM-${savedReport.reference}.pdf`);
      toast.success('Téléchargement démarré !', 'Votre bilan au format PDF haute définition est prêt.');
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      toast.error('Échec de génération du PDF.');
    }
  };

  // Transmission par WhatsApp pré-rempli
  const handleShareWhatsApp = () => {
    if (!savedReport) return;
    const centerPhone = '22997000000';
    const message = encodeURIComponent(
      `🌿 Bonjour Bénin Réflexologie Massage,\n\nJe viens de remplir mon *Bilan Clinique de Vitalité* (Réf : ${savedReport.reference}).\n\n• *Patient(e)* : ${savedReport.client_name}\n• *Pathologie* : ${savedReport.pathology}\n• *Intensité de la gêne* : ${savedReport.intensity}/10\n• *Zones prioritaires* : ${savedReport.pain_zones.join(', ')}\n• *Soin conseillé* : ${savedReport.recommended_care}\n\nJe souhaite réserver ma séance adaptée avec vous.`
    );
    window.open(`https://wa.me/${centerPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-body text-cacao dark:text-sand">
      {/* En-tête Bilan */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-gold" />
            <span>Moteur d'Anamnèse Thérapeutique • Approche Personnalisée</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-medium text-cacao dark:text-sand mt-0.5">
            Bilan Clinique de Vitalité
          </h2>
          <p className="text-xs text-cacao/65 dark:text-sand/65 mt-1">
            Étape {step} sur 5 • Identifier précisément vos blocages pour un soin sur-mesure.
          </p>
        </div>

        {/* Barre de progression par étapes */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((st) => (
            <div
              key={st}
              className={`h-2 rounded-full transition-all duration-300 ${
                step >= st
                  ? 'w-6 bg-gold shadow-xs'
                  : 'w-2 bg-cacao/15 dark:bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ÉTAPE 1 : CHOIX DE LA PATHOLOGIE */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="font-display font-medium text-lg sm:text-xl text-cacao dark:text-sand">
              Quelle est votre problématique prioritaire ?
            </h3>
            <p className="text-xs text-cacao/65 dark:text-sand/65">
              Sélectionnez le motif principal de votre démarche pour adapter le protocole diagnostic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(protocols || []).map((patho) => {
              const Icon = patho.icon || Activity;
              return (
                <motion.div
                  key={patho.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPathology(patho)}
                  className="p-5 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-amber-500/20 hover:border-gold/60 shadow-md hover:shadow-xl transition cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${patho.color} text-white flex items-center justify-center shrink-0 shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-medium text-base text-cacao dark:text-sand leading-snug">
                        {patho.title}
                      </h4>
                      <p className="text-xs text-cacao/65 dark:text-sand/65 mt-1 leading-relaxed">
                        {patho.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cacao/10 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-gold">
                    <span>Démarrer le bilan</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ÉTAPE 2 : MANIFESTATIONS & SYMPTÔMES SPÉCIFIQUES */}
      {step === 2 && (
        <div className="space-y-5 p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-amber-500/20 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-cacao/10 dark:border-white/10">
            <div>
              <span className="text-[10px] uppercase font-bold text-gold tracking-wider">
                Pathologie : {selectedPathology.title}
              </span>
              <h3 className="font-display font-medium text-lg text-cacao dark:text-sand">
                Quels symptômes ressentez-vous au quotidien ?
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-cacao/60 hover:text-cacao dark:text-sand/60 transition"
            >
              Changer
            </button>
          </div>

          <p className="text-xs text-cacao/70 dark:text-sand/70">
            Cochez les manifestations qui correspondent le plus à votre état actuel :
          </p>

          <div className="space-y-2.5">
            {selectedPathology.symptomsList.map((symp) => {
              const isChecked = selectedSymptoms.includes(symp);
              return (
                <div
                  key={symp}
                  onClick={() => toggleSymptom(symp)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                    isChecked
                      ? 'bg-gold/15 border-gold ring-1 ring-gold/40 text-cacao dark:text-sand shadow-sm'
                      : 'bg-white/50 dark:bg-stone-800/50 border-cacao/10 dark:border-white/10 text-cacao/80 dark:text-sand/80 hover:bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                      isChecked
                        ? 'bg-gold border-gold text-stone-950 font-bold'
                        : 'border-cacao/30 dark:border-white/30'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{symp}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-3 border-t border-cacao/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-2xl bg-white/10 text-xs font-semibold text-cacao dark:text-sand cursor-pointer"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={selectedSymptoms.length === 0}
              className="btn-gold py-2.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-md cursor-pointer disabled:opacity-40"
            >
              Étape suivante : Intensité & Zones
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : INTENSITÉ & ZONES CORPORELLES */}
      {step === 3 && (
        <div className="space-y-6 p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-amber-500/20 shadow-md">
          <div className="space-y-1 pb-3 border-b border-cacao/10 dark:border-white/10">
            <h3 className="font-display font-medium text-lg text-cacao dark:text-sand">
              Évaluation de l'intensité et zones douloureuses
            </h3>
            <p className="text-xs text-cacao/65 dark:text-sand/65">
              Positionnez le niveau de gêne ressenti et pointez les zones du corps à soulager.
            </p>
          </div>

          {/* Curseur d'intensité 0 à 10 */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                Intensité de la gêne / douleur :
              </span>
              <span
                className={`font-mono text-base font-black px-3 py-0.5 rounded-full ${
                  intensity >= 7
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                    : 'bg-gold/20 text-gold border border-gold/30'
                }`}
              >
                {intensity} / 10
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />

            <div className="flex justify-between text-[10px] font-bold text-cacao/50 dark:text-sand/50">
              <span>1 - Très légère</span>
              <span>5 - Modérée supportable</span>
              <span>10 - Aiguë / Insupportable</span>
            </div>
          </div>

          {/* Sélecteur des zones corporelles */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand block">
              Sélectionnez les zones du corps tendues ou sensibles :
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_BODY_ZONES.map((zone) => {
                const isSelected = selectedZones.includes(zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => toggleZone(zone)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-gold text-stone-950 font-bold shadow-sm'
                        : 'bg-white/60 dark:bg-stone-800/60 text-cacao/70 dark:text-sand/70 hover:bg-white'
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-cacao/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-2xl bg-white/10 text-xs font-semibold text-cacao dark:text-sand cursor-pointer"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="btn-gold py-2.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-md cursor-pointer"
            >
              Étape suivante : Antécédents
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 4 : ANTÉCÉDENTS MÉDICAUX & SÉCURITÉ */}
      {step === 4 && (
        <div className="space-y-5 p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-amber-500/20 shadow-md">
          <div className="space-y-1 pb-3 border-b border-cacao/10 dark:border-white/10">
            <h3 className="font-display font-medium text-lg text-cacao dark:text-sand">
              Précautions d'usage & antécédents de santé
            </h3>
            <p className="text-xs text-cacao/65 dark:text-sand/65">
              Ces éléments garantissent une pratique en toute sécurité conforme aux règles de réflexologie.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-2">
              <label className="text-xs font-bold text-cacao dark:text-sand block">
                Êtes-vous enceinte ou avez-vous subi une intervention chirurgicale récente ?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="pregnant"
                    value="non"
                    checked={isPregnantOrSurgery === 'non'}
                    onChange={() => setIsPregnantOrSurgery('non')}
                    className="accent-amber-600"
                  />
                  <span>Non, aucune</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="pregnant"
                    value="oui"
                    checked={isPregnantOrSurgery === 'oui'}
                    onChange={() => setIsPregnantOrSurgery('oui')}
                    className="accent-amber-600"
                  />
                  <span>Oui, à préciser</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand block">
                Remarques ou antécédents particuliers (allergies, tensions, etc.) :
              </label>
              <textarea
                rows={3}
                value={precautions}
                onChange={(e) => setPrecautions(e.target.value)}
                placeholder="Ex : Sensibilité particulière à la cheville droite, chirurgie du genou en 2024..."
                className="w-full p-3.5 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-cacao/10 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-cacao/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-2xl bg-white/10 text-xs font-semibold text-cacao dark:text-sand cursor-pointer"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleFinalizeAnamnesis}
              className="btn-gold py-2.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Générer mon Bilan Clinique</span>
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 5 : SYNTHÈSE CLINIQUE & DOUBLE EXPORT (PDF + WHATSAPP) */}
      {step === 5 && savedReport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-stone-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-2xl"
        >
          {/* Badge Succès */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Bilan de Santé Clinique Finalisé</h4>
              <p className="text-xs text-emerald-200/80">
                Réf : {savedReport.reference} • Archivé dans votre espace et transmis à l'équipe.
              </p>
            </div>
          </div>

          {/* Synthèse Recommandation */}
          <div className="p-5 rounded-2xl bg-gold/10 border border-gold/30 space-y-2">
            <span className="text-[10px] uppercase font-bold text-gold tracking-wider block">
              Soin Recommandé par le Centre :
            </span>
            <h3 className="font-display font-medium text-xl sm:text-2xl text-cacao dark:text-sand">
              {savedReport.recommended_care}
            </h3>
            <p className="text-xs text-cacao/75 dark:text-sand/75 leading-relaxed">
              {savedReport.role}
            </p>
          </div>

          {/* Récapitulatif Rapide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-stone-800/50 border border-cacao/10">
              <span className="text-cacao/60 dark:text-sand/60 block text-[10px] uppercase font-bold">
                Pathologie
              </span>
              <strong className="text-cacao dark:text-sand mt-0.5 block truncate">
                {savedReport.pathology}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-stone-800/50 border border-cacao/10">
              <span className="text-cacao/60 dark:text-sand/60 block text-[10px] uppercase font-bold">
                Intensité
              </span>
              <strong className="text-gold mt-0.5 block">
                {savedReport.intensity} / 10
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-white/50 dark:bg-stone-800/50 border border-cacao/10">
              <span className="text-cacao/60 dark:text-sand/60 block text-[10px] uppercase font-bold">
                Zones sensibles
              </span>
              <strong className="text-cacao dark:text-sand mt-0.5 block truncate">
                {(savedReport.pain_zones || []).length} zone(s)
              </strong>
            </div>
          </div>

          {/* DOUBLE EXPORT : PDF LUXE & TRANSMISSION WHATSAPP */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full sm:flex-1 btn-gold py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Télécharger le Bilan PDF Luxueux</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <Phone className="w-4 h-4" />
              <span>Transmettre par WhatsApp au Secrétariat</span>
            </button>
          </div>

          {/* Bouton Réserver la séance recommandée */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate(`/rendez-vous?tab=book&massage=${encodeURIComponent(savedReport.recommended_care)}`)}
              className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <CalendarHeart className="w-3.5 h-3.5" />
              <span>Planifier mon rendez-vous pour ce soin</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
