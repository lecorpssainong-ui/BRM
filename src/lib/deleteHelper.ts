import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { mockStore } from '@/lib/mockStore';
import { queryClientInstance } from '@/lib/query-client';
import { toast } from '@/components/ui/toaster';

export interface DeleteOptions {
  confirmMessage?: string;
  successMessage?: string;
  tableName: string;
  base44Entity?: string;
  skipConfirm?: boolean;
}

/**
 * Normalise les alias ou anciens noms de tables vers le nom officiel Supabase
 */
export function normalizeTableName(tableName: string): string {
  const t = (tableName || '').trim().toLowerCase();
  if (t === 'videos' || t === 'video' || t === 'media') return 'media';
  if (t === 'massage_types' || t === 'massages' || t === 'massage' || t === 'services' || t === 'service') return 'services';
  if (t === 'products' || t === 'product') return 'products';
  if (t === 'orders' || t === 'order') return 'orders';
  if (t === 'appointments' || t === 'appointment') return 'appointments';
  if (t === 'invoices' || t === 'invoice') return 'invoices';
  if (t === 'chat_messages' || t === 'messages' || t === 'message') return 'chat_messages';
  if (t === 'profiles' || t === 'profile' || t === 'users' || t === 'user') return 'profiles';
  if (t === 'app_settings' || t === 'settings') return 'app_settings';
  if (t === 'anamneses' || t === 'anamnesis') return 'anamneses';
  if (t === 'health_reports' || t === 'health_report') return 'health_reports';
  return tableName;
}

/**
 * Fonction unifiée de suppression avec confirmation
 * 1. Confirmation optionnelle si confirmMessage fourni et non skipConfirm
 * 2. Suppression Supabase en PREMIER :
 *    const { data, error } = await supabase.from(tableName).delete().eq('id', id);
 *    console.log('Delete:', { tableName, id, data, error });
 *    if (error && navigator.onLine) throw error;
 * 3. Invalidation des caches React Query correspondants
 * 4. Suppression miroir Base44 et MockStore
 * 5. Toast informatif
 */
