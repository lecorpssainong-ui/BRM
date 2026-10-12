import { formatPrice, formatDate } from '@/lib/format';
import {
  MessageSquare,
  Calendar,
  CreditCard,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface StaffDashboardProps {
  clients?: any[];
  messages?: any[];
  appointments?: any[];
  orders?: any[];
  onNavigate: (section: string) => void;
}

export default function StaffDashboard({
  clients = [],
  messages = [],
  appointments = [],
  orders = [],
  onNavigate,
}: StaffDashboardProps) {
  const unreadMessages = messages.filter((m) => m.sender === 'client' && !m.read);
  const pendingAppts = appointments.filter((a) => a.status === 'pending');
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const now = new Date().toDateString();
  const todayAppts = appointments.filter(
    (a) => new Date(a.date).toDateString() === now && !['cancelled', 'refused'].includes(a.status)
  );

  return (
    <div className="space-y-8 font-body">
      <div>
        <span className="eyebrow block mb-0.5">Tableau de bord</span>
        <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
          Mise à jour opérationnelle du centre
        </h2>
        <p className="text-xs sm:text-sm text-cacao/65 mt-0.5">
          Vue d'ensemble des actions prioritaires et de l'activité du jour.
        </p>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Messages */}
        <div
          onClick={() => onNavigate('inbox')}
          className="card-soft p-5 group cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cacao/60 uppercase">Messages</span>
            <div className="p-2 rounded-xl bg-gold/15 text-gold group-hover:scale-110 transition">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-cacao">
            {unreadMessages.length}
          </div>
          <span className="text-[11px] text-gold font-semibold mt-1 block">
            {unreadMessages.length > 0 ? 'Non lus en attente' : 'À jour'}
          </span>
        </div>

        {/* Rendez-vous en attente */}
        <div
          onClick={() => onNavigate('appointments')}
          className="card-soft p-5 group cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cacao/60 uppercase">Rendez-vous</span>
            <div className="p-2 rounded-xl bg-gold/15 text-gold group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-cacao">
            {pendingAppts.length}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            Demandes à confirmer
          </span>
        </div>

        {/* Paiements MoMo */}
        <div
          onClick={() => onNavigate('payments')}
          className="card-soft p-5 group cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cacao/60 uppercase">Paiements</span>
            <div className="p-2 rounded-xl bg-gold/15 text-gold group-hover:scale-110 transition">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-cacao">
            {pendingOrders.length}
          </div>
          <span className="text-[11px] text-gold font-semibold mt-1 block">
            À vérifier sur relevé
          </span>
        </div>

        {/* Clients Total */}
        <div
          onClick={() => onNavigate('moderation')}
          className="card-soft p-5 group cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cacao/60 uppercase">Clients</span>
            <div className="p-2 rounded-xl bg-gold/15 text-gold group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-cacao">
            {clients.length}
          </div>
          <span className="text-[11px] text-cacao/50 font-semibold mt-1 block">
            Fiches enregistrées
          </span>
        </div>
      </div>

      {/* Two Columns: Today's Appointments & Recent Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
            <div className="flex items-center gap-2 font-display text-lg font-medium text-cacao">
              <Calendar className="w-4 h-4 text-gold" />
              <span>Séances prévues aujourd'hui ({todayAppts.length})</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="text-xs text-gold hover:underline font-semibold"
            >
              Tout voir →
            </button>
          </div>

          <div className="space-y-2.5">
            {todayAppts.length === 0 ? (
              <p className="text-xs text-cacao/50 italic py-4">
                Aucune séance programmée pour aujourd'hui.
              </p>
            ) : (
              todayAppts.slice(0, 4).map((appt) => (
                <div
                  key={appt.id}
                  className="p-3 rounded-2xl bg-white/70 border border-cacao/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-cacao">{appt.client_name}</h5>
                    <span className="text-cacao/60">{appt.massage_name}</span>
                  </div>
                  <span className="font-bold text-gold">
                    {formatDate(appt.date, 'HH:mm')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Orders to Validate */}
        <div className="card-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
            <div className="flex items-center gap-2 font-display text-lg font-medium text-cacao">
              <CreditCard className="w-4 h-4 text-gold" />
              <span>Paiements boutique à valider ({pendingOrders.length})</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-xs text-gold hover:underline font-semibold"
            >
              Valider →
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-cacao/50 italic py-4">
                Aucune transaction Mobile Money en attente.
              </p>
            ) : (
              pendingOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-2xl bg-white/70 border border-cacao/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-cacao">{order.client_name}</h5>
                    <span className="text-cacao/60">
                      Réf : {order.transaction_ref || 'Non déclarée'}
                    </span>
                  </div>
                  <span className="font-display font-bold text-sm text-gold">
                    {formatPrice(order.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
