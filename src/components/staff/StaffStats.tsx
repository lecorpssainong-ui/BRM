import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/format';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { logActivity } from '@/lib/activityLogger';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  ShoppingBag,
  DollarSign,
  Filter,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';

interface StaffStatsProps {
  appointments?: any[];
  orders?: any[];
  invoices?: any[];
  clients?: any[];
}

type TimeFilter = 'all' | 'day' | 'week' | 'month';

export default function StaffStats({
  appointments = [],
  orders = [],
  invoices = [],
  clients = [],
}: StaffStatsProps) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  // Filter items by selected time range
  const { filteredAppts, filteredOrders, filteredInvoices } = useMemo(() => {
    if (filter === 'all') {
      return {
        filteredAppts: appointments,
        filteredOrders: orders,
        filteredInvoices: invoices,
      };
    }

    const now = Date.now();
    const isWithinRange = (dateStr?: string) => {
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return false;

      if (filter === 'day') {
        const today = new Date().toDateString();
        return new Date(dateStr).toDateString() === today;
      }
      if (filter === 'week') {
        const diffDays = (now - t) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (filter === 'month') {
        const diffDays = (now - t) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    };

    return {
      filteredAppts: appointments.filter((a) => isWithinRange(a.date || a.created_date)),
      filteredOrders: orders.filter((o) => isWithinRange(o.created_date || o.created_at)),
      filteredInvoices: invoices.filter((i) => isWithinRange(i.created_date || i.date)),
    };
  }, [filter, appointments, orders, invoices]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalAppointments = filteredAppts.length;
    const confirmedAppts = filteredAppts.filter((a) => a.status === 'accepted').length;

    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter((o) => ['paid', 'delivered'].includes(o.status));
    const shopRevenue = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

    const nonCancelledInvoices = filteredInvoices.filter((i) => i.status !== 'cancelled');
    const invoicesRevenue = nonCancelledInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0);

    // Group appointments by massage
    const massageCounts: Record<string, number> = {};
    filteredAppts.forEach((a) => {
      const name = a.massage_name || 'Autre';
      massageCounts[name] = (massageCounts[name] || 0) + 1;
    });

    const topMassages = Object.entries(massageCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAppointments,
      confirmedAppts,
      totalOrders,
      shopRevenue,
      invoicesRevenue,
      totalRevenue: shopRevenue + invoicesRevenue,
      topMassages,
      totalClients: clients.length,
    };
  }, [filteredAppts, filteredOrders, filteredInvoices, clients]);

  const handlePurge = async () => {
    setPurging(true);
    try {
      let count = 0;
      // Delete filtered appointments
      for (const a of filteredAppts) {
        if (a.id) {
          try {
            await base44.entities.Appointment.delete(a.id);
            count++;
          } catch {}
        }
      }
      // Delete filtered orders
      for (const o of filteredOrders) {
        if (o.id) {
          try {
            await base44.entities.Order.delete(o.id);
            count++;
          } catch {}
        }
      }

      logActivity({
        table: 'Stats',
        action: 'purge',
        description: `Purge de ${count} enregistrement(s) pour la période filtre '${filter}'`,
      });

      toast({
        title: 'Données purgées avec succès',
        description: `${count} entrée(s) de la période "${filter === 'day' ? 'Jour' : filter === 'week' ? 'Semaine' : filter === 'month' ? 'Mois' : 'Toutes'}" ont été supprimées.`,
        variant: 'success',
      });

      setIsPurgeModalOpen(false);
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-orders'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-invoices'] });
    } catch (e: any) {
      toast({
        title: 'Erreur lors de la purge',
        description: e?.message || 'Impossible de purger les données.',
        variant: 'destructive',
      });
    } finally {
      setPurging(false);
    }
  };

  const filterLabels: Record<TimeFilter, string> = {
    all: 'Global / Tout',
    day: 'Par Jour',
    week: 'Par Semaine',
    month: 'Par Mois',
  };

  return (
    <div className="space-y-8 font-body max-w-5xl mx-auto">
      {/* Top Header & Time Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Performance & Activité</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
            Statistiques & Tableaux de Bord
          </h2>
          <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-0.5">
            Suivi périodique des réservations, du chiffre d'affaires et de la fréquentation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-cacao/10 shadow-sm">
            {(['all', 'day', 'week', 'month'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filter === f
                    ? 'bg-cacao text-sand shadow-sm'
                    : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>

          {/* Purge Button */}
          <button
            type="button"
            onClick={() => setIsPurgeModalOpen(true)}
            className="py-2 px-3.5 rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-rose-100 transition cursor-pointer shadow-xs"
            title="Purger les données de cette période"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purger les données</span>
          </button>
        </div>
      </div>

      {/* Revenue Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-soft p-6 space-y-2 border-l-4 border-gold bg-white/80 dark:bg-stone-900/80">
          <span className="text-xs font-semibold text-cacao/60 dark:text-sand/60 uppercase">
            Chiffre d'Affaires ({filterLabels[filter]})
          </span>
          <div className="font-display text-3xl sm:text-4xl font-bold text-cacao dark:text-sand">
            {formatPrice(stats.totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
            Boutique & Séances cumulées
          </span>
        </div>

        <div className="card-soft p-6 space-y-2 bg-white/80 dark:bg-stone-900/80">
          <span className="text-xs font-semibold text-cacao/60 dark:text-sand/60 uppercase">
            Ventes Boutique
          </span>
          <div className="font-display text-2xl sm:text-3xl font-bold text-gold">
            {formatPrice(stats.shopRevenue)}
          </div>
          <span className="text-[11px] text-cacao/50 dark:text-sand/50 block">
            {filteredOrders.length} commande(s) sur la période
          </span>
        </div>

        <div className="card-soft p-6 space-y-2 bg-white/80 dark:bg-stone-900/80">
          <span className="text-xs font-semibold text-cacao/60 dark:text-sand/60 uppercase">
            Facturation Séances
          </span>
          <div className="font-display text-2xl sm:text-3xl font-bold text-gold">
            {formatPrice(stats.invoicesRevenue)}
          </div>
          <span className="text-[11px] text-cacao/50 dark:text-sand/50 block">
            {filteredInvoices.length} facture(s) émise(s)
          </span>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most requested massages */}
        <div className="card-soft p-6 space-y-4 bg-white/80 dark:bg-stone-900/80 border border-cacao/10">
          <div className="flex items-center gap-2 pb-2 border-b border-cacao/10 font-display text-lg font-medium text-cacao dark:text-sand">
            <TrendingUp className="w-5 h-5 text-gold" />
            <span>Soins les plus réservés ({filterLabels[filter]})</span>
          </div>

          {stats.topMassages.length === 0 ? (
            <p className="text-xs text-cacao/50 dark:text-sand/50 italic py-6 text-center">
              Aucune donnée de réservation pour cette période.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topMassages.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-cacao dark:text-sand truncate">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="font-bold text-gold shrink-0">
                      {item.count} séance{item.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-cacao/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (item.count / (stats.totalAppointments || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Key Ratios */}
        <div className="card-soft p-6 space-y-4 bg-white/80 dark:bg-stone-900/80 border border-cacao/10">
          <div className="flex items-center gap-2 pb-2 border-b border-cacao/10 font-display text-lg font-medium text-cacao dark:text-sand">
            <BarChart3 className="w-5 h-5 text-gold" />
            <span>Ratios Opérationnels ({filterLabels[filter]})</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/5">
              <span className="text-[11px] text-cacao/60 dark:text-sand/60 block">Rendez-vous</span>
              <span className="font-bold text-lg text-cacao dark:text-sand">{stats.totalAppointments}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                {stats.confirmedAppts} confirmés
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/5">
              <span className="text-[11px] text-cacao/60 dark:text-sand/60 block">Commandes Boutique</span>
              <span className="font-bold text-lg text-cacao dark:text-sand">{stats.totalOrders}</span>
              <span className="text-[10px] text-gold block mt-0.5">
                Total : {formatPrice(stats.shopRevenue)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/5">
              <span className="text-[11px] text-cacao/60 dark:text-sand/60 block">Fiches Clients</span>
              <span className="font-bold text-lg text-cacao dark:text-sand">{stats.totalClients}</span>
              <span className="text-[10px] text-cacao/50 dark:text-sand/50 block mt-0.5">
                Enregistrées au centre
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-cacao/5">
              <span className="text-[11px] text-cacao/60 dark:text-sand/60 block">Factures Émises</span>
              <span className="font-bold text-lg text-cacao dark:text-sand">{filteredInvoices.length}</span>
              <span className="text-[10px] text-gold block mt-0.5">
                Total : {formatPrice(stats.invoicesRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Purge */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-body">
          <div className="card-soft w-full max-w-md p-6 sm:p-8 bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-900 shadow-2xl rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                  Confirmer la Purge
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Période : {filterLabels[filter]}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-cacao/75 dark:text-sand/75 leading-relaxed">
              Êtes-vous certain de vouloir purger définitivement les enregistrements statistiques correspondant à la période <strong>"{filterLabels[filter]}"</strong> ?
            </p>

            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs text-cacao/70 dark:text-sand/70 space-y-1">
              <div>• Rendez-vous ciblés : <strong>{filteredAppts.length}</strong></div>
              <div>• Commandes boutique ciblées : <strong>{filteredOrders.length}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-cacao/70 dark:text-sand/70 hover:bg-cacao/10 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurge}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-40"
              >
                {purging ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Confirmer la purge définitive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
