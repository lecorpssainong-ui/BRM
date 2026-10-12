import { useState } from 'react';
import { formatDate, APPT_STATUS } from '@/lib/format';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Calendar, Edit3, MessageSquarePlus, Ban, Activity, Clock, Flame, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import FlipClockCountdown from '@/components/appointments/FlipClockCountdown';

interface StaffAppointmentRowProps {
  appointment: any;
  onRefresh: () => void;
  onDelete?: (id: string) => void;
}

export default function StaffAppointmentRow({
  appointment,
  onRefresh,
  onDelete,
}: StaffAppointmentRowProps) {
  const qc = useQueryClient();
  const [editingDate, setEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(
    appointment.date ? new Date(appointment.date).toISOString().slice(0, 16) : ''
  );
  const [editingNote, setEditingNote] = useState(false);
  const [staffNote, setStaffNote] = useState(appointment.notes || appointment.staff_note || '');
  const [saving, setSaving] = useState(false);

  const statusMeta = APPT_STATUS[appointment.status] || {
    label: appointment.status,
    cls: 'bg-stone-200 text-stone-700',
  };

  const handleUpdateStatus = async (status: string) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointment.id)
        .select()
        .single();

      console.log('Update appointment:', { data, error });
      if (error) {
        console.error('Erreur Supabase update status appointment:', error);
        if (navigator.onLine) {
          throw error;
        }
      }

      try {
        await base44.entities.Appointment.update(appointment.id, { status });
      } catch {}

      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });

      toast({ title: `Rendez-vous ${status === 'accepted' ? 'confirmé' : status}`, variant: 'success' });
      onRefresh();
    } catch (err: any) {
      console.error('[StaffAppointmentRow] Update status error:', err);
      toast({
        title: 'Erreur Supabase',
        description: err?.message || 'Impossible de mettre à jour le statut du rendez-vous.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDate = async () => {
    if (!newDate) return;
    setSaving(true);
    try {
      const d = new Date(newDate);
      const appointment_date = newDate.includes('T')
        ? newDate.split('T')[0]
        : (!isNaN(d.getTime()) ? d.toISOString().split('T')[0] : newDate.slice(0, 10));
      const appointment_time = newDate.includes('T')
        ? newDate.split('T')[1].slice(0, 5)
        : (!isNaN(d.getTime()) ? d.toISOString().split('T')[1].slice(0, 5) : '09:30');

      const { data, error } = await supabase
        .from('appointments')
        .update({ appointment_date, appointment_time })
        .eq('id', appointment.id)
        .select()
        .single();

      console.log('Update appointment:', { data, error });
      if (error) {
        console.error('Erreur Supabase update date appointment:', error);
        if (navigator.onLine) {
          throw error;
        }
      }

      try {
        await base44.entities.Appointment.update(appointment.id, {
          date: new Date(newDate).toISOString(),
        });
      } catch {}

      setEditingDate(false);
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });

      toast({ title: 'Rendez-vous reprogrammé', variant: 'success' });
      onRefresh();
    } catch (err: any) {
      console.error('[StaffAppointmentRow] Update date error:', err);
      toast({
        title: 'Erreur Supabase',
        description: err?.message || "Impossible d'enregistrer la date dans Supabase.",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      const noteText = staffNote.trim();
      const { data, error } = await supabase
        .from('appointments')
        .update({ notes: noteText })
        .eq('id', appointment.id)
        .select()
        .single();

      console.log('Update appointment:', { data, error });
      if (error) {
        console.error('Erreur Supabase update note appointment:', error);
        if (navigator.onLine) {
          throw error;
        }
      }

      try {
        await base44.entities.Appointment.update(appointment.id, {
          notes: noteText || undefined,
          staff_note: noteText || undefined,
        });
      } catch {}

      setEditingNote(false);
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });

      toast({ title: 'Note interne enregistrée', variant: 'success' });
      onRefresh();
    } catch (err: any) {
      console.error('[StaffAppointmentRow] Update note error:', err);
      toast({
        title: 'Erreur Supabase',
        description: err?.message || "Impossible d'enregistrer la note dans Supabase.",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-soft p-5 sm:p-6 space-y-4 font-body border border-cacao/10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
        <div>
          <span className="eyebrow block mb-0.5">Demande client</span>
          <h4 className="font-display text-xl text-cacao font-medium">
            {appointment.client_name || 'Client anonyme'}
          </h4>
          <div className="flex items-center gap-3 text-xs text-cacao/65 mt-0.5">
            {appointment.client_phone && <span>Tél : {appointment.client_phone}</span>}
            <span>•</span>
            <span className="font-semibold text-cacao">{appointment.massage_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(appointment.id);
              }}
              className="p-1.5 rounded-lg text-cacao/40 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Supprimer ce rendez-vous"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3D Flip Clock Mechanical Countdown for Staff Cockpit */}
      {!['cancelled', 'refused'].includes(appointment.status) && (
        <div className="p-3.5 rounded-2xl bg-amber-950/10 dark:bg-amber-950/20 border border-amber-900/15 dark:border-amber-400/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
              Décompte avant la séance :
            </span>
          </div>
          <FlipClockCountdown targetDate={appointment.date} status={appointment.status} size="sm" />
        </div>
      )}

      {/* Date & Reschedule */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-cacao font-medium">
          <Calendar className="w-4 h-4 text-gold shrink-0" />
          <span>{formatDate(appointment.date)}</span>
        </div>

        <button
          type="button"
          onClick={() => setEditingDate(!editingDate)}
          className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{editingDate ? 'Annuler' : 'Reprogrammer l\'horaire'}</span>
        </button>
      </div>

      {editingDate && (
        <div className="p-3.5 rounded-2xl bg-white/70 border border-cacao/10 flex items-center gap-2">
          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="field text-xs py-2"
          />
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDate}
            className="btn-gold py-2 px-4 text-xs font-semibold whitespace-nowrap"
          >
            Confirmer la date
          </button>
        </div>
      )}

      {/* Anatomical Pain / Tension Mapping Synthesis Card */}
      {Array.isArray(appointment.pain_mapping) && appointment.pain_mapping.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                Cartographie des tensions & douleurs ciblées ({appointment.pain_mapping.length} zones) :
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Signalé par le client
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {appointment.pain_mapping.map((p: any, idx: number) => {
              const intensity = Number(p.intensity) || 5;
              const barColor =
                intensity <= 3 ? 'bg-emerald-500' : intensity <= 6 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-800/90 border border-cacao/10 dark:border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cacao dark:text-sand">{p.zone_name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-cacao/70 dark:text-sand/70">
                      {p.side === 'back' ? 'Dos' : 'Face'} • {intensity}/10
                    </span>
                  </div>

                  {/* Visual Intensity Bar */}
                  <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${(intensity / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Client Note */}
      {appointment.notes && (
        <div className="p-3 rounded-2xl bg-white/50 border border-cacao/5 text-xs text-cacao/75">
          <span className="font-bold text-cacao block mb-0.5">Message du client :</span>
          <p>{appointment.notes}</p>
        </div>
      )}

      {/* Internal Staff Note */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cacao/60">
            Note interne du centre (visible par le client)
          </span>
          <button
            type="button"
            onClick={() => setEditingNote(!editingNote)}
            className="text-xs text-gold hover:underline font-medium"
          >
            {editingNote ? 'Fermer' : 'Modifier la note'}
          </button>
        </div>

        {editingNote ? (
          <div className="space-y-2">
            <textarea
              rows={2}
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              placeholder="Ex: Merci de venir 10 minutes à l'avance pour la préparation."
              className="field text-xs py-2"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveNote}
                className="btn-dark py-1.5 px-4 text-xs font-semibold"
              >
                Enregistrer la note
              </button>
            </div>
          </div>
        ) : (appointment.notes || appointment.staff_note) ? (
          <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20 text-xs text-cacao/80">
            {appointment.notes || appointment.staff_note}
          </div>
        ) : (
          <p className="text-xs text-cacao/40 italic">Aucune note interne saisie.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-cacao/10 flex flex-wrap items-center justify-end gap-2">
        {appointment.status !== 'accepted' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => handleUpdateStatus('accepted')}
            className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accepter & Confirmer</span>
          </button>
        )}

        {appointment.status !== 'refused' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => handleUpdateStatus('refused')}
            className="btn-soft py-2 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Refuser</span>
          </button>
        )}

        {appointment.status !== 'cancelled' && (
          <button
            type="button"
            disabled={saving}
            onClick={() => handleUpdateStatus('cancelled')}
            className="btn-soft py-2 px-3 text-xs font-semibold text-stone-600 inline-flex items-center gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            disabled={saving}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(appointment.id);
            }}
            className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition border border-rose-200 inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Supprimer ce rendez-vous"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        )}
      </div>
    </div>
  );
}
