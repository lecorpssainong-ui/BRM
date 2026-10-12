import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { UserProfile } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/toaster';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  Trash2,
  Mail,
  User,
  Phone,
  Search,
  Briefcase,
} from 'lucide-react';

export default function TeamManager() {
  const { getAllUsers, assignTeamRole, revokeTeamRole, user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'staff' | 'clients'>('all');

  // Form states to add / configure a user
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'secretary' | 'moderator' | 'client'>('secretary');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const list = await getAllUsers();
      setAllUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Erreur chargement utilisateurs:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleProfilesChange = () => fetchUsers();
    window.addEventListener('brm-profiles-change', handleProfilesChange);
    return () => window.removeEventListener('brm-profiles-change', handleProfilesChange);
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    let cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) cleanEmail += '@gmail.com';

    setSubmitting(true);
    try {
      await assignTeamRole(
        cleanEmail,
        selectedRole,
        nom.trim() || undefined,
        telephone.trim() || undefined
      );

      toast({
        title: 'Rôle mis à jour',
        description: `Rôle '${selectedRole}' attribué pour ${cleanEmail}.`,
        variant: 'success',
      });

      setEmail('');
      setNom('');
      setTelephone('');
      setSelectedRole('secretary');
      await fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Erreur d’attribution',
        description: err?.message || 'Impossible d’accorder le rôle.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (targetUser: UserProfile, newRole: 'secretary' | 'moderator' | 'client') => {
    try {
      await assignTeamRole(
        targetUser.email,
        newRole,
        targetUser.nom,
        targetUser.telephone
      );
      toast({
        title: 'Rôle actualisé',
        description: `${targetUser.email} est désormais ${newRole === 'moderator' ? 'Modérateur' : newRole === 'secretary' ? 'Secrétaire' : 'Client'}.`,
        variant: 'default',
      });
      await fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de modifier le rôle.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAll = async (targetUser: UserProfile) => {
    if (targetUser.id === user?.id) {
      toast({
        title: 'Action impossible',
        description: 'Vous ne pouvez pas révoquer vos propres droits.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Rétrograder ${targetUser.email} au rôle Client standard ?`)) return;

    try {
      await revokeTeamRole(targetUser.id);
      toast({
        title: 'Droits révoqués',
        description: `${targetUser.email} a été rétrogradé au rôle Client standard.`,
        variant: 'default',
      });
      await fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Erreur de révocation',
        description: err?.message || 'Impossible de révoquer les droits.',
        variant: 'destructive',
      });
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.telephone?.includes(q);

    if (!matchesSearch) return false;

    if (filterTab === 'staff') return u.role === 'secretary' || u.role === 'moderator';
    if (filterTab === 'clients') return u.role === 'client';
    return true;
  });

  const staffCount = allUsers.filter((u) => u.role === 'secretary' || u.role === 'moderator').length;
  const clientCount = allUsers.filter((u) => u.role === 'client').length;

  return (
    <div className="space-y-8 font-body max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Administration & Sécurité</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Gestion des Utilisateurs & Attribution des Rôles
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-0.5">
            Aperçu de tous les comptes enregistrés dans la base de données (Gmail, Nom exact, Téléphone et Rôle ENUM).
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-gold/15 text-gold self-start sm:self-auto">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold text-cacao dark:text-sand">RBAC Supabase Sécurisé</span>
        </div>
      </div>

      {/* Formulaire d'ajout / attribution */}
      <div className="card-soft p-6 sm:p-8 space-y-6 bg-white/80 dark:bg-stone-900/80 border border-cacao/10 shadow-lg rounded-3xl">
        <div className="flex items-center gap-2.5 pb-2 border-b border-cacao/10">
          <UserPlus className="w-5 h-5 text-gold" />
          <div>
            <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
              Attribuer ou modifier le rôle d'un compte
            </h3>
            <p className="text-xs text-cacao/60 dark:text-sand/60">
              Par défaut, tout utilisateur est <strong>Client</strong>. Seul le Modérateur peut attribuer un rôle Secrétaire ou Modérateur.
            </p>
          </div>
        </div>

        <form onSubmit={handleAssign} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/75 dark:text-sand/75 block mb-1">
                Compte Gmail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cacao/40 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@gmail.com"
                  className="field pl-9 text-xs sm:text-sm py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/75 dark:text-sand/75 block mb-1">
                Nom d'utilisateur exact
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cacao/40 absolute left-3 top-3" />
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Sophie ou Thomas"
                  className="field pl-9 text-xs sm:text-sm py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-cacao/75 dark:text-sand/75 block mb-1">
                Numéro de téléphone exact
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-cacao/40 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex: 0191729117"
                  className="field pl-9 text-xs sm:text-sm py-2.5"
                />
              </div>
            </div>
          </div>

          {/* Sélecteur de rôle exclusif */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-cacao dark:text-sand block">
                Rôle à attribuer
              </span>
              <p className="text-[11px] text-cacao/65 dark:text-sand/65">
                Sélectionnez le niveau d'accès pour ce compte :
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-cacao/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={`py-1.5 px-3 rounded-xl transition cursor-pointer ${
                  selectedRole === 'client'
                    ? 'bg-stone-300 dark:bg-stone-700 text-cacao dark:text-sand shadow-xs'
                    : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('secretary')}
                className={`py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  selectedRole === 'secretary'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Secrétaire</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('moderator')}
                className={`py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  selectedRole === 'moderator'
                    ? 'bg-gold text-stone-950 shadow-xs font-black'
                    : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Modérateur</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              <span>Enregistrer dans la base de données</span>
            </button>
          </div>
        </form>
      </div>

      {/* Liste des utilisateurs avec filtres et recherche */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl text-cacao dark:text-sand font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <span>Base des utilisateurs ({filteredUsers.length})</span>
            </h3>
          </div>

          {/* Filtres tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-cacao/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`py-1 px-3 rounded-xl transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-gold text-stone-950 shadow-xs'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              Tous ({allUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('staff')}
              className={`py-1 px-3 rounded-xl transition cursor-pointer ${
                filterTab === 'staff'
                  ? 'bg-gold text-stone-950 shadow-xs'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              Staff ({staffCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('clients')}
              className={`py-1 px-3 rounded-xl transition cursor-pointer ${
                filterTab === 'clients'
                  ? 'bg-gold text-stone-950 shadow-xs'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              Clients ({clientCount})
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-cacao/40 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par compte Gmail, nom d'utilisateur ou numéro de téléphone..."
            className="field pl-10 text-xs sm:text-sm py-2"
          />
        </div>

        {loadingUsers ? (
          <div className="p-8 text-center text-xs text-cacao/60 animate-pulse card-soft">
            Chargement des comptes utilisateurs...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card-soft p-8 text-center text-xs text-cacao/60">
            Aucun compte trouvé correspondant aux critères.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((item) => {
              const isMod = item.role === 'moderator';
              const isSec = item.role === 'secretary';

              return (
                <div
                  key={item.id || item.email}
                  className="card-soft p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-cacao/10 bg-white/70 dark:bg-stone-900/70 hover:shadow-md transition rounded-2xl"
                >
                  {/* Coordonnées */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                        isMod
                          ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30'
                          : isSec
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {(item.nom || item.full_name || item.email || 'U')[0].toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-cacao dark:text-sand truncate">
                          {item.nom || item.full_name}
                        </h4>

                        {isMod ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/25 text-stone-900 dark:text-amber-300 border border-gold/40 flex items-center gap-1">
                            <Shield className="w-3 h-3 fill-current" />
                            <span>Modérateur</span>
                          </span>
                        ) : isSec ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>Secrétaire</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            Client
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-cacao/65 dark:text-sand/65 flex-wrap">
                        <span className="font-mono text-cacao/80 dark:text-sand/80">
                          {item.email}
                        </span>
                        {item.telephone && (
                          <span className="text-[11px] text-cacao/60 dark:text-sand/60">
                            • Tél : <strong className="font-mono">{item.telephone}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Sélecteur de rôle */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
                    <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-cacao/10 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleUpdateRole(item, 'client')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          item.role === 'client'
                            ? 'bg-stone-300 dark:bg-stone-700 text-cacao dark:text-sand font-bold shadow-xs'
                            : 'text-stone-500 hover:text-cacao'
                        }`}
                      >
                        Client
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRole(item, 'secretary')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          item.role === 'secretary'
                            ? 'bg-amber-600 text-white font-bold shadow-xs'
                            : 'text-stone-500 hover:text-cacao'
                        }`}
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>Secrétaire</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateRole(item, 'moderator')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          item.role === 'moderator'
                            ? 'bg-gold text-stone-950 font-black shadow-xs'
                            : 'text-stone-500 hover:text-cacao'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>Modérateur</span>
                      </button>
                    </div>

                    {item.role !== 'client' && (
                      <button
                        type="button"
                        onClick={() => handleRevokeAll(item)}
                        className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Rétrograder en simple client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
