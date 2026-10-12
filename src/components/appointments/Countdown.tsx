import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  date: string | Date;
}

export default function Countdown({ date }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const target = new Date(date).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Séance en cours ou passée');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 1) {
        setTimeLeft(`Dans ${days} jours et ${hours}h`);
      } else if (days === 1) {
        setTimeLeft(`Demain (dans ${hours + 24}h)`);
      } else if (hours > 0) {
        setTimeLeft(`Aujourd'hui dans ${hours}h${minutes > 0 ? `${minutes}m` : ''}`);
      } else {
        setTimeLeft(`Dans ${minutes} minute(s)`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date]);

  if (!timeLeft) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-[#8a6030] text-xs font-semibold">
      <Clock className="w-3.5 h-3.5 text-gold" />
      <span>{timeLeft}</span>
    </div>
  );
}
