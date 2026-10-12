import { useState, FormEvent } from 'react';
import { useMassages, useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { computeLine, invoiceTotals, generateInvoicePdfBlob } from '@/lib/invoice';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, X, Receipt, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, uploadUserDocument } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function InvoiceForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: InvoiceFormProps) {
  const { data: massages = [] } = useMassages();
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [number, setNumber] = useState(
    initialData?.number || `BRM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [clientName, setClientName] = useState(initialData?.client_name || '');
  const [clientPhone, setClientPhone] = useState(initialData?.client_phone || '');
  const [clientAddress, setClientAddress] = useState(initialData?.client_address || '');
  const [issuedBy, setIssuedBy] = useState(initialData?.issued_by || 'Secrétariat BRM');
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  const [items, setItems] = useState<any[]>(
    initialData?.items || [
      {
        label: massages[0]?.name || 'Réflexologie Plantaire Thérapeutique',
        qty: 1,
        unit_price: massages[0]?.price || 15000,
        discount_percent: 0,
        total: massages[0]?.price || 15000,
      },
    ]
  );

  const [loyaltyApplied, setLoyaltyApplied] = useState(Boolean(initialData?.loyalty_applied));
  const [nextMassage, setNextMassage] = useState(initialData?.next_massage || '');
  const [nextAppointment, setNextAppointment] = useState(
    initialData?.next_appointment ? new Date(initialData.next_appointment).toISOString().slice(0, 16) : ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState(initialData?.status || 'issued');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleItemChange = (idx: number, field: string, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = { ...copy[idx], [field]: val };

      // Recompute line
      const matchedMassage = massages.find((m: any) => m.name === cur.label);
      const computed = computeLine(cur.qty, cur.unit_price, matchedMassage);
      copy[idx] = {
        ...cur,
        qty: computed.qty,
        unit_price: computed.unit_price,
        discount_percent: computed.discount_percent,
        total: computed.total,
      };
      return copy;
    });
  };

  const handleAddItem = () => {
    const defaultM = massages[0];
    setItems((prev) => [
      ...prev,
      {
        label: defaultM?.name || 'Soin',
        qty: 1,
        unit_price: defaultM?.price || 15000,
        discount_percent: 0,
        total: defaultM?.price || 15000,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totals = invoiceTotals(items);
  const finalTotal = loyaltyApplied
    ? Math.round(totals.total * (1 - (settings?.loyalty_percent || 15) / 100))
    : totals.total;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || items.length === 0) return;

    setSubmitting(true);
    const invoicePayload = {
      number,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || undefined,
      client_address: clientAddress.trim() || undefined,
      issued_by: issuedBy.trim() || undefined,
      date: new Date(date).toISOString(),
      items,
      subtotal: totals.subtotal,
      discount: totals.discount + (loyaltyApplied ? totals.total - finalTotal : 0),
      total: finalTotal,
      loyalty_applied: loyaltyApplied,
      next_massage: nextMassage.trim() || undefined,
      next_appointment: nextAppointment ? new Date(nextAppointment).toISOString() : undefined,
      notes: notes.trim() || undefined,
      status,
    };

    try {
      let createdInvoiceId = initialData?.id || null;
      let targetUserId = user?.id;

      // Recherche du profil client s'il existe
      if (clientPhone.trim()) {
        try {
          const { data: clientProf } = await supabase
            .from('profiles')
            .select('id')
            .eq('telephone', clientPhone.trim())
            .maybeSingle();

          if (clientProf?.id) {
            targetUserId = clientProf.id;
          }
        } catch {}
      }

      // Génération et upload du PDF si possible
      let pdfUrl: string | null = null;
      try {
        const pdfBlob = await generateInvoicePdfBlob(invoicePayload, settings);
        if (targetUserId) {
          pdfUrl = await uploadUserDocument(
            targetUserId,
            `facture-${number}.pdf`,
            pdfBlob
          );
        }
      } catch (uploadErr) {
        console.warn('[Storage] Erreur génération/upload PDF:', uploadErr);
      }

      // Colonnes officielles Supabase : order_id, client_name, client_phone, total_price, pdf_url
      const sbInvoicePayload = {
        order_id: initialData?.order_id || null,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || 'Non renseigné',
        total_price: Number(finalTotal) || 0,
        pdf_url: pdfUrl || initialData?.pdf_url || null,
      };

      if (initialData?.id) {
        const { data, error } = await supabase
          .from('invoices')
          .update(sbInvoicePayload)
          .eq('id', initialData.id)
          .select()
          .single();

        console.log('Update invoice:', { data, error });

        if (error) {
          console.error('Erreur mise à jour facture Supabase:', error);
          if (navigator.onLine) {
            throw error;
          }
        }
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .insert(sbInvoicePayload)
          .select()
          .single();

        console.log('Insert invoice:', { data, error });

        if (error) {
          console.error('Erreur insertion facture Supabase:', error);
          if (navigator.onLine) {
            throw error;
          }
        }

        if (data?.id) {
          createdInvoiceId = data.id;
        }
      }

      // Synchronisation secondaire de secours
      try {
        if (initialData?.id) {
          await base44.entities.Invoice.update(initialData.id, {
            ...invoicePayload,
            pdf_url: pdfUrl,
          });
        } else {
          await base44.entities.Invoice.create({
            ...invoicePayload,
            id: createdInvoiceId || undefined,
            pdf_url: pdfUrl,
          });
        }
      } catch {}

      toast({
        title: initialData?.id ? 'Facture mise à jour' : 'Facture émise avec succès !',
        description: pdfUrl ? 'PDF archivé dans le dossier sécurisé du client.' : 'Enregistrée avec succès.',
        variant: 'success',
      });

      // Invalidation stricte React Query
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['staff-invoices'] });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || "Impossible d'enregistrer la facture.",
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
      <div
        style={{
          backgroundColor: 'rgb(var(--sand))',
          color: 'rgb(var(--cacao))',
          borderColor: 'rgb(var(--cacao) / 0.15)',
        }}
        className="card-soft w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 font-body shadow-2xl border"
      >
        <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gold" />
            <h3 className="font-display text-2xl text-cacao font-medium">
              {initialData ? `Modifier Facture N° ${number}` : 'Émettre une Facture'}
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

        <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
          {/* Client & Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Numéro de facture
              </label>
              <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="field font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Date d'émission
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Nom du client *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Awa Dossou"
                className="field"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+229 97 00 00 00"
                className="field"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Émise par
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                className="field"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao/70">
                Prestations & Lignes de facture
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/70 border border-cacao/10 grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      value={it.label}
                      onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
                      placeholder="Prestation"
                      className="field py-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={it.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                      placeholder="Qté"
                      className="field py-1.5 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={it.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                      placeholder="P.U."
                      className="field py-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-2 text-right font-bold text-xs text-cacao">
                    {formatPrice(it.total)}
                    {it.discount_percent > 0 && (
                      <span className="text-[10px] text-amber-700 block">
                        -{it.discount_percent}%
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-cacao/40 hover:text-rose-600 disabled:opacity-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty option */}
          <div className="p-3.5 rounded-2xl bg-white/60 border border-cacao/10 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={loyaltyApplied}
                onChange={(e) => setLoyaltyApplied(e.target.checked)}
                className="w-4 h-4 rounded text-gold focus:ring-gold"
              />
              <span className="text-xs font-semibold text-cacao">
                Appliquer la réduction fidélité ({settings?.loyalty_percent || 15}%)
              </span>
            </label>
            {loyaltyApplied && (
              <span className="text-xs font-bold text-emerald-800">
                Déduction active
              </span>
            )}
          </div>

          {/* Next session and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Prochain soin convenu
              </label>
              <input
                type="text"
                value={nextMassage}
                onChange={(e) => setNextMassage(e.target.value)}
                placeholder="Ex: Massage Suédois Relaxant"
                className="field"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
                Date du prochain rendez-vous
              </label>
              <input
                type="datetime-local"
                value={nextAppointment}
                onChange={(e) => setNextAppointment(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 block mb-1">
              Notes complémentaires (visibles sur la facture)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Séances valables 6 mois à compter de la date d'émission..."
              className="field resize-none text-xs"
            />
          </div>

          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-cacao text-sand flex items-center justify-between">
            <div>
              <span className="text-xs opacity-70 block">Total à payer</span>
              <span className="font-display text-2xl font-bold text-gold">
                {formatPrice(finalTotal)}
              </span>
            </div>

            <div className="text-right text-xs opacity-80">
              <span>Sous-total brut : {formatPrice(totals.subtotal)}</span>
              {totals.discount > 0 && <span className="block text-amber-300">Remise : -{formatPrice(totals.discount)}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2.5">
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
              {submitting ? 'Émission en cours...' : 'Enregistrer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
