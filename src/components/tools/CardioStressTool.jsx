import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Sparkles, BarChart2, Activity, Wind, Flame } from 'lucide-react';
import ToolCircularGauge from './ToolCircularGauge';
import ToolOracleAdvisor from './ToolOracleAdvisor';

export default function CardioStressTool() {
  const [age, setAge] = useState(35);
  const [restingHr, setRestingHr] = useState(68);
  const [vrcLevel, setVrcLevel] = useState(1); // 0: Basse/Rigide, 1: Normale, 2: Excellente/Fluide
  const [breathType, setBreathType] = useState(0); // 0: Courte/Thoracique, 1: Moyenne, 2: Abdominale profonde
  const [stressLevel, setStressLevel] = useState(6); // 1 à 10
  const [mode, setMode] = useState('classic');

  const maxHr = 220 - age;
  const reserve = maxHr - restingHr;
  const recoveryZoneMax = Math.round(restingHr + reserve * 0.5);

  // Score d'Adaptation & Résilience au Stress (0 à 100%)
  // Base 100 - pénalités FC repos élevée, stress haut, respiration courte + bonus VRC
  let stressScore = 100;
  if (restingHr > 75) stressScore -= (restingHr - 75) * 1.5;
  stressScore -= stressLevel * 4.5;
  if (breathType === 0) stressScore -= 15;
  if (breathType === 2) stressScore += 10;
  if (vrcLevel === 0) stressScore -= 12;
  if (vrcLevel === 2) stressScore += 12;

  stressScore = Math.max(10, Math.min(98, Math.round(stressScore)));

  let resilienceLabel = 'Bonne Résilience';
  let gaugeColor = 'emerald';
  if (stressScore < 45) {
    resilienceLabel = 'Surcharge & Tensions Aiguës';
    gaugeColor = 'rose';
  } else if (stressScore < 70) {
    resilienceLabel = 'Adaptation Modérée';
    gaugeColor = 'amber';
  }

  const vrcLabels = ['Faible / Rythme figé', 'Normale / Équilibrée', 'Excellente / Grande souplesse'];
  const breathLabels = [
    'Courte & bloquée dans le thorax',
    'Intermédiaire',
    'Ample, ventrale & décontractée',
  ];

  const metricsSummary = {
    'Âge': `${age} ans`,
    'Fréquence Cardiaque Repos': `${restingHr} bpm`,
    'FC Maximale Théorique': `${maxHr} bpm`,
    'Zone de Récupération Végétative': `< ${recoveryZoneMax} bpm`,
    'Variabilité Cardiaque Perçue': vrcLabels[vrcLevel],
    'Type de Respiration': breathLabels[breathType],
    'Niveau de Stress Déclaré': `${stressLevel} / 10`,
    'Score Global de Résilience': `${stressScore} % (${resilienceLabel})`,
  };

  return (
    <div className="space-y-6 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paramètres Cardio-Respiratoires */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Biométrie Cardiaque & Système Neuro-Végétatif</span>
            </span>
          </div>

          {/* Âge & FC Repos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-cacao/70 dark:text-sand/70">Âge</span>
                <span className="text-gold font-bold font-mono">{age} ans</span>
              </div>
              <input
                type="range"
                min="16"
                max="85"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-cacao/70 dark:text-sand/70">FC Repos</span>
                <span className="text-rose-500 font-bold font-mono">{restingHr} bpm</span>
              </div>
              <input
                type="range"
                min="45"
                max="110"
                value={restingHr}
                onChange={(e) => setRestingHr(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Type de respiration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-sky-500" />
              <span>Qualité & amplitude de votre respiration :</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {breathLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBreathType(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-left border cursor-pointer ${
                    breathType === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Variabilité perçue (VRC) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Souplesse cardiaque & capacité d'apaisement :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {vrcLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setVrcLevel(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-center border cursor-pointer ${
                    vrcLevel === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau de stress */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Pression mentale & stress ressenti</span>
              </span>
              <span className="text-gold font-bold font-mono">{stressLevel} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Panneau Jauge Résilience */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-stone-900/90 border border-amber-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <ToolCircularGauge
            value={stressScore}
            min={0}
            max={100}
            size={160}
            strokeWidth={12}
            unit="%"
            label={resilienceLabel}
            colorScheme={gaugeColor}
          />

          <div className="w-full space-y-2 pt-2 border-t border-cacao/10 dark:border-white/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Zone de Récupération (Parasympathique)</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                &lt; {recoveryZoneMax} bpm
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Zone d'Action Réflexologique</span>
              <strong className="text-gold font-bold">
                Plexus Solaire & Diaphragme
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
              Analyse de l'Équilibre Sympathique / Parasympathique
            </h4>
            <p className="leading-relaxed">
              Votre score de résilience ({stressScore}%) traduit la capacité de votre cœur à récupérer après un pic de tension. En réflexologie plantaire, la stimulation des points réflexes du <strong>Plexus Solaire</strong> et des <strong>Surrénales</strong> permet de désamorcer la surproduction de cortisol et de restaurer le calme intérieur.
            </p>
          </div>
        )}

        {mode === 'oracle' && (
          <ToolOracleAdvisor
            toolId="cardio"
            toolTitle="Cardio-Respiratoire & Stress"
            metrics={metricsSummary}
            primaryScore={`${stressScore} %`}
            categoryLabel={resilienceLabel}
          />
        )}
      </div>
    </div>
  );
}
