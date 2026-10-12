import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Receipt, ShoppingBag } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useAppSettings } from '@/lib/queries';
import { useCart } from '@/lib/useCart';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import CartSheet from '@/components/shop/CartSheet';

export default function Header() {
  const { data: settings } = useAppSettings();
  const { t } = useTranslation();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const showAdvisor = settings?.header_show_conseiller !== false;
  const showOrders = settings?.header_show_commandes !== false;
  const align = settings?.header_align || 'right';

  return (
    <>
      <header className="sticky top-0 z-40 h-16 glass border-b border-cacao/10 transition-colors">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <Link to="/" className="shrink-0 hover:opacity-90 transition">
            <Logo size="sm" />
          </Link>

          {align === 'center' && <div className="flex-1" />}

          {/* Shortcuts */}
          <div className={`flex items-center gap-2 sm:gap-3 ${align === 'left' ? 'mr-auto ml-4' : ''}`}>
            {showAdvisor && (
              <Link
                to="/conseiller-ia"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gold/15 text-[#8a6030] hover:bg-gold/25 transition active:scale-[0.97]"
                title={t('header.advisor')}
              >
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="hidden xs:inline">{t('header.advisor')}</span>
              </Link>
            )}

            {/* Shopping Cart Trigger with Elastic Pop/Bounce Animated Badge */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full text-cacao/75 hover:text-cacao hover:bg-cacao/5 transition active:scale-95 cursor-pointer"
              title={t('header.cart')}
            >
              <ShoppingBag className="w-5 h-5 text-cacao" />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    key={cart.count}
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                    className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black font-mono flex items-center justify-center shadow-md border-2 border-sand"
                  >
                    {cart.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {showOrders && (
              <Link
                to="/historique-commandes"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-cacao/70 hover:text-cacao hover:bg-cacao/5 transition active:scale-[0.97]"
                title={t('header.orders')}
              >
                <Receipt className="w-3.5 h-3.5 text-cacao/60" />
                <span className="hidden sm:inline">{t('header.orders')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Cart Sheet Modal Drawer */}
      <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
