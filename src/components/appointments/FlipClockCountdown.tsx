import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles, CheckCircle2 } from 'lucide-react';

interface FlipClockCountdownProps {
  targetDate: string | Date;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calculateTimeRemaining(dateStr: string | Date): TimeRemaining {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const totalMs = target - now;

  if (!dateStr || isNaN(target) || totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, totalMs };
}

interface FlipCardProps {
  currentValue: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function FlipCard({ currentValue, label, size = 'md' }: FlipCardProps) {
  const prevValueRef = useRef(currentValue);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prevValueRef.current !== currentValue) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setFlipping(false);
        prevValueRef.current = currentValue;
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [currentValue]);

  const formattedValue = String(currentValue).padStart(2, '0');
  const prevFormattedValue = String(prevValueRef.current).padStart(2, '0');

  // Sizing definitions
  const dimensions = {
    sm: { card: 'w-10 h-12 text-base', label: 'text-[9px]' },
    md: { card: 'w-13 h-16 text-xl sm:text-2xl', label: 'text-[10px]' },
    lg: { card: 'w-16 h-20 text-2xl sm:text-3xl', label: 'text-xs' },
  }[size];

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      {/* 3D Flip Container */}
      <div
        className={`relative ${dimensions.card} font-mono font-black tracking-tight rounded-xl shadow-lg border border-amber-900/30 dark:border-amber-400/20 overflow-hidden`}
        style={{ perspective: '1000px' }}
      >
        {/* Background Full Plate (New incoming value) */}
        <div className="absolute inset-0 bg-[#1E140F] dark:bg-[#120B08] text-[#F9EAD2] flex items-center justify-center rounded-xl">
          <span>{formattedValue}</span>
          {/* Subtle horizontal flap divider shadow */}
          <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-black/70 -translate-y-1/2 z-20 shadow-sm pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.04] pointer-events-none" />
        </div>

        {/* Flipping Top-To-Bottom Card Animation (3D Inverse Downward Flip Effect for Countdown) */}
        <AnimatePresence mode="popLayout">
          {flipping && (
            <motion.div
              key={`${label}-${currentValue}`}
              initial={{ rotateX: -180, opacity: 0.9 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 180, opacity: 0 }}
              transition={{ duration: 0.48, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: '50% 0%',
              }}
              className="absolute inset-0 bg-gradient-to-b from-[#382318] to-[#1C110A] text-[#FDF4E7] flex items-center justify-center rounded-xl z-30 shadow-2xl border-b border-amber-400/35"
            >
              <span className="backface-hidden">{formattedValue}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gloss highlight on top half */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-xl z-10" />
        {/* Side hinge notches */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-stone-900 border border-amber-800/40 z-20" />
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-stone-900 border border-amber-800/40 z-20" />
      </div>

      {/* Flap Unit Label */}
      <span className={`font-body font-bold uppercase tracking-wider text-cacao/70 dark:text-sand/70 ${dimensions.label}`}>
        {label}
      </span>
    </div>
  );
}

export default function FlipClockCountdown({
  targetDate,
  status,
  size = 'md',
  className = '',
}: FlipClockCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    // Immediate initial computation
    setTimeLeft(calculateTimeRemaining(targetDate));

    // Update every second for live flip transitions
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // If time has passed
  if (timeLeft.totalMs <= 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 shadow-xs ${className}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
        <Sparkles className="w-4 h-4 text-gold shrink-0 animate-pulse" />
        <span className="text-xs sm:text-sm font-bold tracking-tight">C'est maintenant !</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {/* Flip Clock Banner Container */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 p-2 sm:p-3 rounded-2xl bg-amber-950/10 dark:bg-amber-950/20 border border-amber-900/15 dark:border-amber-400/15 backdrop-blur-md shadow-inner">
        <FlipCard currentValue={timeLeft.days} label="Jours" size={size} />
        <span className="text-xl sm:text-2xl font-black text-amber-700/60 dark:text-amber-400/60 -mt-4 animate-pulse">
          :
        </span>
        <FlipCard currentValue={timeLeft.hours} label="Heures" size={size} />
        <span className="text-xl sm:text-2xl font-black text-amber-700/60 dark:text-amber-400/60 -mt-4 animate-pulse">
          :
        </span>
        <FlipCard currentValue={timeLeft.minutes} label="Minutes" size={size} />
        <span className="text-xl sm:text-2xl font-black text-amber-700/60 dark:text-amber-400/60 -mt-4 animate-pulse">
          :
        </span>
        <FlipCard currentValue={timeLeft.seconds} label="Secondes" size={size} />
      </div>
    </div>
  );
}
