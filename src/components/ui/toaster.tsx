import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

let toastListeners: Array<(msg: ToastMessage) => void> = [];

export function toast({
  title,
  description,
  variant = 'default',
}: {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}) {
  const id = crypto.randomUUID();
  toastListeners.forEach((fn) => fn({ id, title, description, variant }));
}

toast.success = (title: string, description?: string) => {
  toast({ title, description, variant: 'success' });
};

toast.error = (title: string, description?: string) => {
  toast({ title, description, variant: 'destructive' });
};

toast.info = (title: string, description?: string) => {
  toast({ title, description, variant: 'default' });
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4200);
    };

    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2.5 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl flex items-start gap-3 border ${
              t.variant === 'destructive'
                ? 'bg-rose-950/95 text-rose-50 border-rose-600/40 backdrop-blur-xl'
                : t.variant === 'success'
                ? 'bg-stone-950/95 text-emerald-200 border-emerald-500/40 backdrop-blur-xl'
                : 'bg-stone-950/95 text-sand border-amber-500/40 backdrop-blur-xl'
            }`}
          >
            {t.variant === 'destructive' ? (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            ) : t.variant === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {t.title && <div className="font-semibold text-sm leading-tight">{t.title}</div>}
              {t.description && <div className="text-xs opacity-85 mt-1 leading-snug">{t.description}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
