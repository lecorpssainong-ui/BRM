import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HealingRainProps {
  triggerKey: number;
  duration?: number; // seconds
  stickers?: string[]; // categories or emojis
  onComplete?: () => void;
}

const STICKER_MAP: Record<string, string[]> = {
  hearts: ['❤️', '💖', '💕', '💓', '💗'],
  leaves: ['🍃', '🌿', '🌱', '🪴', '🍀'],
  water: ['💧', '🫧', '🌊', '💦'],
  lotus: ['🪷', '🌸', '🌺', '🌼'],
  stars: ['✨', '⭐', '🌟', '💫'],
};

interface Particle {
  id: string;
  emoji: string;
  x: number; // percentage (0 - 100)
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  drift: number; // px horizontal drift
  rotate: number; // degrees
}

export default function HealingRain({
  triggerKey,
  duration = 5,
  stickers = ['hearts', 'leaves', 'water', 'lotus', 'stars'],
  onComplete,
}: HealingRainProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    if (triggerKey <= 0) return;

    // Collect available emojis
    const availableEmojis: string[] = [];
    const activeCategories = Array.isArray(stickers) && stickers.length > 0
      ? stickers
      : ['hearts', 'leaves', 'water', 'lotus', 'stars'];

    activeCategories.forEach((cat) => {
      if (STICKER_MAP[cat]) {
        availableEmojis.push(...STICKER_MAP[cat]);
      } else if (typeof cat === 'string' && cat.length <= 4) {
        availableEmojis.push(cat);
      }
    });

    if (availableEmojis.length === 0) {
      availableEmojis.push('❤️', '🍃', '💧', '🪷', '✨');
    }

    // Generate 45 particles with staggered delays and organic physics
    const count = 45;
    const generated: Particle[] = Array.from({ length: count }, (_, idx) => {
      const emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
      return {
        id: `particle_${triggerKey}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        emoji,
        x: Math.random() * 92 + 4, // 4% to 96%
        size: Math.floor(Math.random() * 22) + 20, // 20px to 42px
        duration: Math.random() * 1.8 + (duration * 0.7), // Fall duration
        delay: Math.random() * (duration * 0.5), // Staggered over half the active duration
        drift: (Math.random() - 0.5) * 120, // Drift left or right
        rotate: Math.floor((Math.random() - 0.5) * 360),
      };
    });

    setParticles(generated);
    setIsActive(true);

    const timer = setTimeout(() => {
      setIsActive(false);
      setParticles([]);
      onComplete?.();
    }, (duration + 1.2) * 1000);

    return () => clearTimeout(timer);
  }, [triggerKey, duration, stickers, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 0,
              y: -50,
              x: `${p.x}vw`,
              scale: 0.5,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0.8, 0],
              y: ['0vh', '110vh'],
              x: [`${p.x}vw`, `calc(${p.x}vw + ${p.drift}px)`],
              scale: [0.6, 1.2, 1, 0.9],
              rotate: [0, p.rotate],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              position: 'absolute',
              fontSize: `${p.size}px`,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))',
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Center Badge for Healing Affirmation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.05, 1, 0.9], y: [20, 0, 0, -10] }}
        transition={{ duration: Math.min(3, duration), times: [0, 0.2, 0.8, 1] }}
        className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-sand shadow-2xl flex items-center gap-2 text-xs font-bold"
      >
        <span>🍃 Pluie de Guérison & Vitalité</span>
        <span className="text-amber-300">✨</span>
      </motion.div>
    </div>
  );
}
