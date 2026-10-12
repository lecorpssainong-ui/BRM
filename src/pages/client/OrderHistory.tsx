import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { useClientOrders } from '@/lib/queries';
import { formatPrice, formatDate, ORDER_STATUS } from '@/lib/format';
import PageHeader from '@/components/shared/PageHeader';
import ProfileRequired from '@/components/shared/ProfileRequired';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';

export default function OrderHistory() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useClientOrders(user?.id, profile?.phone);

  return (
    <ProfileRequired reason="Pour consulter l'historique de vos commandes boutique, veuillez renseigner votre identité.">
      <div className="space-y-6">
        <PageHeader
          eyebrow={t('orders.eyebrow')}
          title={t('orders.title')}
          subtitle={t('orders.subtitle')}
        />

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 rounded-3xl bg-white/40 animate-pulse" />
            <div className="h-32 rounded-3xl bg-white/40 animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card-soft p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl text-cacao mb-2 font-medium">
              {t('orders.noOrders')}
            </h3>
            <p className="text-cacao/65 text-sm leading-relaxed mb-6 font-body">
              {t('orders.noOrdersDesc')}
            </p>
            <Link to="/boutique" className="btn-gold inline-flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span>{t('orders.visitShop')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusMeta = ORDER_STATUS[order.status] || {
                label: order.status,
                cls: 'bg-stone-200 text-stone-700',
              };
              const items = order.items || [];

              return (
                <div key={order.id} className="card-soft p-6 sm:p-7 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cacao/10">
                    <div>
                      <span className="eyebrow block mb-0.5">{t('orders.orderNumber')}</span>
                      <h4 className="font-display text-xl text-cacao font-medium">
                        {formatDate(order.created_date, 'd MMMM yyyy à HH:mm')}
                      </h4>
                      <p className="text-xs text-cacao/60 mt-0.5">
                        Mode : {String(order.payment_method || 'mtn').toUpperCase()}
                        {order.payer_phone && ` • Payé par ${order.payer_phone}`}
                        {order.transaction_ref && ` (Réf : ${order.transaction_ref})`}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <span className="font-display text-xl sm:text-2xl font-bold text-gold block">
                        {formatPrice(order.total)}
                      </span>
                      <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${statusMeta.cls}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-1.5 text-xs sm:text-sm font-body">
                    {items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-cacao/80">
                        <span>
                          {it.name} <span className="text-cacao/50">×{it.qty}</span>
                        </span>
                        <span className="font-semibold text-cacao">
                          {formatPrice((it.price || 0) * (it.qty || 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProfileRequired>
  );
}
