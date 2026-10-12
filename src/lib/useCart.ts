import { useEffect, useState, useCallback } from 'react';

const KEY = 'brm_cart';
const EVENT_NAME = 'brm-cart-change';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  image_url?: string;
  media_type?: 'image' | 'video' | 'gif';
  qty: number;
}

const readCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
    }
  } catch {
    // Ignore storage errors
  }
};

const triggerHaptic = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  } catch {}
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(readCart);

  // Synchronisation globale temps réel (aucun rechargement ni changement de page requis)
  useEffect(() => {
    const handleCartChange = (e: any) => {
      if (e?.detail) {
        setItems(e.detail);
      } else {
        setItems(readCart());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === KEY) {
        setItems(readCart());
      }
    };

    window.addEventListener(EVENT_NAME, handleCartChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCartChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const add = useCallback((p: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    discount_percent?: number;
    image_url?: string;
    media_type?: 'image' | 'video' | 'gif';
  }) => {
    triggerHaptic();
    const current = readCart();
    const found = current.find((i) => i.product_id === p.id);
    let updated: CartItem[];

    if (found) {
      updated = current.map((i) =>
        i.product_id === p.id ? { ...i, qty: (Number(i.qty) || 1) + 1 } : i
      );
    } else {
      updated = [
        ...current,
        {
          product_id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          original_price: p.original_price ? Number(p.original_price) : undefined,
          discount_percent: p.discount_percent,
          image_url: p.image_url,
          media_type: p.media_type,
          qty: 1,
        },
      ];
    }
    setItems(updated);
    writeCart(updated);
  }, []);

  const addItemWithDiscount = useCallback((p: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    discount_percent?: number;
    image_url?: string;
    media_type?: 'image' | 'video' | 'gif';
    qty?: number;
  }) => {
    triggerHaptic();
    const current = readCart();
    const quantityToAdd = Math.max(1, p.qty || 1);
    const found = current.find((i) => i.product_id === p.id);
    let updated: CartItem[];

    if (found) {
      updated = current.map((i) =>
        i.product_id === p.id
          ? {
              ...i,
              qty: (Number(i.qty) || 0) + quantityToAdd,
              price: Number(p.price) || i.price,
              original_price: p.original_price ?? i.original_price,
              discount_percent: p.discount_percent ?? i.discount_percent,
            }
          : i
      );
    } else {
      updated = [
        ...current,
        {
          product_id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          original_price: p.original_price ? Number(p.original_price) : undefined,
          discount_percent: p.discount_percent,
          image_url: p.image_url,
          media_type: p.media_type,
          qty: quantityToAdd,
        },
      ];
    }
    setItems(updated);
    writeCart(updated);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    triggerHaptic();
    const current = readCart();
    let updated: CartItem[];
    if (qty <= 0) {
      updated = current.filter((i) => i.product_id !== id);
    } else {
      updated = current.map((i) => (i.product_id === id ? { ...i, qty: Number(qty) } : i));
    }
    setItems(updated);
    writeCart(updated);
  }, []);

  const remove = useCallback((id: string) => {
    triggerHaptic();
    const current = readCart();
    const updated = current.filter((i) => i.product_id !== id);
    setItems(updated);
    writeCart(updated);
  }, []);

  const clear = useCallback(() => {
    triggerHaptic();
    setItems([]);
    writeCart([]);
  }, []);

  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const count = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);

  return { items, add, addItemWithDiscount, setQty, remove, clear, total, count };
}
