import { useCachedQuery } from './offline';
import { base44, type AppSettingsData } from '@/api/base44Client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { mockStore } from './mockStore';

export async function fetchAppSettingsFromSupabase(): Promise<AppSettingsData> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'a0000000-0000-0000-0000-000000000001')
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Error reading app_settings:', error.message);
      const list = await base44.entities.AppSettings.list();
      return (list[0] || {}) as AppSettingsData;
    }

    if (!data) {
      const list = await base44.entities.AppSettings.list();
      return (list[0] || {}) as AppSettingsData;
    }

    const ks = data.kill_switch || {};
    const ui = data.ui_customization || {};
    const isLocked = typeof data.is_locked === 'boolean' ? data.is_locked : (ks.is_locked ?? false);
    const lockMsg = data.lock_message || ks.lock_message || 'Application momentanément fermée pour maintenance programmée.';
    // Local fallback storage for hero settings
    let localHeroFallback: any = {};
    try {
      const stored = localStorage.getItem('brm_hero_override') || localStorage.getItem('brm_hero_settings_override');
      if (stored) localHeroFallback = JSON.parse(stored);
    } catch {}

    // Hero normalisé : priorités colonne directe Supabase -> ui_customization -> localHeroFallback
    const heroMediaUrl =
      data.hero_media_url ||
      ui.hero_media_url ||
      localHeroFallback.hero_media_url ||
      '';

    const heroMediaType =
      data.hero_media_type ||
      (heroMediaUrl && (heroMediaUrl.includes('.mp4') || heroMediaUrl.includes('.webm') || heroMediaUrl.includes('video')) ? 'video' : 'image') ||
      localHeroFallback.hero_media_type ||
      'image';

    const heroEyebrow =
      data.hero_eyebrow ||
      ui.hero_eyebrow ||
      localHeroFallback.hero_eyebrow ||
      'Sanctuaire de Bien-être';

    const heroTitle =
      data.hero_title ||
      ui.hero_title ||
      localHeroFallback.hero_title ||
      "L'art du toucher";

    const heroHighlight =
      data.hero_highlight ||
      data.hero_title_em ||
      ui.hero_highlight ||
      ui.hero_title_em ||
      localHeroFallback.hero_highlight ||
      'qui libère.';

    const heroSubtitle =
      data.hero_subtitle ||
      ui.hero_subtitle ||
      localHeroFallback.hero_subtitle ||
      "Réflexologie plantaire, massages thérapeutiques et soins traditionnels au cœur du Bénin pour restaurer l'harmonie du corps et de l'esprit.";

    const heroSectionsOrder =
      Array.isArray(data.hero_sections_order) && data.hero_sections_order.length > 0
        ? data.hero_sections_order
        : Array.isArray(data.home_sections) && data.home_sections.length > 0
        ? data.home_sections
        : Array.isArray(localHeroFallback.hero_sections_order)
        ? localHeroFallback.hero_sections_order
        : ['hero', 'bridges', 'massages', 'videos', 'center', 'momo'];

    const normalized: AppSettingsData = {
      id: data.id,
      header_title: data.header_title || data.center_name || 'Bénin Réflexologie Massage',
      center_name: data.header_title || data.center_name || 'Bénin Réflexologie Massage',
      center_phone: data.center_phone || '0191729117',
      center_momo_number: data.center_momo_number || '0191729117',
      center_momo_number_2: data.center_momo_number_2,
      center_address: data.center_address || data.address || 'Rue 340, Haie Vive, Cotonou, Bénin',
      center_owner_name: data.center_owner_name || 'Fatoumbi Adedodja Rébecca',
      whatsapp: data.center_whatsapp || '+229 01 91 72 91 17',
      center_email: data.center_email || 'contact@benin-reflexologie.bj',
      center_city: data.center_city || 'Cotonou',
      address: data.center_address || data.address || 'Rue 340, Haie Vive, Cotonou, Bénin',
      opening_hours: data.opening_hours || 'Du lundi au samedi : 08h00 - 20h00',
      center_map_url: data.center_map_url || 'https://maps.google.com/?q=6.3535,2.4045',
      welcome_message: data.welcome_message,
      ai_name: data.ai_name || 'Rébecca la lionne',
      ai_greeting: data.ai_greeting,

      // Kill Switch normalisé
      is_locked: isLocked,
      lock_message: lockMsg,
      lock_password: ks.password || 'Acces',
      is_countdown_active: ks.countdown_active ?? false,
      countdown_date: ks.countdown_date ?? null,
      app_active: !isLocked,
      app_opened: !isLocked,
      master_access_code: ks.password || 'Acces',
      closed_message: lockMsg,

      // UI Customization normalisé
      theme: ui.theme || 'cacao',
      force_global_theme: ui.global_theme_forced ?? false,
      hero_media_url: heroMediaUrl,
      hero_media_type: heroMediaType,
      hero_image_url: heroMediaUrl,
      hero_eyebrow: heroEyebrow,
      hero_title: heroTitle,
      hero_highlight: heroHighlight,
      hero_title_em: heroHighlight,
      hero_subtitle: heroSubtitle,
      hero_sections_order: heroSectionsOrder,
      home_sections: heroSectionsOrder,
      logo_url: '/logo-brm-v2.png',
      app_logos: ['/logo-brm-v2.png'],
      msg_bg_color: ui.message_bg_color || '#FAF7F2',
      msg_bg_url: ui.message_bg_image,
      nav_offset_x: ui.nav_offset_x ?? 0,
      nav_offset_y: ui.nav_offset_y ?? 16,
      nav_width: ui.nav_width ?? '92%',
      nav_padding_y: ui.nav_padding_y ?? 12,
      nav_border_radius: ui.nav_border_radius ?? 24,

      // Propriétés brutes
      kill_switch: ks,
      ui_customization: ui,
      ai_studio: data.ai_studio,
      invoice_design: data.invoice_design,
      momo_accounts: data.momo_accounts,
    } as any;

    return normalized;
  } catch (err) {
    console.warn('[Supabase] Exception lecture app_settings:', err);
    const list = await base44.entities.AppSettings.list();
    return (list[0] || {}) as AppSettingsData;
  }
}

