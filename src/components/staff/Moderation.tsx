import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAppSettings } from '@/lib/queries';
import { useCachedQuery } from '@/lib/offline';
import { base44 } from '@/api/base44Client';
import { THEMES } from '@/components/ThemeApplier';
import { formatPrice, formatDate } from '@/lib/format';
import {
  Palette,
  Power,
  Users,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Sliders,
  Compass,
  MoveHorizontal,
  MoveVertical,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';

export default function Moderation() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  // Theme, App Opened, Master Access Code & Client Unblock Code states
  const [currentTheme, setCurrentTheme] = useState(settings?.theme || 'cacao');
  const [appOpened, setAppOpened] = useState(
    settings?.app_opened !== false && settings?.app_active !== false
  );
  const [masterAccessCode, setMasterAccessCode] = useState(
    settings?.master_access_code || 'Acces'
  );
  const [clientUnblockCode, setClientUnblockCode] = useState(
    settings?.client_unblock_code || 'Accepter'
  );
  const [closedMessage, setClosedMessage] = useState(
    settings?.closed_message || 'Nous réalisons des travaux d\'aménagement pour mieux vous accueillir. À très bientôt.'
  );

  // BottomNav custom dimensions states
  const [navOffsetX, setNavOffsetX] = useState<number>(Number(settings?.nav_offset_x ?? 0));
  const [navOffsetY, setNavOffsetY] = useState<number>(Number(settings?.nav_offset_y ?? settings?.nav_bottom ?? 16));
  const [navWidth, setNavWidth] = useState<number>(
    Number(typeof settings?.nav_width === 'number' ? settings.nav_width : parseInt(String(settings?.nav_width || '92'), 10) || 92)
  );
  const [navPaddingY, setNavPaddingY] = useState<number>(Number(settings?.nav_padding_y ?? 12));
  const [navBorderRadius, setNavBorderRadius] = useState<number>(Number(settings?.nav_border_radius ?? 24));

  // Invite user form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'secretary' | 'moderator'>('secretary');
  const [inviteName, setInviteName] = useState('');

  // Team users query (chargement des profils depuis la table Supabase `profiles`)
  const { data: teamUsers = [] } = useCachedQuery<any[]>({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('Erreur chargement profiles dans Moderation:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 5000,
  });

  const [localTeamUsers, setLocalTeamUsers] = useState<any[]>([]);

  useEffect(() => {
    if (teamUsers) setLocalTeamUsers(teamUsers);
  }, [teamUsers]);

  // Synchronisation temps réel lors de modifications de profils ou de rôles
  useEffect(() => {
    const handleProfilesChange = () => {
      qc.invalidateQueries({ queryKey: ['team-users'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    };
    window.addEventListener('brm-profiles-change', handleProfilesChange);
    return () => window.removeEventListener('brm-profiles-change', handleProfilesChange);
  }, [qc]);

  // Clients query
  const { data: clients = [] } = useCachedQuery<any[]>({
    queryKey: ['moderation-clients'],
    queryFn: async () => {
      return base44.entities.Client.list('-last_seen', 200);
    },
    staleTime: 5000,
  });

  const handleSaveAppearanceAndPower = async () => {
    try {
      // 1. Supabase app_settings (singleton id = 'a0000000-0000-0000-0000-000000000001')
      const { data, error } = await supabase
        .from('app_settings')
        .update({
          theme: currentTheme,
          is_locked: !appOpened,
          lock_message: closedMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'a0000000-0000-0000-0000-000000000001')
        .select()
        .single();

      console.log('Update app_settings:', { data, error });

      // Synchronisation locale pour rétrocompatibilité
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, {
          theme: currentTheme,
          app_active: appOpened,
          app_opened: appOpened,
          is_locked: !appOpened,
          master_access_code: masterAccessCode.trim() || 'Acces',
          client_unblock_code: clientUnblockCode.trim() || 'Accepter',
          closed_message: closedMessage,
          nav_offset_x: navOffsetX,
          nav_offset_y: navOffsetY,
          nav_bottom: navOffsetY,
          nav_width: navWidth,
          nav_padding_y: navPaddingY,
          nav_border_radius: navBorderRadius,
        });
      }
      toast({ title: 'Paramètres système enregistrés avec succès', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } catch {
      toast({ title: "Erreur d'enregistrement", variant: 'destructive' });
    }
  };

  const handleSaveNavSettings = async () => {
    try {
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, {
          nav_offset_x: navOffsetX,
          nav_offset_y: navOffsetY,
          nav_bottom: navOffsetY,
          nav_width: navWidth,
          nav_padding_y: navPaddingY,
          nav_border_radius: navBorderRadius,
        });
      }
      toast({ title: 'Dimensions du Navigateur (BottomNav) enregistrées', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } catch {
      toast({ title: "Erreur d'enregistrement", variant: 'destructive' });
    }
  };

  const handleSaveClientUnblockCode = async () => {
    try {
      if (settings?.id) {
        await base44.entities.AppSettings.update(settings.id, {
          client_unblock_code: clientUnblockCode.trim() || 'Accepter',
        });
      }
      toast({ title: 'Code de déblocage client mis à jour', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    } catch {
      toast({ title: "Erreur d'enregistrement", variant: 'destructive' });
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    let cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) cleanEmail += '@gmail.com';

    const role = inviteRole;

    try {
      // 1. Vérifier si un profil existe déjà pour cet email
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            role,
            nom: inviteName.trim() || existing.nom,
            full_name: inviteName.trim() || existing.full_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        console.log('Update role:', { data, error });
        if (error) throw error;
      } else {
        // 2. Création/upsert d'un profil pour l'invitation
        const newId = crypto.randomUUID();
        const fullName = inviteName.trim() || cleanEmail.split('@')[0];
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: newId,
            email: cleanEmail,
            nom: fullName,
            full_name: fullName,
            role,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        console.log('Update role:', { data, error });
        if (error) {
          if (
            error.code === '23503' ||
            error.message?.includes('foreign key') ||
            error.message?.includes('profiles_id_fkey')
          ) {
            throw new Error(
              `Ce compte (${cleanEmail}) doit d'abord s'être connecté une première fois avec Google sur l'application.`
            );
          }
          throw error;
        }
      }

      toast({
        title: 'Rôle attribué avec succès',
        description: `Rôle '${role}' accordé pour ${cleanEmail}.`,
        variant: 'success',
      });
      setInviteEmail('');
      setInviteName('');
      setInviteRole('secretary');
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['team-users'] });
      window.dispatchEvent(new CustomEvent('brm-profiles-change'));
    } catch (err: any) {
      console.error('Erreur attribution rôle:', err);
      toast({
        title: "Erreur lors de l'attribution",
        description: err?.message || "Impossible d'accorder le rôle.",
        variant: 'destructive',
      });
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const role = newRole === 'admin' ? 'moderator' : newRole === 'user' ? 'client' : newRole;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      console.log('Update role:', { data, error });

      if (error) throw error;

      toast({ title: 'Rôle modifié avec succès', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['team-users'] });
      window.dispatchEvent(new CustomEvent('brm-profiles-change'));
    } catch (err: any) {
      console.error('Erreur modification rôle:', err);
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de modifier le rôle.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'client', updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      console.log('Update role:', { data, error });
      if (error) throw error;

      setLocalTeamUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: "Membre retiré de l'équipe (rétrogradé en client)", variant: 'success' });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['team-users'] });
      window.dispatchEvent(new CustomEvent('brm-profiles-change'));
    } catch (err: any) {
      console.error('Erreur suppression membre:', err);
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de retirer le membre.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBlockClient = async (client: any) => {
    const nextBlocked = !client.blocked;
    try {
      // 1. Suspension d'accès local/client device (base44 Client, respecté par ClosedScreen)
      await base44.entities.Client.update(client.id, { blocked: nextBlocked });

      // 2. Si le client correspond à un compte profiles, on applique role = 'client' pour révoquer tout accès staff
      if (nextBlocked && (client.profile_id || client.email)) {
        let q = supabase.from('profiles').update({ role: 'client', updated_at: new Date().toISOString() });
        if (client.profile_id) {
          q = q.eq('id', client.profile_id);
        } else if (client.email) {
          q = q.eq('email', client.email);
        }
        const { data, error } = await q.select();
        console.log('Revoke staff roles for blocked user:', { data, error });
      }

      toast({
        title: nextBlocked ? 'Accès client suspendu' : 'Accès client rétabli',
        variant: nextBlocked ? 'destructive' : 'success',
      });
      qc.invalidateQueries({ queryKey: ['moderation-clients'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['team-users'] });
    } catch (err: any) {
      console.error('Erreur blocage client:', err);
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-10 font-body">
      <div>
        <span className="eyebrow block mb-0.5">Contrôle global & Sécurité</span>
        <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
          Modération & Permissions
        </h2>
        <p className="text-xs sm:text-sm text-cacao/65 mt-0.5">
          Gérez le thème de l'application, l'ouverture générale du service, les membres de l'équipe et le blocage des clients.
        </p>
      </div>

      {/* 1. Theme Selection */}
      <div className="card-soft p-6 sm:p-8 space-y-5 border border-cacao/10">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Thème de Couleurs de l'Application
          </h3>
        </div>
        <p className="text-xs text-cacao/65">
          Sélectionnez l'ambiance chromatique active pour l'ensemble des visiteurs et des espaces professionnels.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {THEMES.map((th) => {
            const isSelected = currentTheme === th.value;
            return (
              <button
                key={th.value}
                type="button"
                onClick={() => setCurrentTheme(th.value)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-gold bg-gold/15 shadow-md'
                    : 'border-cacao/10 bg-white/60 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-display font-medium text-base text-cacao">
                      {th.label}
                    </span>
                    {/* Swatches preview */}
                    <div className="flex gap-1">
                      {th.swatch.map((color, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-cacao/65 leading-relaxed font-body">
                    {th.hint}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold text-gold mt-3 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Thème actif</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom BottomNav Dimensional Settings (Ajustement sur-mesure du Navigateur) */}
      <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-gold" />
            <div>
              <h3 className="font-display text-xl text-cacao font-medium">
                Ajustement sur-mesure du Navigateur (BottomNav)
              </h3>
              <p className="text-xs text-cacao/65">
                Réglez au pixel près l'arrondi, la position, la largeur et la hauteur interne de la barre de navigation client.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setNavOffsetX(0);
              setNavOffsetY(16);
              setNavWidth(92);
              setNavPaddingY(12);
              setNavBorderRadius(24);
            }}
            className="text-xs text-cacao/60 hover:text-cacao inline-flex items-center gap-1 font-semibold cursor-pointer"
            title="Rétablir les dimensions par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser par défaut</span>
          </button>
        </div>

        {/* Live Interactive Preview */}
        <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/60 border border-cacao/10 dark:border-white/10 flex flex-col items-center justify-center min-h-[120px] overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cacao/50 dark:text-sand/50 mb-3">
            Aperçu en temps réel de votre barre de navigation :
          </span>

          <div
            style={{
              width: `${navWidth}%`,
              maxWidth: '460px',
              paddingTop: `${navPaddingY}px`,
              paddingBottom: `${navPaddingY}px`,
              borderRadius: `${navBorderRadius}px`,
              transform: navOffsetX ? `translateX(${navOffsetX}px)` : undefined,
              marginBottom: `${Math.min(24, navOffsetY / 2)}px`,
            }}
            className="bg-[#2B1D16] text-white px-3 flex items-center justify-between gap-2 shadow-xl border border-amber-900/30 transition-all duration-150"
          >
            {['Accueil', 'Rendez-vous', 'Messages', 'Boutique', 'Découvrir'].map((label, idx) => {
              const isSelected = idx === 1; // Example selected item
              return (
                <div
                  key={label}
                  style={{
                    borderRadius: `${Math.max(6, navBorderRadius - 4)}px`,
                  }}
                  className={`flex-1 py-1 px-1.5 text-center text-[10px] font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                      : 'text-white/80'
                  }`}
                >
                  <span className="truncate block">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* 1. Horizontal Position */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-cacao dark:text-sand">
                <MoveHorizontal className="w-3.5 h-3.5 text-gold" />
                <span>1. Position Horizontale (Décalage X)</span>
              </span>
              <strong className="text-gold font-mono">{navOffsetX}px</strong>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              step="1"
              value={navOffsetX}
              onChange={(e) => setNavOffsetX(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-cacao/50 dark:text-sand/50">
              <span>Gauche (-60px)</span>
              <span>Centré (0px)</span>
              <span>Droite (+60px)</span>
            </div>
          </div>

          {/* 2. Vertical Position */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-cacao dark:text-sand">
                <MoveVertical className="w-3.5 h-3.5 text-gold" />
                <span>2. Position Verticale (Marge du bas Y)</span>
              </span>
              <strong className="text-gold font-mono">{navOffsetY}px</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={navOffsetY}
              onChange={(e) => setNavOffsetY(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-cacao/50 dark:text-sand/50">
              <span>Ras du bas (0px)</span>
              <span>Flottant classique (16px)</span>
              <span>Élevé (60px)</span>
            </div>
          </div>

          {/* 3. Width */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-cacao dark:text-sand">
                <Maximize2 className="w-3.5 h-3.5 text-gold" />
                <span>3. Largeur Globale</span>
              </span>
              <strong className="text-gold font-mono">{navWidth}%</strong>
            </div>
            <input
              type="range"
              min="60"
              max="100"
              step="1"
              value={navWidth}
              onChange={(e) => setNavWidth(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-cacao/50 dark:text-sand/50">
              <span>Compacte (60%)</span>
              <span>Idéal (92%)</span>
              <span>Pleine largeur (100%)</span>
            </div>
          </div>

          {/* 4. Internal Vertical Padding */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-cacao dark:text-sand">
                <Sliders className="w-3.5 h-3.5 text-gold" />
                <span>4. Hauteur Interne (Rembourrage)</span>
              </span>
              <strong className="text-gold font-mono">{navPaddingY}px</strong>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={navPaddingY}
              onChange={(e) => setNavPaddingY(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-cacao/50 dark:text-sand/50">
              <span>Très fine (4px)</span>
              <span>Confort (12px)</span>
              <span>Épaisse (24px)</span>
            </div>
          </div>

          {/* 5. Border Radius (Arrondi des coins) */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-cacao dark:text-sand">
                <RotateCcw className="w-3.5 h-3.5 text-gold" />
                <span>5. Arrondi des coins (Rayon de courbure)</span>
              </span>
              <strong className="text-gold font-mono">{navBorderRadius}px</strong>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={navBorderRadius}
              onChange={(e) => setNavBorderRadius(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-cacao/50 dark:text-sand/50">
              <span>Bords carrés (0px)</span>
              <span>Arrondi moderne (24px)</span>
              <span>Pilule totale (40px)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveNavSettings}
            className="btn-gold py-2 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Dimensions du Navigateur</span>
          </button>
        </div>
      </div>

      {/* 3. App Power Switch & Master Access Code */}
      <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10">
        <div className="flex items-center justify-between pb-4 border-b border-cacao/10">
          <div className="flex items-center gap-2.5">
            <Power className={`w-5 h-5 ${appOpened ? 'text-emerald-600' : 'text-rose-600'}`} />
            <div>
              <h3 className="font-display text-xl text-cacao font-medium">
                Ouverture & Verrouillage Central de l'Application
              </h3>
              <p className="text-xs text-cacao/60">
                État actuel :{' '}
                <strong className={appOpened ? 'text-emerald-700' : 'text-rose-700'}>
                  {appOpened ? 'Application Ouverte au Public & à l\'Équipe' : 'Application Fermée / Verrouillée'}
                </strong>
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appOpened}
              onChange={(e) => setAppOpened(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Master Emergency Access Code (Code Secret d'Accès d'Urgence) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-cacao block mb-1">
              Code Secret d'Accès d'Urgence (Master Code)
            </label>
            <p className="text-xs text-cacao/70 leading-relaxed font-body">
              Permet de déverrouiller immédiatement l'accès à l'application sur un terminal lorsque l'application est en mode fermé.
            </p>
          </div>
          <div className="flex flex-col justify-center">
            <input
              type="text"
              value={masterAccessCode}
              onChange={(e) => setMasterAccessCode(e.target.value)}
              placeholder="Ex: Acces"
              className="field text-sm font-bold tracking-wider text-cacao bg-white"
            />
          </div>
        </div>

        {!appOpened && (
          <div className="space-y-2 p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <label className="text-xs font-semibold uppercase tracking-wider text-rose-800 block">
              Message d'information affiché aux visiteurs pendant la fermeture :
            </label>
            <textarea
              rows={2}
              value={closedMessage}
              onChange={(e) => setClosedMessage(e.target.value)}
              className="field text-xs resize-none"
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveAppearanceAndPower}
            className="btn-gold py-2 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le Thème & le Verrouillage Central</span>
          </button>
        </div>
      </div>

      {/* 3. Team Roles & Accounts */}
      <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Membres de l'Équipe & Rôles
          </h3>
        </div>

        {/* Invite form */}
        <form onSubmit={handleInviteUser} className="p-4 rounded-2xl bg-white/70 border border-cacao/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cacao/60 block">
            Inviter un nouveau membre :
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nom complet (ex: Jean Dossou)"
                className="field text-xs py-2"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@benin-reflexologie.bj"
                className="field text-xs py-2"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="field text-xs py-2"
              >
                <option value="secretary">Secrétariat</option>
                <option value="moderator">Modérateur</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!inviteEmail.trim()}
              className="btn-dark py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter à l'équipe</span>
            </button>
          </div>
        </form>

        {/* Users list */}
        <div className="space-y-2">
          {localTeamUsers.map((u) => (
            <div
              key={u.id}
              className="p-3.5 rounded-2xl bg-white/60 border border-cacao/10 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cacao/10 text-cacao flex items-center justify-center font-bold text-xs">
                  {(u.full_name || u.nom || u.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="font-semibold text-cacao">{u.full_name || u.nom || 'Membre'}</h5>
                  <span className="text-xs text-cacao/60">{u.email || u.telephone || 'Sans coordonnées'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={u.role || 'client'}
                  onChange={(e) => handleChangeRole(u.id, e.target.value)}
                  className="p-1.5 rounded-xl border border-cacao/20 text-xs font-semibold bg-white text-cacao"
                >
                  <option value="secretary">Secrétariat</option>
                  <option value="moderator">Modérateur</option>
                  <option value="client">Client</option>
                </select>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(u.id);
                  }}
                  className="p-1.5 rounded-lg text-cacao/40 hover:text-rose-600 transition cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Clients list & Suspension */}
      <div className="card-soft p-6 sm:p-8 space-y-6 border border-cacao/10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl text-cacao font-medium">
            Fiches Clients & Suspension d'Accès
          </h3>
        </div>
        <p className="text-xs text-cacao/65">
          Visualisez les fiches de vos clients et suspendez un accès en cas d'abus ou de litige.
        </p>

        {/* Client Unblock Secret Code Configuration Card */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cacao block">
              Code Secret de Déblocage Client (Accès suspendu)
            </span>
            <p className="text-xs text-cacao/70 leading-relaxed font-body">
              Code confidentiel que vous pouvez transmettre à un client suspendu pour lui permettre de débloquer son compte de façon autonome (Défaut : <strong>Accepter</strong>).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={clientUnblockCode}
              onChange={(e) => setClientUnblockCode(e.target.value)}
              placeholder="Ex: Accepter"
              className="field text-xs font-bold tracking-wider text-cacao bg-white w-32 sm:w-36 py-2 text-center"
            />
            <button
              type="button"
              onClick={handleSaveClientUnblockCode}
              className="btn-gold py-2 px-3.5 text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
              title="Enregistrer le code de déblocage"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {clients.length === 0 ? (
            <p className="text-xs text-cacao/50 italic py-4">Aucun client encore enregistré sur la plateforme.</p>
          ) : (
            clients.map((c) => (
              <div
                key={c.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition ${
                  c.blocked ? 'bg-rose-50 border-rose-200' : 'bg-white/60 border-cacao/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-cacao">{c.name}</h5>
                    {c.blocked && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-200 px-2 py-0.2 rounded-full">
                        Accès suspendu
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-cacao/60 mt-0.5">
                    {c.phone ? `Tél : ${c.phone}` : 'Sans numéro'} • Visite :{' '}
                    {c.last_seen ? formatDate(c.last_seen, 'd MMM yyyy') : 'Récente'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleBlockClient(c)}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    c.blocked
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-rose-700 text-white hover:bg-rose-800'
                  }`}
                >
                  {c.blocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  <span>{c.blocked ? 'Rétablir l\'accès' : 'Suspendre l\'accès'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
