import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Sparkles, BarChart2, Monitor, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import ToolCircularGauge from './ToolCircularGauge';
import ToolOracleAdvisor from './ToolOracleAdvisor';

export default function PostureErgoTool() {
  const [workPosition, setWorkPosition] = useState(0); // 0: Assis écran, 1: Debout statique, 2: Mixte actif
  const [screenHours, setScreenHours] = useState(8);
  const [neckPain, setNeckPain] = useState(1); // 0: Aucune, 1: Modérée, 2: Sévère
  const [chairQuality, setChairQuality] = useState(1); // 0: Basique/Tabouret, 1: Standard, 2: Ergonomique
  const [stretchingBreaks, setStretchingBreaks] = useState(false);
  const [mode, setMode] = useState('classic');

  // Calcul de l'Indice de Fatigue & Tension Posturale (0 - 100%)
  let postureTension = 15;
  if (workPosition === 0) postureTension += 25; // Assis prolongé
  if (workPosition === 1) postureTension += 20; // Debout prolongé
  postureTension += screenHours * 4;
  postureTension += neckPain * 18;
  if (chairQuality === 0) postureTension += 12;
  if (chairQuality === 2) postureTension -= 10;
  if (stretchingBreaks) postureTension -= 12;

  postureTension = Math.max(10, Math.min(99, Math.round(postureTension)));

  let postureStatus = 'Posture Équilibrée';
  let gaugeColor = 'emerald';
  if (postureTension >= 70) {
    postureStatus = 'Risque Élevé de Blocage';
    gaugeColor = 'rose';
  } else if (postureTension >= 45) {
    postureStatus = 'Tensions Modérées Accumulées';
    gaugeColor = 'amber';
  }

  const positionLabels = [
    'Assis prolongé (Bureau / Écran)',
    'Debout statique (Comptoir / Atelier)',
    'Mixte, actif & mobile',
  ];

  const neckLabels = ['Aucune gêne', 'Tensions légères le soir', 'Douleurs permanentes & raideurs'];
  const chairLabels = ['Siège basique / Tabouret', 'Chaise de bureau standard', 'Siège ergonomique avec soutien lombaire'];

  const metricsSummary = {
    'Posture dominante': positionLabels[workPosition],
    'Temps d\'écran quotidien': `${screenHours} heures/jour`,
    'Tensions Cervicales / Trapèzes': neckLabels[neckPain],
    'Ergonomie de l\'assise': chairLabels[chairQuality],
    'Pauses & Micro-étirements': stretchingBreaks ? 'Régulières' : 'Rares ou absentes',
    'Indice de Tension Posturale': `${postureTension} % (${postureStatus})`,
  };

  return (
    <div className="space-y-6 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paramètres Posturaux */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Facteurs Ergonomiques & Contraintes Posturales</span>
            </span>
          </div>

          {/* Position de travail */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Position de travail principale au quotidien :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {positionLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setWorkPosition(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-left border cursor-pointer ${
                    workPosition === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Heures devant écran */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-gold" />
                <span>Heures passées devant un écran</span>
              </span>
              <span className="text-gold font-bold font-mono text-sm">{screenHours} h / jour</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              value={screenHours}
              onChange={(e) => setScreenHours(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Douleurs cervicales */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Niveau de raideur cervicale & trapèzes :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {neckLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNeckPain(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-center border cursor-pointer ${
                    neckPain === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Siège ergonomique */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Ergonomie de votre assise :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {chairLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChairQuality(idx)}
                  className={`p-2 rounded-xl text-[10px] font-semibold transition text-center border cursor-pointer ${
                    chairQuality === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Pauses étirements */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-cacao dark:text-sand cursor-pointer">
            <input
              type="checkbox"
              checked={stretchingBreaks}
              onChange={(e) => setStretchingBreaks(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
            />
            <span>Je fais des pauses d'étirements et de respiration toutes les 90 minutes</span>
          </label>
        </div>

        {/* Panneau Jauge Posture */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-stone-900/90 border border-amber-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <ToolCircularGauge
            value={postureTension}
            min={0}
            max={100}
            size={160}
            strokeWidth={12}
            unit="%"
            label={postureStatus}
            colorScheme={gaugeColor}
          />

          <div className="w-full space-y-2 pt-2 border-t border-cacao/10 dark:border-white/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Zones Myofasciales en Surcharge</span>
              <strong className="text-rose-600 dark:text-rose-400 font-bold">
                {neckPain > 0 ? 'Nuque, Trapèzes & Lombaires' : 'Lombaires & Yeux'}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Protocole Décontractant Conseillé</span>
              <strong className="text-gold font-bold">
                Massage Suédois Décontractant
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* SWITCH CLASSIQUE VS ORACLE IA */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/70 dark:bg-stone-800/80 border border-cacao/10 shadow-sm">
            <button
              type="button"
              onClick={() => setMode('classic')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'classic'
                  ? 'bg-cacao text-sand shadow-sm'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-gold" />
              <span>Algorithme Classique</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('oracle')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'oracle'
                  ? 'bg-cacao text-sand shadow-sm'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Analyse IA Profonde</span>
            </button>
          </div>
        </div>

        {mode === 'classic' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 space-y-3 text-xs sm:text-sm text-cacao/80 dark:text-sand/80">
            <h4 className="font-display font-medium text-base text-cacao dark:text-sand">
              Diagnostic Biomécanique & Chaînes Musculaires
            </h4>
            <p className="leading-relaxed">
              La posture statique prolongée ({screenHours}h d'écran) bloque les trapèzes supérieurs et comprime les disques L4-L5. Nous vous recommandons d'alterner les postures de travail et de dénouer les adhérences myo-fasciales par un <strong>Massage Suédois Décontractant</strong> associé à un soin ciblé <strong>Nuque & Crâne</strong>.
            </p>
          </div>
        )}

        {mode === 'oracle' && (
          <ToolOracleAdvisor
            toolId="posture"
            toolTitle="Score Postural & Ergonomie"
            metrics={metricsSummary}
            primaryScore={`${postureTension} %`}
            categoryLabel={postureStatus}
          />
        )}
      </div>
    </div>
  );
}
