import { useState, FormEvent } from 'react';
import { useMassages } from '@/lib/queries';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { saveAppointmentToSupabase } from '@/lib/client';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import { Check, CalendarHeart, Clock, Sparkles, MessageSquare, Activity } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import BodyPainMapping, { PainZone } from './BodyPainMapping';

const SLOTS = [
  '08:00',
  '09:30',
  '11:00',
  '12:30',
  '14:00',
  '15:30',
  '17:00',
  '18:30',
];

interface BookAppointmentProps {
  initialMassageName?: string;
  onSuccess: () => void;
}

export default function BookAppointment({
  initialMassageName,
  onSuccess,
}: BookAppointmentProps) {
  const { data: massages = [] } = useMassages();
  const profile = useProfile();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedMassage, setSelectedMassage] = useState<string>(
    initialMassageName || (massages[0]?.name ?? '')
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('09:30');
  const [notes, setNotes] = useState<string>('');
  const [expressionTab, setExpressionTab] = useState<'text' | 'demonstrate'>('text');
  const [painMapping, setPainMapping] = useState<PainZone[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMassage || !date || !time) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez sélectionner un soin, une date et un créneau horaire.',
        variant: 'destructive',
      });
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
      toast({
        title: 'Créneau passé',
        description: 'Choisissez un créneau dans le futur.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const selectedServiceObj = massages.find(
      (m: any) => m.name === selectedMassage || m.title === selectedMassage
    );

    const clientNotes = [
      notes.trim(),
      painMapping.length > 0
        ? `Zones d'attention indiquées sur la silhouette : ${painMapping.map((p) => p.zone_name).join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const apptPayload = {
        user_id: user?.id || null,
        client_key: profile?.client_key || crypto.randomUUID(),
        client_name: user?.full_name || user?.nom || profile?.name || 'Client',
        client_phone: user?.telephone || profile?.phone || '',
        client_email: user?.email || null,
        massage_name: selectedMassage,
        service_title: selectedMassage,
        service_price: selectedServiceObj?.price || 15000,
        appointment_date: date,
        appointment_time: time,
        date: scheduledDate.toISOString(),
        status: 'pending',
        notes: clientNotes || undefined,
        pain_mapping: painMapping.length > 0 ? painMapping : [],
      };

      await saveAppointmentToSupabase(apptPayload);

      toast({
        title: 'Demande envoyée !',
        description: 'Votre rendez-vous a été enregistré. Retrouvez votre séance dans l\'onglet Rendez-vous.',
        variant: 'success',
      });

      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.refetchQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Erreur inattendue',
        description: err?.message || 'Une erreur est survenue lors de la réservation.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-soft p-6 sm:p-10 space-y-8 font-body">
      <div>
        <span className="eyebrow block mb-1">Réservation directe</span>
        <h2 className="font-display text-3xl sm:text-4xl text-cacao font-medium">
          Planifier votre séance
        </h2>
        <p className="text-xs sm:text-sm text-cacao/65 mt-1">
          Sélectionnez votre rituel de soin et l'horaire de votre choix.
        </p>
      </div>

      {/* Étape 1 : Le Soin */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
          1 • Choisissez votre soin
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {massages.map((m: any) => {
            const isSelected = selectedMassage === m.name;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMassage(m.name)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-cacao text-sand border-cacao shadow-md'
                    : 'bg-white/60 text-cacao border-cacao/10 hover:border-gold/50'
                }`}
              >
                <div>
                  <h4 className="font-display font-medium text-base leading-snug">
                    {m.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs opacity-75 mt-1 font-body">
                    <span>{m.duration_min || 60} min</span>
                    <span>•</span>
                    <span className="font-semibold">{formatPrice(m.price)}</span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-gold text-cacao' : 'border border-cacao/20'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Étape 2 : Le Jour */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
          2 • Le jour souhaité
        </label>
        <input
          type="date"
          required
          min={todayStr}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="field max-w-xs cursor-pointer font-medium"
        />
      </div>

      {/* Étape 3 : L'Heure */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
          3 • Créneau horaire proposé
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {SLOTS.map((slot) => {
            const isSelected = time === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`py-2 px-1 text-center rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold text-cacao shadow-md font-bold'
                    : 'bg-white/70 text-cacao border border-cacao/10 hover:bg-white'
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Étape 4 : Expression du besoin (Un mot pour nous & Démontrer) */}
      <div className="space-y-4 pt-2 border-t border-cacao/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
              4 • Exprimez vos besoins & tensions corporelles
            </label>
            <p className="text-xs text-cacao/60 mt-0.5">
              Rédigez un mot libre ou localisez vos points de douleur avec précision sur le schéma corporel interactif.
            </p>
          </div>

          {/* Segmented Sub-Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 dark:border-amber-400/20 shrink-0">
            <button
              type="button"
              onClick={() => setExpressionTab('text')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                expressionTab === 'text'
                  ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 font-bold shadow-sm'
                  : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Un mot pour nous</span>
            </button>

            <button
              type="button"
              onClick={() => setExpressionTab('demonstrate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                expressionTab === 'demonstrate'
                  ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 font-bold shadow-sm'
                  : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Démontrer</span>
              {painMapping.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {painMapping.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Freeform text note */}
        {expressionTab === 'text' && (
          <div className="space-y-1.5">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zones sensibles, préférences particulières, niveau de pression souhaité, questions..."
              className="field resize-none leading-relaxed"
            />
            {painMapping.length > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>{painMapping.length} zone(s) de tension ont également été sélectionnées dans l'onglet "Démontrer".</span>
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Anatomical Demonstration */}
        {expressionTab === 'demonstrate' && (
          <div className="pt-2">
            <BodyPainMapping value={painMapping} onChange={setPainMapping} />
          </div>
        )}
      </div>

      {/* Validation */}
      <div className="pt-4 border-t border-cacao/10">
        <button
          type="submit"
          disabled={submitting || !selectedMassage || !date || !time}
          className="btn-gold w-full sm:w-auto text-sm sm:text-base py-3.5 px-8 font-semibold inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
          ) : (
            <CalendarHeart className="w-5 h-5" />
          )}
          <span>Envoyer ma demande de rendez-vous</span>
        </button>
      </div>
    </form>
  );
}
