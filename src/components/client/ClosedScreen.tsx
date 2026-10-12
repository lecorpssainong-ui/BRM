import { useState } from 'react';
import { Sparkles, ShieldBan, Phone, Lock, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useAppSettings } from '@/lib/queries';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/toaster';

interface ClosedScreenProps {
  blocked?: boolean;
  message?: string;
  clientId?: string;
  clientKey?: string;
  onUnlock?: () => void;
}

export default function ClosedScreen({
  blocked = false,
  message,
  clientId,
  clientKey,
  onUnlock,
}: ClosedScreenProps) {
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const isModerator = user?.role === 'moderator';

  // Master App Unlock (App locked / Kill Switch case)
  const handleMasterUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctCode = (
      (settings as any)?.kill_switch?.password ||
      settings?.lock_password ||
      settings?.master_access_code ||
      'Acces'
    ).trim();
    if (code.trim().toLowerCase() === correctCode.toLowerCase()) {
      sessionStorage.setItem('brm_master_unlock', 'true');
      toast({
        title: 'Accès Maître Déverrouillé',
        description: 'Session temporaire autorisée avec succès.',
        variant: 'success',
      });
      if (onUnlock) {
        onUnlock();
      } else {
        window.location.reload();
      }
    } else {
      setError(true);
      toast({
        title: 'Mot de passe incorrect',
        description: 'Veuillez vérifier le mot de passe d\'accès d\'urgence.',
        variant: 'destructive',
      });
    }
  };

  // Client Unblock (Blocked client case)
  const handleClientUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctCode = (settings?.client_unblock_code || 'Accepter').trim();
    if (code.trim().toLowerCase() === correctCode.toLowerCase()) {
      setIsUnblocking(true);
      try {
        if (clientId) {
          await base44.entities.Client.update(clientId, { blocked: false });
        } else if (clientKey) {
          const found = await base44.entities.Client.filter({ client_key: clientKey });
          if (found && found.length > 0) {
            await base44.entities.Client.update(found[0].id, { blocked: false });
          }
        }
        toast({
          title: 'Accès Rétabli avec Succès',
          description: 'Votre compte a été débloqué. Bienvenue !',
          variant: 'success',
        });
        if (onUnlock) {
          onUnlock();
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Failed to unblock client:', err);
        toast({
          title: 'Accès débloqué',
          description: 'Bienvenue à nouveau chez Bénin Réflexologie.',
          variant: 'success',
        });
        if (onUnlock) onUnlock();
        else window.location.reload();
      } finally {
        setIsUnblocking(false);
      }
    } else {
      setError(true);
      toast({
        title: 'Code de déblocage incorrect',
        description: 'Veuillez contacter le secrétariat pour obtenir votre code.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#150F0C] text-[#2B1D16] dark:text-[#E8DCC4] flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <div className="card-soft max-w-lg w-full p-8 sm:p-10 bg-white/95 dark:bg-[#1E1612]/95 border border-[#2B1D16]/15 dark:border-amber-400/20 backdrop-blur-xl shadow-2xl rounded-3xl space-y-6">
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-md ${
            blocked ? 'bg-rose-100 text-rose-700' : 'bg-rose-500/15 text-rose-600'
          }`}
        >
          {blocked ? <ShieldBan className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl text-[#2B1D16] dark:text-[#F3EBE1] font-bold">
            {blocked ? 'Accès suspendu' : 'Application Verrouillée'}
          </h1>

          <p className="text-[#2B1D16]/75 dark:text-[#E8DCC4]/80 text-sm leading-relaxed">
            {blocked
              ? 'Votre accès a été temporairement suspendu par la sécurité. Contactez le centre pour plus d\'informations.'
              : message ||
                settings?.lock_message ||
                settings?.closed_message ||
                'Le centre Bénin Réflexologie Massage est momentanément fermé ou en maintenance.'}
          </p>
        </div>

        {/* Client Unblock Form when access is suspended */}
        {blocked ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-gold shrink-0" />
              <span>Vous possédez un code de déblocage ?</span>
            </div>
            <p className="text-xs text-[#2B1D16]/75 dark:text-[#E8DCC4]/80 mb-3">
              Saisissez votre code confidentiel pour rétablir votre accès immédiatement.
            </p>

            <form onSubmit={handleClientUnblock} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Code de déblocage (ex: Accepter)..."
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(false);
                  }}
                  className={`field text-xs font-bold tracking-wider ${
                    error ? 'border-rose-500 ring-2 ring-rose-300' : ''
                  }`}
                />
                <button
                  type="submit"
                  disabled={isUnblocking || !code.trim()}
                  className="btn-gold py-2.5 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                  title="Débloquer mon accès"
                >
                  {isUnblocking ? 'Vérification...' : 'Débloquer'}
                </button>
              </div>
              {error && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  Code de déblocage incorrect. Veuillez contacter le centre.
                </p>
              )}
            </form>
          </div>
        ) : (
          /* General App Locked Case: Direct password input */
          <div className="p-5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-cacao/10 dark:border-white/10 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2B1D16] dark:text-[#E8DCC4] uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-gold shrink-0" />
              <span>Accès réservé & Déverrouillage d'Urgence</span>
            </div>
            <p className="text-xs text-[#2B1D16]/70 dark:text-[#E8DCC4]/70">
              Saisissez le mot de passe d'accès pour lever temporairement le verrouillage.
            </p>

            <form onSubmit={handleMasterUnlock} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Mot de passe d'accès (défaut : Acces)..."
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(false);
                  }}
                  className={`field text-xs font-mono font-bold tracking-wider py-2.5 ${
                    error ? 'border-rose-500 ring-2 ring-rose-300' : ''
                  }`}
                />
                <button
                  type="submit"
                  disabled={!code.trim()}
                  className="btn-gold py-2.5 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span>Déverrouiller</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {error && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  Mot de passe incorrect. Veuillez vérifier auprès du centre.
                </p>
              )}
            </form>
          </div>
        )}

        {isModerator && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('brm_master_unlock', 'true');
                if (onUnlock) onUnlock();
                else window.location.reload();
              }}
              className="py-2 px-4 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-2 hover:bg-amber-500/30 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-gold" />
              <span>Contourner le verrouillage (Compte Modérateur)</span>
            </button>
          </div>
        )}

        {settings?.center_phone && (
          <div className="pt-2 border-t border-[#2B1D16]/10 dark:border-white/10 flex justify-center">
            <a
              href={`tel:${settings.center_phone}`}
              className="text-xs text-[#2B1D16]/80 dark:text-[#E8DCC4]/80 hover:text-gold inline-flex items-center gap-2 py-1 font-semibold transition"
            >
              <Phone className="w-3.5 h-3.5 text-gold" />
              <span>Assistance téléphonique : {settings.center_phone}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