export async function deleteRecordWithConfirm(
  recordId: string,
  options: DeleteOptions
): Promise<boolean> {
  const rawTable = options.tableName || '';
  const tableName = normalizeTableName(rawTable);

  if (options.confirmMessage && !options.skipConfirm) {
    if (typeof window !== 'undefined' && !window.confirm(options.confirmMessage)) {
      return false;
    }
  }

  try {
    // 1. Suppression prioritaire Supabase en PREMIER
    if (tableName && supabase) {
      const { data, error } = await supabase.from(tableName).delete().eq('id', recordId);
      console.log('Delete:', { tableName, id: recordId, data, error });
      if (error && typeof navigator !== 'undefined' && navigator.onLine) {
        throw error;
      }
    }

    // 2. Invalidation React Query selon la table cible
    const t = tableName.toLowerCase();
    const ent = (options.base44Entity || '').toLowerCase();

    if (t === 'services' || t.includes('massage') || ent.includes('massage')) {
      queryClientInstance.invalidateQueries({ queryKey: ['services'] });
      queryClientInstance.invalidateQueries({ queryKey: ['massages'] });
    } else if (t === 'media' || t.includes('video') || ent.includes('video')) {
      queryClientInstance.invalidateQueries({ queryKey: ['media'] });
      queryClientInstance.invalidateQueries({ queryKey: ['videos'] });
    } else if (t === 'products' || ent.includes('product')) {
      queryClientInstance.invalidateQueries({ queryKey: ['products'] });
      queryClientInstance.invalidateQueries({ queryKey: ['shop'] });
    } else if (t === 'appointments' || ent.includes('appoint')) {
      queryClientInstance.invalidateQueries({ queryKey: ['appointments'] });
      queryClientInstance.invalidateQueries({ queryKey: ['secretary-appointments'] });
      queryClientInstance.invalidateQueries({ queryKey: ['staff-badge-appts'] });
    } else if (t === 'orders' || ent.includes('order')) {
      queryClientInstance.invalidateQueries({ queryKey: ['orders'] });
      queryClientInstance.invalidateQueries({ queryKey: ['staff-orders'] });
    } else if (t === 'invoices' || ent.includes('invoice')) {
      queryClientInstance.invalidateQueries({ queryKey: ['invoices'] });
      queryClientInstance.invalidateQueries({ queryKey: ['staff-invoices'] });
      queryClientInstance.invalidateQueries({ queryKey: ['staff-badge-invoices'] });
    } else if (t === 'chat_messages' || ent.includes('message')) {
      queryClientInstance.invalidateQueries({ queryKey: ['chat_messages'] });
      queryClientInstance.invalidateQueries({ queryKey: ['messages'] });
    } else if (t === 'profiles' || ent.includes('user') || ent.includes('profile')) {
      queryClientInstance.invalidateQueries({ queryKey: ['profiles'] });
      queryClientInstance.invalidateQueries({ queryKey: ['staff'] });
      queryClientInstance.invalidateQueries({ queryKey: ['team'] });
      queryClientInstance.invalidateQueries({ queryKey: ['team-users'] });
    } else if (t === 'anamneses' || ent.includes('anamnesis')) {
      queryClientInstance.invalidateQueries({ queryKey: ['anamneses'] });
    } else if (t === 'health_reports' || ent.includes('health')) {
      queryClientInstance.invalidateQueries({ queryKey: ['health_reports'] });
    } else if (t === 'app_settings' || ent.includes('setting')) {
      queryClientInstance.invalidateQueries({ queryKey: ['app-settings'] });
      queryClientInstance.invalidateQueries({ queryKey: ['settings'] });
    } else if (t.includes('announc') || ent.includes('announc')) {
      queryClientInstance.invalidateQueries({ queryKey: ['announcements'] });
    }

    // 3. Suppression miroir Base44 si spécifiée
    const entity = options.base44Entity;
    if (entity && (base44.entities as any)[entity]) {
      try {
        await (base44.entities as any)[entity].delete(recordId);
      } catch (e) {
        console.warn('Base44 delete warning:', e);
      }
    }

    // 4. Suppression miroir MockStore pour synchronisation locale & événements
    try {
      if (t === 'services' || t.includes('massage') || ent.includes('massage')) {
        await mockStore.deleteService(recordId);
        queryClientInstance.setQueryData(['massages'], (old: any) =>
          Array.isArray(old) ? old.filter((s: any) => s.id !== recordId) : []
        );
        queryClientInstance.setQueryData(['services'], (old: any) =>
          Array.isArray(old) ? old.filter((s: any) => s.id !== recordId) : []
        );
      } else if (t === 'products' || ent.includes('product')) {
        await mockStore.deleteProduct(recordId);
        queryClientInstance.setQueryData(['products'], (old: any) =>
          Array.isArray(old) ? old.filter((p: any) => p.id !== recordId) : []
        );
      } else if (t === 'media' || t.includes('video') || ent.includes('video')) {
        await mockStore.deleteVideo(recordId);
        queryClientInstance.setQueryData(['videos'], (old: any) =>
          Array.isArray(old) ? old.filter((v: any) => v.id !== recordId) : []
        );
        queryClientInstance.setQueryData(['media'], (old: any) =>
          Array.isArray(old) ? old.filter((v: any) => v.id !== recordId) : []
        );
      } else if (t.includes('announc') || ent.includes('announc')) {
        await mockStore.deleteAnnouncement?.(recordId);
        queryClientInstance.setQueryData(['announcements'], (old: any) =>
          Array.isArray(old) ? old.filter((a: any) => a.id !== recordId) : []
        );
      }

      window.dispatchEvent(
        new CustomEvent('brm-db-change', {
          detail: { table: options.base44Entity || tableName },
        })
      );
      window.dispatchEvent(
        new CustomEvent('brm-mockstore-change', {
          detail: { table: tableName },
        })
      );
    } catch (e) {
      console.warn('MockStore delete warning:', e);
    }

    toast({
      title: options.successMessage || 'Élément supprimé avec succès',
      variant: 'default',
    });

    return true;
  } catch (err: any) {
    console.error('deleteRecordWithConfirm error:', err);
    toast({
      title: 'Erreur lors de la suppression',
      description: err?.message || 'Impossible de supprimer cet élément.',
      variant: 'destructive',
    });
    return false;
  }
}
