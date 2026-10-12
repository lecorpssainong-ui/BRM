import { useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints, Sparkles, BarChart2, AlertCircle, CheckCircle2, ShieldAlert, HeartPulse } from 'lucide-react';
import ToolCircularGauge from './ToolCircularGauge';
import ToolOracleAdvisor from './ToolOracleAdvisor';

export default function FootTensionTool() {
  const [weight, setWeight] = useState(68);
  const [shoeType, setShoeType] = useState(1); // 0: Talons, 1: Ville rigide, 2: Baskets amorties, 3: Sandales/Tongs, 4: Pieds nus
  const [standingHours, setStandingHours] = useState(6);
  const [archType, setArchType] = useState(0); // 0: Normale, 1: Pieds plats, 2: Pieds creux
  const [swelling, setSwelling] = useState(1); // 0: Jamais, 1: Parfois le soir, 2: Systématique / Pieds lourds
  const [mode, setMode] = useState('classic');

  // Calcul du score de Tension & Pression Podale (0 - 100%)
  let podoScore = 20;
  podoScore += (weight - 50) * 0.4;
  podoScore += standingHours * 5.5;

  // Chaussures
  if (shoeType === 0) podoScore += 26; // Talons
  if (shoeType === 1) podoScore += 16; // Rigide
  if (shoeType === 2) podoScore -= 8;  // Baskets amorties
  if (shoeType === 3) podoScore += 14; // Sandales plates

  // Morphologie voûte
  if (archType === 1) podoScore += 12; // Pieds plats
  if (archType === 2) podoScore += 14; // Pieds creux

  // Gonflement
  podoScore += swelling * 12;

  podoScore = Math.max(15, Math.min(99, Math.round(podoScore)));

  let podoStatus = 'Pression Équilibrée';
  let gaugeColor = 'emerald';
  if (podoScore >= 75) {
    podoStatus = 'Surcharge Podale Critique';
    gaugeColor = 'rose';
  } else if (podoScore >= 45) {
    podoStatus = 'Tension & Fatigue Modérées';
    gaugeColor = 'amber';
  }

  // Analyse des 3 zones clés du pied
  const heelStress = shoeType === 3 || standingHours >= 7 ? 'Élevé (Impacts calcanéum)' : 'Modéré';
  const archStress = shoeType === 0 || archType !== 0 ? 'Critique (Fascia étiré / écrasé)' : 'Normal';
  const forefootStress = shoeType === 0 ? 'Très Élevé (Pression métatarses)' : 'Normal';

  const shoeLabels = [
    'Talons hauts (> 4 cm)',
    'Chaussures de ville rigides',
    'Baskets / Semelles amortissantes',
    'Sandales plates / Tongs',
    'Pieds nus / Chaussons souples',
  ];

  const archLabels = ['Voûte standard', 'Pieds plats (effondrement)', 'Pieds creux (hyper-cambrure)'];
  const swellingLabels = ['Jamais', 'Parfois en fin de journée', 'Systématique / Jambes lourdes'];

  const metricsSummary = {
    'Poids': `${weight} kg`,
    'Chaussures habituelles': shoeLabels[shoeType],
    'Temps debout quotidien': `${standingHours} heures/jour`,
    'Type de voûte plantaire': archLabels[archType],
    'Sensations d\'échauffement / gonflement': swellingLabels[swelling],
    'Zone Talon (Calcanéum)': heelStress,
    'Zone Voûte (Fascia plantaire)': archStress,
    'Zone Avant-pied (Métatarses)': forefootStress,
    'Indice Global de Pression Podale': `${podoScore} % (${podoStatus})`,
  };

  return (
    <div className="space-y-6 font-body">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Paramètres Podologiques */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-gold" />
              <span>Bio-Mécanique Podale & Réflexologie</span>
            </span>
          </div>

          {/* Poids & Heures debout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-cacao/70 dark:text-sand/70">Poids</span>
                <span className="text-gold font-bold font-mono">{weight} kg</span>
              </div>
              <input
                type="range"
                min="40"
                max="160"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-cacao/70 dark:text-sand/70">Temps debout</span>
                <span className="text-gold font-bold font-mono">{standingHours} h / jour</span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                value={standingHours}
                onChange={(e) => setStandingHours(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Type de chaussures */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Chaussures dominantes portées en journée :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shoeLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setShoeType(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-left border cursor-pointer ${
                    shoeType === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Type de voûte */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Morphologie de la voûte plantaire :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {archLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setArchType(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-center border cursor-pointer ${
                    archType === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Gonflement / Échauffements */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cacao/70 dark:text-sand/70 block">
              Sensations de pieds lourds ou brûlures le soir :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {swellingLabels.map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSwelling(idx)}
                  className={`p-2 rounded-xl text-[11px] font-semibold transition text-center border cursor-pointer ${
                    swelling === idx
                      ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-xs'
                      : 'bg-white/60 dark:bg-stone-800 text-cacao/80 dark:text-sand/80 border-cacao/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panneau Jauge Pression Podale & Cartographie */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-stone-900/90 border border-amber-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <ToolCircularGauge
            value={podoScore}
            min={0}
            max={100}
            size={160}
            strokeWidth={12}
            unit="%"
            label={podoStatus}
            colorScheme={gaugeColor}
          />

          {/* Cartographie simplifiée des 3 zones du pied */}
          <div className="w-full space-y-2 pt-2 border-t border-cacao/10 dark:border-white/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Avant-Pied (Métatarses)</span>
              <span className={`font-mono font-bold ${shoeType === 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {forefootStress}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Voûte (Fascia Plantaire)</span>
              <span className={`font-mono font-bold ${archType !== 0 || shoeType === 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {archStress}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Talon (Calcanéum)</span>
              <span className={`font-mono font-bold ${standingHours >= 7 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {heelStress}
              </span>
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
              Diagnostic Podologique & Zones Réflexes
            </h4>
            <p className="leading-relaxed">
              Le pied supporte chaque jour des millions de pas. Votre score de tension ({podoScore}%) indique que les zones réflexes du <strong>système digestif</strong> (voûte) et du <strong>rachis lombaire</strong> (arête interne) sont sous pression mécanique. Une séance de <strong>Réflexologie Plantaire Thérapeutique (60 min)</strong> permet de libérer les adhérences aponévrotiques et de stimuler le retour veineux.
            </p>
          </div>
        )}

        {mode === 'oracle' && (
          <ToolOracleAdvisor
            toolId="foot"
            toolTitle="Cartographie de Tension Podale"
            metrics={metricsSummary}
            primaryScore={`${podoScore} %`}
            categoryLabel={podoStatus}
          />
        )}
      </div>
    </div>
  );
}
