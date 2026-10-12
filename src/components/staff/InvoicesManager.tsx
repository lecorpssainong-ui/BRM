import { useState, useEffect } from 'react';
import { useStaffInvoices, useAppSettings } from '@/lib/queries';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { formatPrice, formatDate } from '@/lib/format';
import { invoicePdf } from '@/lib/invoice';
import InvoiceForm from './InvoiceForm';
import { Receipt, Plus, Download, Pencil, Trash2, Search, Gift } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { deleteRecordWithConfirm } from '@/lib/deleteHelper';

export default function InvoicesManager() {
  const qc = useQueryClient();
  const { data: settings } = useAppSettings();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useStaffInvoices();

  const [localInvoices, setLocalInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (invoices) setLocalInvoices(invoices);
  }, [invoices]);

  const handleDownload = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      if (inv.pdf_url) {
        window.open(inv.pdf_url, '_blank');
      } else {
        await invoicePdf(inv, settings);
      }
      toast({ title: 'Facture PDF prête', variant: 'success' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase.from('invoices').delete().eq('id', id);
      console.log('Delete invoice:', { data, error });
      if (error) {
        console.error('Erreur suppression facture Supabase:', error);
        if (navigator.onLine) {
          throw error;
        }
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de supprimer la facture.',
        variant: 'destructive',
      });
      return;
    }

    const success = await deleteRecordWithConfirm(id, {
      tableName: 'invoices',
      base44Entity: 'Invoice',
      confirmMessage: 'Voulez-vous vraiment supprimer cette facture ?',
      successMessage: 'Facture supprimée.',
    });
    if (success) {
      setLocalInvoices((prev) => prev.filter((i) => i.id !== id));
      qc.invalidateQueries({ queryKey: ['staff-invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    }
  };

  const handleOpenEdit = (inv: any) => {
    setEditingInvoice(inv);
    setFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const filtered = localInvoices.filter((inv) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = (inv.number || '').toLowerCase().includes(q);
      const matchClient = (inv.client_name || '').toLowerCase().includes(q);
      const matchPhone = (inv.client_phone || '').includes(q);
      if (!matchNum && !matchClient && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-0.5">Comptabilité & Reçus</span>
          <h2 className="font-display text-2xl sm:text-3xl text-cacao font-medium">
            Facturation Clients
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-gold py-2.5 px-5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Émettre une facture</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-cacao/40 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro ou client..."
          className="field text-xs py-2 pl-9"
        />
      </div>

      {/* Invoices List */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-3xl bg-white/40 animate-pulse" />
          <div className="h-32 rounded-3xl bg-white/40 animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-soft p-12 text-center max-w-md mx-auto my-8">
          <Receipt className="w-12 h-12 text-gold mx-auto mb-3" />
          <h4 className="font-display text-xl text-cacao">Aucune facture émise</h4>
          <p className="text-xs text-cacao/65 mt-1 font-body">
            Émettez une facture après la séance ou un forfait client.
          </p>
        </div>
      ) : (
        <div className="space-y-4 font-body">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="card-soft p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-cacao/10"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="font-display text-lg sm:text-xl font-bold text-cacao">
                    {inv.number || 'Facture'}
                  </h4>
                  {inv.loyalty_applied && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      <Gift className="w-3 h-3" />
                      <span>Fidélité</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-cacao/75 font-semibold mt-0.5">
                  Client : {inv.client_name}{' '}
                  {inv.client_phone && <span className="font-normal text-cacao/60">({inv.client_phone})</span>}
                </p>

                <p className="text-[11px] text-cacao/50 mt-0.5">
                  Émise le {formatDate(inv.date || inv.created_date, 'd MMMM yyyy')}
                  {inv.issued_by && ` par ${inv.issued_by}`} • {(inv.items || []).length} prestation(s)
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-cacao/10">
                <div className="text-right">
                  <span className="text-xs text-cacao/50 block">Total</span>
                  <span className="font-display text-xl font-bold text-gold">
                    {formatPrice(inv.total)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={downloadingId === inv.id}
                    onClick={() => handleDownload(inv)}
                    className="p-2 rounded-xl text-cacao hover:bg-cacao/10 transition"
                    title="Télécharger le PDF"
                  >
                    {downloadingId === inv.id ? (
                      <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 text-gold" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(inv)}
                    className="p-2 rounded-xl text-cacao/70 hover:text-cacao hover:bg-cacao/10 transition"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(inv.id);
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <InvoiceForm
        isOpen={formOpen}
        initialData={editingInvoice}
        onClose={() => setFormOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['staff-invoices'] })}
      />
    </div>
  );
}
