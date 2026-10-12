import { useState, useEffect } from 'react';
import { useProducts } from '@/lib/queries';
import { mockStore, useMockStore } from '@/lib/mockStore';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_FIELDS } from '@/lib/staffEntities';
import EntityManager from './EntityManager';
import { formatPrice } from '@/lib/format';
import AutoMedia, { isMediaVideo } from '@/components/shared/AutoMedia';
import {
  ShoppingBag,
  Pencil,
  Trash2,
  Tag,
  Plus,
  AlertTriangle,
  X,
  Check,
  FolderPlus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteRecordWithConfirm } from '@/lib/deleteHelper';
import { toast } from '@/components/ui/toaster';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShopManager() {
  const qc = useQueryClient();
  const { data: dbProducts = [], refetch } = useProducts();
  const { data: mockProducts = [] } = useMockStore('products', (store: any) => store.getProducts());

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Fusion sans doublons pour garantir l'affichage complet
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);

  useEffect(() => {
    const map = new Map<string, any>();
    (dbProducts || []).forEach((p: any) => {
      if (p?.id) map.set(p.id, p);
    });
    (mockProducts || []).forEach((p: any) => {
      if (p?.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    const merged = Array.from(map.values());
    setAllProducts(merged);

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

  const handleSave = async (data: any, isEdit: boolean) => {
    try {
      const cat = (data.category || 'Huiles & Soins').trim();
      const sbProduct = {
        name: String(data.name || '').trim(),
        description: data.description ? String(data.description).trim() : '',
        price: Number(data.price || 0),
        stock: data.stock !== undefined ? Number(data.stock) : 10,
        image_url: data.image_url ? String(data.image_url).trim() : '',
        category: cat || 'Huiles & Baumes',
      };

      let savedRecord: any = null;

      if (isEdit && data.id) {
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update(sbProduct)
          .eq('id', data.id)
          .select()
          .single();

        console.log('Update product:', { data: updated, error: updateError });
        if (updateError) {
          console.error('Erreur Supabase update product:', updateError);
          if (navigator.onLine) {
            throw updateError;
          }
        }
        savedRecord = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('products')
          .insert(sbProduct)
          .select()
          .single();

        console.log('Insert product:', { data: inserted, error: insertError });
        if (insertError) {
          console.error('Erreur Supabase insert product:', insertError);
          if (navigator.onLine) {
            throw insertError;
          }
        }
        savedRecord = inserted;
      }

      const finalId = savedRecord?.id || data.id || crypto.randomUUID();
      const localData = {
        ...data,
        ...sbProduct,
        id: finalId,
      };

      // Miroir local Base44 & mockStore pour synchronisation instantanée du composant
      try {
        if (isEdit && data.id) {
          await base44.entities.Product.update(data.id, localData);
        } else {
          await base44.entities.Product.create(localData);
        }
        await mockStore.saveProduct(localData);
        if (cat) {
          await mockStore.saveProductCategory(cat);
        }
      } catch (localErr) {
        console.warn('[ShopManager] Miroir local product:', localErr);
      }

      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['shop'] });
      refetch();

      const cats = await mockStore.getProductCategories();
      setCategories(cats);

      toast.success(
        isEdit ? 'Produit mis à jour dans Supabase !' : 'Nouveau produit ajouté dans Supabase !'
      );
      return localData;
    } catch (err: any) {
      console.error('[ShopManager] Save product error:', err);
      toast.error(
        err?.message || "Impossible d'enregistrer le produit dans Supabase."
      );
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data, error } = await supabase.from('products').delete().eq('id', id);
      console.log('Delete product:', { data, error });
      if (error) {
        console.error('Erreur Supabase delete product:', error);
        if (navigator.onLine) {
          throw error;
        }
      }
    } catch (err: any) {
      if (navigator.onLine) {
        toast.error(err?.message || 'Impossible de supprimer le produit dans Supabase.');
        return;
      }
    }

    await deleteRecordWithConfirm(id, {
      tableName: 'products',
      base44Entity: 'Product',
      confirmMessage: 'Voulez-vous vraiment supprimer définitivement ce produit ?',
      successMessage: 'Produit retiré du catalogue.',
    });
    await mockStore.deleteProduct(id);
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['shop'] });
    refetch();
    const cats = await mockStore.getProductCategories();
    setCategories(cats);
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    const s = Math.max(0, newStock);
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ stock: s })
        .eq('id', id)
        .select()
        .single();
      console.log('Update stock product:', { data, error });
      if (error) {
        console.error('Erreur Supabase update stock:', error);
      }
    } catch (err) {
      console.error('[ShopManager] Erreur mise à jour stock Supabase:', err);
    }

    await mockStore.saveProduct({ id, stock: s });
    try {
      await base44.entities.Product.update(id, { stock: s });
    } catch {}

    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['shop'] });
    refetch();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    const cat = newCatInput.trim();
    await mockStore.saveProductCategory(cat);
    setNewCatInput('');
    setShowNewCatModal(false);
    const cats = await mockStore.getProductCategories();
    setCategories(cats);
    setSelectedCategory(cat);
    toast.success('Catégorie créée !', `La catégorie "${cat}" est maintenant disponible.`);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete;
    const count = allProducts.filter(
      (p) => (p.category || '').trim().toLowerCase() === catName.toLowerCase()
    ).length;

    await mockStore.deleteCategory(catName);
    setCategoryToDelete(null);
    setSelectedCategory('all');
    qc.invalidateQueries({ queryKey: ['products'] });
    refetch();
    const cats = await mockStore.getProductCategories();
    setCategories(cats);
    toast.success(
      'Catégorie supprimée !',
      `La catégorie "${catName}" et ses ${count} produit(s) ont été définitivement supprimés.`
    );
  };

  // Filtrage par catégorie sélectionnée (insensible à la casse)
  const filteredProducts = (allProducts || []).filter((p) => {
    if (!p) return false;
    if (selectedCategory === 'all') return true;
    return (p.category || '').trim().toLowerCase() === selectedCategory.trim().toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Category Management Toolbar */}
      <div className="card-soft p-4 sm:p-5 border border-cacao/10 space-y-3 font-body bg-white/60 dark:bg-stone-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gold" />
            <h4 className="font-display font-medium text-base sm:text-lg text-cacao dark:text-sand">
              Catégories de la Boutique
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowNewCatModal(true)}
            className="btn-soft py-1.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-gold" />
            <span>Nouvelle catégorie</span>
          </button>
        </div>

        {/* Category Filter Chips with Delete Option */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map((cat, idx) => {
            const isAll = cat === 'all';
            const isSelected = selectedCategory === cat;
            const count = isAll
              ? allProducts.length
              : allProducts.filter(
                  (p) => (p.category || '').trim().toLowerCase() === cat.toLowerCase()
                ).length;

            return (
              <div
                key={`${cat}-${idx}`}
                className={`inline-flex items-center rounded-xl text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-gold text-stone-950 font-bold border-gold shadow-xs'
                    : 'bg-white/80 dark:bg-stone-800/80 hover:bg-white text-cacao/80 dark:text-sand/80 border-cacao/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isAll ? 'Toutes les catégories' : cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-stone-950/20 text-stone-950 font-bold'
                        : 'bg-black/5 dark:bg-white/10 text-cacao/60 dark:text-sand/60'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Delete custom category button with confirmation */}
                {!isAll && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(cat);
                    }}
                    className="pr-2 pl-1 py-1.5 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                    title={`Supprimer la catégorie "${cat}" et tous ses produits`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Entity Manager for Products */}
      <EntityManager
        title="Gestion de la Boutique & Stocks"
        subtitle="Mettez à jour les prix, descriptions et quantités en stock de vos huiles et accessoires."
        items={filteredProducts}
        fields={PRODUCT_FIELDS}
        onSave={handleSave}
        onDelete={handleDelete}
        renderRow={(prod, onEdit, onDelete) => {
          const hasDiscount =
            Boolean(prod.original_price) && Number(prod.original_price) > Number(prod.price);
          const discountPercent =
            prod.discount_percent ||
            (hasDiscount
              ? Math.round(
                  ((Number(prod.original_price) - Number(prod.price)) /
                    Number(prod.original_price)) *
                    100
                )
              : 0);

          return (
            <div
              key={prod.id}
              className="card-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body border border-cacao/10 bg-white/80 dark:bg-stone-900/80"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Media Thumbnail (Image, GIF ou Vidéo auto-résolue) */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-cacao/10">
                  <AutoMedia
                    url={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-medium text-base sm:text-lg text-cacao dark:text-sand truncate">
                      {prod.name}
                    </h4>
                    {prod.active ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        En ligne
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                        Masqué
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-cacao/65 dark:text-sand/65 mt-0.5">
                    {hasDiscount && (
                      <span className="line-through text-cacao/40 dark:text-sand/40 text-[11px]">
                        {formatPrice(prod.original_price)}
                      </span>
                    )}
                    <span className="font-bold text-gold">{formatPrice(prod.price)}</span>
                    {hasDiscount && discountPercent > 0 && (
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        PROMO -{discountPercent}%
                      </span>
                    )}
                    {prod.category && <span>• {prod.category}</span>}
                  </div>
                </div>
              </div>

              {/* Direct Inline Stock adjustment */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-cacao/5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-cacao/60 dark:text-sand/60 font-semibold">Stock :</span>
                  <input
                    type="number"
                    min="0"
                    value={prod.stock ?? 10}
                    onChange={(e) => handleUpdateStock(prod.id, Number(e.target.value))}
                    className="w-16 p-1 rounded-lg border border-cacao/20 text-center font-bold text-cacao dark:text-sand bg-white dark:bg-stone-800 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="p-2 rounded-xl text-cacao/70 dark:text-sand/70 hover:text-cacao hover:bg-cacao/10 transition cursor-pointer"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4 text-gold" />
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Modal Création de Catégorie */}
      <AnimatePresence>
        {showNewCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewCatModal(false)}
              className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: 'rgb(var(--sand))',
                color: 'rgb(var(--cacao))',
                borderColor: 'rgb(var(--cacao) / 0.18)',
              }}
              className="relative z-10 w-full max-w-md p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 font-body"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gold" />
                  <h3 className="font-display font-medium text-lg text-cacao dark:text-sand">
                    Nouvelle Catégorie
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCatModal(false)}
                  className="p-1 rounded-xl text-cacao/50 hover:text-cacao dark:text-sand/50 dark:hover:text-sand transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-cacao/70 dark:text-sand/70">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ex: Coffrets Cadeaux, Encens & Bougies..."
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    className="field text-xs sm:text-sm py-2.5"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCatModal(false)}
                    className="btn-soft text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-gold text-xs py-2 px-4 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Créer la catégorie</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Confirmation Suppression de Catégorie & Contenu */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryToDelete(null)}
              className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: 'rgb(var(--sand))',
                color: 'rgb(var(--cacao))',
                borderColor: 'rgb(var(--cacao) / 0.18)',
              }}
              className="relative z-10 w-full max-w-md p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 font-body"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-display font-medium text-lg text-cacao dark:text-sand">
                  Supprimer la catégorie « {categoryToDelete} » ?
                </h3>
                <p className="text-xs text-cacao/70 dark:text-sand/70 leading-relaxed">
                  Attention : cette action supprimera définitivement la catégorie et{' '}
                  <strong className="text-rose-600 font-bold">tous les produits associés</strong>{' '}
                  dans la boutique.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="btn-soft text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmer la suppression</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
