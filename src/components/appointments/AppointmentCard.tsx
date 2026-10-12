import { useState } from 'react';
import { Calendar, Clock, AlertCircle, Ban, Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/toaster';
import { APPT_STATUS, formatDate, formatPrice } from '@/lib/format';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import FlipClockCountdown from './FlipClockCountdown';

interface AppointmentCardProps {
  appointment: any;
  onRefresh?: () => void;
  isUpcoming?: boolean;
}

export default function AppointmentCard({
  appointment,
  onRefresh,
  isUpcoming = false,
}: AppointmentCardProps) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const statusMeta = APPT_STATUS[appointment.status] || {
    label: appointment.status,
    cls: 'bg-stone-200 text-stone-700',
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', appointment.id)
        .select()
      if (error && navigator.onLine) throw error;

      try {
        await base44.entities.Appointment.update(appointment.id, {
          status: 'cancelled',
        });
      } catch {}

      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });

      window.dispatchEvent(
        new CustomEvent('brm-db-change', {
          detail: { table: 'appointments', action: 'UPDATE', id: appointment.id },
        })
      );

      toast({
        title: 'Rendez-vous annulé',
        description: 'Votre rendez-vous a bien été annulé.',
      });

      onRefresh?.();
    } catch (err: any) {
      console.error('Cancel appointment error:', err);
      toast({
        title: 'Erreur',
        description: "Impossible d'annuler le rendez-vous pour le moment.",
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
      setShowConfirmModal(false);
    }
  };

  const canCancel = isUpcoming && !['cancelled', 'refused'].includes(appointment.status);
  const isScheduled = isUpcoming && !['cancelled', 'refused'].includes(appointment.status);

  return (
    <div className="card-soft p-5 sm:p-6 space-y-4">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <span className="eyebrow block mb-0.5">Séance de soin</span>
          <h3 className="font-display text-xl sm:text-2xl text-cacao font-medium">
            {appointment.massage_name}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Message d'attente pour statut pending */}
      {appointment.status === 'pending' && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-medium">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>En attente de confirmation du secrétariat</span>
        </div>
      )}

      {/* 3D Flip Clock Mechanical Countdown for Scheduled Appointments */}
      {isUpcoming &&
        ['pending', 'accepted', 'confirmed'].includes(appointment.status) &&
        (() => {
          const targetStr = appointment.appointment_date && appointment.appointment_time
            ? `${appointment.appointment_date}T${appointment.appointment_time}`
            : appointment.date || appointment.appointment_date;
          if (!targetStr) return null;
          const targetMs = new Date(targetStr).getTime();
          if (isNaN(targetMs) || targetMs <= Date.now()) return null;

          return (
            <div className="my-3 flex flex-col items-center justify-center">
              <p className="text-xs text-center text-stone-500 dark:text-stone-400 mb-2 font-medium">
                {t('appointments.countdown_label') || 'Temps restant avant votre séance'}
              </p>
              <FlipClockCountdown targetDate={targetStr} status={appointment.status} size="sm" />
            </div>
          );
        })()}

      {/* Date, Heure & Tarif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-cacao font-medium pt-2 border-t border-cacao/5 font-body">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold/15 text-gold shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-cacao/50 block">Date & Heure</span>
            <span className="capitalize">{formatDate(appointment.date)}</span>
          </div>
        </div>

        {appointment.service_price !== undefined && appointment.service_price !== null && (
          <div className="px-3 py-1.5 rounded-xl bg-sand/80 dark:bg-stone-800/80 border border-cacao/10 text-right self-start sm:self-auto">
            <span className="text-[10px] text-cacao/50 block font-normal uppercase tracking-wider">Tarif séance</span>
            <span className="text-xs sm:text-sm font-bold text-gold">{formatPrice(appointment.service_price)}</span>
          </div>
        )}
      </div>

      {/* Anatomical Pain / Tension Mapping if submitted by client */}
      {Array.isArray(appointment.pain_mapping) && appointment.pain_mapping.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Activity className="w-3.5 h-3.5 text-gold" />
            <span>Points de tension signalés ({appointment.pain_mapping.length}) :</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {appointment.pain_mapping.map((p: any, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-stone-800 text-[11px] font-medium text-cacao dark:text-sand border border-cacao/10 shadow-xs"
              >
                <span>{p.zone_name}</span>
                <span className="opacity-60 text-[9px]">({p.side === 'back' ? 'Dos' : 'Face'})</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                  {p.intensity}/10
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes if present */}
      {appointment.notes && (
        <div className="p-3 rounded-2xl bg-white/50 text-xs text-cacao/75 border border-cacao/5">
          <span className="font-semibold block text-cacao/90 mb-0.5">Votre mot :</span>
          <p>{appointment.notes}</p>
        </div>
      )}

      {/* Staff note if present */}
      {appointment.staff_note && (
        <div className="p-3 rounded-2xl bg-gold/10 text-xs text-cacao/80 border border-gold/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-cacao mb-0.5">Note du centre :</span>
            <p>{appointment.staff_note}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={cancelling}
            onClick={() => setShowConfirmModal(true)}
            className="text-xs font-medium text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{cancelling ? 'Annulation...' : 'Annuler ce rendez-vous'}</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-cacao/10 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40">
                <Ban className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-base text-cacao dark:text-sand">
                Annuler le rendez-vous
              </h4>
            </div>

            <p className="text-sm text-cacao/75 dark:text-sand/75 font-body leading-relaxed">
              Êtes-vous sûr de vouloir annuler ce rendez-vous ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-cacao/70 dark:text-sand/70 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Non, conserver
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Annulation...' : 'Oui, annuler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
