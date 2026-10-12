import { useState, useEffect, FormEvent } from 'react';
import { useMassages } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { saveAppointmentToSupabase } from '@/lib/client';
import { toast } from '@/components/ui/toaster';
import { X, CalendarPlus } from 'lucide-react';

interface StaffNewAppointmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClientName?: string;
  initialClientPhone?: string;
  initialClientKey?: string;
}

export default function StaffNewAppointment({
  isOpen,
  onClose,
  onSuccess,
  initialClientName = '',
  initialClientPhone = '',
  initialClientKey,
}: StaffNewAppointmentProps) {
  const { data: massages = [] } = useMassages();

  const [clientName, setClientName] = useState(initialClientName);
  const [clientPhone, setClientPhone] = useState(initialClientPhone);
  const [selectedMassage, setSelectedMassage] = useState(massages[0]?.name || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync initial values when modal opens or props change
  useEffect(() => {
    if (initialClientName) setClientName(initialClientName);
    if (initialClientPhone) setClientPhone(initialClientPhone);
  }, [initialClientName, initialClientPhone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !selectedMassage || !date) return;

    setSubmitting(true);
    try {
      const scheduledDate = new Date(date);
      const apptDate = !isNaN(scheduledDate.getTime()) ? scheduledDate.toISOString().split('T')[0] : date.slice(0, 10);
      const apptTime = !isNaN(scheduledDate.getTime()) ? scheduledDate.toISOString().split('T')[1].slice(0, 5) : '09:30';
      const chosenMassage = massages.find((m: any) => m.name === selectedMassage || m.title === selectedMassage);

      await saveAppointmentToSupabase({
        client_key: initialClientKey || crypto.randomUUID(),
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || '',
        massage_name: selectedMassage,
        service_title: selectedMassage,
        service_price: chosenMassage?.price || 15000,
        date: !isNaN(scheduledDate.getTime()) ? scheduledDate.toISOString() : new Date().toISOString(),
        appointment_date: apptDate,
        appointment_time: apptTime,
        notes: notes.trim() || undefined,
        status: 'accepted',
      });

      try {
        await base44.entities.Appointment.create({
          client_key: initialClientKey || crypto.randomUUID(),
          client_name: clientName.trim(),
          client_phone: clientPhone.trim() || undefined,
          massage_name: selectedMassage,
          date: new Date(date).toISOString(),
          notes: notes.trim() || undefined,
          status: 'accepted',
        });
      } catch {}

      toast({ title: 'Rendez-vous créé et confirmé', variant: 'success' });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl border"
      >
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-gold" />
            <h3 className="font-display text-2xl text-cacao font-medium">
              Nouveau rendez-vous
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-cacao/60 hover:text-cacao"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs sm:text-sm">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Nom du client *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Kouassi Adan"
              className="field py-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Téléphone du client
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+229 97 00 00 00"
              className="field py-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Soin à réaliser *
            </label>
            <select
              value={selectedMassage}
              onChange={(e) => setSelectedMassage(e.target.value)}
              className="field py-2"
            >
              {massages.map((m: any) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.price} FCFA)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Date et Heure *
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field py-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Notes complémentaires (facultatif)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Venu sur recommandation, séance test..."
              className="field py-2 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-soft py-2 px-4 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !clientName.trim()}
              className="btn-gold py-2 px-6 text-xs font-semibold"
            >
              Enregistrer le rendez-vous
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
