import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getProfile } from './clientProfile';

const getLikesKey = () => {
  const p = getProfile();
  return p?.client_key ? `brm_likes_${p.client_key}` : 'brm_likes_anon';
};

const getLikes = (): Set<string> => {
  try {
    const raw = localStorage.getItem(getLikesKey());
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map(String));
    }
    return new Set();
  } catch {
    return new Set();
  }
};

export function useLike(entity: string, record: { id: string; likes?: number }) {
  const itemKey = `${entity}:${record?.id}`;
  const [hasLiked, setHasLiked] = useState<boolean>(() => getLikes().has(itemKey));
  const [count, setCount] = useState<number>(Number(record?.likes) || 0);

  const syncState = useCallback(() => {
    setCount(Number(record?.likes) || 0);
    setHasLiked(getLikes().has(itemKey));
  }, [record?.likes, itemKey]);

  useEffect(() => {
    syncState();

    const handleReset = () => syncState();
    window.addEventListener('brm-likes-update', handleReset);
    window.addEventListener('brm-profile', handleReset);
    return () => {
      window.removeEventListener('brm-likes-update', handleReset);
      window.removeEventListener('brm-profile', handleReset);
    };
  }, [record?.id, syncState]);

  const toggleLike = useCallback(async () => {
    if (!record?.id) return;
    const currentLikes = getLikes();
    const isLiked = currentLikes.has(itemKey);

    let nextCount: number;
    if (isLiked) {
      currentLikes.delete(itemKey);
      nextCount = Math.max(0, count - 1);
      setHasLiked(false);
    } else {
      currentLikes.add(itemKey);
      nextCount = count + 1;
      setHasLiked(true);
    }

    setCount(nextCount);
    try {
      localStorage.setItem(getLikesKey(), JSON.stringify(Array.from(currentLikes)));
    } catch {
      // ignore
    }

    try {
      if ((base44.entities as any)[entity]) {
        await (base44.entities as any)[entity].update(record.id, { likes: nextCount });
      }
    } catch {
      // ignore
    }
  }, [count, entity, itemKey, record?.id]);

  return { hasLiked, count, toggleLike };
}
