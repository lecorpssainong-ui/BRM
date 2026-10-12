import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  X,
  Plus,
  Flame,
  Activity,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import ThreeBodyAnatomy, { BodyCategory } from './ThreeBodyAnatomy';

export interface PainZone {
  zone_id: string;
  zone_name: string;
  side: 'front' | 'back';
  category: BodyCategory;
  intensity: number; // 1 to 10
}

interface BodyPainMappingProps {
  value: PainZone[];
  onChange: (zones: PainZone[]) => void;
}

// Precision region close-up sub-targets
const REGION_ZONES: Record<
  BodyCategory,
  Array<{ id: string; name: string; side: 'front' | 'back'; detail: string }>
> = {
  skeleton: [
    { id: 'tete', name: 'Tête & Crâne', side: 'front', detail: 'Tensions crâniennes, fatigue mentale et céphalées' },
    { id: 'cou', name: 'Cou & Cervicales', side: 'front', detail: 'Raideurs de la nuque et compression cervicale' },
    { id: 'torse', name: 'Torse & Pectoraux', side: 'front', detail: 'Oppression thoracique et blocage respiratoire' },
    { id: 'lombaires', name: 'Lombaires (Bas du dos)', side: 'back', detail: 'Surmenage postural et blocage bas du dos' },
    { id: 'fessier_g', name: 'Fessiers & Sacrum', side: 'back', detail: 'Départ du nerf sciatique et hanches' },
    { id: 'pied_g', name: 'Pieds & Voûtes', side: 'front', detail: 'Réflexologie intégrale et points d\'ancrage' },
  ],
  arms: [
    { id: 'epaule_g', name: 'Épaule & Deltoïde Gauche', side: 'front', detail: 'Tension coiffe des rotateurs et mobilité' },
    { id: 'epaule_d', name: 'Épaule & Deltoïde Droit', side: 'front', detail: 'Mobilité articulaire et contractures trapèzes' },
    { id: 'bras_g', name: 'Bras & Biceps Gauche', side: 'front', detail: 'Contraction musculaire et raideur du bras' },
    { id: 'bras_d', name: 'Bras & Biceps Droit', side: 'front', detail: 'Tension musculaire et fatigue physique' },
    { id: 'avant_bras_g', name: 'Avant-bras Gauche (Canal)', side: 'front', detail: 'Tendinites, surmenage informatique & souris' },
    { id: 'avant_bras_d', name: 'Avant-bras Droit (Canal)', side: 'front', detail: 'Sensibilité au toucher et crispations' },
    { id: 'main_g', name: 'Main & Poignet Gauche', side: 'front', detail: 'Points réflexes palmaires et canal carpien' },
    { id: 'main_d', name: 'Main & Poignet Droit', side: 'front', detail: 'Fatigue digitale, engourdissements' },
  ],
  feet: [
    { id: 'pied_g', name: 'Voûte Plantaire Gauche (Zone Médiane)', side: 'front', detail: 'Zone réflexe estomac, reins, plexus solaire' },
    { id: 'pied_d', name: 'Voûte Plantaire Droite (Zone Médiane)', side: 'front', detail: 'Zone réflexe foie, intestin et colonne' },
    { id: 'mollet_g', name: 'Mollet & Tendon d\'Achille Gauche', side: 'back', detail: 'Lourdeur circulatoire, crampes et tensions' },
    { id: 'mollet_d', name: 'Mollet & Tendon d\'Achille Droit', side: 'back', detail: 'Drainage lymphatique et raideurs musculaires' },
    { id: 'genou_g', name: 'Genou & Rotule Gauche', side: 'front', detail: 'Sensibilité articulaire et appuis' },
    { id: 'genou_d', name: 'Genou & Rotule Droite', side: 'front', detail: 'Mobilité fémoro-patellaire' },
    { id: 'cuisse_g', name: 'Cuisse Gauche (Quadriceps / Ischios)', side: 'front', detail: 'Fatigue musculaire et chaîne postérieure' },
    { id: 'cuisse_d', name: 'Cuisse Droite (Quadriceps / Ischios)', side: 'front', detail: 'Contraction et récupération physique' },
  ],
  head: [
    { id: 'tete', name: 'Front & Sinus / Sommet Crânien', side: 'front', detail: 'Pression oculaire, sinusite et surmenage mental' },
    { id: 'occiput', name: 'Nuque & Base du Crâne (Occiput)', side: 'back', detail: 'Migraines de tension et raideurs posturales' },
    { id: 'cou', name: 'Cervicales & Sterno-cléido-mastoïdien', side: 'front', detail: 'Nœuds musculaires et tensions vertébrales' },
    { id: 'epaule_g', name: 'Trapèze Gauche & Attache Nuque', side: 'back', detail: 'Point gâchette et accumulation de stress' },
    { id: 'epaule_d', name: 'Trapèze Droit & Attache Nuque', side: 'back', detail: 'Tensions des épaules et charge posturale' },
  ],
  trunk: [
    { id: 'torse', name: 'Torse, Sternum & Cage Thoracique', side: 'front', detail: 'Ouverture respiratoire et déblocage émotionnel' },
    { id: 'abdomen', name: 'Plexus Solaire & Abdomen Viscéral', side: 'front', detail: 'Centre digestif, détente profonde du diaphragme' },
    { id: 'haut_dos', name: 'Dos Supérieur & Entre les Omoplates', side: 'back', detail: 'Dorsalgies, contractures et posture voûtée' },
    { id: 'lombaires', name: 'Lombaires & Bas du Dos', side: 'back', detail: 'Barre lombaire, sensation d\'écrasement postural' },
    { id: 'bassin', name: 'Bassin & Hanches (Face)', side: 'front', detail: 'Alignement pelvien et souplesse articulaire' },
    { id: 'fessier_g', name: 'Fessier Gauche & Sacrum (Pyramidal)', side: 'back', detail: 'Sciatalgie et points de pression fessiers' },
    { id: 'fessier_d', name: 'Fessier Droit & Sacrum (Pyramidal)', side: 'back', detail: 'Décompression lombaire et sacrée' },
  ],
};

