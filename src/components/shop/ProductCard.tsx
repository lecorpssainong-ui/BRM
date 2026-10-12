import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/useCart';
import { toast } from '@/components/ui/toaster';
import AutoMedia, { isMediaVideo } from '@/components/shared/AutoMedia';

interface ProductCardProps {
  product: any;
  onSelect?: (product: any) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const cart = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const originalPrice = Number(product.original_price || 0);
    const price = Number(product.price || 0);
    const hasDiscount = originalPrice > price && price > 0;
    const discountPercent =
      product.discount_percent ||
      (hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

    cart.addItemWithDiscount({
      id: product.id,
      name: product.name,
      price: price,
      original_price: hasDiscount ? originalPrice : undefined,
      discount_percent: hasDiscount ? discountPercent : undefined,
      image_url: product.image_url,
      media_type: isMediaVideo(product.image_url) ? 'video' : 'image',
      qty: 1,
    });

    toast({
      title: 'Ajouté au panier !',
      description: `${product.name} (1x) • ${formatPrice(price)}`,
      variant: 'success',
    });
  };

  const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;

  const rawPrice = Number(product.price) || 0;
  const rawOriginalPrice =
    product.original_price !== undefined && product.original_price !== null
      ? Number(product.original_price)
      : null;

  const currentPrice = rawPrice;
  const oldPrice = rawOriginalPrice && rawOriginalPrice > rawPrice ? rawOriginalPrice : null;
  const hasPromo = Boolean(oldPrice !== null && oldPrice > currentPrice);
  const discountPercent =
    product.discount_percentage ||
    product.discount_percent ||
    (hasPromo && oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0);

  return (
    <div
      onClick={() => onSelect?.(product)}
      className="card-soft overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-[#FAF6F0] dark:bg-[#1C1410] border border-[#2B1D16]/10 dark:border-amber-400/15 select-none"
    >
      <div>
        <div className="relative aspect-square w-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
          <AutoMedia
            url={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Category Tag */}
          {product.category && (
            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-sand/95 dark:bg-stone-900/95 text-cacao dark:text-sand text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-cacao/10">
              {product.category}
            </span>
          )}

          {/* Scintillating Animated Promo Badge */}
          {hasPromo && discountPercent > 0 && (
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'],
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute top-2.5 right-2.5 px-2.5 py-0.8 rounded-full bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 border border-white/30 backdrop-blur-md z-10"
            >
              <Sparkles className="w-2.5 h-2.5 animate-spin text-amber-200" />
              <span>-{discountPercent}%</span>
            </motion.div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                Rupture temporaire
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="font-display text-lg sm:text-xl text-cacao dark:text-sand font-medium group-hover:text-gold transition-colors leading-snug mb-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-cacao/65 dark:text-sand/70 line-clamp-2 leading-relaxed font-body">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 border-t border-cacao/10 dark:border-white/10 mt-auto">
        <div className="flex flex-col">
          {hasPromo && oldPrice !== null && (
            <span className="line-through text-cacao/45 dark:text-sand/40 text-xs font-medium -mb-0.5">
              {formatPrice(oldPrice)}
            </span>
          )}
          <span
            className={`font-display text-base sm:text-lg font-bold ${
              hasPromo ? 'text-gold' : 'text-cacao dark:text-sand'
            }`}
          >
            {formatPrice(currentPrice)}
          </span>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAdd}
          className="btn-gold py-2 px-3.5 text-xs inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-sm active:scale-95 transition-transform"
          title="Ajouter au panier"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>
    </div>
  );
}
