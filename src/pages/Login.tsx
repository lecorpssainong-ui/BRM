import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getAuthReturnTo, setAuthReturnTo } from '@/lib/authReturnTo';
import Logo from '@/components/brand/Logo';
import { AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const redirectReason = (location.state as any)?.reason;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Redirection automatique immédiate après login
  useEffect(() => {
    if (user && !isLoadingAuth) {
      const returnTo = getAuthReturnTo() || '/';
      navigate(returnTo, { replace: true });
    }
  }, [user, isLoadingAuth, navigate]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const targetReturn =
        (location.state as any)?.returnTo ||
        new URLSearchParams(location.search).get('returnTo');
      if (targetReturn) {
        setAuthReturnTo(targetReturn);
      }

      const returnTo = getAuthReturnTo() || '/';
      const redirectUri = window.location.origin + (returnTo.startsWith('/') ? returnTo : `/${returnTo}`);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err?.message || t('auth.googleError'));
      setGoogleLoading(false);
    }
  };

  // Si l'utilisateur est déjà connecté, afficher un spinner fluide pendant la redirection
  if (user && !isLoadingAuth) {
    return (
      <div className="min-h-screen bg-sand text-cacao flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-cacao/20 border-t-cacao rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-cacao/70">Connexion réussie ! Redirection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-cacao flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-gold/30 font-body relative overflow-hidden">
      {/* Background Ambience Elements */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cacao/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link to="/" title={t('auth.backHome')} className="hover:opacity-90 transition">
          <Logo size="md" />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white/90 dark:bg-[#1C1410]/95 backdrop-blur-xl border border-cacao/15 dark:border-gold/20 shadow-2xl rounded-3xl relative z-10 text-center"
      >
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cacao to-cacao/90 text-gold flex items-center justify-center mx-auto mb-2 shadow-lg border border-gold/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="text-[10px] text-gold font-bold tracking-widest uppercase block">
            {t('auth.secureSpace')}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-xs text-cacao/70 dark:text-sand/70 max-w-sm mx-auto leading-relaxed">
            {redirectReason || t('auth.loginSubtitle')}
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed font-medium">{errorMessage}</p>
          </motion.div>
        )}

        {/* Bouton Unique : Continuer avec Google */}
        <div className="py-2 space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-4 px-6 rounded-full bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-900 dark:text-white border-2 border-cacao/15 dark:border-stone-700 font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{t('auth.continueWithGoogle')}</span>
              </>
            )}
          </button>
          <p className="text-xs text-cacao/70 dark:text-sand/70 leading-relaxed max-w-xs mx-auto">
            {t('auth.googlePrompt')}
          </p>
        </div>

        <div className="pt-4 border-t border-cacao/10 dark:border-stone-800 text-center">
          <Link
            to="/"
            className="text-xs text-cacao/60 dark:text-sand/60 hover:text-gold hover:underline transition"
          >
            ← {t('auth.backHome')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
