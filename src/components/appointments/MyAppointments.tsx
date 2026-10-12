import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { useAppointments } from '@/lib/queries';
import { useOutbox } from '@/lib/offline';
import { formatDate } from '@/lib/format';
import AppointmentCard from './AppointmentCard';
import { CalendarPlus, CloudUpload, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface MyAppointmentsProps {
  onGoToBook: () => void;
}

export default function MyAppointments({ onGoToBook }: MyAppointmentsProps) {
  const profile = useProfile();
  const { user } = useAuth();
  const outbox = useOutbox();
  const qc = useQueryClient();

  const effectiveUserId = user?.id || (profile?.client_key && profile.client_key.length === 36 ? profile.client_key : undefined);
  const effectivePhone = user?.telephone || profile?.phone;
  const effectiveEmail = user?.email || profile?.email;
  const { data: appointments = [], isLoading } = useAppointments(effectiveUserId, effectivePhone, effectiveEmail);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();

  const getApptDate = (a: any) => {
    if (a.appointment_date) return a.appointment_date;
    if (typeof a.date === 'string') {
      return a.date.includes('T') ? a.date.split('T')[0] : a.date;
    }
    return '';
  };

  // Section "Séances à venir" : RDV en attente ou RDV avec date >= today et statut actif
  const upcoming = appointments.filter((a: any) => {
    if (a.status === 'pending') return true;
    const apptDate = getApptDate(a);
    const isTodayOrFuture = apptDate ? apptDate >= todayStr : true;
    const isUpcomingStatus = ['accepted', 'confirmed'].includes(a.status);
    return isTodayOrFuture && isUpcomingStatus;
  });

  // Section "Historique" : RDV completed, cancelled, refused, ou appointment_date < today
  const past = appointments.filter((a: any) => !upcoming.includes(a));

  // Outbox pending items for Appointment
  const pendingOutbox = outbox.filter((it) => it.entity === 'Appointment');

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['appointments'] });
    qc.refetchQueries({ queryKey: ['appointments'] });
    qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
    qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-3xl bg-white/40 animate-pulse" />
        <div className="h-44 rounded-3xl bg-white/40 animate-pulse" />
      </div>
    );
  }

  const isEmpty = upcoming.length === 0 && past.length === 0 && pendingOutbox.length === 0;

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <div className="card-soft p-8 sm:p-12 text-center max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto mb-4">
            <CalendarPlus className="w-8 h-8" />
          </div>
          <h3 className="font-display text-2xl text-cacao mb-2 font-medium">
            Aucun rendez-vous
          </h3>
          <p className="text-cacao/65 text-sm leading-relaxed mb-6 font-body">
            Votre prochaine parenthèse de bien-être vous attend. Choisissez votre soin et réservez votre créneau en quelques clics.
          </p>
          <button
            type="button"
            onClick={onGoToBook}
            className="btn-gold inline-flex items-center gap-2 text-sm"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Planifier maintenant</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Outbox */}
      {pendingOutbox.length > 0 && (
        <div className="space-y-3">
          <span className="eyebrow text-amber-700 block">En attente d'envoi réseau</span>
          <div className="space-y-3">
            {pendingOutbox.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-cacao"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800">
                    <CloudUpload className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {item.payload.massage_name}
                    </h4>
                    <p className="text-xs text-cacao/65">
                      Prévu le {formatDate(item.payload.date)} • Partira dès le retour du réseau
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-200/50 px-3 py-1 rounded-full">
                  File locale
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <span className="eyebrow block">Séances à venir</span>
          <div className="space-y-4">
            {upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                isUpcoming={true}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past & History */}
      {past.length > 0 && (
        <div className="space-y-4">
          <span className="eyebrow text-cacao/40 block">Historique de vos séances</span>
          <div className="space-y-4">
            {past.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                isUpcoming={false}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
