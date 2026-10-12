import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { CalendarHeart, X, Clock, Sparkles, Check } from 'lucide-react';
import { useMassages } from '@/lib/queries';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { saveAppointmentToSupabase } from '@/lib/client';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';

interface VideoBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMassageName?: string;
  initialMassageId?: string;
}

const SLOTS = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30', '19:00'];

export default function VideoBookingDrawer({
  isOpen,
  onClose,
  initialMassageName,
  initialMassageId,
}: VideoBookingDrawerProps) {
  const { user } = useAuth();
  const profile = useProfile();
  const qc = useQueryClient();
  const { data: massages = [] } = useMassages();

  const [selectedMassageName, setSelectedMassageName] = useState(initialMassageName || '');
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(SLOTS[1]);
  const [clientName, setClientName] = useState(user?.full_name || user?.nom || profile?.name || '');
  const [clientPhone, setClientPhone] = useState(user?.telephone || profile?.phone || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (!clientName) setClientName(user.full_name || user.nom);
      if (!clientPhone) setClientPhone(user.telephone || '');
    } else if (profile) {
      if (!clientName && profile.name) setClientName(profile.name);
      if (!clientPhone && profile.phone) setClientPhone(profile.phone);
    }
  }, [user, profile]);

  const matchedMassage = massages.find(
    (m: any) =>
      m.name?.toLowerCase() === selectedMassageName?.toLowerCase() ||
      m.id === initialMassageId
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 300) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      toast({
        title: 'Informations requises',
        description: 'Veuillez renseigner votre nom et numéro de téléphone.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledIso = `${selectedDate}T${selectedSlot}:00`;
      const apptData = {
        user_id: user?.id || null,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_key: profile?.client_key || crypto.randomUUID(),
        client_email: user?.email || null,
        massage_name: selectedMassageName || matchedMassage?.name || 'Soin Thérapeutique',
        service_title: selectedMassageName || matchedMassage?.name || 'Soin Thérapeutique',
        service_price: matchedMassage?.price || 15000,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        date: scheduledIso,
        status: 'pending',
        notes: notes.trim() || undefined,
      };

      await saveAppointmentToSupabase(apptData);

      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.refetchQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-appts'] });

      setIsSuccess(true);
      toast({
        title: 'Demande de rendez-vous enregistrée !',
        description: `Créneau demandé le ${selectedDate} à ${selectedSlot}. Retrouvez votre séance dans l'onglet Rendez-vous.`,
        variant: 'success',
      });

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible d\'enregistrer la réservation.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-body">
          {/* Backdrop avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
          />

          {/* Drawer Content - Thème clair/chaleureux lisible avec glissement dynamique */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              backgroundColor: 'rgb(var(--sand))',
              color: 'rgb(var(--cacao))',
              borderColor: 'rgb(var(--cacao) / 0.18)',
            }}
            className="relative z-10 w-full max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Grab handle Header */}
            <div
              style={{ borderColor: 'rgb(var(--cacao) / 0.12)' }}
              className="p-4 sm:p-5 pb-3 border-b shrink-0 select-none"
            >
              <div
                style={{ backgroundColor: 'rgb(var(--cacao) / 0.25)' }}
                className="w-12 h-1.5 rounded-full mx-auto -mt-1 mb-3 cursor-grab active:cursor-grabbing shrink-0"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    style={{
                      backgroundColor: 'rgb(var(--gold) / 0.18)',
                      color: 'rgb(var(--gold))',
                    }}
                    className="p-2 rounded-2xl font-bold"
                  >
                    <CalendarHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-lg sm:text-xl">
                      Réserver votre séance
                    </h3>
                    <p
                      style={{ color: 'rgb(var(--cacao) / 0.65)' }}
                      className="text-xs"
                    >
                      Sans quitter la vidéo • Glisser vers le bas pour fermer
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  style={{ color: 'rgb(var(--cacao) / 0.7)' }}
                  className="p-2 rounded-full hover:bg-black/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-pan-y overscroll-contain">
              {isSuccess ? (
                <div className="py-12 text-center space-y-3 my-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-medium text-xl">
                    Séance demandée avec succès !
                  </h4>
                  <p
                    style={{ color: 'rgb(var(--cacao) / 0.75)' }}
                    className="text-xs max-w-xs mx-auto"
                  >
                    Votre créneau a bien été réservé. Vous pouvez continuer à profiter de vos vidéos.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Massage Selection */}
                  <div className="space-y-1.5">
                    <label
                      style={{ color: 'rgb(var(--cacao) / 0.85)' }}
                      className="text-xs font-bold uppercase tracking-wider block"
                    >
                      Type de Soin
                    </label>
                    <select
                      value={selectedMassageName}
                      onChange={(e) => setSelectedMassageName(e.target.value)}
                      style={{
                        backgroundColor: 'rgb(var(--sand))',
                        color: 'rgb(var(--cacao))',
                        borderColor: 'rgb(var(--cacao) / 0.2)',
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl border text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    >
                      {initialMassageName && (
                        <option value={initialMassageName}>
                          {initialMassageName} (Lié à cette vidéo)
                        </option>
                      )}
                      {massages.map((m: any) => (
                        <option key={m.id} value={m.name}>
                          {m.name} • {formatPrice(m.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price & Duration banner */}
                  {matchedMassage && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        Tarif : {formatPrice(matchedMassage.price)}
                      </span>
                      <span className="text-cacao/70 dark:text-sand/70 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gold" />
                        {matchedMassage.duration_min || 60} min
                      </span>
                    </div>
                  )}

                  {/* Date & Slot selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        style={{ color: 'rgb(var(--cacao) / 0.85)' }}
                        className="text-xs font-bold uppercase tracking-wider block"
                      >
                        Date souhaitée
                      </label>
                      <input
                        type="date"
                        required
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                          backgroundColor: 'rgb(var(--sand))',
                          color: 'rgb(var(--cacao))',
                          borderColor: 'rgb(var(--cacao) / 0.2)',
                        }}
                        className="w-full py-2 px-3 rounded-2xl border text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        style={{ color: 'rgb(var(--cacao) / 0.85)' }}
                        className="text-xs font-bold uppercase tracking-wider block"
                      >
                        Heure
                      </label>
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        style={{
                          backgroundColor: 'rgb(var(--sand))',
                          color: 'rgb(var(--cacao))',
                          borderColor: 'rgb(var(--cacao) / 0.2)',
                        }}
                        className="w-full py-2 px-3 rounded-2xl border text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      >
                        {SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Client Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        style={{ color: 'rgb(var(--cacao) / 0.85)' }}
                        className="text-xs font-bold uppercase tracking-wider block"
                      >
                        Votre Nom
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Jean Dupont"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{
                          backgroundColor: 'rgb(var(--sand))',
                          color: 'rgb(var(--cacao))',
                          borderColor: 'rgb(var(--cacao) / 0.2)',
                        }}
                        className="w-full py-2 px-3 rounded-2xl border text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        style={{ color: 'rgb(var(--cacao) / 0.85)' }}
                        className="text-xs font-bold uppercase tracking-wider block"
                      >
                        Téléphone WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: +229 97 00 00 00"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        style={{
                          backgroundColor: 'rgb(var(--sand))',
                          color: 'rgb(var(--cacao))',
                          borderColor: 'rgb(var(--cacao) / 0.2)',
                        }}
                        className="w-full py-2 px-3 rounded-2xl border text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      style={{ color: 'rgb(var(--cacao) / 0.85)' }}
                      className="text-xs font-bold uppercase tracking-wider block"
                    >
                      Notes particulières (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Tensions au bas du dos, première visite..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                        backgroundColor: 'rgb(var(--sand))',
                        color: 'rgb(var(--cacao))',
                        borderColor: 'rgb(var(--cacao) / 0.2)',
                      }}
                      className="w-full py-2 px-3 rounded-2xl border text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-2 pb-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-gold py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isSubmitting ? 'Envoi...' : 'Confirmer ma réservation'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
