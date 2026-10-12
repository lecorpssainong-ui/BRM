import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/brand/Logo';
import { Lock, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Mots de passe non identiques',
        description: 'Vérifiez la concordance de votre nouveau mot de passe.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Mot de passe modifié',
        description: 'Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.',
        variant: 'success',
      });
      navigate('/login');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6 selection:bg-gold/30">
      <div className="mb-8">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </div>

      <div className="card-soft w-full max-w-md p-8 sm:p-10 space-y-6">
        <div>
          <span className="eyebrow block mb-1">Nouveau mot de passe</span>
          <h1 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Réinitialisation
          </h1>
          <p className="text-xs text-cacao/65 mt-1 font-body">
            Saisissez votre nouveau mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-cacao/40 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-cacao/40 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="field pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-gold w-full py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>Enregistrer le mot de passe</span>
          </button>
        </form>
      </div>
    </div>
  );
}
