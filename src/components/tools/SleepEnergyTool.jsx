import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sparkles, BarChart2, BatteryCharging, Zap, Bed, Clock } from 'lucide-react';
import ToolCircularGauge from './ToolCircularGauge';
import ToolOracleAdvisor from './ToolOracleAdvisor';

export default function SleepEnergyTool() {
  const [sleepHours, setSleepHours] = useState(6.5);
  const [wakeUps, setWakeUps] = useState(1); // 0: 0, 1: 1-2, 2: 3+
  const [fallAsleepTime, setFallAsleepTime] = useState(1); // 0: <15min, 1: 15-45min, 2: >45min
  const [morningFatigue, setMorningFatigue] = useState(5); // 1 (frais) à 10 (épuisé)
  const [afternoonSlump, setAfternoonSlump] = useState(true);
  const [mode, setMode] = useState('classic');

  // Calcul du score d'Énergie Vitale (0 - 100%)
  let vitalEnergy = 100;
  // Pénalité durée
  if (sleepHours < 7) vitalEnergy -= (7 - sleepHours) * 12;
  if (sleepHours > 9.5) vitalEnergy -= (sleepHours - 9.5) * 8;
  // Pénalité réveils
  vitalEnergy -= wakeUps * 14;
  // Pénalité endormissement
  vitalEnergy -= fallAsleepTime * 10;
  // Pénalité fatigue au réveil
  vitalEnergy -= morningFatigue * 4;
  // Coup de barre
  if (afternoonSlump) vitalEnergy -= 8;

  vitalEnergy = Math.max(12, Math.min(99, Math.round(vitalEnergy)));

  let energyStatus = 'Énergie Optimale';
  let gaugeColor = 'emerald';
  if (vitalEnergy < 45) {
    energyStatus = 'Épuisement & Dette Critique';
    gaugeColor = 'rose';
  } else if (vitalEnergy < 70) {
    energyStatus = 'Énergie Modérée (Fatigue Latente)';
    gaugeColor = 'amber';
  }

  const wakeLabels = ['Aucun réveil', '1 à 2 micro-réveils', '3+ réveils / Nuit hachée'];
  const fallAsleepLabels = ['Rapide (< 15 min)', 'Modéré (15-45 min)', 'Difficile (> 45 min)'];

  const metricsSummary = {
    'Durée du Sommeil': `${sleepHours} heures/nuit`,
    'Réveils Nocturnes': wakeLabels[wakeUps],
    'Délai d\'Endormissement': fallAsleepLabels[fallAsleepTime],
    'Niveau de Fatigue au Réveil': `${morningFatigue} / 10`,
    'Coup de barre en après-midi': afternoonSlump ? 'Oui' : 'Non',
    'Score d\'Énergie Vitale': `${vitalEnergy} % (${energyStatus})`,
  };

  return (
    <div className="space-y-6 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paramètres de Sommeil */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Qualité du Sommeil & Cycles Circadiens</span>
            </span>
          </div>

          {/* Heures de sommeil */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>Heures effectives de sommeil</span>
              </span>
              <span className="text-purple-500 dark:text-purple-400 font-bold font-mono text-sm">
                {sleepHours} h / nuit
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="11"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Délai d'endormissement */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Temps nécessaire pour vous endormir :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {fallAsleepLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFallAsleepTime(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-center border cursor-pointer ${
                    fallAsleepTime === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Réveils nocturnes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Fréquence des réveils pendant la nuit :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {wakeLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setWakeUps(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-center border cursor-pointer ${
                    wakeUps === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Fatigue matinale */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70">Sensation de fatigue au réveil</span>
              <span className="text-gold font-bold font-mono">{morningFatigue} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={morningFatigue}
              onChange={(e) => setMorningFatigue(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Coup de barre en journée */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-cacao dark:text-sand cursor-pointer">
            <input
              type="checkbox"
              checked={afternoonSlump}
              onChange={(e) => setAfternoonSlump(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
            />
            <span>Baisse d'énergie brutale ressentie en milieu d'après-midi (14h-16h)</span>
          </label>
        </div>

        {/* Panneau Jauge Énergie */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-stone-900/90 border border-amber-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <ToolCircularGauge
            value={vitalEnergy}
            min={0}
            max={100}
            size={160}
            strokeWidth={12}
            unit="%"
            label={energyStatus}
            colorScheme={gaugeColor}
          />

          <div className="w-full space-y-2 pt-2 border-t border-cacao/10 dark:border-white/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Cycles de Mélatonine</span>
              <strong className="text-purple-600 dark:text-purple-400 font-bold">
                {wakeUps === 0 && sleepHours >= 7 ? 'Synchronisés' : 'Perturbés'}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Points Réflexes Cibles</span>
              <strong className="text-gold font-bold">
                Épiphyse, Hypophyse & Reins
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
              Diagnostic Chronobiologique & Énergie
            </h4>
            <p className="leading-relaxed">
              Votre réserve d'énergie vitale est à <strong>{vitalEnergy}%</strong>. Pour relancer la production nocturne de mélatonine et calmer l'activité cérébrale, une séance de <strong>Réflexologie Plantaire Thérapeutique</strong> centrée sur la zone réflexe du gros orteil (épiphyse) et les glandes surrénales recharge en profondeur votre vitalité.
            </p>
          </div>
        )}

        {mode === 'oracle' && (
          <ToolOracleAdvisor
            toolId="sleep"
            toolTitle="Énergie Vitale & Sommeil"
            metrics={metricsSummary}
            primaryScore={`${vitalEnergy} %`}
            categoryLabel={energyStatus}
          />
        )}
      </div>
    </div>
  );
}
