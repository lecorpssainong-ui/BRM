import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { useCart } from '@/lib/useCart';
import { formatPrice } from '@/lib/format';
import CheckoutForm from './CheckoutForm';
import AutoMedia from '@/components/shared/AutoMedia';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const cart = useCart();
  const [isCheckout, setIsCheckout] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm"
          />

          {/* Lateral Sliding Drawer (Slide-in from Right on Desktop, Bottom on Mobile) */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                backgroundColor: 'rgb(var(--sand))',
                color: 'rgb(var(--cacao))',
                borderColor: 'rgb(var(--cacao) / 0.18)',
              }}
              className="w-screen max-w-md shadow-2xl border-l flex flex-col h-full font-body select-none"
            >
              {/* Header */}
              <div
                style={{ borderColor: 'rgb(var(--cacao) / 0.12)' }}
                className="px-5 py-4 border-b flex items-center justify-between backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-sm">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-[#2B1D16] dark:text-[#F3EBE1] font-medium leading-tight">
                      {isCheckout ? 'Validation de commande' : 'Votre Panier'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#2B1D16]/65 dark:text-[#E8DCC4]/65">
                      <span>{cart.count} article(s)</span>
                      {!isCheckout && cart.items.length > 0 && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => cart.clear()}
                            className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                          >
                            Vider le panier
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full text-[#2B1D16]/60 dark:text-[#E8DCC4]/60 hover:text-[#2B1D16] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Fermer le panier"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {isCheckout ? (
                  <CheckoutForm
                    onBack={() => setIsCheckout(false)}
                    onSuccess={() => {
                      setIsCheckout(false);
                      onClose();
                    }}
                  />
                ) : cart.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-2xl text-cacao dark:text-sand font-medium">
                        Votre panier est vide
                      </h4>
                      <p className="text-xs text-cacao/65 dark:text-sand/65 max-w-xs leading-relaxed">
                        Explorez notre gamme d'huiles artisanales, baumes réflexologiques et cartes cadeaux.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-gold py-2.5 px-6 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Découvrir la boutique</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {cart.items.map((item) => {
                        const itemSubtotal = (Number(item.price) || 0) * (Number(item.qty) || 0);

                        return (
                          <motion.div
                            key={item.product_id}
                            initial={{ opacity: 0, height: 0, y: 10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 dark:border-amber-400/15 shadow-sm space-y-3"
                          >
                            <div className="flex items-center gap-3">
                              {/* Product Thumbnail */}
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-cacao/5">
                                <AutoMedia
                                  url={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              </div>

                              {/* Title & Unit Price */}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-display font-medium text-sm text-cacao dark:text-sand truncate">
                                  {item.name}
                                </h5>
                                <span className="text-[11px] text-cacao/60 dark:text-sand/60 block">
                                  Prix unit. : {formatPrice(item.price)}
                                </span>
                              </div>

                              {/* Explicit Delete Button */}
                              <button
                                type="button"
                                onClick={() => cart.remove(item.product_id)}
                                className="p-2 rounded-xl text-rose-600/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="Supprimer cet article"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Quantity Controls & Dynamic Subtotal */}
                            <div className="pt-2 border-t border-cacao/5 dark:border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-2 bg-[#FAF6F0] dark:bg-stone-800/80 p-1 rounded-xl border border-cacao/10 dark:border-white/10">
                                <button
                                  type="button"
                                  onClick={() => cart.setQty(item.product_id, item.qty - 1)}
                                  className="w-6 h-6 rounded-lg bg-white dark:bg-stone-700 text-cacao dark:text-sand hover:bg-stone-100 flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition"
                                  title="Diminuer la quantité"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <span className="w-6 text-center text-xs font-bold font-mono text-cacao dark:text-sand">
                                  {item.qty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => cart.setQty(item.product_id, item.qty + 1)}
                                  className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition font-bold"
                                  title="Augmenter la quantité"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Line Subtotal */}
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-cacao/50 dark:text-sand/50 block">
                                  Sous-total
                                </span>
                                <span className="font-display font-bold text-sm text-gold">
                                  {formatPrice(itemSubtotal)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer Summary & Checkout CTA */}
              {!isCheckout && cart.items.length > 0 && (
                <div className="p-5 sm:p-6 bg-white/60 dark:bg-stone-900/60 border-t border-cacao/10 dark:border-white/10 space-y-3.5 shadow-lg">
                  {/* Subtotal & Total Breakdown */}
                  <div className="space-y-1.5 text-xs text-cacao/70 dark:text-sand/70">
                    <div className="flex items-center justify-between">
                      <span>Sous-total articles :</span>
                      <span className="font-mono font-medium">{formatPrice(cart.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retrait en centre / Livraison :</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        Calculé à l'étape suivante
                      </span>
                    </div>
                    <div className="pt-2 border-t border-cacao/10 dark:border-white/10 flex items-center justify-between text-base font-bold text-cacao dark:text-sand">
                      <span>Total général :</span>
                      <span className="font-display text-2xl text-gold">
                        {formatPrice(cart.total)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={() => setIsCheckout(true)}
                    className="btn-gold w-full py-3.5 px-6 rounded-2xl text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xl active:scale-98 transition cursor-pointer"
                  >
                    <span>Procéder au règlement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-cacao/50 dark:text-sand/50 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                    <span>Paiement sécurisé Mobile Money (MTN MoMo & Moov Money)</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
