/**
 * BÉNIN RÉFLEXOLOGIE MASSAGE — ABSTRACTION LOCALE DU CLIENT BDD (MOCK SUPABASE)
 * Étape 1 : Isolement BDD & Redirection 100% Locale vers mockStore.js
 * 
 * Ce fichier remplace la connexion externe Supabase par une couche d'émulation
 * locale haute performance, réactive et sans latence ni dépendance réseau.
 * Les signatures et structures de retour (Promise/JSON) sont rigoureusement préservées.
 */

import { mockStore } from './mockStore.js';
import { runWellnessAdvisor } from './wellnessAdvisor.js';
import { supabase } from './supabaseClient';
import { base44 } from '@/api/base44Client';

/**
 * Constructeur de requête chaînée émulant le Supabase Query Builder
 * Permet d'exécuter .from('table').select().eq().order().limit().maybeSingle()
 * directement sur les données en mémoire de mockStore.
 */
class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.action = 'select';
    this.selectedColumns = '*';
    this.filters = [];
    this.sortField = null;
    this.sortAscending = true;
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.payload = null;
  }

  select(columns = '*') {
    this.selectedColumns = columns;
    return this;
  }

  insert(data) {
    this.action = 'insert';
    this.payload = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  match(criteria = {}) {
    this.filters.push((item) => {
      for (const [key, val] of Object.entries(criteria)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
    return this;
  }

  order(column, options = { ascending: true }) {
    this.sortField = column;
    this.sortAscending = options.ascending !== false;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  /**
   * Exécution asynchrone (compatibilité PromiseLike & await)
   */
  async execute() {
    try {
      // Normalisation universelle du nom de la table
      let tableKey = this.tableName;
      if (tableKey === 'massages' || tableKey === 'services' || tableKey === 'massage_types' || tableKey === 'MassageType') tableKey = 'services';
      if (tableKey === 'products' || tableKey === 'Product') tableKey = 'products';
      if (tableKey === 'app_settings' || tableKey === 'AppSettings') tableKey = 'app_settings';
      if (tableKey === 'appointments' || tableKey === 'Appointment') tableKey = 'appointments';
      if (tableKey === 'chat_messages' || tableKey === 'Message' || tableKey === 'messages') tableKey = 'chat_messages';
      if (tableKey === 'videos' || tableKey === 'Video' || tableKey === 'tiktok_videos') tableKey = 'videos';
      if (tableKey === 'announcements' || tableKey === 'Announcement') tableKey = 'announcements';
      if (tableKey === 'video_comments' || tableKey === 'VideoComment') tableKey = 'video_comments';
      if (tableKey === 'profiles' || tableKey === 'User' || tableKey === 'Profile') tableKey = 'profiles';

      const tableContent = mockStore.getTable(tableKey);
      let items = Array.isArray(tableContent) ? [...tableContent] : [];

      // 1. ACTION INSERT
      if (this.action === 'insert') {
        const createdItems = [];
        const payloadList = Array.isArray(this.payload) ? this.payload : (this.payload ? [this.payload] : []);
        for (const row of payloadList) {
          const newRow = {
            ...row,
            id: row.id || crypto.randomUUID(),
            created_at: new Date().toISOString(),
          };
          items.unshift(newRow);
          createdItems.push(newRow);
        }
        mockStore.setTable(tableKey, items);
        return {
          data: this.isSingle ? createdItems[0] : createdItems,
          error: null,
        };
      }

      // 2. ACTION UPDATE
      if (this.action === 'update') {
        let updatedCount = 0;
        const updatedList = items.map((item) => {
          const match = this.filters.every((fn) => fn(item));
          if (match || this.filters.length === 0) {
            updatedCount++;
            return { ...item, ...this.payload, updated_at: new Date().toISOString() };
          }
          return item;
        });
        mockStore.setTable(tableKey, updatedList);
        return {
          data: updatedList,
          count: updatedCount,
          error: null,
        };
      }

      // 3. ACTION DELETE
      if (this.action === 'delete') {
        const remaining = items.filter((item) => !this.filters.every((fn) => fn(item)));
        mockStore.setTable(tableKey, remaining);
        try {
          const baseKeyMap = {
            services: 'MassageType',
            products: 'Product',
            videos: 'Video',
            announcements: 'Announcement',
            appointments: 'Appointment',
            chat_messages: 'Message',
            profiles: 'User',
            video_comments: 'VideoComment',
          };
          const bKey = baseKeyMap[tableKey];
          if (bKey) {
            localStorage.setItem(`brm_db_${bKey}`, JSON.stringify(remaining));
            window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: bKey } }));
          }
        } catch {
          // ignore
        }
        return { data: null, error: null };
      }

      // 4. ACTION SELECT
      let filtered = items;
      if (this.filters.length > 0) {
        filtered = filtered.filter((item) => this.filters.every((fn) => fn(item)));
      }

      if (this.sortField) {
        filtered.sort((a, b) => {
          const valA = a[this.sortField] ?? '';
          const valB = b[this.sortField] ?? '';
          if (valA < valB) return this.sortAscending ? -1 : 1;
          if (valA > valB) return this.sortAscending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount && this.limitCount > 0) {
        filtered = filtered.slice(0, this.limitCount);
      }

      let data = filtered;
      if (this.isSingle) {
        data = filtered[0] || null;
      } else if (this.isMaybeSingle) {
        data = filtered[0] || null;
      }

      return { data, error: null };
    } catch (err) {
      console.warn('[MockQueryBuilder] Execution error:', err);
      return { data: null, error: err };
    }
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.execute().catch(onrejected);
  }
}

/**
 * Émulateur temps réel des Canaux Supabase
 */
class MockChannel {
  constructor(name) {
    this.name = name;
    this.listeners = [];
  }

  on(event, filter, callback) {
    const cb = typeof filter === 'function' ? filter : callback;
    if (typeof cb === 'function') {
      const handler = (e) => {
        cb({ new: e.detail || {} });
      };
      this.listeners.push(handler);
      window.addEventListener('brm-mockstore-change', handler);
    }
    return this;
  }

  subscribe(statusCallback) {
    if (typeof statusCallback === 'function') {
      statusCallback('SUBSCRIBED');
    }
    return this;
  }

  unsubscribe() {
    this.listeners.forEach((h) => window.removeEventListener('brm-mockstore-change', h));
    this.listeners = [];
  }
}

/**
 * Client Supabase Officiel connecté à l'instance
 */
export { supabase };

/**
 * Récupère en temps réel la configuration complète de l'IA depuis le mockStore
 * @returns {Promise<object>}
 */
export async function fetchAiConfig() {
  const settings = await mockStore.getAppSettings();

  let localConfig = null;
  try {
    const rawLocal = localStorage.getItem('brm_local_ai_config');
    if (rawLocal) localConfig = JSON.parse(rawLocal);
  } catch (e) {
    // ignore
  }

  const dynamicName =
    localConfig?.persona?.ai_name ||
    localConfig?.ai_name ||
    settings?.ai_name ||
    'Rébecca la lionne';

  const defaultGreeting =
    localConfig?.persona?.greeting ||
    localConfig?.default_greeting ||
    settings?.ai_greeting ||
    `Bonjour, je suis ${dynamicName}, conseillère bien-être du centre. Quel inconfort, tension ou besoin ressentez-vous aujourd'hui ?`;

  return {
    ...settings,
    ...(localConfig || {}),
    ai_name: dynamicName,
    ai_tone: localConfig?.persona?.tone || settings?.ai_tone || 'chaleureux',
    ai_greeting: defaultGreeting,
    default_greeting: defaultGreeting,
    ai_topics: localConfig?.topics || settings?.ai_topics || [
      'J\'ai mal au bas du dos et aux lombaires',
      'Je dors mal et ressens un grand stress',
      'J\'ai les jambes lourdes et chevilles gonflées',
      'Tensions au niveau de la nuque et des trapèzes'
    ],
    memory_limit: Number(localConfig?.memory_limit || 6),
    max_discount_percent: Number(localConfig?.max_discount_percent ?? settings?.loyalty_percent ?? 15),
  };
}

/**
 * Interroge le conseiller bien-être holistique Gemini Flash avec le mockStore
 * @param {string} userQuery
 * @param {object} [options]
 */
export async function askGeminiAdvisor(userQuery, options = {}) {
  try {
    let aiConfig = options.ai_config || null;
    if (!aiConfig) {
      aiConfig = await fetchAiConfig();
    }

    return await runWellnessAdvisor({
      question: userQuery,
      history: options.history,
      client_key: options.client_key,
      ai_config: aiConfig,
    });
  } catch (error) {
    console.warn('[client.js:askGeminiAdvisor] Erreur appel conseiller :', error);
    throw error;
  }
}

/**
 * Écouteur en temps réel local pour les messages du chat
 * @param {string} clientKey
 * @param {Function} onMessageReceived
 * @returns {Function} Fonction de désinscription
 */
export function subscribeToChatMessages(clientKey, onMessageReceived) {
  if (!clientKey || typeof onMessageReceived !== 'function') {
    return () => {};
  }

  const handler = (e) => {
    if (e.detail?.table === 'chat_messages') {
      const messages = mockStore.getTable('chat_messages');
      const latest = messages
        .filter((m) => m.client_key === clientKey)
        .slice(-1)[0];
      if (latest) {
        onMessageReceived(latest);
      }
    }
  };

  window.addEventListener('brm-mockstore-change', handler);
  return () => {
    window.removeEventListener('brm-mockstore-change', handler);
  };
}

/**
 * Écouteur en temps réel pour la mise à jour des réglages généraux du centre
 * Notamment pour synchroniser les dimensions et styles du BottomNav ajustés depuis le Cockpit.
 * @param {Function} onSettingsUpdated
 * @returns {Function} Fonction de désinscription
 */
export function subscribeToAppSettings(onSettingsUpdated) {
  if (typeof onSettingsUpdated !== 'function') {
    return () => {};
  }

  const handler = async (e) => {
    if (!e.detail?.table || e.detail.table === 'app_settings') {
      const settings = await mockStore.getAppSettings();
      onSettingsUpdated(settings);
    }
  };

  window.addEventListener('brm-mockstore-change', handler);
  return () => {
    window.removeEventListener('brm-mockstore-change', handler);
  };
}

/**
 * Enregistrement officiel d'un rendez-vous dans la table Supabase 'appointments'
 * avec miroir local mockStore et notification en temps réel
 * @param {object} appointmentData
 * @returns {Promise<any>}
 */
export async function saveAppointmentToSupabase(appointmentData) {
  let supabaseResult = null;

  try {
    const rawDate = appointmentData.date || appointmentData.appointment_date || new Date().toISOString();
    const apptDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
    const apptTime =
      appointmentData.time ||
      appointmentData.appointment_time ||
      (rawDate.includes('T') ? rawDate.split('T')[1].slice(0, 5) : '09:30');

    const isValidUuid =
      typeof appointmentData.user_id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentData.user_id);

    const payload = {
      user_id: isValidUuid ? appointmentData.user_id : null,
      client_name: appointmentData.client_name || 'Client',
      client_phone: appointmentData.client_phone || '',
      client_email: appointmentData.client_email || null,
      service_title: appointmentData.massage_name || appointmentData.service_title || 'Soin Holistique',
      service_price: Number(appointmentData.service_price || appointmentData.price) || 15000,
      appointment_date: apptDate,
      appointment_time: apptTime,
      status: appointmentData.status || 'pending',
      payment_status: appointmentData.payment_status || 'unpaid',
      notes: appointmentData.notes || null,
      pain_mapping: Array.isArray(appointmentData.pain_mapping) ? appointmentData.pain_mapping : [],
    };

    const { data, error } = await supabase.from('appointments').insert(payload).select().maybeSingle();
    if (!error && data) {
      supabaseResult = data;
    } else if (error) {
      console.warn('[Supabase] Erreur insertion appointments:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Exception insertion appointments:', err);
  }

  // Miroir local Base44 et MockStore pour la synchronisation immédiate et hors ligne
  const apptId = supabaseResult?.id || appointmentData.id || `appt_${Date.now()}`;
  const rawDate = appointmentData.date || appointmentData.appointment_date || new Date().toISOString();
  const apptDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
  const apptTime =
    appointmentData.time ||
    appointmentData.appointment_time ||
    (rawDate.includes('T') ? rawDate.split('T')[1].slice(0, 5) : '09:30');
  const fullIsoDate = rawDate.includes('T') && rawDate.length > 10 ? rawDate : `${apptDate}T${apptTime}:00`;

  try {
    await base44.entities.Appointment.create({
      id: apptId,
      user_id: appointmentData.user_id || null,
      client_key: appointmentData.client_key || null,
      client_email: appointmentData.client_email || null,
      client_name: appointmentData.client_name || 'Client',
      client_phone: appointmentData.client_phone || '',
      service_title: appointmentData.massage_name || appointmentData.service_title || 'Soin Holistique',
      service_price: Number(appointmentData.service_price || appointmentData.price) || 15000,
      appointment_date: apptDate,
      appointment_time: apptTime,
      date: fullIsoDate,
      status: appointmentData.status || 'pending',
      notes: appointmentData.notes || null,
      pain_mapping: Array.isArray(appointmentData.pain_mapping) ? appointmentData.pain_mapping : [],
    });
  } catch (bErr) {
    console.warn('[Base44] Erreur miroir appointment:', bErr);
  }

  const localSaved = await mockStore.saveAppointment({
    id: apptId,
    user_id: appointmentData.user_id || null,
    client_email: appointmentData.client_email || null,
    client_key: appointmentData.client_key,
    client_name: appointmentData.client_name,
    client_phone: appointmentData.client_phone,
    massage_name: appointmentData.massage_name || appointmentData.service_title,
    service_title: appointmentData.massage_name || appointmentData.service_title,
    date: fullIsoDate,
    appointment_date: apptDate,
    appointment_time: apptTime,
    status: appointmentData.status || 'pending',
    notes: appointmentData.notes || null,
    pain_mapping: Array.isArray(appointmentData.pain_mapping) ? appointmentData.pain_mapping : [],
  });

  // Déclencher les événements d'invalidation pour rafraîchir toutes les vues (Client, Secrétariat, Modérateur)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'appointments' } }));
    window.dispatchEvent(new CustomEvent('brm-mockstore-change', { detail: { table: 'appointments' } }));
  }

  return supabaseResult || localSaved;
}

/**
 * Fonctions unifiées de suppression CRUD directe
 */
export async function deleteVideo(id) {
  return await mockStore.deleteVideo(id);
}

export async function deleteProduct(id) {
  return await mockStore.deleteProduct(id);
}

export async function deleteService(id) {
  return await mockStore.deleteService(id);
}

export async function deletePlaylist(playlistName) {
  return await mockStore.deletePlaylist(playlistName);
}

export async function deleteAnnouncement(id) {
  return await mockStore.deleteAnnouncement(id);
}

export default {
  supabase,
  mockStore,
  deleteVideo,
  deleteProduct,
  deleteService,
  deletePlaylist,
  deleteAnnouncement,
  fetchAiConfig,
  askGeminiAdvisor,
  subscribeToChatMessages,
  subscribeToAppSettings,
  saveAppointmentToSupabase,
};