function getIntensityLabel(val: number): { text: string; color: string } {
  if (val <= 3) return { text: 'Gêne légère', color: 'text-emerald-700 dark:text-emerald-400' };
  if (val <= 6) return { text: 'Tension modérée', color: 'text-amber-700 dark:text-amber-400' };
  if (val <= 8) return { text: 'Douleur aiguë', color: 'text-orange-700 dark:text-orange-400' };
  return { text: 'Douleur intense / Priorité', color: 'text-rose-700 dark:text-rose-400 font-bold' };
}

export default function BodyPainMapping({ value = [], onChange }: BodyPainMappingProps) {
  const [activeTab, setActiveTab] = useState<BodyCategory>('skeleton');
  const [skeletonSide, setSkeletonSide] = useState<'front' | 'back'>('front');

  const safeVal = Array.isArray(value) ? value : [];

  const toggleZone = (zone: {
    zone_id: string;
    zone_name: string;
    side: 'front' | 'back';
    category: BodyCategory;
  }) => {
    const existingIndex = safeVal.findIndex((z) => z.zone_id === zone.zone_id);
    if (existingIndex >= 0) {
      // Remove
      const next = [...safeVal];
      next.splice(existingIndex, 1);
      onChange(next);
    } else {
      // Add with default intensity 5/10
      onChange([
        ...safeVal,
        {
          zone_id: zone.zone_id,
          zone_name: zone.zone_name,
          side: zone.side,
          category: zone.category,
          intensity: 5,
        },
      ]);
    }
  };

  const updateIntensity = (id: string, newIntensity: number) => {
    const next = safeVal.map((z) => (z.zone_id === id ? { ...z, intensity: newIntensity } : z));
    onChange(next);
  };

  const removeZone = (id: string) => {
    onChange(safeVal.filter((z) => z.zone_id !== id));
  };

  return (
    <div className="space-y-6 font-body">
      {/* Precision 5 Sub-Tabs for Interactive 3D Anatomy */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 dark:border-amber-400/20 backdrop-blur-md shadow-sm">
        {[
          { id: 'skeleton', label: 'Squelette 3D (Corps entier)' },
          { id: 'head', label: 'Tête & Cou' },
          { id: 'trunk', label: 'Tronc & Dos' },
          { id: 'arms', label: 'Bras & Mains' },
          { id: 'feet', label: 'Pied & Réflexologie' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as BodyCategory)}
              className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                isActive
                  ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 shadow-sm font-bold'
                  : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Interactive 3D WebGL Area & Side-Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D WebGL Scene and Quick Precision Targeting */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-soft p-5 sm:p-6 bg-white/85 dark:bg-stone-900/85 border border-cacao/10 dark:border-amber-400/15">
            <ThreeBodyAnatomy
              selectedZones={value}
              onToggleZone={toggleZone}
              activeCategory={activeTab}
              skeletonSide={skeletonSide}
              onSideChange={setSkeletonSide}
            />
          </div>

          {/* Quick Sub-Zone Selection Cards corresponding to active tab */}
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-cacao/10 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                  Ciblage fin & Points réflexes (
                  {activeTab === 'skeleton' && 'Vue Globale'}
                  {activeTab === 'head' && 'Tête & Cervicales'}
                  {activeTab === 'trunk' && 'Tronc & Rachis'}
                  {activeTab === 'arms' && 'Membres Supérieurs'}
                  {activeTab === 'feet' && 'Voûtes & Réflexologie'}
                  ) :
                </span>
              </div>
              <span className="text-[11px] text-cacao/50 dark:text-sand/50">
                Sélection rapide
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(REGION_ZONES[activeTab] || []).map((rz) => {
                const isSelected = value.some((v) => v.zone_id === rz.id);
                return (
                  <button
                    key={rz.id}
                    type="button"
                    onClick={() =>
                      toggleZone({
                        zone_id: rz.id,
                        zone_name: rz.name,
                        side: rz.side,
                        category: activeTab,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-600 dark:border-amber-400 shadow-sm'
                        : 'bg-white/70 dark:bg-stone-800/70 border-cacao/10 dark:border-white/10 hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-bold text-xs text-cacao dark:text-sand leading-snug">
                        {rz.name}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isSelected
                            ? 'bg-amber-500 text-white font-bold'
                            : 'border border-cacao/20 dark:border-white/20'
                        }`}
                      >
                        {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Plus className="w-2.5 h-2.5 opacity-40" />}
                      </div>
                    </div>
                    <span className="text-[10px] text-cacao/65 dark:text-sand/70 line-clamp-1">
                      {rz.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Pain Scale Intensity Sliders (1 to 10) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-cacao/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h4 className="font-display text-lg text-cacao dark:text-sand font-medium">
                Zones sélectionnées ({value.length})
              </h4>
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Tout désélectionner
              </button>
            )}
          </div>

          {value.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/50 dark:bg-stone-900/50 border border-dashed border-cacao/20 dark:border-white/20 text-center space-y-2.5">
              <Activity className="w-9 h-9 text-gold/60 mx-auto animate-pulse" />
              <p className="text-xs text-cacao/75 dark:text-sand/80 font-bold">
                Aucune zone de tension ciblée
              </p>
              <p className="text-[11px] text-cacao/55 dark:text-sand/55 leading-relaxed">
                Touchez les zones anatomiques sur le mannequin 3D ou cliquez sur les cartes rapides pour indiquer vos tensions et personnaliser votre séance.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {value.map((zone) => {
                const labelInfo = getIntensityLabel(zone.intensity);
                return (
                  <motion.div
                    key={zone.zone_id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 rounded-2xl bg-white/95 dark:bg-stone-800/95 border border-cacao/15 dark:border-amber-400/25 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-xs text-cacao dark:text-sand">
                          {zone.zone_name}
                        </h5>
                        <span className="text-[10px] text-cacao/60 dark:text-sand/60">
                          {zone.side === 'back' ? 'Côté Dos' : 'Côté Face'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeZone(zone.zone_id)}
                        className="p-1 rounded-lg text-cacao/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Retirer cette zone"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Pain Intensity Slider 1 to 10 */}
                    <div className="space-y-1 bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-xl border border-cacao/5 dark:border-white/5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-cacao/75 dark:text-sand/75">
                          Intensité : <strong className="text-cacao dark:text-sand">{zone.intensity}/10</strong>
                        </span>
                        <span className={`text-[10px] font-bold ${labelInfo.color}`}>
                          {labelInfo.text}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={zone.intensity}
                        onChange={(e) => updateIntensity(zone.zone_id, Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