export function useAppSettings() {
  const qc = useQueryClient();

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const safeInvalidate = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        qc.invalidateQueries({ queryKey: ['app-settings'] });
        qc.invalidateQueries({ queryKey: ['settings'] });
      }, 500);
    };

    const channelName = `realtime_app_settings_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings' },
        safeInvalidate
      )
      .subscribe();

    const localHandler = (e: any) => {
      if (e?.detail?.table?.includes('AppSettings') || e?.detail?.table?.includes('app_settings')) {
        safeInvalidate();
      }
    };
    window.addEventListener('brm-db-change', localHandler);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      window.removeEventListener('brm-db-change', localHandler);
    };
  }, [qc]);

  return useCachedQuery<AppSettingsData>({
    queryKey: ['app-settings'],
    queryFn: fetchAppSettingsFromSupabase,
    staleTime: 30000,
  });
}

/**
 * 1. CATALOGUE DES SERVICES & MASSAGES (table 'services')
 * Récupère les soins actifs depuis Supabase avec réactivité temps réel
 */
export function useMassages() {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_services_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          qc.invalidateQueries({ queryKey: ['massages'] });
          qc.invalidateQueries({ queryKey: ['services'] });
        }
      )
      .subscribe();

    const handler = (e: any) => {
      if (e?.detail?.table?.includes('MassageType') || e?.detail?.table?.includes('services')) {
        qc.invalidateQueries({ queryKey: ['massages'] });
        qc.invalidateQueries({ queryKey: ['services'] });
      }
    };
    window.addEventListener('brm-db-change', handler);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('brm-db-change', handler);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['massages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((s) => ({
            id: s.id,
            name: s.title,
            title: s.title,
            description: s.description || '',
            price: Number(s.price) || 0,
            duration: Number(s.duration) || 60,
            category: (s as any).category || 'Réflexologie',
            image_url: s.image_url,
            video_url: (s as any).video_url,
            is_active: true,
            active: true,
            order: 0,
            created_at: s.created_at,
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture services, repli base44:', err);
      }

      // Repli gracieux
      const fallback = await base44.entities.MassageType.list('order', 100);
      return (fallback || []).map((m: any) => ({
        ...m,
        title: m.name || m.title,
        is_active: m.active ?? true,
      }));
    },
    staleTime: 60000,
  });
}

/**
 * 2. CATALOGUE DE LA BOUTIQUE (table 'products')
 * Récupère les articles disponibles depuis Supabase avec réactivité temps réel
 */
export function useProducts() {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_products_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          qc.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    const handler = (e: any) => {
      const t = String(e?.detail?.table || '').toLowerCase();
      if (!e?.detail || t.includes('product') || t.includes('products')) {
        qc.invalidateQueries({ queryKey: ['products'] });
      }
    };
    window.addEventListener('brm-db-change', handler);
    window.addEventListener('brm-product-change', handler);
    window.addEventListener('storage', handler);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('brm-db-change', handler);
      window.removeEventListener('brm-product-change', handler);
      window.removeEventListener('storage', handler);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0,
            image_url: p.image_url,
            category: p.category || 'Bien-être',
            is_available: true,
            created_at: p.created_at,
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture products, repli local:', err);
      }

      // Repli gracieux
      const list = await base44.entities.Product.list('-created_date', 300);
      let mockList: any[] = [];
      try {
        const raw = localStorage.getItem('brm_store_products');
        if (raw) mockList = JSON.parse(raw);
      } catch {}
      const map = new Map<string, any>();
      (mockList || []).forEach((p: any) => {
        if (p && (p.id || p.name)) map.set(p.id || p.name, p);
      });
      (list || []).forEach((p: any) => {
        if (p && (p.id || p.name)) map.set(p.id || p.name, p);
      });
      return Array.from(map.values());
    },
    staleTime: 30000,
  });
}

/**
 * 3. GESTION DES RENDEZ-VOUS (table 'appointments')
 * Hook Client pour l'historique et le suivi de ses propres rendez-vous
 */
export function useAppointments(userId?: string, clientPhone?: string, clientEmail?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_appts_client_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('[Realtime] postgres_changes appointments:', payload);
          qc.invalidateQueries({ queryKey: ['appointments'] });
          qc.refetchQueries({ queryKey: ['appointments'] });
        }
      )
      .subscribe();

    const handleLocalDbChange = (e: any) => {
      if (!e.detail?.table || e.detail.table === 'appointments') {
        qc.invalidateQueries({ queryKey: ['appointments'] });
        qc.refetchQueries({ queryKey: ['appointments'] });
      }
    };

    window.addEventListener('brm-db-change', handleLocalDbChange);
    window.addEventListener('brm-mockstore-change', handleLocalDbChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('brm-db-change', handleLocalDbChange);
      window.removeEventListener('brm-mockstore-change', handleLocalDbChange);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['appointments', userId || clientPhone || clientEmail || 'all'],
    queryFn: async () => {
      const userPhone = clientPhone ? String(clientPhone).trim() : '';
      const userEmail = clientEmail ? String(clientEmail).trim() : '';

      try {
        let query = supabase.from('appointments').select('*');

        // Construction robuste du filtre
        const filters: string[] = [];
        if (userId && userId.length === 36) filters.push(`user_id.eq.${userId}`);
        if (userPhone?.trim()) filters.push(`client_phone.eq.${userPhone.trim()}`);
        if (userEmail?.trim()) filters.push(`client_email.eq.${userEmail.trim()}`);

        if (filters.length > 0) {
          query = query.or(filters.join(','));
        }

        const { data, error } = await query
          .order('appointment_date', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((a) => {
            const rawDate = a.date || a.appointment_date || a.created_at;
            const apptDate = a.appointment_date || (rawDate && rawDate.includes('T') ? rawDate.split('T')[0] : rawDate);
            const apptTime = a.appointment_time || a.time || (rawDate && rawDate.includes('T') ? rawDate.split('T')[1].slice(0, 5) : '09:30');
            const fullDate = a.date || (apptDate ? `${apptDate}T${apptTime}:00` : a.created_at);

            return {
              id: a.id,
              user_id: a.user_id,
              client_id: a.user_id,
              client_name: a.client_name,
              client_phone: a.client_phone,
              client_email: a.client_email,
              massage_name: a.service_title || a.massage_name || 'Soin Holistique',
              service_title: a.service_title || a.massage_name || 'Soin Holistique',
              service_price: Number(a.service_price || a.price) || 15000,
              date: fullDate,
              appointment_date: apptDate,
              appointment_time: apptTime,
              status: a.status || 'pending',
              payment_status: a.payment_status || 'unpaid',
              notes: a.notes || '',
              pain_mapping: Array.isArray(a.pain_mapping) ? a.pain_mapping : [],
              created_at: a.created_at,
            };
          });
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture appointments client:', err);
      }

      // Fallback local mockStore / base44
      try {
        const localList = await mockStore.getAppointments(userId || clientPhone);
        if (Array.isArray(localList) && localList.length > 0) {
          return localList.map((a: any) => {
            const rawDate = a.date || a.appointment_date || a.created_at || new Date().toISOString();
            const apptDate = a.appointment_date || (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate);
            const apptTime = a.appointment_time || a.time || (rawDate.includes('T') ? rawDate.split('T')[1].slice(0, 5) : '09:30');
            const fullDate = a.date || `${apptDate}T${apptTime}:00`;

            return {
              id: a.id,
              user_id: a.user_id,
              client_id: a.user_id,
              client_name: a.client_name,
              client_phone: a.client_phone,
              client_email: a.client_email,
              massage_name: a.massage_name || a.service_title || 'Soin Holistique',
              service_title: a.service_title || a.massage_name || 'Soin Holistique',
              service_price: Number(a.service_price || a.price) || 15000,
              date: fullDate,
              appointment_date: apptDate,
              appointment_time: apptTime,
              status: a.status || 'pending',
              payment_status: a.payment_status || 'unpaid',
              notes: a.notes || '',
              pain_mapping: Array.isArray(a.pain_mapping) ? a.pain_mapping : [],
              created_at: a.created_at,
            };
          });
        }
      } catch {}

      return [];
    },
    staleTime: 2000,
  });
}

/**
 * 4. VUE SECRÉTARIAT / COCKPIT (table 'appointments')
 * Récupère tous les rendez-vous en direct avec Realtime
 */
export function useSecretaryAppointments() {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_appts_sec_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
          qc.invalidateQueries({ queryKey: ['appointments'] });
        }
      )
      .subscribe();

    const handleLocalDbChange = (e: any) => {
      if (!e.detail?.table || e.detail.table === 'appointments') {
        qc.invalidateQueries({ queryKey: ['secretary-appointments'] });
        qc.invalidateQueries({ queryKey: ['appointments'] });
      }
    };

    window.addEventListener('brm-db-change', handleLocalDbChange);
    window.addEventListener('brm-mockstore-change', handleLocalDbChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('brm-db-change', handleLocalDbChange);
      window.removeEventListener('brm-mockstore-change', handleLocalDbChange);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['secretary-appointments'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((a) => {
            const rawDate = a.date || a.appointment_date || a.created_at;
            const apptDate = a.appointment_date || (rawDate && rawDate.includes('T') ? rawDate.split('T')[0] : rawDate);
            const apptTime = a.appointment_time || a.time || (rawDate && rawDate.includes('T') ? rawDate.split('T')[1].slice(0, 5) : '09:30');
            const fullDate = a.date || (apptDate ? `${apptDate}T${apptTime}:00` : a.created_at);

            return {
              id: a.id,
              user_id: a.user_id,
              client_id: a.user_id,
              client_name: a.client_name,
              client_phone: a.client_phone,
              client_email: a.client_email,
              massage_name: a.service_title || a.massage_name || 'Soin Holistique',
              service_title: a.service_title || a.massage_name || 'Soin Holistique',
              service_price: Number(a.service_price || a.price) || 15000,
              date: fullDate,
              appointment_date: apptDate,
              appointment_time: apptTime,
              status: a.status || 'pending',
              payment_status: a.payment_status || 'unpaid',
              notes: a.notes || '',
              pain_mapping: Array.isArray(a.pain_mapping) ? a.pain_mapping : [],
              created_at: a.created_at,
            };
          });
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture secretary appointments:', err);
      }

      // Fallback local mockStore
      try {
        const localList = await mockStore.getTable('appointments');
        if (Array.isArray(localList) && localList.length > 0) {
          return localList.map((a: any) => {
            const rawDate = a.date || a.appointment_date || a.created_at || new Date().toISOString();
            const apptDate = a.appointment_date || (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate);
            const apptTime = a.appointment_time || a.time || (rawDate.includes('T') ? rawDate.split('T')[1].slice(0, 5) : '09:30');
            const fullDate = a.date || `${apptDate}T${apptTime}:00`;

            return {
              id: a.id,
              user_id: a.user_id,
              client_id: a.user_id,
              client_name: a.client_name,
              client_phone: a.client_phone,
              client_email: a.client_email,
              massage_name: a.massage_name || a.service_title || 'Soin Holistique',
              service_title: a.service_title || a.massage_name || 'Soin Holistique',
              service_price: Number(a.service_price || a.price) || 15000,
              date: fullDate,
              appointment_date: apptDate,
              appointment_time: apptTime,
              status: a.status || 'pending',
              payment_status: a.payment_status || 'unpaid',
              notes: a.notes || '',
              pain_mapping: Array.isArray(a.pain_mapping) ? a.pain_mapping : [],
              created_at: a.created_at,
            };
          });
        }
      } catch {}

      return [];
    },
    staleTime: 2000,
  });
}

/**
 * 5. COMMANDES CLIENT (table 'orders')
 */
export function useClientOrders(userId?: string, clientPhone?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_orders_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          qc.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['orders', userId || clientPhone || 'guest'],
    queryFn: async () => {
      try {
        let query = supabase.from('orders').select('*');
        if (userId) {
          query = query.eq('user_id', userId);
        } else if (clientPhone) {
          query = query.eq('client_phone', clientPhone);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((o) => ({
            id: o.id,
            client_name: o.client_name,
            client_phone: o.client_phone,
            client_email: (o as any).client_email,
            total: Number(o.total_price) || 0,
            total_price: Number(o.total_price) || 0,
            status: o.status,
            payment_method: o.payment_method,
            momo_transaction_id: o.momo_transaction_id,
            transaction_ref: o.momo_transaction_id,
            items: Array.isArray(o.items) ? o.items : [],
            created_at: o.created_at,
            created_date: o.created_at,
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture orders:', err);
      }

      return [];
    },
    staleTime: 5000,
  });
}

/**
 * 6. FACTURES CLIENT & STAFF (table 'invoices')
 */
export function useClientInvoices(userId?: string, clientPhone?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_invoices_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          qc.invalidateQueries({ queryKey: ['invoices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['invoices', userId || clientPhone || 'guest'],
    queryFn: async () => {
      try {
        let query = supabase.from('invoices').select('*');
        if (clientPhone) {
          query = query.eq('client_phone', clientPhone);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((inv) => ({
            id: inv.id,
            order_id: inv.order_id,
            client_name: inv.client_name,
            client_phone: inv.client_phone,
            total: Number(inv.total_price) || 0,
            total_price: Number(inv.total_price) || 0,
            status: 'confirmed',
            pdf_url: inv.pdf_url,
            created_at: inv.created_at,
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture client invoices:', err);
      }

      return [];
    },
    staleTime: 5000,
  });
}

export function useStaffInvoices() {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `realtime_staff_invoices_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          qc.invalidateQueries({ queryKey: ['staff-invoices'] });
          qc.invalidateQueries({ queryKey: ['invoices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['staff-invoices'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((inv) => ({
            id: inv.id,
            order_id: inv.order_id,
            client_name: inv.client_name,
            client_phone: inv.client_phone,
            total: Number(inv.total_price) || 0,
            total_price: Number(inv.total_price) || 0,
            status: 'confirmed',
            pdf_url: inv.pdf_url,
            created_at: inv.created_at,
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Erreur lecture staff invoices:', err);
      }

      return base44.entities.Invoice.list('-created_date', 500);
    },
    staleTime: 5000,
  });
}

