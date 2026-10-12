import { useState, useMemo } from 'react';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { useClientInvoices, useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { invoicePdf, invoiceWhatsappText } from '@/lib/invoice';
import { formatPrice, formatDate } from '@/lib/format';
import { Receipt, Download, MessageSquare, Gift, Calendar, ArrowRight, Filter, Trash2, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { logActivity } from '@/lib/activityLogger';

type TimeFilter = 'all' | 'day' | 'week' | 'month';

export default function InvoicesTab() {
  const profile = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  const { data: invoices = [], isLoading } = useClientInvoices(user?.id, profile?.phone);

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices;
    const now = Date.now();
    return invoices.filter((inv) => {
      const d = inv.date || inv.created_date;
      if (!d) return false;
      const t = new Date(d).getTime();
      if (isNaN(t)) return false;

      if (filter === 'day') {
        return new Date(d).toDateString() === new Date().toDateString();
      }
      if (filter === 'week') {
        const diffDays = (now - t) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (filter === 'month') {
        const diffDays = (now - t) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    });
  }, [filter, invoices]);

  const handleDownload = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      if (inv.pdf_url) {
        window.open(inv.pdf_url, '_blank');
      } else {
        await invoicePdf(inv, settings);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSendToCenter = (inv: any) => {
    const text = invoiceWhatsappText(inv, settings);
    navigate(`/messages?text=${text}`);
  };

  const handlePurge = async () => {
    if (!profile?.client_key || filteredInvoices.length === 0) return;
    setPurging(true);
    try {
      let count = 0;
      for (const inv of filteredInvoices) {
        if (inv.id) {
          try {
            await base44.entities.Invoice.delete(inv.id);
            count++;
          } catch {}
        }
      }

      logActivity({
        table: 'Invoice',
        action: 'delete',
        description: `Purge de ${count} facture(s) client pour la période '${filter}' (${profile.name || profile.client_key})`,
        user_email: (profile as any).email || profile.client_key,
      });

      toast({
        title: 'Factures purgées',
        description: `${count} facture(s) supprimée(s) pour la période sélectionnée.`,
        variant: 'success',
      });

      setIsPurgeModalOpen(false);
      qc.invalidateQueries({ queryKey: ['invoices', profile?.client_key] });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de purger les factures.',
        variant: 'destructive',
      });
    } finally {
      setPurging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-3xl bg-white/40 animate-pulse" />
        <div className="h-40 rounded-3xl bg-white/40 animate-pulse" />
      </div>
    );
  }

  const filterLabels: Record<TimeFilter, string> = {
    all: 'Toutes',
    day: 'Par Jour',
    week: 'Par Semaine',
    month: 'Par Mois',
  };

  return (
    <div className="space-y-6">
      {/* Temporal filter & purge action */}
      {invoices.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-cacao/10 shadow-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gold ml-1" />
            {(['all', 'day', 'week', 'month'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filter === f
                    ? 'bg-cacao text-sand shadow-sm'
                    : 'text-cacao/70 dark:text-sand/70 hover:text-cacao'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>

          {filteredInvoices.length > 0 && (
            <button
              type="button"
              onClick={() => setIsPurgeModalOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purger cette période ({filteredInvoices.length})</span>
            </button>
          )}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="card-soft p-8 sm:p-12 text-center max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h3 className="font-display text-2xl text-cacao mb-2 font-medium">
            Aucune facture pour l'instant
          </h3>
          <p className="text-cacao/65 text-sm leading-relaxed mb-6 font-body">
            Vos reçus et factures détaillées apparaîtront ici après vos séances. Vous pourrez les télécharger en PDF avec le cachet du centre.
          </p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card-soft p-8 text-center max-w-md mx-auto my-4">
          <p className="text-xs text-cacao/60">
            Aucune facture pour la période sélectionnée ({filterLabels[filter]}).
          </p>
        </div>
      ) : (
        filteredInvoices.map((inv) => {
          const isDownloading = downloadingId === inv.id;
          const items = inv.items || [];

          return (
            <div key={inv.id} className="card-soft p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-cacao/10">
                <div>
                  <span className="eyebrow block mb-1">
                    Facture client {inv.status === 'paid' ? '• Réglée' : ''}
                  </span>
                  <h3 className="font-display text-2xl text-cacao font-medium">
                    {inv.number ? `N° ${inv.number}` : 'N° BRM-001'}
                  </h3>
                  <p className="text-xs text-cacao/60 mt-1">
                    Émise le {formatDate(inv.date || inv.created_date, 'd MMMM yyyy')}
                    {inv.issued_by && ` par ${inv.issued_by}`}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-cacao/60 block font-medium">Montant total</span>
                  <span className="font-display text-2xl sm:text-3xl font-bold text-gold">
                    {formatPrice(inv.total)}
                  </span>
                  {inv.loyalty_applied && (
                    <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <Gift className="w-3 h-3" />
                      <span>Remise fidélité appliquée</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line items list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cacao/50 block">
                  Prestations & Soins
                </span>
                <div className="divide-y divide-cacao/5 bg-white/50 rounded-2xl p-4 border border-cacao/5">
                  {items.map((it: any, idx: number) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-sm gap-2">
                      <div className="min-w-0">
                        <span className="font-medium text-cacao truncate block">
                          {it.label || it.name}
                        </span>
                        <span className="text-xs text-cacao/50">
                          Quantité : {it.qty} {Number(it.discount_percent) > 0 ? `(-${it.discount_percent}%)` : ''}
                        </span>
                      </div>
                      <div className="font-semibold text-cacao shrink-0">
                        {formatPrice(it.total || (it.qty * it.unit_price))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next appointment */}
              {(inv.next_appointment || inv.next_massage) && (
                <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gold shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-semibold text-cacao block">Prochaine séance prévue :</span>
                    <span className="text-cacao/75">
                      {[inv.next_massage, inv.next_appointment ? formatDate(inv.next_appointment) : null].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownload(inv)}
                  className="btn-gold text-xs sm:text-sm py-2.5 px-5 inline-flex items-center gap-2"
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Télécharger le PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendToCenter(inv)}
                  className="btn-soft text-xs sm:text-sm py-2.5 px-5 inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-cacao/60" />
                  <span>Envoyer au centre</span>
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Confirmation Modal for Client Purge */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card-soft p-6 sm:p-8 max-w-md w-full bg-white dark:bg-stone-900 border border-cacao/20 shadow-2xl rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="p-1 rounded-full text-cacao/40 hover:text-cacao"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-display text-xl font-bold text-cacao dark:text-sand">
                Confirmer la purge des factures
              </h3>
              <p className="text-xs text-cacao/70 dark:text-sand/70 mt-1 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement les <strong>{filteredInvoices.length}</strong> facture(s) correspondant à la période <strong>"{filterLabels[filter]}"</strong> ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={purging}
                onClick={() => setIsPurgeModalOpen(false)}
                className="btn-soft text-xs py-2 px-4 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurge}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{purging ? 'Suppression...' : 'Oui, purger définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
