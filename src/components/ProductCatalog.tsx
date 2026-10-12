import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Trash2,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { mockStore, useMockStore } from '@/lib/mockStore';
import { useProducts } from '@/lib/queries';
import { useCart } from '@/lib/useCart';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/ui/toaster';
import AutoMedia, { isMediaVideo } from '@/components/shared/AutoMedia';

export { isMediaVideo };

export interface ProductCatalogProps {
  isStaffMode?: boolean;
}

/**
 * PRODUCT CATALOG — CATALOGUE BOUTIQUE HAUTE FIDÉLITÉ (GRILLE 2 COLONNES, VIDÉO/GIF/IMAGE, PROMO SCINTILLANTE)
 */
export default function ProductCatalog({ isStaffMode = false }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductModal, setActiveProductModal] = useState<any | null>(null);
  const cart = useCart();

  // Chargement hybride ultra synchrone : DB (base44) + mockStore
  const { data: dbProducts = [] } = useProducts();
  const { data: mockProducts = [], refetch } = useMockStore(
    'products',
    (store: any) => store.getProducts()
  );

  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);

  useEffect(() => {
    // Fusion intelligente sans doublons d'ID (mockProducts mis à jour en priorité)
    const map = new Map<string, any>();
    (dbProducts || []).forEach((p: any) => {
      if (p?.id) map.set(p.id, p);
    });
    (mockProducts || []).forEach((p: any) => {
      if (p?.id) {
        const existing = map.get(p.id);
        map.set(p.id, { ...existing, ...p });
      }
    });
    const merged = Array.from(map.values());
    setLocalProducts(merged);

    mockStore.getProductCategories().then((cats) => {
      const mergedCats = Array.from(
        new Set([
          'all',
          ...cats,
          ...merged.map((p) => p?.category?.trim()).filter(Boolean),
        ])
      );
      setCategories(mergedCats);
    });
  }, [dbProducts, mockProducts]);

  // Synchronisation événementielle instantanée (en direct)
  useEffect(() => {
    const handleLiveChange = () => {
      refetch();
      mockStore.getProducts().then((prods) => {
        setLocalProducts(prods || []);
      });
      mockStore.getProductCategories().then((cats) => {
        setCategories(cats);
      });
    };

    window.addEventListener('brm-product-change', handleLiveChange);
    window.addEventListener('brm-db-change', handleLiveChange);
    window.addEventListener('brm-mockstore-change', handleLiveChange);
    window.addEventListener('storage', handleLiveChange);

    return () => {
      window.removeEventListener('brm-product-change', handleLiveChange);
      window.removeEventListener('brm-db-change', handleLiveChange);
      window.removeEventListener('brm-mockstore-change', handleLiveChange);
      window.removeEventListener('storage', handleLiveChange);
    };
  }, [refetch]);

  // Action Ajouter au Panier (Ultra réactive + Haptique douce + ZÉRO rechargement)
  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    e.preventDefault();

    if (!product) return;

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

  // Action Supprimer Produit (Staff Mode)
  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    setLocalProducts((prev) => (prev || []).filter((p) => p.id !== id));

    try {
      await mockStore.deleteProduct(id);
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été supprimé du catalogue.',
        variant: 'success',
      });
    } catch (err) {
      console.error('Erreur suppression produit:', err);
      toast({
        title: 'Erreur',
        description: 'Échec lors de la suppression.',
        variant: 'destructive',
      });
      refetch();
    }
  };

  // Filtrage sécurisé anti-crash & insensible à la casse
  const filteredProducts = (localProducts || []).filter((p) => {
    if (!p) return false;
    if (
      selectedCategory !== 'all' &&
      (p.category || '').trim().toLowerCase() !== selectedCategory.trim().toLowerCase()
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 24,
      },
    },
  };

  return (
    <div className="space-y-6 font-body">
      {/* Barre de Recherche & Filtre de Catégories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-cacao/40 dark:text-sand/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une huile, baume, coffret..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/85 dark:bg-stone-900/85 border border-cacao/10 dark:border-white/10 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition shadow-xs"
          />
        </div>

        {/* Sous-Onglets Catégories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={`${cat}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-gold text-stone-950 font-bold border-gold shadow-md'
                    : 'bg-white/60 dark:bg-stone-900/60 hover:bg-white text-cacao/75 dark:text-sand/75 border-cacao/10 dark:border-white/10'
                }`}
              >
                {cat === 'all' ? 'Tous les produits' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille de Produits — EXACTEMENT 2 COLONNES (Mobile & Desktop) */}
      {filteredProducts.length === 0 ? (
        <div className="card-soft p-10 text-center space-y-2 max-w-md mx-auto my-6">
          <ShoppingBag className="w-10 h-10 text-gold/60 mx-auto" />
          <h4 className="font-display text-lg text-cacao dark:text-sand font-medium">
            Aucun produit dans cette catégorie
          </h4>
          <p className="text-xs text-cacao/60 dark:text-sand/60">
            Sélectionnez une autre catégorie ou modifiez votre recherche.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5"
        >
          {filteredProducts.map((product, idx) => {
            const originalPrice = Number(product.original_price || 0);
            const price = Number(product.price || 0);
            const hasDiscount = originalPrice > price && price > 0;
            const discountPercent =
              product.discount_percent ||
              (hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

            return (
              <motion.div
                key={product.id ? `${product.id}-${idx}` : `prod-${idx}`}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => setActiveProductModal(product)}
                className="group rounded-2.5xl sm:rounded-3xl bg-white/80 dark:bg-stone-900/85 border border-amber-500/20 hover:border-gold/50 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between cursor-pointer backdrop-blur-md"
              >
                {/* Media Container (Image, GIF ou Vidéo courte boucle muette) */}
                <div className="relative aspect-square sm:aspect-4/3 overflow-hidden bg-cacao/5">
                  <AutoMedia
                    url={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />

                  {/* Category Pill */}
                  {product.category && (
                    <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-sand border border-white/10 uppercase tracking-wider truncate max-w-[70%]">
                      {product.category}
                    </div>
                  )}

                  {/* Sticker Remise Scintillant Animé Ultra Visible */}
                  {hasDiscount && discountPercent > 0 && (
                    <motion.div
                      animate={{
                        scale: [1, 1.06, 1],
                        filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'],
                      }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                      className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 px-2 py-0.5 sm:px-2.5 sm:py-0.8 rounded-full bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 border border-white/30 backdrop-blur-md z-10"
                    >
                      <Sparkles className="w-2.5 h-2.5 animate-spin text-amber-200" />
                      <span>-{discountPercent}%</span>
                    </motion.div>
                  )}
                </div>

                {/* Contenu Carte Produit */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div className="space-y-0.5 sm:space-y-1">
                    <h3 className="font-display font-medium text-sm sm:text-base text-cacao dark:text-sand leading-snug line-clamp-1 group-hover:text-gold transition">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-[11px] sm:text-xs text-cacao/65 dark:text-sand/65 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Tarifs & Bouton Panier */}
                  <div className="pt-2 border-t border-cacao/10 dark:border-white/10 flex items-center justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm md:text-base text-gold truncate">
                        {formatPrice(price)}
                      </div>
                      {hasDiscount && (
                        <div className="text-[10px] sm:text-[11px] line-through text-cacao/45 dark:text-sand/40 font-mono">
                          {formatPrice(originalPrice)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isStaffMode && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(e, product.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Supprimer du catalogue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, product)}
                        className="btn-gold py-1.5 px-2.5 sm:px-3 text-xs font-bold rounded-xl inline-flex items-center gap-1 cursor-pointer active:scale-95 transition shadow-xs"
                        title="Ajouter au panier"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Ajouter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modal Détail Produit Glassmorphic */}
      <AnimatePresence>
        {activeProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveProductModal(null)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: 'rgb(var(--sand))',
                color: 'rgb(var(--cacao))',
                borderColor: 'rgb(var(--cacao) / 0.18)',
              }}
              className="relative z-10 max-w-lg w-full p-5 sm:p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl space-y-4 font-body"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-gold tracking-wider">
                  {activeProductModal.category || 'Boutique'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveProductModal(null)}
                  className="p-1.5 rounded-xl text-white/60 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Média Preview Modal (Auto-Play Video ou Image Haute Définition) */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-black/40 relative">
                <AutoMedia
                  url={activeProductModal.image_url}
                  alt={activeProductModal.name}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              </div>

              <div>
                <h3 className="font-display font-medium text-xl text-sand">
                  {activeProductModal.name}
                </h3>
                {activeProductModal.description && (
                  <p className="text-xs text-sand/75 mt-2 leading-relaxed">
                    {activeProductModal.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gold">
                    {formatPrice(activeProductModal.price)}
                  </div>
                  {Boolean(
                    activeProductModal.original_price &&
                      Number(activeProductModal.original_price) > Number(activeProductModal.price)
                  ) && (
                    <div className="text-xs line-through text-sand/40 font-mono">
                      {formatPrice(activeProductModal.original_price)}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    handleAddToCart(e, activeProductModal);
                    setActiveProductModal(null);
                  }}
                  className="btn-gold py-2.5 px-5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ajouter au panier</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
