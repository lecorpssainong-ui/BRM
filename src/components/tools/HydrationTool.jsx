import { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Sparkles, BarChart2, Sun, Zap, GlassWater, Coffee } from 'lucide-react';
import ToolCircularGauge from './ToolCircularGauge';
import ToolOracleAdvisor from './ToolOracleAdvisor';

export default function HydrationTool() {
  const [weight, setWeight] = useState(68);
  const [temperature, setTemperature] = useState(31); // Climat tropical Cotonou
  const [activityLevel, setActivityLevel] = useState(1); // 0: Sédentaire, 1: Modéré, 2: Intense, 3: Athlète
  const [caffeineCups, setCaffeineCups] = useState(1);
  const [mode, setMode] = useState('classic');

  // Calcul du volume optimal
  const baseWater = weight * 0.035;
  const heatFactor = temperature > 24 ? (temperature - 24) * 0.035 : 0;
  const activityFactor = activityLevel * 0.4;
  const caffeineFactor = caffeineCups * 0.08;

  const totalLitres = Number((baseWater + heatFactor + activityFactor + caffeineFactor).toFixed(2));
  const totalGlasses = Math.ceil(totalLitres / 0.25); // Verres de 250ml

  const activityLabels = [
    'Sédentaire (Bureau / Repos)',
    'Modéré (30-60 min d\'activité / marche)',
    'Intense (> 1h de sport ou travail actif)',
    'Très intense / Travailleur en plein soleil',
  ];

  let hydraStatus = 'Hydratation Standard';
  let hydraColor = 'cyan';
  if (totalLitres > 3.2) {
    hydraStatus = 'Besoins Élevés (Forte Chaleur / Activité)';
    hydraColor = 'purple';
  } else if (totalLitres < 2.0) {
    hydraStatus = 'Besoins Modérés';
    hydraColor = 'emerald';
  }

  const metricsSummary = {
    'Poids': `${weight} kg`,
    'Température ambiante': `${temperature} °C`,
    'Niveau d\'activité': activityLabels[activityLevel],
    'Café / Thé quotidien': `${caffeineCups} tasse(s)`,
    'Besoin Total en Eau': `${totalLitres} Litres/jour`,
    'Équivalent en Verres (250ml)': `${totalGlasses} verres`,
    'Recharge Électrolytes': temperature > 30 || activityLevel >= 2 ? 'Forte (Magnésium + Potassium recommandé)' : 'Standard',
  };

  return (
    <div className="space-y-6 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paramètres d'Hydratation */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-sky-500" />
              <span>Paramètres Métaboliques & Environnement</span>
            </span>
          </div>

          {/* Poids */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70">Poids corporel</span>
              <span className="text-gold font-bold font-mono">{weight} kg</span>
            </div>
            <input
              type="range"
              min="35"
              max="160"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Température ambiante (Cotonou / Bénin) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Température ambiante actuelle</span>
              </span>
              <span className="text-amber-600 font-bold font-mono">{temperature} °C</span>
            </div>
            <input
              type="range"
              min="18"
              max="45"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Niveau d'activité */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Niveau d'effort physique quotidien :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activityLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivityLevel(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-left border cursor-pointer ${
                    activityLevel === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Café / Thé */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
                <span>Café ou thé consommé</span>
              </span>
              <span className="text-gold font-bold font-mono">{caffeineCups} tasse(s)/jour</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={caffeineCups}
              onChange={(e) => setCaffeineCups(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Panneau Jauge Circulaire & Verres */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-stone-900/90 border border-amber-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <ToolCircularGauge
            value={totalLitres}
            min={1.0}
            max={5.0}
            size={160}
            strokeWidth={12}
            unit="L / jour"
            label={hydraStatus}
            colorScheme={hydraColor}
          />

          <div className="w-full space-y-2.5 pt-2 border-t border-cacao/10 dark:border-white/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65 flex items-center gap-1">
                <GlassWater className="w-3.5 h-3.5 text-sky-500" />
                <span>Équivalent en verres</span>
              </span>
              <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold text-sm">
                ~ {totalGlasses} verres (250 ml)
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Électrolytes recommandés</span>
              </span>
              <strong className="text-gold font-mono font-bold">
                Eau de coco / Magnésium
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
              Protocole d'Hydratation & Drainage
            </h4>
            <p className="leading-relaxed">
              Sous le climat chaud de Cotonou ({temperature}°C), buvez de petites gorgées réparties sur la journée. Prenez impérativement 1 grand verre d'eau tempérée à la fin de chaque séance de massage ou réflexologie pour faciliter le drainage lymphatique des acides métaboliques.
            </p>
          </div>
        )}

        {mode === 'oracle' && (
          <ToolOracleAdvisor
            toolId="hydration"
            toolTitle="Hydratation & Électrolytes"
            metrics={metricsSummary}
            primaryScore={`${totalLitres} L / jour`}
            categoryLabel={hydraStatus}
          />
        )}
      </div>
    </div>
  );
}
