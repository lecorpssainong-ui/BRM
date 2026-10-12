import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MessageSquare,
  Search,
  Trash2,
  RefreshCw,
  Sparkles,
  CreditCard,
  User,
  AlertCircle,
  Filter,
  FileText,
  HeartPulse,
} from 'lucide-react';
import { useSecretaryAppointments } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import AnamnesisArchiveLibrary from './staff/AnamnesisArchiveLibrary';

/**
 * SECRETARY PANEL — MODULE DU SECRÉTARIAT (CONNECTÉ À SUPABASE REALTIME)
 * Actions CRUD ultra-réactives, e.stopPropagation() & e.preventDefault() sur tous les boutons,
 * mises à jour optimistes et synchronisation instantanée avec la base de données.
 */
export default function SecretaryPanel() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState('appointments'); // 'appointments' | 'bilans'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification In-App en direct lors de la réception d'une nouvelle anamnèse
  useEffect(() => {
    const handleNewAnam = (e) => {
      const data = e.detail;
      toast({
        title: 'Nouveau Bilan Clinique Reçu !',
        description: `${data.client_name || 'Un patient'} a transmis son anamnèse (${data.pathology}). Consultez l'onglet Bilans pour la lire ou la télécharger.`,
        variant: 'default',
      });
    };
    window.addEventListener('brm-new-anamnesis', handleNewAnam);
    return () => window.removeEventListener('brm-new-anamnesis', handleNewAnam);
  }, []);

  // Chargement réactif depuis Supabase avec Realtime
  const { data: appointments = [], refetch: refetchAppts, isLoading } = useSecretaryAppointments();

  const [localAppointments, setLocalAppointments] = useState([]);

  useEffect(() => {
    setLocalAppointments(appointments || []);
  }, [appointments]);

  // Actions Rendez-vous avec e.stopPropagation() & mise à jour optimiste
  const handleUpdateStatus = async (e, id, newStatus) => {
    e.stopPropagation();
    e.preventDefault();

    // Optimistic Update
    setLocalAppointments((prev) =>
      (prev || []).map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title:
          newStatus === 'confirmed'
            ? 'Rendez-vous validé !'
            : newStatus === 'cancelled'
            ? 'Rendez-vous annulé'
            : 'Statut mis à jour',
        description: `Le statut a été passé à "${newStatus}".`,
        variant: 'success',
      });

      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
    } catch (err) {
      console.error('Erreur mise à jour rendez-vous:', err);
      toast({
        title: 'Erreur lors de la mise à jour',
        description: err?.message || 'Veuillez vérifier les droits ou la connexion.',
        variant: 'destructive',
      });
      refetchAppts();
    }
  };

  const handleDeleteAppointment = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm('Supprimer définitivement ce rendez-vous ?')) return;

    // Optimistic Update
    setLocalAppointments((prev) => (prev || []).filter((app) => app.id !== id));

    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Rendez-vous supprimé avec succès !',
        variant: 'success',
      });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
    } catch (err) {
      console.error('Erreur suppression rendez-vous:', err);
      toast({
        title: 'Échec de la suppression.',
        description: err?.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
      refetchAppts();
    }
  };

  // Filtrage sécurisé (anti-crash)
  const filteredAppointments = (localAppointments || []).filter((app) => {
    if (!app) return false;
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (app.client_name || '').toLowerCase().includes(q);
      const matchPhone = (app.client_phone || '').includes(q);
      const matchSoin = (app.massage_name || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchSoin) return false;
    }
    return true;
  });

  const countPending = (localAppointments || []).filter((a) => a?.status === 'pending').length;
  const countConfirmed = (localAppointments || []).filter((a) => a?.status === 'confirmed').length;

  return (
    <div className="space-y-6 font-body text-cacao dark:text-sand">
      {/* En-tête & Statistiques Express */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/70 dark:bg-stone-900/80 border border-amber-500/20 shadow-md backdrop-blur-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Secrétariat Opérationnel • Bénin Réflexologie</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-medium text-cacao dark:text-sand mt-0.5">
            Gestion Quotidienne des Soins
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de Vue : Rendez-vous / Bibliothèque des Bilans */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/60 dark:bg-stone-800/80 border border-cacao/10 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('appointments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'appointments'
                  ? 'bg-cacao text-sand shadow-sm'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-gold" />
              <span>Rendez-vous ({(localAppointments || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('bilans')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'bilans'
                  ? 'bg-cacao text-sand shadow-sm'
                  : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-gold" />
              <span>Bibliothèque des Bilans (PDF)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              refetchAppts();
              toast.info('Données actualisées');
            }}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-gold/20 text-cacao dark:text-sand transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4 text-gold" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {viewMode === 'bilans' ? (
        <AnamnesisArchiveLibrary />
      ) : (
        <>
          {/* Cartes KPI Rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-amber-500/20 shadow-xs">
          <span className="text-xs text-cacao/60 dark:text-sand/60">En attente</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {countPending}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-emerald-500/20 shadow-xs">
          <span className="text-xs text-cacao/60 dark:text-sand/60">Confirmés</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {countConfirmed}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-cacao/10 dark:border-white/10 shadow-xs">
          <span className="text-xs text-cacao/60 dark:text-sand/60">Total séances</span>
          <div className="text-2xl font-bold text-cacao dark:text-sand mt-1">
            {(localAppointments || []).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-purple-500/20 shadow-xs">
          <span className="text-xs text-cacao/60 dark:text-sand/60">Mode BDD</span>
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MockStore Local</span>
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cacao/40 dark:text-sand/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone ou soin..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 dark:border-white/10 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'confirmed', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setStatusFilter(st);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-gold text-stone-950 shadow-md font-bold'
                  : 'bg-white/50 dark:bg-stone-900/50 hover:bg-white/80 text-cacao/70 dark:text-sand/70'
              }`}
            >
              {st === 'all'
                ? 'Tous'
                : st === 'pending'
                ? 'En attente'
                : st === 'confirmed'
                ? 'Confirmés'
                : 'Annulés'}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Rendez-vous avec Actions Protégées (e.stopPropagation) */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/40 dark:bg-stone-900/40 border border-dashed border-cacao/20 dark:border-white/20">
            <Calendar className="w-8 h-8 text-cacao/40 dark:text-sand/40 mx-auto mb-2" />
            <p className="text-sm font-semibold">Aucun rendez-vous trouvé.</p>
            <p className="text-xs text-cacao/60 dark:text-sand/60 mt-1">
              Les demandes client passées via le Conseiller IA ou l'agenda s'affichent ici.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredAppointments.map((app) => {
              const isPending = app?.status === 'pending';
              const isConfirmed = app?.status === 'confirmed';

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-stone-900/85 border border-amber-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-gold/50"
                >
                  {/* Informations Client & Soin */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-medium text-base text-cacao dark:text-sand truncate">
                        {app.client_name || 'Client anonyme'}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isConfirmed ? 'Confirmé' : isPending ? 'En attente' : app.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cacao/70 dark:text-sand/70">
                      <span className="font-semibold text-gold">{app.massage_name}</span>
                      {app.date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cacao/50 dark:text-sand/50" />
                          <span>{new Date(app.date).toLocaleString('fr-FR')}</span>
                        </span>
                      )}
                      {app.client_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-cacao/50 dark:text-sand/50" />
                          <span>{app.client_phone}</span>
                        </span>
                      )}
                    </div>

                    {app.notes && (
                      <p className="text-xs text-cacao/60 dark:text-sand/60 italic pt-1 line-clamp-2">
                        « {app.notes} »
                      </p>
                    )}
                  </div>

                  {/* Boutons d'Action (ZÉRO BUG : e.stopPropagation()) */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Valider / Confirmer */}
                    {!isConfirmed && (
                      <button
                        type="button"
                        onClick={(e) => handleUpdateStatus(e, app.id, 'confirmed')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        title="Confirmer la séance"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider</span>
                      </button>
                    )}

                    {/* Annuler */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={(e) => handleUpdateStatus(e, app.id, 'cancelled')}
                        className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition active:scale-95 cursor-pointer"
                        title="Annuler"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* WhatsApp Rapide */}
                    {app.client_phone && (
                      <a
                        href={`https://wa.me/${app.client_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                        title="Contacter sur WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {/* Supprimer */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAppointment(e, app.id)}
                      className="p-2 rounded-xl text-cacao/40 dark:text-sand/40 hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </>
  )}
</div>
  );
}
