import { Link } from 'react-router-dom';
import Logo from '@/components/brand/Logo';
import { ArrowLeft, Phone, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-sand text-cacao flex flex-col items-center justify-center p-6 selection:bg-gold/30 font-body">
      <div className="mb-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </div>

      <div className="card-soft w-full max-w-md p-8 sm:p-10 space-y-6 bg-white/95 dark:bg-[#1C1410]/95 border border-cacao/15 shadow-2xl rounded-3xl">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <span className="eyebrow block mb-1 text-gold text-[10px] uppercase font-bold tracking-widest">
            Assistance & Coordonnées
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Récupération de compte
          </h1>
          <p className="text-xs text-cacao/65 dark:text-sand/65">
            Informations sur l'authentification sécurisée
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 text-xs text-cacao/80 dark:text-sand/80 leading-relaxed">
          <p>
            Sur Bénin Réflexologie Massage, la connexion s'effectue avec votre numéro de téléphone et votre mot de passe personnel.
          </p>
          <p>
            En cas d'oubli de mot de passe, veuillez contacter le secrétariat ou le modérateur du centre pour réinitialiser vos accès en toute sécurité.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-cacao/10 space-y-2 text-xs">
          <span className="text-[10px] uppercase tracking-wider font-bold text-cacao/60 dark:text-sand/60 block">
            Besoin d'aide ? Contactez le centre
          </span>
          <div className="flex items-center gap-2 text-cacao dark:text-sand font-bold text-sm">
            <Phone className="w-4 h-4 text-gold" />
            <span>+229 97 00 00 00</span>
          </div>
          <p className="text-[11px] text-cacao/65 dark:text-sand/65">
            Le secrétariat ou le modérateur pourra vérifier votre identité et réinitialiser vos identifiants d'accès.
          </p>
        </div>

        <div className="text-center pt-2 border-t border-cacao/10 font-body">
          <Link
            to="/login"
            className="text-xs text-gold hover:underline inline-flex items-center gap-1.5 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la page de connexion</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
