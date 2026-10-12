import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ShoppingBag, X, Plus } from 'lucide-react';
import { useProducts } from '@/lib/queries';
import { useCart } from '@/lib/useCart';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import AutoMedia from '@/components/shared/AutoMedia';

interface VideoShopDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productId?: string;
}

export default function VideoShopDrawer({
  isOpen,
  onClose,
  productName,
  productId,
}: VideoShopDrawerProps) {
  const { data: allProducts = [] } = useProducts();
  const cart = useCart();

  const linkedProduct = allProducts.find(
    (p: any) =>
      (productId && p.id === productId) ||
      (productName && p.name?.toLowerCase() === productName.toLowerCase())
  );

  const displayProducts = linkedProduct
    ? [linkedProduct, ...allProducts.filter((p: any) => p.id !== linkedProduct.id)]
    : allProducts;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 300) {
      onClose();
    }
  };

  const handleAdd = (product: any) => {
    cart.addItemWithDiscount({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      original_price: product.original_price ? Number(product.original_price) : undefined,
      discount_percent: product.discount_percent,
      image_url: product.image_url,
      qty: 1,
    });

    toast({
      title: 'Ajouté au panier !',
      description: `${product.name} (1x) • ${formatPrice(product.price)}`,
      variant: 'success',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-body">
          {/* Backdrop avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
          />

          {/* Drawer Content - Thème clair/chaleureux lisible avec glissement gestuel */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              backgroundColor: 'rgb(var(--sand))',
              color: 'rgb(var(--cacao))',
              borderColor: 'rgb(var(--cacao) / 0.18)',
            }}
            className="relative z-10 w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border backdrop-blur-xl flex flex-col"
          >
            {/* Grab handle pour fermer en glissant vers le bas */}
            <div
              style={{ backgroundColor: 'rgb(var(--cacao) / 0.25)' }}
              className="w-12 h-1.5 rounded-full mx-auto -mt-1 mb-3 cursor-grab active:cursor-grabbing shrink-0"
            />

            {/* Header */}
            <div
              style={{ borderColor: 'rgb(var(--cacao) / 0.12)' }}
              className="flex items-center justify-between pb-3 border-b shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-medium text-lg text-cacao dark:text-sand">
                    Boutique & Huiles de Soin
                  </h3>
                  <p className="text-xs text-cacao/65 dark:text-sand/65">
                    Commande directe • Glisser vers le bas pour fermer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-cacao/60 dark:text-sand/60 hover:bg-cacao/10 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {displayProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-cacao/60 dark:text-sand/60">
                  Aucun produit disponible pour le moment.
                </div>
              ) : (
                displayProducts.map((prod: any) => {
                  const isLinked = linkedProduct && prod.id === linkedProduct.id;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition ${
                        isLinked
                          ? 'bg-amber-500/15 border-gold shadow-xs'
                          : 'bg-white/80 dark:bg-stone-900/80 border-cacao/10 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-cacao/10">
                          <AutoMedia
                            url={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          {isLinked && (
                            <span className="px-2 py-0.2 rounded-full bg-gold text-stone-950 text-[9px] font-black uppercase tracking-wider mb-0.5 inline-block">
                              Présenté dans la vidéo
                            </span>
                          )}
                          <h4 className="font-display font-medium text-sm text-cacao dark:text-sand truncate">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-gold">
                              {formatPrice(prod.price)}
                            </span>
                            {prod.category && (
                              <span className="text-[11px] text-cacao/60 dark:text-sand/60">• {prod.category}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdd(prod)}
                        className="btn-gold py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer active:scale-95 transition shadow-sm shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
