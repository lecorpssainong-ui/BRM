/**
 * BÉNIN RÉFLEXOLOGIE MASSAGE — MOCK DATA STORE UNIQUE & RÉACTIF
 * Couche d'abstraction locale haute fidélité (Zero External Database Dependency)
 * 
 * Fonctionnalités :
 * 1. État local réactif persisté dans localStorage avec listeners d'événements
 * 2. Données de démonstration riches (Massages en FCFA, Produits, Vidéos, Anamnèse, Settings)
 * 3. Méthodes asynchrones imitant les opérations BDD (CRUD, filtrage, pagination)
 * 4. Hook React `useMockStore` pour réactivité instantanée dans les composants
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_PREFIX = 'brm_mock_';

// ============================================================================
// 1. DONNÉES DE DÉMONSTRATION COMPLÈTES (SEED DATA)
// ============================================================================

export const SEED_APP_SETTINGS = {
  id: 'settings_default',
  center_name: 'Bénin Réflexologie Massage',
  center_city: 'Cotonou',
  center_landmark: 'Haie Vive, près de l\'Aéroport International Cardinal Bernardin Gantin',
  address: 'Rue 340, Haie Vive, Cotonou, Bénin',
  center_map_url: 'https://maps.google.com/?q=6.3535,2.4045',
  center_phone: '0191729117',
  whatsapp: '+229 01 91 72 91 17',
  center_email: 'contact@benin-reflexologie.bj',
  center_owner_name: 'Fatoumbi Adedodja Rébecca',
  center_momo_number: '0191729117',
  opening_hours: 'Lundi au Samedi : 08h00 - 20h00 • Dimanche sur rendez-vous',
  welcome_message: 'Bienvenue au sanctuaire de régénération et d\'équilibre corporel au cœur de Cotonou.',
  logo_url: '',
  app_active: true,
  app_opened: true,
  master_access_code: 'Acces',
  client_unblock_code: 'Accepter',
  closed_message: 'Nous réalisons des travaux d\'aménagement pour mieux vous accueillir. À très bientôt.',
  theme: 'cacao',
  // BottomNav configuration temps réel
  nav_bottom: 16,
  nav_side: 12,
  nav_offset_x: 0,
  nav_offset_y: 16,
  nav_width: 92,
  nav_padding_y: 12,
  nav_border_radius: 24,
  nav_elevation: 30,
  // Header configuration
  header_title: 'Bénin Réflexologie',
  header_align: 'right',
  header_show_conseiller: true,
  header_show_commandes: true,
  header_show_pro: true,
  hero_image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80',
  hero_eyebrow: 'Sanctuaire de Bien-être & Réflexologie',
  hero_title: 'L\'art du toucher',
  hero_title_em: 'qui libère et régénère.',
  home_sections: ['hero', 'bridges', 'massages', 'videos', 'center', 'momo'],
  pwa_logo_url: '',
  pwa_logo_type: 'image/png',
  pwa_logo_updated_at: null,
  pwa_logo_history: [],
  // Conseiller IA
  ai_name: 'Rébecca la lionne',
  ai_tone: 'chaleureux',
  ai_greeting: 'Bonjour, je suis Rébecca la lionne, conseillère bien-être du centre. Quel inconfort, tension ou besoin ressentez-vous aujourd\'hui ?',
  ai_instructions: 'Écouter avec bienveillance, conseiller les massages du centre, ne poser aucun diagnostic médical.',
  ai_topics: [
    'J\'ai mal au bas du dos et aux lombaires',
    'Je dors mal et ressens un grand stress',
    'J\'ai les jambes lourdes et chevilles gonflées',
    'Tensions au niveau de la nuque et des trapèzes'
  ],
  ai_rules: [
    'Ne jamais poser de diagnostic médical ni prescrire de médicament.',
    'Conseiller de consulter un médecin en cas de douleur aiguë ou fièvre.',
    'Proposer les soins et produits existants du centre avec bienveillance.'
  ],
  ai_allow_booking: true,
  ai_allow_shop: true,
  ai_suggestion_mode: 'auto',
  ai_fixed_suggestions: [],
  ai_mode: 'standard',
  ai_power: 7,
  // Factures & Paiement Mobile Money
  momo_number: '0191729117',
  momo_name: 'Bénin Réflexologie Massage',
  loyalty_percent: 15,
  loyalty_threshold: 10,
  invoice_title: 'FACTURE OFFICIELLE',
  invoice_accent: '#b8864b',
  invoice_show_logo: true,
  invoice_show_address: true,
  invoice_show_landmark: true,
  invoice_show_contact: true,
  invoice_show_hours: true,
  invoice_show_number: true,
  invoice_show_issued_by: true,
  invoice_show_discounts: true,
  invoice_footer: 'Merci de votre confiance. Prenez grand soin de votre énergie vitale.',
  invoice_note: 'Dispensé de TVA sous le régime des centres de soins de bien-être.'
};

export const SEED_SERVICES = [];

export const SEED_PRODUCTS = [];

export const SEED_VIDEOS = [];

export const SEED_ANNOUNCEMENTS = [];

export const SEED_ANAMNESIS = {
  id: 'anam_default',
  name: 'Bilan Vitalité & Zones Réflexes',
  description: 'Questionnaire préalable pour personnaliser votre séance et identifier vos zones de tension prioritaires.',
  image_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80',
  password: '',
  welcome_message: 'Bienvenue dans votre bilan de réflexologie. Prenons ensemble quelques instants pour faire le point sur votre équilibre.',
  order: 1,
  active: true,
};

export const SEED_ROOT_MODERATOR = null;

// --- PROTOCOLES D'ANAMNÈSE PAR PATHOLOGIE (CLINIQUE BRM) ---
export const SEED_PATHOLOGY_PROTOCOLS = [
  {
    id: 'stress',
    title: 'Stress & Surcharge Mentale',
    subtitle: 'Nervosité, palpitations, tensions posturales et oppression',
    icon_name: 'Flame',
    color: 'from-amber-600 to-orange-700',
    symptomsList: [
      'Oppression thoracique et souffle court',
      'Tensions permanentes dans les trapèzes et la nuque',
      'Pensées incessantes et irritabilité',
      'Crispation des mâchoires (bruxisme)',
      "Perte d'appétit ou fringales émotionnelles",
    ],
    defaultZones: ['Trapèzes & Nuque', 'Plexus Solaire', 'Crâne & Tempes'],
    recommendedMassage: 'Réflexologie Palmaire & Massage Crânien (45 min)',
    role: 'Apaisement immédiat du système nerveux central et relâchement oculaire',
    order: 1,
  },
  {
    id: 'sleep',
    title: 'Insomnie & Sommeil Agité',
    subtitle: 'Endormissement difficile, réveils nocturnes et fatigue matinale',
    icon_name: 'Moon',
    color: 'from-indigo-600 to-purple-800',
    symptomsList: [
      'Plus de 45 minutes pour trouver le sommeil',
      'Réveils nocturnes fréquents entre 3h et 5h du matin',
      'Sensation de fatigue intense dès le réveil',
      'Cauchemars ou sommeil agité',
      'Agitation des jambes au coucher',
    ],
    defaultZones: ['Voûte Plantaire (Zone Épiphyse)', 'Nuque', 'Pieds & Chevilles'],
    recommendedMassage: 'Réflexologie Plantaire Thérapeutique (60 min)',
    role: 'Harmonisation neuro-végétative et réactivation des cycles de mélatonine',
    order: 2,
  },
  {
    id: 'back',
    title: 'Douleurs Lombaires & Articulaires',
    subtitle: 'Bas du dos bloqué, sciatique, raideurs et courbatures',
    icon_name: 'Activity',
    color: 'from-emerald-700 to-teal-900',
    symptomsList: [
      'Douleur sourde ou élancement dans le bas du dos',
      'Irradiation dans la fesse ou la jambe (nerf sciatique)',
      'Difficulté à se pencher ou se redresser le matin',
      'Raideurs au niveau des épaules et du bassin',
      'Douleurs accentuées par la posture assise prolongée',
    ],
    defaultZones: ['Lombaires (Bas du dos)', 'Hanches & Fessiers', 'Colonne Vertébrale'],
    recommendedMassage: 'Massage Suédois Relaxant & Décontractant (75 min)',
    role: 'Dénouement des nœuds myo-fasciaux, oxygénation et libération articulaire',
    order: 3,
  },
  {
    id: 'digest',
    title: 'Troubles Digestifs & Viscéraux',
    subtitle: 'Ballonnements, spasmes intestinaux, transit ralenti et stress au ventre',
    icon_name: 'Compass',
    color: 'from-amber-700 to-yellow-800',
    symptomsList: [
      'Ventre gonflé ou douloureux après chaque repas',
      'Transit irrégulier ou paresse intestinale',
      "Nœud permanent logé au creux de l'estomac",
      'Digestion lourde et reflux gastriques',
      'Respiration bloquée dans le haut du thorax',
    ],
    defaultZones: ['Abdomen (Autour du nombril)', 'Plexus Solaire', 'Zones Réflexes Digestives du Pied'],
    recommendedMassage: 'Massage Abdominal Énergétique Chi Nei Tsang (60 min)',
    role: 'Détoxification des viscères, libération émotionnelle et relance du péristaltisme',
    order: 4,
  },
  {
    id: 'fatigue',
    title: 'Fatigue Chronique & Épuisement',
    subtitle: 'Baisse d\'immunité, sensation de corps lourd et manque de tonus',
    icon_name: 'Zap',
    color: 'from-rose-700 to-red-900',
    symptomsList: [
      'Épuisement physique persistant malgré le repos',
      'Baisse de concentration et mémoire embrumée',
      'Sensibilité accrue aux maux de tête et rhumes',
      'Courbatures diffuses dans l\'ensemble du corps',
      'Manque d\'entrain et de motivation globale',
    ],
    defaultZones: ['Plante des Pieds (Zone Reins/Surrénales)', 'Colonne Vertébrale', 'Crâne'],
    recommendedMassage: 'Réflexologie Plantaire Thérapeutique (60 min)',
    role: 'Stimulation des glandes surrénales et recharge de l\'énergie vitale',
    order: 5,
  },
  {
    id: 'circul',
    title: 'Mauvaise Circulation & Jambes Lourdes',
    subtitle: 'Chevilles gonflées, rétention d\'eau et engourdissements',
    icon_name: 'HeartPulse',
    color: 'from-cyan-700 to-blue-900',
    symptomsList: [
      'Pieds et chevilles gonflés en fin d\'après-midi',
      'Sensation de pesanteur et picotements dans les mollets',
      'Extrémités (mains et pieds) souvent froides',
      'Traces visibles de chaussettes ou chaussures serrées',
      'Engourdissements fréquents en position immobile',
    ],
    defaultZones: ['Mollets & Tibias', 'Chevilles & Tendons d\'Achille', 'Plante des Pieds'],
    recommendedMassage: 'Drainage Lymphatique Méthode Douce (75 min)',
    role: 'Désengorgement des membres inférieurs, activation du retour veineux et purification',
    order: 6,
  },
];

// ============================================================================
// 2. MOTEUR DU MOCK DATA STORE (LOCALSTORAGE + EVENT REACTIVITY)
// ============================================================================

class MockDataStore {
  constructor() {
    this.init();
  }

  init() {
    // Purge de nettoyage initial (Clean slate de production intégrale)
    try {
      const cleanKey = 'brm_clean_slate_v5_final';
      if (!localStorage.getItem(cleanKey)) {
        localStorage.removeItem(`${STORAGE_PREFIX}services`);
        localStorage.removeItem(`${STORAGE_PREFIX}products`);
        localStorage.removeItem(`${STORAGE_PREFIX}videos`);
        localStorage.removeItem(`${STORAGE_PREFIX}announcements`);
        localStorage.removeItem(`${STORAGE_PREFIX}video_comments`);
        localStorage.removeItem('brm_db_MassageType');
        localStorage.removeItem('brm_db_Product');
        localStorage.removeItem('brm_db_Video');
        localStorage.removeItem('brm_db_Announcement');
        localStorage.removeItem('brm_db_VideoComment');
        localStorage.setItem(cleanKey, 'true');
      }
    } catch {
      // ignore
    }

    // Initialisation intelligente des tables si absentes
    this.ensureTable('services', SEED_SERVICES);
    this.ensureTable('products', SEED_PRODUCTS);
    this.ensureTable('videos', SEED_VIDEOS);
    this.ensureTable('app_settings', [SEED_APP_SETTINGS]);
    this.ensureTable('announcements', SEED_ANNOUNCEMENTS);
    this.ensureTable('anamnesis', [SEED_ANAMNESIS]);
    this.ensureTable('anamnesis_protocols', SEED_PATHOLOGY_PROTOCOLS);
    this.ensureTable('anamnesis_entries', []);
    this.ensureTable('health_reports', []);
    this.ensureTable('appointments', []);
    this.ensureTable('chat_messages', []);
    this.ensureTable('orders', []);
    this.ensureTable('invoices', []);
    this.ensureTable('clients', []);
    this.ensureTable('activity_logs', []);
  }

  ensureTable(tableName, defaultData) {
    const key = `${STORAGE_PREFIX}${tableName}`;
    try {
      const existing = localStorage.getItem(key);
      if (!existing) {
        localStorage.setItem(key, JSON.stringify(defaultData));
      }
    } catch (e) {
      console.warn(`[MockStore] Inaccessible localStorage for ${tableName}:`, e);
    }
  }

  getTable(tableName) {
    const key = `${STORAGE_PREFIX}${tableName}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  setTable(tableName, data) {
    const key = `${STORAGE_PREFIX}${tableName}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notify(tableName);
    } catch (e) {
      console.warn(`[MockStore] Error writing ${tableName}:`, e);
    }
  }

  notify(tableName) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('brm-mockstore-change', {
          detail: { table: tableName, timestamp: Date.now() },
        })
      );
      // Synchronisation universelle avec les observateurs de queries.ts
      const tableMap = {
        services: 'MassageType',
        products: 'Product',
        videos: 'Video',
        app_settings: 'AppSettings',
        announcements: 'Announcement',
        appointments: 'Appointment',
        chat_messages: 'Message',
      };
      const entityName = tableMap[tableName] || tableName;
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: entityName } }));

      // Synchronisation avec les événements de l'écosystème existant
      if (tableName === 'app_settings') {
        window.dispatchEvent(new Event('brm-settings-update'));
      }
      if (tableName === 'chat_messages') {
        window.dispatchEvent(new Event('brm-chat-update'));
      }
      if (tableName === 'appointments') {
        window.dispatchEvent(new Event('brm-appointment-update'));
      }
    }
  }

  // ==========================================================================
  // 3. MÉTHODES ASYNCHRONES DE CONSULTATION ET MUTATION (BDD-LIKE)
  // ==========================================================================

  // --- SOINS & MASSAGES ---
  async getServices() {
    return [...this.getTable('services')];
  }

  async getServiceById(id) {
    const services = this.getTable('services');
    return services.find((s) => s.id === id) || null;
  }

  async saveService(serviceData) {
    const services = this.getTable('services');
    let saved;
    if (serviceData.id) {
      const idx = services.findIndex((s) => s.id === serviceData.id);
      if (idx !== -1) {
        saved = { ...services[idx], ...serviceData, updated_at: new Date().toISOString() };
        services[idx] = saved;
      } else {
        saved = { ...serviceData, id: serviceData.id || crypto.randomUUID(), created_at: new Date().toISOString() };
        services.unshift(saved);
      }
    } else {
      saved = { ...serviceData, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      services.unshift(saved);
    }
    this.setTable('services', services);

    // Sync Base44 MassageType table storage
    try {
      const raw = localStorage.getItem('brm_db_MassageType');
      let baseList = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(baseList)) baseList = [];
      const bIdx = baseList.findIndex((s) => s.id === saved.id);
      if (bIdx !== -1) {
        baseList[bIdx] = { ...baseList[bIdx], ...saved };
      } else {
        baseList.unshift(saved);
      }
      localStorage.setItem('brm_db_MassageType', JSON.stringify(baseList));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'MassageType' } }));
      window.dispatchEvent(new CustomEvent('brm-service-change', { detail: saved }));
      window.dispatchEvent(new CustomEvent('brm-mockstore-change', { detail: { table: 'services' } }));
    }
    return saved;
  }

  async deleteService(id) {
    const services = this.getTable('services').filter((s) => s.id !== id);
    this.setTable('services', services);
    try {
      const raw = localStorage.getItem('brm_db_MassageType');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          localStorage.setItem('brm_db_MassageType', JSON.stringify(list.filter((s) => s.id !== id)));
          window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'MassageType' } }));
        }
      }
    } catch {}
    return true;
  }

  // --- PRODUITS & HUILES ---
  async getProducts() {
    return [...this.getTable('products')];
  }

  async getProductById(id) {
    const products = this.getTable('products');
    return products.find((p) => p.id === id) || null;
  }

  async getProductCategories() {
    const products = this.getTable('products');
    const customCats = this.getTable('product_categories');
    let dbProducts = [];
    try {
      const raw = localStorage.getItem('brm_db_Product');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) dbProducts = parsed;
      }
    } catch {}

    const set = new Set([
      'all',
      ...products.map((p) => p.category?.trim()).filter(Boolean),
      ...dbProducts.map((p) => p.category?.trim()).filter(Boolean),
      ...customCats.map((c) => (typeof c === 'string' ? c : c?.name)?.trim()).filter(Boolean),
    ]);
    return Array.from(set);
  }

  async saveProductCategory(categoryName) {
    if (!categoryName || typeof categoryName !== 'string') return;
    const name = categoryName.trim();
    if (!name || name.toLowerCase() === 'all') return;
    const customCats = this.getTable('product_categories');
    if (!customCats.some((c) => (typeof c === 'string' ? c : c?.name)?.toLowerCase() === name.toLowerCase())) {
      customCats.push({ id: crypto.randomUUID(), name, created_at: new Date().toISOString() });
      this.setTable('product_categories', customCats);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-product-change', { detail: { categoryAdded: name } }));
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Product' } }));
    }
  }

  async deleteCategory(categoryName) {
    if (!categoryName || categoryName === 'all') return false;
    const name = categoryName.trim();

    // 1. Delete all products belonging to this category
    const products = this.getTable('products').filter(
      (p) => (p.category || '').trim().toLowerCase() !== name.toLowerCase()
    );
    this.setTable('products', products);

    // 2. Remove category from custom categories list
    const customCats = this.getTable('product_categories').filter(
      (c) => (typeof c === 'string' ? c : c?.name)?.trim().toLowerCase() !== name.toLowerCase()
    );
    this.setTable('product_categories', customCats);

    // 3. Clean up base44 table
    try {
      const raw = localStorage.getItem('brm_db_Product');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.filter((p) => (p.category || '').trim().toLowerCase() !== name.toLowerCase());
          localStorage.setItem('brm_db_Product', JSON.stringify(updated));
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Product' } }));
      window.dispatchEvent(new CustomEvent('brm-product-change', { detail: { categoryDeleted: name } }));
      window.dispatchEvent(new CustomEvent('brm-mockstore-change', { detail: { table: 'products' } }));
    }
    return true;
  }

  async saveProduct(productData) {
    const products = this.getTable('products');
    let saved;
    const finalData = {
      ...productData,
      price: Number(productData.price || 0),
      original_price: productData.original_price ? Number(productData.original_price) : undefined,
      stock: productData.stock !== undefined ? Number(productData.stock) : 10,
      active: productData.active !== undefined ? Boolean(productData.active) : true,
      category: (productData.category || 'Huiles & Soins').trim(),
    };

    if (finalData.category) {
      this.saveProductCategory(finalData.category);
    }

    if (finalData.id) {
      const idx = products.findIndex((p) => p.id === finalData.id);
      if (idx !== -1) {
        saved = { ...products[idx], ...finalData, updated_at: new Date().toISOString() };
        products[idx] = saved;
      } else {
        saved = { ...finalData, id: finalData.id || crypto.randomUUID(), created_at: new Date().toISOString() };
        products.unshift(saved);
      }
    } else {
      saved = { ...finalData, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      products.unshift(saved);
    }
    this.setTable('products', products);

    // Sync Base44 table storage
    try {
      const raw = localStorage.getItem('brm_db_Product');
      let baseList = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(baseList)) baseList = [];
      const bIdx = baseList.findIndex((p) => p.id === saved.id);
      if (bIdx !== -1) {
        baseList[bIdx] = { ...baseList[bIdx], ...saved };
      } else {
        baseList.unshift(saved);
      }
      localStorage.setItem('brm_db_Product', JSON.stringify(baseList));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Product' } }));
      window.dispatchEvent(new CustomEvent('brm-product-change', { detail: saved }));
    }
    return saved;
  }

  async deleteProduct(id) {
    const products = this.getTable('products').filter((p) => p.id !== id);
    this.setTable('products', products);
    try {
      const raw = localStorage.getItem('brm_db_Product');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          localStorage.setItem('brm_db_Product', JSON.stringify(list.filter((p) => p.id !== id)));
        }
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Product' } }));
      window.dispatchEvent(new CustomEvent('brm-product-change', { detail: { id, deleted: true } }));
    }
    return true;
  }

  // --- VIDÉOS TIKTOK & PLAYLISTS ---
  async getVideos() {
    return [...this.getTable('videos')];
  }

  async getVideoPlaylists() {
    const videos = this.getTable('videos');
    const playlists = [...new Set(videos.map((v) => v.playlist).filter(Boolean))];
    return playlists;
  }

  async deletePlaylist(playlistName) {
    if (!playlistName || playlistName === 'all') return false;
    const videos = this.getTable('videos').map((v) =>
      v.playlist === playlistName ? { ...v, playlist: '' } : v
    );
    this.setTable('videos', videos);
    try {
      const raw = localStorage.getItem('brm_db_Video');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map((v) => v.playlist === playlistName ? { ...v, playlist: '' } : v);
          localStorage.setItem('brm_db_Video', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Video' } }));
        }
      }
    } catch {}
    return true;
  }

  async saveVideo(videoData) {
    const videos = this.getTable('videos');
    let saved;
    const withComments = {
      comments_enabled: true,
      commentsEnabled: true,
      ...videoData,
    };
    if (withComments.id) {
      const idx = videos.findIndex((v) => v.id === withComments.id);
      if (idx !== -1) {
        saved = { ...videos[idx], ...withComments, updated_at: new Date().toISOString() };
        videos[idx] = saved;
      } else {
        saved = { ...withComments, id: withComments.id || crypto.randomUUID(), created_at: new Date().toISOString() };
        videos.unshift(saved);
      }
    } else {
      saved = { ...withComments, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      videos.unshift(saved);
    }
    this.setTable('videos', videos);

    // Sync Base44 Video table storage
    try {
      const raw = localStorage.getItem('brm_db_Video');
      let baseList = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(baseList)) baseList = [];
      const bIdx = baseList.findIndex((v) => v.id === saved.id);
      if (bIdx !== -1) {
        baseList[bIdx] = { ...baseList[bIdx], ...saved };
      } else {
        baseList.unshift(saved);
      }
      localStorage.setItem('brm_db_Video', JSON.stringify(baseList));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Video' } }));
      window.dispatchEvent(new CustomEvent('brm-video-change', { detail: saved }));
      window.dispatchEvent(new CustomEvent('brm-mockstore-change', { detail: { table: 'videos' } }));
    }
    return saved;
  }

  async deleteVideo(id) {
    const videos = this.getTable('videos').filter((v) => v.id !== id);
    this.setTable('videos', videos);
    try {
      const raw = localStorage.getItem('brm_db_Video');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          localStorage.setItem('brm_db_Video', JSON.stringify(list.filter((v) => v.id !== id)));
        }
      }
      // Also cleanup comments for this video
      const comments = this.getTable('video_comments').filter((c) => c.video_id !== id);
      this.setTable('video_comments', comments);
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Video' } }));
      window.dispatchEvent(new CustomEvent('brm-video-change', { detail: { id, deleted: true } }));
      window.dispatchEvent(new CustomEvent('brm-mockstore-change', { detail: { table: 'videos' } }));
    }
    return true;
  }

  // --- COMMENTAIRES VIDÉOS ---
  async getVideoComments(videoId) {
    const comments = this.getTable('video_comments');
    const filtered = videoId ? comments.filter((c) => c.video_id === videoId) : comments;
    const seen = new Set();
    return filtered.filter((c) => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  async addVideoComment(videoId, commentData) {
    const comments = this.getTable('video_comments');
    const newId = commentData.id || `comment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const newComment = {
      id: newId,
      video_id: videoId,
      author_name: commentData.author_name || 'Client BRM',
      author_role: commentData.author_role || 'client',
      content: commentData.content || '',
      created_at: new Date().toISOString(),
      likes: 0,
      reply_to_id: commentData.reply_to_id || null,
      reply_author: commentData.reply_author || null,
    };
    // Ensure no duplicate in array
    const deduped = comments.filter((c) => c.id !== newId);
    deduped.unshift(newComment);
    this.setTable('video_comments', deduped);
    return newComment;
  }

  async updateVideoComment(commentId, newContent) {
    const comments = this.getTable('video_comments');
    let updated = null;
    const list = comments.map((c) => {
      if (c.id === commentId) {
        updated = { ...c, content: newContent, updated_at: new Date().toISOString() };
        return updated;
      }
      return c;
    });
    this.setTable('video_comments', list);
    return updated;
  }

  async toggleVideoCommentLike(commentId, userId) {
    const comments = this.getTable('video_comments');
    let updatedComment = null;
    const list = comments.map((c) => {
      if (c.id === commentId) {
        const likedBy = Array.isArray(c.liked_by) ? [...c.liked_by] : [];
        const isLiked = likedBy.includes(userId);
        const newLikedBy = isLiked ? likedBy.filter((u) => u !== userId) : [...likedBy, userId];
        const newLikes = Math.max(0, (c.likes || 0) + (isLiked ? -1 : 1));
        updatedComment = { ...c, likes: newLikes, liked_by: newLikedBy };
        return updatedComment;
      }
      return c;
    });
    this.setTable('video_comments', list);
    return updatedComment;
  }

  async deleteVideoComment(commentId) {
    const comments = this.getTable('video_comments').filter((c) => c.id !== commentId);
    this.setTable('video_comments', comments);
    return true;
  }

  // --- ANNONCES & STATUTS ---
  async getAnnouncements() {
    return [...this.getTable('announcements')];
  }

  async saveAnnouncement(data) {
    const list = this.getTable('announcements');
    let saved;
    if (data.id) {
      const idx = list.findIndex((a) => a.id === data.id);
      if (idx !== -1) {
        saved = { ...list[idx], ...data, updated_at: new Date().toISOString() };
        list[idx] = saved;
      } else {
        saved = { ...data, id: data.id || crypto.randomUUID(), created_at: new Date().toISOString() };
        list.unshift(saved);
      }
    } else {
      saved = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      list.unshift(saved);
    }
    this.setTable('announcements', list);
    return saved;
  }

  async deleteAnnouncement(id) {
    const list = this.getTable('announcements').filter((a) => a.id !== id);
    this.setTable('announcements', list);
    try {
      const raw = localStorage.getItem('brm_db_Announcement');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localStorage.setItem('brm_db_Announcement', JSON.stringify(parsed.filter((a) => a.id !== id)));
          window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'Announcement' } }));
        }
      }
    } catch {}
    return true;
  }

  // --- ANAMNÈSE ---
  async getAnamnesis() {
    const list = this.getTable('anamnesis');
    return list[0] || SEED_ANAMNESIS;
  }

  // --- PROTOCOLES D'ANAMNÈSE PAR PATHOLOGIE ---
  async getAnamnesisProtocols() {
    const list = this.getTable('anamnesis_protocols');
    if (!list || list.length === 0) {
      this.setTable('anamnesis_protocols', SEED_PATHOLOGY_PROTOCOLS);
      return SEED_PATHOLOGY_PROTOCOLS;
    }
    return list;
  }

  async saveAnamnesisProtocol(protocol) {
    const list = this.getTable('anamnesis_protocols');
    const id = protocol.id || `patho-${Date.now()}`;
    const idx = list.findIndex((p) => p.id === id);
    const updated = { ...protocol, id };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    this.setTable('anamnesis_protocols', list);
    return updated;
  }

  async deleteAnamnesisProtocol(id) {
    const list = this.getTable('anamnesis_protocols');
    const filtered = list.filter((p) => p.id !== id);
    this.setTable('anamnesis_protocols', filtered);
    return true;
  }

  async saveAnamnesisEntry(entryData) {
    const entries = this.getTable('anamnesis_entries');
    const newEntry = {
      ...entryData,
      id: entryData.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    entries.unshift(newEntry);
    this.setTable('anamnesis_entries', entries);

    // 1. Notification In-App pour le Secrétariat (message instantané)
    try {
      const messages = this.getTable('chat_messages');
      messages.push({
        id: crypto.randomUUID(),
        client_key: newEntry.client_key || 'client_demo',
        client_name: newEntry.client_name,
        sender: 'client',
        text: `📋 [Nouveau Bilan Clinique Reçu]\n• Réf : ${newEntry.reference || 'BRM-ANAM'}\n• Patient(e) : ${newEntry.client_name}\n• Pathologie : ${newEntry.pathology}\n• Intensité : ${newEntry.intensity}/10\n• Zones : ${(newEntry.pain_zones || []).join(', ')}\n• Soin conseillé : ${newEntry.recommended_care}`,
        created_date: new Date().toISOString(),
        read: false,
      });
      this.setTable('chat_messages', messages);
    } catch (e) {
      console.warn('Erreur notification chat pour anamnèse:', e);
    }

    // 2. Journal d'activité interne
    try {
      const logs = this.getTable('activity_logs');
      logs.unshift({
        id: crypto.randomUUID(),
        action: 'anamnesis_completed',
        details: `Bilan clinique reçu pour ${newEntry.client_name} (${newEntry.pathology}) - Réf: ${newEntry.reference || newEntry.id}`,
        user_name: newEntry.client_name,
        user_role: 'client',
        created_at: new Date().toISOString(),
      });
      this.setTable('activity_logs', logs);
    } catch (e) {
      // ignore
    }

    // 3. Événement temps réel pour alerte sonore / toast in-app
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('brm-new-anamnesis', { detail: newEntry }));
      } catch (e) {
        // ignore
      }
    }

    return newEntry;
  }

  async getAnamnesisEntries(clientKey) {
    const entries = this.getTable('anamnesis_entries');
    if (clientKey) {
      return entries.filter((e) => e.client_key === clientKey);
    }
    return entries;
  }

  // --- RAPPORTS DE SANTÉ & HUB HOLISTIQUE ---
  async saveHealthReport(reportData) {
    const reports = this.getTable('health_reports');
    const newReport = {
      ...reportData,
      id: reportData.id || `hr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    reports.unshift(newReport);
    this.setTable('health_reports', reports);

    // Journal d'activité interne
    try {
      const logs = this.getTable('activity_logs');
      logs.unshift({
        id: crypto.randomUUID(),
        action: 'health_tool_evaluated',
        details: `Outil de santé évalué : ${newReport.tool_title || newReport.tool_id} par ${newReport.client_name || 'Client'} (Score: ${newReport.score_display || newReport.primary_score || 'OK'})`,
        user_name: newReport.client_name || 'Client',
        user_role: 'client',
        created_at: new Date().toISOString(),
      });
      this.setTable('activity_logs', logs);
    } catch (e) {
      // ignore
    }

    return newReport;
  }

  async getHealthReports(clientKey) {
    const reports = this.getTable('health_reports');
    if (clientKey) {
      return reports.filter((r) => r.client_key === clientKey);
    }
    return reports;
  }

  async deleteHealthReport(id) {
    const reports = this.getTable('health_reports');
    const filtered = reports.filter((r) => r.id !== id);
    this.setTable('health_reports', filtered);
    return true;
  }

  // --- PARAMÈTRES GLOBAUX & BOTTOMNAV ---
  async getAppSettings() {
    const settingsList = this.getTable('app_settings');
    const current = settingsList[0] || SEED_APP_SETTINGS;
    return { ...SEED_APP_SETTINGS, ...current };
  }

  async saveAppSettings(updates) {
    const settingsList = this.getTable('app_settings');
    const current = settingsList[0] || SEED_APP_SETTINGS;
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.setTable('app_settings', [updated]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: 'AppSettings' } }));
      window.dispatchEvent(new CustomEvent('brm-settings-change', { detail: updated }));
    }
    return updated;
  }

  async updateSettings(updates) {
    return this.saveAppSettings(updates);
  }

  // --- RENDEZ-VOUS ---
  async getAppointments(filter = {}) {
    let list = this.getTable('appointments');
    if (!filter) return list;
    if (typeof filter === 'string') {
      const term = filter.trim().toLowerCase();
      if (!term) return list;
      return list.filter((a) =>
        (a.user_id && a.user_id.toLowerCase() === term) ||
        (a.client_key && a.client_key.toLowerCase() === term) ||
        (a.client_phone && a.client_phone.includes(term)) ||
        (a.client_email && a.client_email.toLowerCase() === term)
      );
    }
    if (filter.client_key) {
      list = list.filter((a) => a.client_key === filter.client_key);
    }
    if (filter.user_id) {
      list = list.filter((a) => a.user_id === filter.user_id);
    }
    if (filter.client_phone) {
      list = list.filter((a) => a.client_phone === filter.client_phone);
    }
    if (filter.client_email) {
      list = list.filter((a) => a.client_email === filter.client_email);
    }
    if (filter.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    return list;
  }

  async saveAppointment(data) {
    const list = this.getTable('appointments');
    const newApp = {
      ...data,
      id: data.id || crypto.randomUUID(),
      status: data.status || 'pending',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    list.unshift(newApp);
    this.setTable('appointments', list);
    return newApp;
  }

  async updateAppointment(id, updates) {
    const list = this.getTable('appointments');
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_date: new Date().toISOString() };
      this.setTable('appointments', list);
      return list[idx];
    }
    return null;
  }

  async deleteAppointment(id) {
    const list = this.getTable('appointments').filter((a) => a.id !== id);
    this.setTable('appointments', list);
    return true;
  }

  // --- MESSAGES & CHAT ---
  async getChatHistory(clientKey) {
    const list = this.getTable('chat_messages');
    if (clientKey) {
      return list.filter((m) => m.client_key === clientKey);
    }
    return list;
  }

  async saveChatMessage(messageData) {
    const list = this.getTable('chat_messages');
    const newMsg = {
      ...messageData,
      id: messageData.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    list.push(newMsg);
    this.setTable('chat_messages', list);
    return newMsg;
  }

  async clearChatHistory(clientKey) {
    if (clientKey) {
      const list = this.getTable('chat_messages').filter((m) => m.client_key !== clientKey);
      this.setTable('chat_messages', list);
    } else {
      this.setTable('chat_messages', []);
    }
    return true;
  }

  // --- COMMANDES (SHOPPING CART & ORDERS) ---
  async getOrders(filter = {}) {
    let list = this.getTable('orders');
    if (filter.client_key) {
      list = list.filter((o) => o.client_key === filter.client_key);
    }
    return list;
  }

  async saveOrder(orderData) {
    const list = this.getTable('orders');
    const newOrder = {
      ...orderData,
      id: orderData.id || `ORD-${Date.now().toString().slice(-6)}`,
      status: orderData.status || 'pending',
      created_date: new Date().toISOString(),
    };
    list.unshift(newOrder);
    this.setTable('orders', list);
    return newOrder;
  }
}

// Instance Singleton
export const mockStore = new MockDataStore();

// ============================================================================
// 4. HOOK REACT RÉACTIF POUR LES COMPOSANTS
// ============================================================================

/**
 * Hook d'abonnement réactif aux modifications du MockStore
 * @param {string} tableName - Nom de la table ciblée ('services', 'app_settings', etc.)
 * @param {Function} fetcher - Fonction asynchrone pour extraire les données
 * @param {any} [initialData] - Données initiales facultatives (par défaut tableau vide ou contenu actuel de la table)
 */
export function useMockStore(tableName, fetcher, initialData) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState(() => {
    if (initialData !== undefined) return initialData;
    try {
      const tableData = mockStore.getTable(tableName);
      if (Array.isArray(tableData)) return tableData;
      return [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const result = await fetcherRef.current(mockStore);
        if (mounted) {
          setData(result !== null && result !== undefined ? result : []);
          setLoading(false);
        }
      } catch (err) {
        console.warn(`[useMockStore:${tableName}] Error:`, err);
        if (mounted) setLoading(false);
      }
    }

    loadData();

    const handler = (e) => {
      if (!e.detail?.table || e.detail.table === tableName) {
        loadData();
      }
    };

    window.addEventListener('brm-mockstore-change', handler);
    return () => {
      mounted = false;
      window.removeEventListener('brm-mockstore-change', handler);
    };
  }, [tableName]);

  const refetch = useCallback(() => {
    return fetcherRef.current(mockStore).then((res) => {
      const safe = res !== null && res !== undefined ? res : [];
      setData(safe);
      return safe;
    });
  }, []);

  const safeData = data !== null && data !== undefined ? data : [];

  return {
    data: safeData,
    loading,
    refetch,
  };
}

export default mockStore;
