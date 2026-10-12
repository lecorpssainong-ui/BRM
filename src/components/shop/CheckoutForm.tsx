import { useState, FormEvent } from 'react';
import { useCart } from '@/lib/useCart';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import MomoPaymentCard from '@/components/pay/MomoPaymentCard';
import { ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const PAYMENT_METHODS = [
  { value: 'mtn', label: 'MTN Mobile Money', hint: 'Composer le code USSD direct' },
  { value: 'moov', label: 'Moov Money', hint: 'Paiement manuel Moov' },
  { value: 'celtiis', label: 'Celtiis Cash', hint: 'Paiement manuel Celtiis' },
  { value: 'card', label: 'Carte Bancaire', hint: 'Au comptoir ou lien sécurisé' },
];

interface CheckoutFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function CheckoutForm({ onBack, onSuccess }: CheckoutFormProps) {
  const cart = useCart();
  const profile = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState(profile?.name || user?.nom || '');
  const [phone, setPhone] = useState(profile?.phone || user?.telephone || '');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'moov' | 'celtiis' | 'card'>('mtn');
  const [transactionRef, setTransactionRef] = useState('');
  const [payerPhone, setPayerPhone] = useState(profile?.phone || user?.telephone || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Nom requis', description: 'Veuillez saisir votre nom.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const orderPayload = {
      client_key: profile?.client_key || crypto.randomUUID(),
      client_name: name.trim(),
      client_phone: phone.trim(),
      items: cart.items.map((it) => ({
        product_id: it.product_id,
        name: it.name,
        price: it.price,
        qty: it.qty,
      })),
      total: cart.total,
      payment_method: paymentMethod,
      transaction_ref: transactionRef.trim() || undefined,
      payer_phone: payerPhone.trim() || undefined,
      status: 'pending',
    };

    try {
      // 1. Enregistrement direct dans Supabase orders
      // Colonnes officielles : user_id, client_name, client_phone, items, total_price, payment_method, momo_transaction_id, status
      const sbOrderPayload = {
        user_id: user?.id || null,
        client_name: name.trim(),
        client_phone: phone.trim(),
        items: cart.items.map((it) => ({
          product_id: it.product_id,
          name: it.name,
          price: it.price,
          qty: it.qty,
        })),
        total_price: cart.total,
        payment_method: paymentMethod,
        momo_transaction_id: transactionRef.trim() || null,
        status: 'pending',
      };

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert(sbOrderPayload)
        .select()
        .single();

      console.log('Insert order:', { data: orderData, error: orderErr });

      if (orderErr) {
        console.warn('[Supabase] Erreur enregistrement commande:', orderErr.message);
        if (navigator.onLine) {
          toast({
            title: 'Erreur lors de la commande',
            description: orderErr.message || "Impossible d'enregistrer la commande.",
            variant: 'destructive',
          });
          return;
        }
      }

      // 2. Synchronisation locale de secours
      try {
        await base44.entities.Order.create(orderPayload);
      } catch {}

      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['staff-orders'] });
      qc.invalidateQueries({ queryKey: ['staff-badge-orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });

      cart.clear();
      toast({
        title: 'Commande enregistrée avec succès !',
        description: 'Votre commande a été transmise au secrétariat. Vos articles sont réservés.',
        variant: 'success',
      });
      onSuccess();
      navigate('/historique-commandes');
    } catch (err: any) {
      toast({
        title: 'Erreur inattendue',
        description: err?.message || 'Une erreur est survenue lors de la commande.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-left">
      <div className="flex items-center justify-between pb-3 border-b border-cacao/10">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-cacao/70 hover:text-cacao inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au panier</span>
        </button>
        <span className="font-bold text-sm text-cacao">Total : {formatPrice(cart.total)}</span>
      </div>

      {/* Client Identity */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
          Vos coordonnées
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom complet *"
            className="field text-xs sm:text-sm"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone pour la livraison"
            className="field text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
          Mode de règlement
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = paymentMethod === pm.value;
            return (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value as any)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-gold bg-gold/15 shadow-sm font-semibold text-cacao'
                    : 'border-cacao/10 bg-white/60 text-cacao/70 hover:bg-white'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{pm.label}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{pm.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Network Payment Card */}
      <MomoPaymentCard
        amount={cart.total}
        label="Règlement commande boutique"
        initialNetwork={
          paymentMethod === 'moov'
            ? 'moov'
            : paymentMethod === 'celtiis'
            ? 'celtiis'
            : paymentMethod === 'card'
            ? 'bank'
            : 'mtn'
        }
        onNetworkChange={(net) => {
          if (net === 'mtn') setPaymentMethod('mtn');
          else if (net === 'moov') setPaymentMethod('moov');
          else if (net === 'celtiis') setPaymentMethod('celtiis');
          else if (net === 'bank') setPaymentMethod('card');
        }}
      />

      {/* Payment Reference Declaration */}
      <div className="p-4 rounded-2xl bg-white/70 border border-cacao/10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-cacao/70 block">
          Déclaration de transaction
        </span>
        <p className="text-xs text-cacao/65">
          Après avoir validé l'envoi sur votre téléphone, saisissez le numéro ayant payé et l'identifiant reçu par SMS :
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="tel"
            value={payerPhone}
            onChange={(e) => setPayerPhone(e.target.value)}
            placeholder="Numéro payeur (Ex: 97000000)"
            className="field text-xs sm:text-sm"
          />
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="Réf transaction / SMS (facultatif)"
            className="field text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Validation */}
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="btn-gold w-full py-3.5 text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
        ) : (
          <ShieldCheck className="w-5 h-5" />
        )}
        <span>Valider et transmettre ma commande ({formatPrice(cart.total)})</span>
      </button>
    </form>
  );
}
