import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarHeart,
  CalendarPlus,
  Receipt,
  Clock,
  Sparkles,
  MessageSquare,
  Activity,
  Check,
  Calendar,
  AlertCircle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useMassages, useAppointments } from '@/lib/queries';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { formatPrice, formatDate, APPT_STATUS } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import FlipClockCountdown from '@/components/appointments/FlipClockCountdown';
import Body3DMap from './Body3DMap';
import { saveAppointmentToSupabase } from '@/lib/client';

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

export default function Appointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'mine';
  const massageParam = searchParams.get('massage') || '';

  const activeTab = ['mine', 'book'].includes(currentTab) ? currentTab : 'mine';

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  const profile = useProfile();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: massages = [] } = useMassages();

  const effectiveUserId = user?.id || profile?.client_key;
  const effectivePhone = user?.telephone || profile?.phone;
  const { data: appointments = [], isLoading } = useAppointments(effectiveUserId, effectivePhone);

  // Form State
  const [selectedMassage, setSelectedMassage] = useState(massageParam || '');
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('09:30');
  const [notes, setNotes] = useState('');
  const [expressionTab, setExpressionTab] = useState('demonstrate'); // 'text' | 'demonstrate'
  const [painMapping, setPainMapping] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Auto-select first massage when loaded
  useEffect(() => {
    if (!selectedMassage && massages.length > 0) {
      setSelectedMassage(massages[0].name);
    }
  }, [massages, selectedMassage]);

  const handleSubmit = async (e) => {
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

    const currentMassageObj = massages.find((m) => m.name === selectedMassage || m.title === selectedMassage);

    setSubmitting(true);
    const payload = {
      user_id: user?.id || null,
      client_key: profile?.client_key || crypto.randomUUID(),
      client_name: user?.full_name || user?.nom || profile?.name || 'Client',
      client_phone: user?.telephone || profile?.phone || '',
      client_email: user?.email || null,
      massage_name: selectedMassage,
      service_title: selectedMassage,
      service_price: currentMassageObj?.price || 15000,
      date: scheduledDate.toISOString(),
      appointment_date: date,
      appointment_time: time,
      notes: notes.trim() || undefined,
      pain_mapping: painMapping.length > 0 ? painMapping : [],
      status: 'pending',
    };

    try {
      await saveAppointmentToSupabase(payload);
      toast({
        title: 'Demande envoyée avec succès !',
        description: 'Le secrétariat a reçu votre réservation et votre cartographie anatomique 3D.',
        variant: 'success',
      });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });
      setTab('mine');
    } catch (err) {
      toast({
        title: 'Erreur lors de l\'envoi',
        description: 'Impossible d\'enregistrer votre rendez-vous. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-body max-w-5xl mx-auto pb-16">
      {/* Navigation Onglets Principaux */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 dark:border-amber-400/20 backdrop-blur-md shadow-sm w-fit mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'mine'
              ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 shadow-sm font-bold'
              : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <CalendarHeart className="w-4 h-4" />
          <span>Mes Séances ({appointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('book')}
          className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'book'
              ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 shadow-sm font-bold'
              : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Planifier un Soin</span>
        </button>
      </div>

      {/* ONGLET 1 : LISTE DES RENDEZ-VOUS & FLIP CLOCK 3D */}
      {activeTab === 'mine' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-cacao/10">
            <div>
              <span className="eyebrow block mb-0.5">Votre planning bien-être</span>
              <h2 className="font-display text-2xl sm:text-3xl text-cacao dark:text-sand font-medium">
                Vos séances programmées
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setTab('book')}
              className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Réserver une autre séance</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-cacao/60 dark:text-sand/60">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Chargement de votre agenda...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="card-soft p-12 text-center space-y-4 border border-dashed border-cacao/20">
              <CalendarHeart className="w-12 h-12 text-gold mx-auto" />
              <div className="space-y-1">
                <h3 className="font-display text-xl text-cacao dark:text-sand font-medium">
                  Aucun rendez-vous pour le moment
                </h3>
                <p className="text-xs text-cacao/65 dark:text-sand/65 max-w-md mx-auto">
                  Prenez rendez-vous en quelques secondes et indiquez vos points de tension sur notre modèle anatomique 3D.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('book')}
                className="btn-gold py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2"
              >
                <span>Planifier ma première séance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {appointments.map((appt) => {
                const statusMeta = APPT_STATUS[appt.status] || {
                  label: appt.status,
                  cls: 'bg-stone-200 text-stone-700',
                };
                const isUpcoming =
                  !['cancelled', 'refused'].includes(appt.status) &&
                  new Date(appt.date).getTime() > Date.now();

                return (
                  <div
                    key={appt.id}
                    className="card-soft p-6 sm:p-8 space-y-5 border border-cacao/15 dark:border-amber-400/20 shadow-md"
                  >
                    {/* Top Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusMeta.cls}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl text-cacao dark:text-sand font-medium">
                          {appt.massage_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-cacao/65 dark:text-sand/65 mt-1 font-medium">
                          <Calendar className="w-4 h-4 text-gold shrink-0" />
                          <span>{formatDate(appt.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Module Décompte Flip Clock 3D */}
                    {isUpcoming && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/10 dark:bg-amber-950/30 border border-amber-900/15 dark:border-amber-400/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gold animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                              Décompte Flip Clock 3D :
                            </span>
                          </div>
                          <p className="text-xs text-cacao/60 dark:text-sand/60">
                            Temps restant exact avant le début de votre séance au centre.
                          </p>
                        </div>
                        <FlipClockCountdown targetDate={appt.date} status={appt.status} size="md" />
                      </div>
                    )}

                    {/* Synthèse de la cartographie 3D WebGL (Zones ciblées) */}
                    {Array.isArray(appt.pain_mapping) && appt.pain_mapping.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gold" />
                            <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-sand">
                              Cartographie 3D des tensions ciblées ({appt.pain_mapping.length} zones) :
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            Transmis au praticien
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {appt.pain_mapping.map((p, idx) => {
                            const intensity = Number(p.intensity) || 5;
                            const barColor =
                              intensity <= 3 ? 'bg-emerald-500' : intensity <= 6 ? 'bg-amber-500' : 'bg-rose-500';
                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-white/90 dark:bg-stone-800/90 border border-cacao/10 dark:border-white/10 space-y-1"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-cacao dark:text-sand truncate">
                                    {p.zone_name}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-cacao/70 dark:text-sand/70 shrink-0">
                                    {p.side === 'back' ? 'Dos' : 'Face'} • {intensity}/10
                                  </span>
                                </div>
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

                    {/* Note du client */}
                    {appt.notes && (
                      <div className="p-3.5 rounded-xl bg-white/60 dark:bg-stone-800/60 border border-cacao/10 text-xs text-cacao/75 dark:text-sand/75">
                        <span className="font-bold text-cacao dark:text-sand block mb-0.5">Vos précisions :</span>
                        <p>{appt.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2 : FORMULAIRE DE RÉSERVATION AVEC SQUELETTE 3D THREE.JS */}
      {activeTab === 'book' && (
        <form onSubmit={handleSubmit} className="card-soft p-6 sm:p-10 space-y-8 border border-cacao/15">
          <div>
            <span className="eyebrow block mb-1">Réservation directe & haute précision</span>
            <h2 className="font-display text-3xl sm:text-4xl text-cacao dark:text-sand font-medium">
              Planifier votre séance
            </h2>
            <p className="text-xs sm:text-sm text-cacao/65 dark:text-sand/65 mt-1">
              Sélectionnez votre soin, choisissez votre date et ciblez vos tensions sur le mannequin 3D.
            </p>
          </div>

          {/* Étape 1 : Le Soin */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block">
              1 • Choisissez votre rituel de soin
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {massages.map((m) => {
                const isSelected = selectedMassage === m.name;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMassage(m.name)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 border-cacao shadow-md'
                        : 'bg-white/60 dark:bg-stone-800/60 text-cacao dark:text-sand border-cacao/10 hover:border-gold/50'
                    }`}
                  >
                    <div>
                      <h4 className="font-display font-medium text-base leading-snug">
                        {m.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs opacity-75 mt-1">
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
            <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block">
              2 • Date de la séance
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
            <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block">
              3 • Créneau horaire
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
                        : 'bg-white/70 dark:bg-stone-800/70 text-cacao dark:text-sand border border-cacao/10 hover:bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Étape 4 : Expression du besoin avec double sous-onglet */}
          <div className="space-y-5 pt-4 border-t border-cacao/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 dark:text-sand/70 block">
                  4 • Expression de vos besoins & douleurs corporelles
                </label>
                <p className="text-xs text-cacao/60 dark:text-sand/60 mt-0.5">
                  Rédigez un mot libre ou désignez vos zones sensibles sur le mannequin 3D interactif.
                </p>
              </div>

              {/* Double Sous-Onglet : Un mot pour nous vs Démontrer */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpressionTab('demonstrate')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    expressionTab === 'demonstrate'
                      ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 font-bold shadow-sm'
                      : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Démontrer (3D)</span>
                  {painMapping.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {painMapping.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setExpressionTab('text')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    expressionTab === 'text'
                      ? 'bg-cacao text-sand dark:bg-amber-400 dark:text-stone-950 font-bold shadow-sm'
                      : 'text-cacao/70 dark:text-sand/70 hover:bg-black/5'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Un mot pour nous</span>
                </button>
              </div>
            </div>

            {/* Sous-Onglet 1 : Texte libre */}
            {expressionTab === 'text' && (
              <div className="space-y-2">
                <textarea
                  rows={4}
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

            {/* Sous-Onglet 2 : Mannequin Anatomique 3D WebGL (Three.js) */}
            {expressionTab === 'demonstrate' && (
              <div className="pt-2">
                <Body3DMap value={painMapping} onChange={setPainMapping} />
              </div>
            )}
          </div>

          {/* Validation & Envoi */}
          <div className="pt-4 border-t border-cacao/10">
            <button
              type="submit"
              disabled={submitting || !selectedMassage || !date || !time}
              className="btn-gold w-full sm:w-auto text-sm sm:text-base py-3.5 px-8 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
              ) : (
                <CalendarHeart className="w-5 h-5" />
              )}
              <span>Confirmer ma demande de rendez-vous</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
