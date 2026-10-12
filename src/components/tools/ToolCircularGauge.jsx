import { motion } from 'framer-motion';

/**
 * JAUGE CIRCULAIRE SVG ANIMÉE LUXUEUSE
 * 
 * @param {object} props
 * @param {number} props.value - Valeur actuelle (ex: 24.5 ou 85)
 * @param {number} props.min - Valeur minimale
 * @param {number} props.max - Valeur maximale
 * @param {number} props.size - Diamètre en px (défaut 140)
 * @param {number} props.strokeWidth - Épaisseur du trait (défaut 10)
 * @param {string} props.unit - Unité affichée (ex: "kg/m²", "%", "L/j")
 * @param {string} props.label - Libellé affiché sous la valeur (ex: "Poids normal")
 * @param {string} props.colorScheme - 'gold' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple'
 */
export default function ToolCircularGauge({
  value = 0,
  min = 0,
  max = 100,
  size = 140,
  strokeWidth = 10,
  unit = '',
  label = '',
  colorScheme = 'gold',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calcul du pourcentage borné
  const clampedValue = Math.min(Math.max(Number(value) || 0, min), max);
  const percentage = Math.max(0, Math.min(1, (clampedValue - min) / (max - min || 1)));
  const strokeDashoffset = circumference - percentage * circumference;

  // Palettes de dégradés et couleurs
  const colorMap = {
    gold: {
      gradient: ['#F59E0B', '#B45309', '#D97706'],
      text: 'text-amber-500 dark:text-amber-400',
      stroke: '#D97706',
      bgStroke: 'rgba(217, 119, 6, 0.15)',
    },
    emerald: {
      gradient: ['#34D399', '#059669', '#10B981'],
      text: 'text-emerald-600 dark:text-emerald-400',
      stroke: '#10B981',
      bgStroke: 'rgba(16, 185, 129, 0.15)',
    },
    amber: {
      gradient: ['#FBBF24', '#D97706', '#B45309'],
      text: 'text-amber-600 dark:text-amber-400',
      stroke: '#F59E0B',
      bgStroke: 'rgba(245, 158, 11, 0.15)',
    },
    rose: {
      gradient: ['#F43F5E', '#BE123C', '#E11D48'],
      text: 'text-rose-600 dark:text-rose-400',
      stroke: '#E11D48',
      bgStroke: 'rgba(225, 29, 72, 0.15)',
    },
    cyan: {
      gradient: ['#38BDF8', '#0284C7', '#0EA5E9'],
      text: 'text-sky-600 dark:text-sky-400',
      stroke: '#0EA5E9',
      bgStroke: 'rgba(14, 165, 233, 0.15)',
    },
    purple: {
      gradient: ['#A855F7', '#6D28D9', '#8B5CF6'],
      text: 'text-purple-600 dark:text-purple-400',
      stroke: '#8B5CF6',
      bgStroke: 'rgba(139, 92, 246, 0.15)',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.gold;
  const gradientId = `gauge-gradient-${colorScheme}-${size}`;

  return (
    <div className="relative flex flex-col items-center justify-center select-none font-body">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={scheme.gradient[0]} />
            <stop offset="50%" stopColor={scheme.gradient[2]} />
            <stop offset="100%" stopColor={scheme.gradient[1]} />
          </linearGradient>
        </defs>

        {/* Cercle d'arrière-plan */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scheme.bgStroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Cercle animé de progression */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {/* Contenu Central Numérique */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-baseline justify-center gap-0.5"
        >
          <span className="font-display font-medium text-2xl sm:text-3xl text-cacao dark:text-sand tracking-tight leading-none">
            {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
          </span>
          {unit && (
            <span className="text-[10px] sm:text-xs text-cacao/60 dark:text-sand/60 font-semibold font-mono">
              {unit}
            </span>
          )}
        </motion.div>

        {label && (
          <motion.span
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${scheme.text}`}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}
