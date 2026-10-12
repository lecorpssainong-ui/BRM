import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Sparkles, BarChart2, Activity, User, HeartPulse, Info } from 'lucide-react';
import ToolCircularGauge from './ToolCircularGauge';
import ToolOracleAdvisor from './ToolOracleAdvisor';

export default function ImcTool() {
  const [gender, setGender] = useState('f'); // 'h' | 'f'
  const [age, setAge] = useState(32);
  const [height, setHeight] = useState(168);
  const [weight, setWeight] = useState(64);
  const [waist, setWaist] = useState(74);
  const [hips, setHips] = useState(98);
  const [isPregnant, setIsPregnant] = useState(false);
  const [mode, setMode] = useState('classic'); // 'classic' | 'oracle'

  // Calculs
  const heightM = height / 100;
  const imc = Number((weight / (heightM * heightM)).toFixed(1));

  // Estimation Masse Grasse (Formule Deurenberg)
  const fatMassPercent = Number(
    (
      1.2 * imc +
      0.23 * age -
      10.8 * (gender === 'h' ? 1 : 0) -
      5.4
    ).toFixed(1)
  );

  // Ratio Taille / Hanches (RTH)
  const rth = Number((waist / hips).toFixed(2));

  // Classification IMC
  let imcCategory = 'Poids normal';
  let imcColor = 'emerald';
  let imcAdvice = 'Votre indice de masse corporelle est harmonieux. Maintenez vos séances de bien-être préventives et une hydratation constante.';

  if (imc < 18.5) {
    imcCategory = 'Insuffisance pondérale';
    imcColor = 'amber';
    imcAdvice = 'Léger déficit de masse corporelle. Privilégiez des soins relaxants doux comme le Massage Crânien et une nutrition régénérante.';
  } else if (imc >= 25 && imc < 30) {
    imcCategory = 'Surpoids modéré';
    imcColor = 'amber';
    imcAdvice = 'Un drainage lymphatique et des massages décontractants réguliers favorisent l’élimination des toxines et la légèreté des membres.';
  } else if (imc >= 30) {
    imcCategory = 'Obésité (Zone d\'attention)';
    imcColor = 'rose';
    imcAdvice = 'Une surcharge métabolique est constatée. Des séances de Drainage Lymphatique et Réflexologie sont fortement conseillées en synergie avec un suivi médical.';
  }

  // Évaluation RTH (si non enceinte)
  let rthLabel = 'Répartition gynoïde (favorable)';
  if (gender === 'h' && rth > 0.95) rthLabel = 'Répartition androïde (vigilance cardiovasculaire)';
  if (gender === 'f' && rth > 0.85) rthLabel = 'Répartition androïde (vigilance abdominale)';

  const metricsSummary = {
    'Sexe': gender === 'h' ? 'Homme' : 'Femme',
    'Âge': `${age} ans`,
    'Taille': `${height} cm`,
    'Poids': `${weight} kg`,
    'IMC Calculé': `${imc} kg/m²`,
    'Estimation Masse Grasse': `${fatMassPercent} %`,
    'Statut Grossesse': isPregnant ? 'Oui (Calculs adaptés)' : 'Non',
    'Ratio Taille/Hanches': isPregnant ? 'N/A' : `${rth} (${rthLabel})`,
  };

  return (
    <div className="space-y-6 font-body">
      {/* Saisie Interactive des Données */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panneau Gauche : Sliders et Contrôles */}
        <div className="lg:col-span-7 space-y-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span>Paramètres Morphologiques</span>
            </span>

            {/* Sexe */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/60 dark:bg-stone-800 border border-cacao/10">
              <button
                type="button"
                onClick={() => setGender('f')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  gender === 'f' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-cacao/70 dark:text-sand/70'
                }`}
              >
                Femme
              </button>
              <button
                type="button"
                onClick={() => setGender('h')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  gender === 'h' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-cacao/70 dark:text-sand/70'
                }`}
              >
                Homme
              </button>
            </div>
          </div>

          {/* Âge */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70">Âge</span>
              <span className="text-gold font-bold font-mono">{age} ans</span>
            </div>
            <input
              type="range"
              min="16"
              max="90"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Taille */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-cacao/70 dark:text-sand/70">Taille</span>
              <span className="text-gold font-bold font-mono">{height} cm</span>
            </div>
            <input
              type="range"
              min="120"
              max="220"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
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
              max="180"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Tour de taille & Hanches */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-cacao/70 dark:text-sand/70 block">
                Tour de taille ({waist} cm)
              </label>
              <input
                type="number"
                min="50"
                max="160"
                disabled={isPregnant}
                value={waist}
                onChange={(e) => setWaist(Number(e.target.value) || 70)}
                className="w-full p-2 rounded-xl bg-white/80 dark:bg-stone-800 border border-cacao/10 dark:border-white/10 text-xs font-mono disabled:opacity-40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-cacao/70 dark:text-sand/70 block">
                Tour de hanches ({hips} cm)
              </label>
              <input
                type="number"
                min="60"
                max="180"
                disabled={isPregnant}
                value={hips}
                onChange={(e) => setHips(Number(e.target.value) || 90)}
                className="w-full p-2 rounded-xl bg-white/80 dark:bg-stone-800 border border-cacao/10 dark:border-white/10 text-xs font-mono disabled:opacity-40"
              />
            </div>
          </div>

          {/* Statut de Grossesse */}
          {gender === 'f' && (
            <label className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-cacao dark:text-sand cursor-pointer">
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <span>Statut de grossesse en cours (Désactive les ratios taille/hanches)</span>
            </label>
          )}
        </div>

        {/* Panneau Droit : Jauge Circulaire & Métriques */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-stone-900/90 border border-amber-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
          <ToolCircularGauge
            value={imc}
            min={15}
            max={40}
            size={160}
            strokeWidth={12}
            unit="kg/m²"
            label={imcCategory}
            colorScheme={imcColor}
          />

          <div className="w-full space-y-2 pt-2 border-t border-cacao/10 dark:border-white/10 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-cacao/65 dark:text-sand/65">Masse Grasse Estimée</span>
              <strong className="text-gold font-mono font-bold">{fatMassPercent} %</strong>
            </div>

            {!isPregnant && (
              <div className="flex justify-between items-center">
                <span className="text-cacao/65 dark:text-sand/65">Ratio Taille / Hanches</span>
                <strong className="text-cacao dark:text-sand font-mono font-bold">{rth}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SWITCH : ANALYSE CLASSIQUE VS ORACLE IA */}
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

        {/* MODE CLASSIQUE */}
        {mode === 'classic' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 space-y-4">
            <h4 className="font-display font-medium text-base text-cacao dark:text-sand">
              Interprétation Morphologique Standard
            </h4>

            {/* Barre visuelle des zones IMC */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-cacao/60 dark:text-sand/60">
                <span>Maigreur (&lt;18.5)</span>
                <span>Normal (18.5-25)</span>
                <span>Surpoids (25-30)</span>
                <span>Obésité (&gt;30)</span>
              </div>
              <div className="h-3 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden flex">
                <div className="w-[18%] bg-amber-400" />
                <div className="w-[32%] bg-emerald-500" />
                <div className="w-[25%] bg-amber-500" />
                <div className="w-[25%] bg-rose-500" />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-cacao/80 dark:text-sand/80 leading-relaxed">
              {imcAdvice}
            </p>
          </div>
        )}

        {/* MODE ORACLE IA */}
        {mode === 'oracle' && (
          <ToolOracleAdvisor
            toolId="imc"
            toolTitle="IMC & Composition Corporelle"
            metrics={metricsSummary}
            primaryScore={`${imc} kg/m²`}
            categoryLabel={imcCategory}
          />
        )}
      </div>
    </div>
  );
}
