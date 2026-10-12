import { useState, useEffect } from 'react';
import { useOnline, useOutbox } from '@/lib/offline';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CloudUpload, Check, X } from 'lucide-react';

export default function OfflineBar() {
  const online = useOnline();
  const outbox = useOutbox();
  const [justSent, setJustSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = () => {
      setJustSent(true);
      setDismissed(false); // Reset dismissal on sync success
      const t = setTimeout(() => setJustSent(false), 3500);
      return () => clearTimeout(t);
    };
    window.addEventListener('brm-outbox-sent', handler);
    return () => window.removeEventListener('brm-outbox-sent', handler);
  }, []);

  // When connection drops or outbox queues new items, re-enable bar if user hasn't explicitly dismissed it for current outbox count
  useEffect(() => {
    if (online && outbox.length === 0 && !justSent) {
      setDismissed(false);
    }
  }, [online, outbox.length, justSent]);

  const shouldShow = (!online || outbox.length > 0 || justSent) && !dismissed;

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full z-30 relative"
      >
        <div
          className={`py-2 px-4 pr-10 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-sm transition-colors relative ${
            !online
              ? 'bg-stone-900 text-stone-200 border-b border-stone-800'
              : justSent
              ? 'bg-emerald-700 text-emerald-100'
              : 'bg-amber-700 text-amber-100'
          }`}
        >
          {!online ? (
            <>
              <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-400 shrink-0" />
              <span>Hors connexion — Vos actions sont conservées et partiront automatiquement dès le retour du réseau.</span>
            </>
          ) : justSent ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span>Synchronisation réussie — Vos demandes ont bien été transmises au centre.</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>
                {outbox.length} transmission(s) en attente — partira dès confirmation du réseau.
              </span>
            </>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Masquer cet avertissement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
