import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import Logo from '@/components/brand/Logo';
import { ShieldAlert, ArrowLeft, AlertCircle } from 'lucide-react';

interface StaffGateProps {
  denied?: boolean;
}

export default function StaffGate({ denied = false }: StaffGateProps) {
  const { logout, user } = useAuth();
  const isStaff = user?.role === 'secretary' || user?.role === 'moderator';

  // Si l'utilisateur est connecté avec rôle staff et n'est pas refusé, ne pas bloquer
  if (user && isStaff && !denied) {
    return null;
  }
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/staff`,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de la connexion avec Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand text-cacao flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-gold/30 font-body">
      <div className="mb-6">
        <Link to="/" title="Retour au sanctuaire">
          <Logo size="md" />
        </Link>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white/95 dark:bg-[#1C1410]/95 backdrop-blur-xl border border-cacao/15 shadow-2xl rounded-3xl text-center">
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-[10px] text-gold font-bold tracking-widest uppercase block">
            Accès Réservé à l'Équipe
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Cockpit Professionnel
          </h1>
          <p className="text-xs text-cacao/65 dark:text-sand/65">
            {denied
              ? 'Votre compte Google actuel ne dispose pas des privilèges Staff requis (Secrétariat ou Modération).'
              : 'Connectez-vous avec votre compte Google autorisé pour accéder à l\'Espace Pro.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed font-semibold">{errorMessage}</p>
          </div>
        )}

        {user && denied && (
          <div className="p-4 rounded-2xl bg-sand/60 dark:bg-stone-900 border border-cacao/10 text-xs text-cacao/80 dark:text-sand/80 space-y-2 text-left">
            <p>
              Connecté en tant que : <strong className="text-cacao dark:text-sand">{user.nom}</strong> ({user.email})
            </p>
            <p>
              Rôle actuel : <span className="capitalize font-bold text-amber-600">{user.role}</span>
            </p>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              Se déconnecter pour changer de compte Google
            </button>
          </div>
        )}

        {/* Bouton de connexion Google Pro */}
        <div className="py-2 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-900 dark:text-white border-2 border-cacao/15 dark:border-stone-700 font-bold text-sm transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
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
        </div>

        <div className="pt-2 border-t border-cacao/10 dark:border-stone-800 flex items-center justify-between text-xs text-cacao/60 dark:text-sand/60">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-cacao dark:text-sand hover:text-gold transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l'accueil client</span>
          </Link>

          <Link
            to="/login"
            className="text-gold font-bold hover:underline"
          >
            Connexion client
          </Link>
        </div>
      </div>
    </div>
  );
}