export function useVideos() {
  const qc = useQueryClient();
  useEffect(() => {
    const channelName = `realtime_media_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media' },
        () => {
          qc.invalidateQueries({ queryKey: ['videos'] });
        }
      )
      .subscribe();

    const handler = (e: any) => {
      if (e?.detail?.table?.includes('Video') || e?.detail?.table?.includes('media')) {
        qc.invalidateQueries({ queryKey: ['videos'] });
      }
    };
    window.addEventListener('brm-db-change', handler);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('brm-db-change', handler);
    };
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch {}

      return base44.entities.Video.list('-created_date', 200);
    },
    staleTime: 120000,
  });
}

export function useAnnouncements() {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.table?.includes('Announcement')) {
        qc.invalidateQueries({ queryKey: ['announcements'] });
      }
    };
    window.addEventListener('brm-db-change', handler);
    return () => window.removeEventListener('brm-db-change', handler);
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      return base44.entities.Announcement.list('-created_date', 100);
    },
    staleTime: 60000,
  });
}

export function useAnamneses() {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.table?.includes('Anamnesis')) {
        qc.invalidateQueries({ queryKey: ['anamneses'] });
      }
    };
    window.addEventListener('brm-db-change', handler);
    return () => window.removeEventListener('brm-db-change', handler);
  }, [qc]);

  return useCachedQuery<any[]>({
    queryKey: ['anamneses'],
    queryFn: async () => {
      return base44.entities.Anamnesis.filter({ active: true }, 'order', 50);
    },
    staleTime: 120000,
  });
}

export function useStaffUser() {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['auth-user'] });
    };
    window.addEventListener('brm-auth', handler);
    return () => window.removeEventListener('brm-auth', handler);
  }, [qc]);

  return useCachedQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      return base44.auth.me();
    },
    staleTime: 60000,
  });
}
