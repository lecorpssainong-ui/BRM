import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/useCart';
import { toast } from '@/components/ui/toaster';

interface ProductDetailSheetProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

export default function ProductDetailSheet({
  product,
  isOpen,
  onClose,
  onOpenCart,
}: ProductDetailSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      cart.add(product);
    }
    toast({
      title: 'Ajouté au panier !',
      description: `${quantity} × ${product.name} ajouté(s) à votre panier.`,
      variant: 'success',
    });
    setQuantity(1);
    onClose();
    if (onOpenCart) {
      onOpenCart();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-md -z-10"
        />

        {/* Themed Solid Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            backgroundColor: 'rgb(var(--sand))',
            color: 'rgb(var(--cacao))',
            borderColor: 'rgb(var(--cacao) / 0.18)',
          }}
          className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border flex flex-col z-10"
        >
          {/* Top handle on mobile */}
          <div className="w-12 h-1.5 bg-[#2B1D16]/20 rounded-full mx-auto mt-3 sm:hidden" />

          {/* Product Image Header */}
          <div className="relative aspect-video sm:aspect-[16/9] w-full bg-stone-900 shrink-0 overflow-hidden">
            <img
              src={
                product.image_url ||
                'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/55 text-white hover:bg-black/80 transition backdrop-blur-md shadow-lg"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Category Tag & Promo Tag */}
            <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="px-3 py-1 rounded-full bg-sand/95 dark:bg-stone-900/95 text-cacao dark:text-sand text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow border border-cacao/10">
                  {product.category}
                </span>
              )}
              {product.original_price && Number(product.original_price) > Number(product.price) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>
                    PROMO -
                    {product.discount_percent ||
                      Math.round(
                        ((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100
                      )}
                    %
                  </span>
                </motion.span>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#2B1D16]/10 dark:border-white/10">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-[#2B1D16] dark:text-[#F3EBE1] font-medium leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-[#2B1D16]/60 dark:text-[#E8DCC4]/60 mt-0.5">
                  Produit 100% authentique & certifié bien-être
                </p>
              </div>

              <div className="text-left sm:text-right flex flex-col sm:items-end">
                {product.original_price && Number(product.original_price) > Number(product.price) && (
                  <span className="line-through text-cacao/50 dark:text-sand/40 text-sm font-medium -mb-1">
                    {formatPrice(product.original_price)}
                  </span>
                )}
                <span className="font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {formatPrice(product.price)}
                </span>
                {product.stock !== undefined && (
                  <p className="text-[11px] font-medium text-[#2B1D16]/70 dark:text-[#E8DCC4]/70">
                    {Number(product.stock) > 0 ? (
                      <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> En stock ({product.stock} dispo)
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">Rupture de stock</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2B1D16]/70 dark:text-[#E8DCC4]/70">
                Description & Vertus
              </h3>
              <p className="text-sm leading-relaxed text-[#2B1D16]/80 dark:text-[#E8DCC4]/90 whitespace-pre-line font-body">
                {product.description ||
                  'Élaboré avec des ingrédients naturels de première qualité pour prolonger les bienfaits de vos séances de réflexologie à la maison.'}
              </p>
            </div>

            {/* Quality & Assurance Badges */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-stone-800/60 border border-[#2B1D16]/10 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-medium text-[#2B1D16]/80 dark:text-[#E8DCC4]/90">Ingrédients purs & bio</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium text-[#2B1D16]/80 dark:text-[#E8DCC4]/90">Paiement Mobile Money</span>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              {/* Quantity Controls */}
              <div className="flex items-center justify-between border border-[#2B1D16]/20 dark:border-white/20 rounded-full p-1 w-full sm:w-auto bg-white/40 dark:bg-stone-800/40">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#2B1D16]/10 disabled:opacity-30 transition"
                  title="Diminuer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-base">{quantity}</span>
                <button
                  type="button"
                  disabled={isOutOfStock || (product.stock !== undefined && quantity >= Number(product.stock))}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#2B1D16]/10 disabled:opacity-30 transition"
                  title="Augmenter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="btn-gold flex-1 w-full py-3.5 px-6 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Ajouter au panier • {formatPrice(Number(product.price || 0) * quantity)}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
