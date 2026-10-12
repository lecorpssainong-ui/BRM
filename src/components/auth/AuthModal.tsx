import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { triggerAuthSuccessCallback } from '@/lib/authModalHelper';
import {
  Sparkles,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState(
    'Connectez-vous avec votre compte Google pour gérer vos rendez-vous, réservations et factures.'
  );
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de la connexion Google.');
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const handleOpen = (e: any) => {
      const detail = e.detail || {};
      if (detail.reason) setReason(detail.reason);
      setErrorMessage(null);
      setIsOpen(true);
    };

    window.addEventListener('brm-open-auth-modal', handleOpen);
    return () => window.removeEventListener('brm-open-auth-modal', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Close modal if user is already connected
  useEffect(() => {
    if (user && isOpen) {
      setIsOpen(false);
      triggerAuthSuccessCallback();
    }
  }, [user, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-sand-light dark:bg-[#1E140F] border border-gold/30 dark:border-amber-700/40 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden font-body text-cacao dark:text-sand text-center"
          >
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-gold to-amber-500" />

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-cacao/60 dark:text-sand/60 hover:text-cacao dark:hover:text-sand hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Identity & Security */}
            <div className="space-y-2 mb-6">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-gold to-amber-600 text-stone-950 flex items-center justify-center mx-auto mb-2 shadow-md border border-gold/30">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[10px] font-black tracking-widest uppercase">
                <Sparkles className="w-3 h-3 text-gold" />
                <span>BIENVENUE AU CENTRE</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
                Compte Sécurisé
              </h2>

              <p className="text-xs sm:text-sm text-cacao/75 dark:text-sand/75 leading-relaxed max-w-sm mx-auto">
                {reason}
              </p>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <p className="font-semibold leading-relaxed">{errorMessage}</p>
              </motion.div>
            )}

            {/* Bouton Unique : Continuer avec Google */}
            <div className="py-2 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3.5 px-5 rounded-full bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-900 dark:text-white border-2 border-cacao/15 dark:border-stone-700 font-bold text-sm transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continuer avec Google</span>
                  </>
                )}
              </button>

              <p className="text-xs text-cacao/70 dark:text-sand/70 leading-relaxed">
                Connectez-vous avec votre compte Google pour accéder à votre espace.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
