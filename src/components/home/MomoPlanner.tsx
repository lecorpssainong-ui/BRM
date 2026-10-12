import { useState } from 'react';
import { useMassages, useAppSettings } from '@/lib/queries';
import { useProfile } from '@/lib/clientProfile';
import { useCachedQuery } from '@/lib/offline';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/format';
import { loyaltyState, computeLine, invoiceTotals } from '@/lib/invoice';
import { CreditCard, Plus, Minus, Gift, Sparkles } from 'lucide-react';
import MomoPaymentCard from '@/components/pay/MomoPaymentCard';
import { useTranslation } from '@/lib/i18n';

export default function MomoPlanner() {
  const { t } = useTranslation();
  const { data: massages = [] } = useMassages();
  const { data: settings } = useAppSettings();
  const profile = useProfile();

  const [mode, setMode] = useState<'packages' | 'custom'>('packages');
  const [customAmount, setCustomAmount] = useState<string>('15000');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Read invoices for loyalty calculation
  const { data: clientInvoices = [] } = useCachedQuery<any[]>({
    queryKey: ['invoices-planner', profile?.client_key || 'guest'],
    enabled: Boolean(profile?.client_key),
    queryFn: async () => {
      if (!profile?.client_key) return [];
      return base44.entities.Invoice.filter({ client_key: profile.client_key });
    },
  });

  const loyalty = loyaltyState(clientInvoices, settings?.loyalty_threshold || 11);

  const handleQtyChange = (massageId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[massageId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [massageId]: next };
    });
  };

  // Compute lines for packages
  const lines = massages
    .filter((m: any) => (quantities[m.id] || 0) > 0)
    .map((m: any) => {
      const qty = quantities[m.id] || 0;
      const calc = computeLine(qty, m.price, m);
      return {
        label: m.name,
        qty: calc.qty,
        unit_price: calc.unit_price,
        discount_percent: calc.discount_percent,
        total: calc.total,
      };
    });

  const totals = invoiceTotals(lines);
  const totalAmount = mode === 'custom' ? Math.max(0, Number(customAmount) || 0) : totals.total;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="eyebrow block mb-1">{t('home.momoEyebrow')}</span>
          <h2 className="font-display text-3xl sm:text-4xl text-cacao font-medium">
            {t('home.momoTitle')}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-cacao/65 max-w-sm">
          {t('home.momoSubtitle')}
        </p>
      </div>

      {/* Loyalty Banner if applicable */}
      {loyalty.total > 0 && (
        <div className="card-soft p-5 border border-gold/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-gold/15 text-gold shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cacao/60 block">
                {t('planner.loyaltyTitle')}
              </span>
              <p className="text-sm font-semibold text-cacao">
                {loyalty.total} séance(s) déjà réalisées • Étape {loyalty.done}/{loyalty.step}
              </p>
              {loyalty.isDue && (
                <p className="text-xs font-bold text-amber-700 mt-0.5 animate-pulse">
                  🎉 Votre prochaine séance déclenchera votre réduction fidélité de {settings?.loyalty_percent || 15}% !
                </p>
              )}
            </div>
          </div>
          <span className="text-xs font-bold text-gold hidden sm:inline">
            -{settings?.loyalty_percent || 15}% au palier
          </span>
        </div>
      )}

      {/* Main planner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration */}
        <div className="lg:col-span-7 card-soft p-6 sm:p-8 space-y-6">
          {/* Mode Switcher */}
          <div className="flex rounded-full bg-cacao/5 p-1 border border-cacao/10">
            <button
              type="button"
              onClick={() => setMode('packages')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                mode === 'packages'
                  ? 'bg-sand text-cacao shadow-sm font-bold'
                  : 'text-cacao/60 hover:text-cacao'
              }`}
            >
              {t('planner.packages')}
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                mode === 'custom'
                  ? 'bg-sand text-cacao shadow-sm font-bold'
                  : 'text-cacao/60 hover:text-cacao'
              }`}
            >
              {t('planner.customAmount')}
            </button>
          </div>

          {/* Packages Mode */}
          {mode === 'packages' ? (
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-cacao/50 block">
                Composez votre carnet de séances :
              </span>
              <div className="space-y-3">
                {massages.map((m: any) => {
                  const qty = quantities[m.id] || 0;
                  const discount = qty >= (m.bulk_min_qty || 10) ? m.bulk_discount_percent : 0;

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white/60 border border-cacao/5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-cacao truncate">
                          {m.name}
                        </h4>
                        <div className="text-xs text-cacao/60 mt-0.5 flex items-center gap-2">
                          <span>{formatPrice(m.price)} / séance</span>
                          {discount > 0 && (
                            <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              -{discount}% appliqué
                            </span>
                          )}
                        </div>
                      </div>

                      {/* - / + controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(m.id, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-full bg-cacao/5 text-cacao hover:bg-cacao/10 disabled:opacity-30 flex items-center justify-center transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-cacao">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(m.id, 1)}
                          className="w-8 h-8 rounded-full bg-gold/20 text-gold hover:bg-gold/30 flex items-center justify-center transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Breakdown */}
              {lines.length > 0 && (
                <div className="pt-4 border-t border-cacao/10 space-y-2 text-xs sm:text-sm font-body">
                  <div className="flex justify-between text-cacao/70">
                    <span>Sous-total ({totals.subtotal > 0 ? formatPrice(totals.subtotal) : '0 FCFA'})</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>Remise forfait</span>
                      <span>-{formatPrice(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-cacao pt-1 border-t border-cacao/5">
                    <span>Total à régler</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Custom Amount Mode */
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-cacao/60">
                Saisissez le montant en Francs CFA
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ex: 25000"
                  className="field text-lg font-bold pr-16"
                />
                <span className="absolute right-4 top-3 text-xs font-semibold text-cacao/50 pointer-events-none">
                  FCFA
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {[10000, 15000, 20000, 30000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomAmount(String(preset))}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/70 hover:bg-white text-cacao border border-cacao/10 transition"
                  >
                    {formatPrice(preset)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Payment Card */}
        <div className="lg:col-span-5">
          <MomoPaymentCard
            amount={totalAmount}
            label={
              mode === 'packages' && lines.length > 0
                ? `${lines.reduce((s, it) => s + it.qty, 0)} séance(s) sélectionnée(s)`
                : 'Crédit de séances'
            }
          />
        </div>
      </div>
    </section>
  );
}
