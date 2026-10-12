import { useState } from 'react';
import { useCachedQuery } from '@/lib/offline';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { formatPrice, formatDate, ORDER_STATUS } from '@/lib/format';
import { CreditCard, Check, PackageCheck, Ban, Search, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';

export default function PaymentValidation() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useCachedQuery<any[]>({
    queryKey: ['staff-orders'],
    queryFn: async () => {
      // Lecture prioritaire dans Supabase (table orders)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lecture Supabase orders:', error);
        // Ne replier sur mockStore que si déconnecté
        if (navigator.onLine) {
          throw error;
        }
        return base44.entities.Order.list('-created_date', 500);
      }

      if (Array.isArray(data)) {
        return data.map((o) => ({
          id: o.id,
          user_id: o.user_id,
          client_name: o.client_name,
          client_phone: o.client_phone,
          total: Number(o.total_price) || 0,
          total_price: Number(o.total_price) || 0,
          status: o.status,
          payment_method: o.payment_method,
          transaction_ref: o.momo_transaction_id || o.transaction_ref,
          momo_transaction_id: o.momo_transaction_id,
          payer_phone: o.client_phone,
          items: Array.isArray(o.items) ? o.items : [],
          created_date: o.created_at,
          created_at: o.created_at,
        }));
      }

      return [];
    },
    staleTime: 5000,
  });

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setProcessingId(orderId);
    try {
      // 1. Mise à jour Supabase en PREMIER
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      console.log('Update order:', { data, error });

      if (error) {
        console.error('Erreur mise à jour commande Supabase:', error);
        if (navigator.onLine) {
          throw error;
        }
      }

      // Synchronisation de secours
      try {
        await base44.entities.Order.update(orderId, { status });
      } catch {}

      toast({
        title: `Commande marquée : ${status === 'paid' ? 'Payée' : status === 'delivered' ? 'Livrée' : 'Annulée'}`,
        variant: 'success',
      });

      // Invalidation stricte React Query
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['staff-orders'] });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de mettre à jour le statut de la commande.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'pending' && o.status !== 'pending') return false;
    if (filter === 'paid' && o.status !== 'paid') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchClient = (o.client_name || '').toLowerCase().includes(q);
      const matchRef = (o.transaction_ref || '').toLowerCase().includes(q);
      const matchPayer = (o.payer_phone || '').includes(q);
      if (!matchClient && !matchRef && !matchPayer) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Finances & Mobile Money</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Validation des Paiements
          </h2>
        </div>

        <div className="flex items-center gap-1.5 bg-white/70 p-1.5 rounded-full border border-cacao/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
              filter === 'pending' ? 'bg-gold text-cacao shadow-sm' : 'text-cacao/65 hover:text-cacao'
            }`}
          >
            En attente ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
              filter === 'paid' ? 'bg-gold text-cacao shadow-sm' : 'text-cacao/65 hover:text-cacao'
            }`}
          >
            Payées
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
              filter === 'all' ? 'bg-gold text-cacao shadow-sm' : 'text-cacao/65 hover:text-cacao'
            }`}
          >
            Toutes
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-cacao/40 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par référence, numéro payeur ou client..."
          className="field text-xs py-2 pl-9"
        />
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-3xl bg-white/40 animate-pulse" />
          <div className="h-40 rounded-3xl bg-white/40 animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-soft p-12 text-center max-w-md mx-auto my-8">
          <ShieldCheck className="w-12 h-12 text-gold mx-auto mb-3" />
          <h4 className="font-display text-xl text-cacao">Aucun paiement en attente</h4>
          <p className="text-xs text-cacao/65 mt-1 font-body">
            Toutes les transactions Mobile Money déclarées ont été vérifiées.
          </p>
        </div>
      ) : (
        <div className="space-y-4 font-body">
          {filtered.map((order) => {
            const statusMeta = ORDER_STATUS[order.status] || {
              label: order.status,
              cls: 'bg-stone-200 text-stone-700',
            };
            const isProcessing = processingId === order.id;

            return (
              <div key={order.id} className="card-soft p-6 space-y-4 border border-cacao/10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-cacao/10">
                  <div>
                    <span className="eyebrow block mb-0.5">Commande boutique</span>
                    <h4 className="font-display text-xl text-cacao font-medium">
                      {order.client_name || 'Client'}
                    </h4>
                    <p className="text-xs text-cacao/60 mt-0.5">
                      Tél : {order.client_phone || 'Non renseigné'} • Reçu le{' '}
                      {formatDate(order.created_date, 'd MMMM à HH:mm')}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="font-display text-2xl font-bold text-gold block">
                      {formatPrice(order.total)}
                    </span>
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* Mobile Money Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/60 border border-cacao/5 text-xs">
                  <div>
                    <span className="text-cacao/50 block">Moyen de paiement</span>
                    <span className="font-bold text-cacao uppercase">
                      {order.payment_method || 'MTN'}
                    </span>
                  </div>
                  <div>
                    <span className="text-cacao/50 block">Numéro payeur déclaré</span>
                    <span className="font-semibold text-cacao">
                      {order.payer_phone || 'Non précisé'}
                    </span>
                  </div>
                  <div>
                    <span className="text-cacao/50 block">Réf. transaction / SMS</span>
                    <span className="font-mono font-bold text-cacao">
                      {order.transaction_ref || 'Non précisé'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-cacao/50 uppercase tracking-wider block">
                    Articles commandés :
                  </span>
                  {(order.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-cacao/80">
                      <span>
                        • {it.name} <span className="text-cacao/50">×{it.qty}</span>
                      </span>
                      <span className="font-semibold text-cacao">{formatPrice(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-cacao/10 flex flex-wrap items-center justify-end gap-2">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUpdateStatus(order.id, 'paid')}
                      className="btn-gold py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider le paiement</span>
                    </button>
                  )}

                  {order.status === 'paid' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      className="btn-soft py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 hover:bg-sky-200"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Marquer comme livrée</span>
                    </button>
                  )}

                  {order.status !== 'cancelled' && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                      className="btn-soft py-2 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Annuler la commande</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
