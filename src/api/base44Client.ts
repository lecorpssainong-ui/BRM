/**
 * Base44 Client SDK Implementation for Bénin Réflexologie Massage
 * Implements in-browser persistent database with real-time events,
 * CRUD operations, file storage simulations, and functions engine.
 */

export interface AppSettingsData {
  id?: string;
  center_name?: string;
  center_city?: string;
  center_landmark?: string;
  address?: string;
  center_map_url?: string;
  center_phone?: string;
  whatsapp?: string;
  center_email?: string;
  opening_hours?: string;
  welcome_message?: string;
  logo_url?: string;
  is_locked?: boolean;
  lock_message?: string;
  lock_password?: string;
  countdown_date?: string | null;
  countdown_message?: string;
  is_countdown_active?: boolean;
  app_active?: boolean;
  app_opened?: boolean;
  master_access_code?: string;
  client_unblock_code?: string;
  closed_message?: string;
  theme?: string;
  force_global_theme?: boolean;
  nav_bottom?: number;
  nav_side?: number;
  nav_offset_x?: number;
  nav_offset_y?: number;
  nav_width?: number | string;
  nav_padding_y?: number;
  nav_border_radius?: number;
  nav_elevation?: number;
  header_title?: string;
  header_align?: 'left' | 'center' | 'right';
  header_show_conseiller?: boolean;
  header_show_commandes?: boolean;
  header_show_pro?: boolean;
  hero_image_url?: string;
  hero_media_url?: string;
  hero_media_type?: 'image' | 'video';
  hero_eyebrow?: string;
  hero_title?: string;
  hero_title_em?: string;
  hero_highlight?: string;
  hero_subtitle?: string;
  hero_sections_order?: string[];
  home_sections?: string[];
  pwa_logo_url?: string;
  pwa_logo_type?: string;
  pwa_logo_updated_at?: string;
  pwa_logo_history?: Array<{ url: string; type?: string; updated_at?: string; size?: number; name?: string }>;
  msg_composer_height?: number;
  msg_composer_width?: number;
  msg_body_bg_color?: string;
  msg_body_bg_url?: string;
  msg_body_bg_opacity?: number;
  msg_bg_color?: string;
  msg_bg_url?: string;
  msg_bg_opacity?: number;
  msg_text_color?: string;
  msg_show_file?: boolean;
  msg_show_location?: boolean;
  msg_show_voice?: boolean;
  msg_voice_max?: number;
  msg_quick_replies?: string[];
  ai_name?: string;
  ai_system_config?: string;
  ai_tone?: string;
  ai_greeting?: string;
  ai_instructions?: string;
  ai_topics?: string[];
  ai_rules?: string[];
  ai_allow_booking?: boolean;
  ai_allow_shop?: boolean;
  ai_suggestion_mode?: 'auto' | 'fixed' | 'off';
  ai_fixed_suggestions?: string[];
  ai_faq?: Array<{ q: string; a: string; keywords?: string }>;
  ai_mode?: 'standard' | 'integration';
  ai_power?: number;
  messages_mode?: 'standard' | 'integration';
  messages_power?: number;
  upload_mode?: 'standard' | 'integration';
  upload_power?: number;
  announcements_mode?: 'standard' | 'integration';
  announcements_power?: number;
  image_mode?: 'standard' | 'integration';
  image_power?: number;
  invoice_title?: string;
  invoice_logo_url?: string;
  invoice_show_logo?: boolean;
  invoice_bg_url?: string;
  invoice_bg_opacity?: number;
  invoice_accent?: string;
  invoice_show_address?: boolean;
  invoice_show_landmark?: boolean;
  invoice_show_contact?: boolean;
  invoice_show_hours?: boolean;
  invoice_show_number?: boolean;
  invoice_show_issued_by?: boolean;
  invoice_show_discounts?: boolean;
  invoice_show_next?: boolean;
  invoice_show_notes?: boolean;
  invoice_footer?: string;
  invoice_note?: string;
  momo_number?: string;
  momo_name?: string;
  moov_number?: string;
  moov_name?: string;
  moov_ussd?: string;
  celtiis_number?: string;
  celtiis_name?: string;
  celtiis_ussd?: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_iban?: string;
  bank_swift?: string;
  loyalty_percent?: number;
  loyalty_threshold?: number;
  healing_rain_stickers?: string[];
  healing_rain_duration?: number;
  created_date?: string;
  updated_date?: string;
}

const DEFAULT_SETTINGS: AppSettingsData = {
  id: 'settings_default',
  center_name: 'Bénin Réflexologie Massage',
  center_city: 'Cotonou',
  center_landmark: 'Haie Vive, près de l\'Aéroport International',
  address: 'Rue 340, Haie Vive, Cotonou, Bénin',
  center_map_url: 'https://maps.google.com/?q=6.3535,2.4045',
  center_phone: '0191729117',
  whatsapp: '+229 01 91 72 91 17',
  center_email: 'contact@benin-reflexologie.bj',
  opening_hours: 'Du lundi au samedi : 08h00 - 20h00 • Dimanche sur rendez-vous',
  welcome_message: 'Bienvenue au sanctuaire de régénération et d\'équilibre corporel au cœur de Cotonou.',
  logo_url: '',
  healing_rain_stickers: ['hearts', 'leaves', 'water', 'lotus', 'stars'],
  healing_rain_duration: 5,
  is_locked: false,
  lock_message: 'Le centre Bénin Réflexologie Massage est momentanément fermé ou en maintenance.',
  lock_password: 'Acces',
  countdown_date: null,
  countdown_message: 'Fermeture programmée du centre pour maintenance.',
  is_countdown_active: false,
  app_active: true,
  app_opened: true,
  master_access_code: 'Acces',
  client_unblock_code: 'Accepter',
  closed_message: 'Nous réalisons des travaux d\'aménagement pour mieux vous accueillir. À très bientôt.',
  theme: 'cacao',
  nav_bottom: 16,
  nav_side: 12,
  nav_offset_x: 0,
  nav_offset_y: 16,
  nav_width: 92,
  nav_padding_y: 12,
  nav_border_radius: 24,
  nav_elevation: 30,
  header_title: 'Bénin Réflexologie',
  header_align: 'right',
  header_show_conseiller: true,
  header_show_commandes: true,
  header_show_pro: true,
  hero_image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80',
  hero_eyebrow: 'Sanctuaire de Bien-être',
  hero_title: 'L\'art du toucher',
  hero_title_em: 'qui libère.',
  hero_subtitle: 'Réflexologie plantaire, massages thérapeutiques et soins traditionnels au cœur du Bénin pour restaurer l\'harmonie du corps et de l\'esprit.',
  home_sections: ['hero', 'bridges', 'massages', 'videos', 'center', 'momo'],
  msg_composer_height: 34,
  msg_composer_width: 100,
  msg_bg_color: '',
  msg_bg_url: '',
  msg_bg_opacity: 100,
  msg_text_color: '',
  msg_show_file: true,
  msg_show_location: true,
  msg_show_voice: true,
  msg_voice_max: 60,
  msg_quick_replies: [
    'Bonjour 👋',
    'Je souhaite réserver une séance',
    'Quels sont vos tarifs ?',
    'Où se trouve le centre ?',
    'Puis-je décaler mon rendez-vous ?'
  ],
  ai_name: 'Awa',
  ai_tone: 'chaleureux',
  ai_greeting: 'Bonjour, je suis Awa, conseillère bien-être du centre. Dites-moi ce que vous ressentez (tensions, fatigue, stress), je vous oriente vers le soin le plus adapté.',
  ai_instructions: 'Écouter avec bienveillance, conseiller les massages du centre, ne poser aucun diagnostic médical.',
  ai_topics: [
    'J\'ai mal au dos après le travail',
    'Je dors mal en ce moment',
    'J\'ai les jambes lourdes',
    'Je suis très stressé(e)'
  ],
  ai_rules: [
    'Ne jamais poser de diagnostic médical ni prescrire de médicament.',
    'Conseiller de consulter un médecin en cas de douleur vive ou fièvre.',
    'Proposer les soins existants du centre.'
  ],
  ai_allow_booking: true,
  ai_allow_shop: true,
  ai_suggestion_mode: 'auto',
  ai_fixed_suggestions: [],
  ai_faq: [
    {
      q: 'Où êtes-vous situés ?',
      a: 'Nous sommes situés à Cotonou, quartier Haie Vive, à quelques minutes de l\'aéroport.',
      keywords: 'adresse lieu trouver quartier localisation'
    },
    {
      q: 'Comment payer par Mobile Money ?',
      a: 'Vous pouvez régler directement via MTN MoMo ou Moov Money en composant le code USSD fourni ou lors de votre commande.',
      keywords: 'payer paiement momo mtn moov argent'
    },
    {
      q: 'Proposez-vous des forfaits avec réduction ?',
      a: 'Oui, à partir de 10 séances réservées, nous appliquons une remise forfaitaire avantageuse sur tous nos soins.',
      keywords: 'forfait réduction remise pack tarif'
    }
  ],
  ai_mode: 'standard',
  ai_power: 7,
  messages_mode: 'standard',
  messages_power: 5,
  upload_mode: 'standard',
  upload_power: 5,
  announcements_mode: 'standard',
  announcements_power: 5,
  image_mode: 'standard',
  image_power: 3,
  invoice_title: 'FACTURE',
  invoice_logo_url: '',
  invoice_show_logo: true,
  invoice_bg_url: '',
  invoice_bg_opacity: 10,
  invoice_accent: '#b8864b',
  invoice_show_address: true,
  invoice_show_landmark: true,
  invoice_show_contact: true,
  invoice_show_hours: true,
  invoice_show_number: true,
  invoice_show_issued_by: true,
  invoice_show_discounts: true,
  invoice_show_next: true,
  invoice_show_notes: true,
  invoice_footer: 'Merci de votre confiance — prenez soin de vous.',
  invoice_note: 'Dispensé de TVA sous le régime des centres de soins de bien-être.',
  momo_number: '97000000',
  momo_name: 'Bénin Réflexologie Sarl',
  moov_number: '95000000',
  moov_name: 'Bénin Réflexologie Sarl',
  moov_ussd: '*155*1*1*',
  celtiis_number: '40000000',
  celtiis_name: 'Bénin Réflexologie Sarl',
  celtiis_ussd: '*888*1*',
  bank_name: 'Ecobank Bénin',
  bank_account_name: 'Bénin Réflexologie Sarl',
  bank_iban: 'BJ66 0100 1001 123456789012 34',
  bank_swift: 'ECOCBJCO',
  loyalty_percent: 15,
  loyalty_threshold: 11
};

const DEFAULT_MASSAGES: any[] = [];

const DEFAULT_PRODUCTS: any[] = [];

const DEFAULT_VIDEOS: any[] = [];

const DEFAULT_ANNOUNCEMENTS: any[] = [];

const DEFAULT_ANAMNESES = [
  {
    id: 'anam1',
    name: 'Bilan Vitalité & Zones Réflexes',
    description: 'Questionnaire préalable pour personnaliser votre séance et identifier vos zones de tension prioritaires.',
    image_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80',
    password: '',
    welcome_message: 'Bienvenue dans votre bilan de réflexologie. Prenons ensemble quelques instants pour faire le point sur votre équilibre.',
    order: 1,
    active: true
  }
];

const DEFAULT_STEPS = [
  {
    id: 'step1',
    anamnesis_id: 'anam1',
    title: 'Votre niveau d\'énergie',
    intro: 'Indiquez votre état général de forme et de vitalité ces derniers jours.',
    mode: 'choice',
    questions: [
      {
        label: 'Comment évaluez-vous votre niveau d\'énergie global ?',
        options: ['Épuisé(e) / En baisse', 'Moyen mais fonctionnel', 'Bonne énergie', 'Pleine forme']
      }
    ],
    order: 1
  },
  {
    id: 'step2',
    anamnesis_id: 'anam1',
    title: 'Zones d\'inconfort ou de tensions',
    intro: 'Sélectionnez les zones du corps qui réclament une attention particulière.',
    mode: 'checklist',
    questions: [
      {
        label: 'Cochez les zones sensibles :',
        options: ['Bas du dos / Lombaires', 'Nuque & Épaules', 'Jambes lourdes / Chevilles', 'Ventre / Sphère digestive', 'Tête / Migraines']
      }
    ],
    order: 2
  },
  {
    id: 'step3',
    anamnesis_id: 'anam1',
    title: 'Intensité des tensions ressenties',
    intro: 'Positionnez le curseur sur le niveau de gêne ressenti au quotidien.',
    mode: 'scale',
    questions: [
      {
        label: 'Évaluez l\'intensité de la tension de 0 (nulle) à 10 (intense) :'
      }
    ],
    order: 3
  },
  {
    id: 'step4',
    anamnesis_id: 'anam1',
    title: 'Précautions & Antécédents',
    intro: 'Ces questions permettent d\'adapter nos gestes en toute sécurité.',
    mode: 'confirm',
    questions: [
      { label: 'Avez-vous subi une intervention chirurgicale ou fracture récente ?' },
      { label: 'Êtes-vous enceinte ou avez-vous des problèmes circulatoires sévères ?' }
    ],
    order: 4
  },
  {
    id: 'step5',
    anamnesis_id: 'anam1',
    title: 'Vos attentes pour cette séance',
    intro: 'Partagez avec le praticien vos souhaits spécifiques.',
    mode: 'text',
    questions: [
      { label: 'Qu\'attendez-vous principalement de votre prochaine séance ?' }
    ],
    order: 5
  }
];

const DEFAULT_USERS: any[] = [];

/** Storage Manager helper with localStorage fallback */
class StorageTable<T extends { id?: string }> {
  private key: string;
  private defaultItems: T[];

  constructor(key: string, defaultItems: T[] = []) {
    this.key = `brm_db_${key}`;
    this.defaultItems = defaultItems;
    this.init();
  }

  private init() {
    try {
      const existing = localStorage.getItem(this.key);
      if (!existing) {
        localStorage.setItem(this.key, JSON.stringify(this.defaultItems));
      } else if (this.key === 'brm_db_videos') {
        try {
          const items = JSON.parse(existing);
          let updated = false;
          const urlMap: Record<string, string> = {
            v1: '/video-plantaire.mp4',
            v2: '/video-trapezes.mp4',
            v3: '/video-etirements.mp4',
            v4: '/video-palmaire.mp4',
          };
          const sanitized = items.map((item: any) => {
            if (item.video_url && (item.video_url.includes('commondatastorage.googleapis.com') || item.video_url.includes('gtv-videos-bucket'))) {
              updated = true;
              return { ...item, video_url: urlMap[item.id] || '' };
            }
            return item;
          });
          if (updated) {
            localStorage.setItem(this.key, JSON.stringify(sanitized));
          }
        } catch {
          // ignore parsing error
        }
      }
    } catch {
      // storage unavailable
    }
  }

  getAll(): T[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return this.defaultItems;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : this.defaultItems;
    } catch {
      return this.defaultItems;
    }
  }

  setAll(items: T[]) {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('brm-db-change', { detail: { table: this.key } }));
    } catch {
      // ignore quota
    }
  }

  async list(sortField?: string, limit?: number): Promise<T[]> {
    let items = [...this.getAll()];
    if (sortField) {
      const desc = sortField.startsWith('-');
      const field = desc ? sortField.slice(1) : sortField;
      items.sort((a: any, b: any) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }
    if (limit && limit > 0) {
      items = items.slice(0, limit);
    }
    return items;
  }

  async filter(criteria: Partial<T>, sortField?: string, limit?: number): Promise<T[]> {
    let items = this.getAll().filter((item: any) => {
      for (const k of Object.keys(criteria)) {
        if (item[k] !== (criteria as any)[k]) {
          return false;
        }
      }
      return true;
    });
    if (sortField) {
      const desc = sortField.startsWith('-');
      const field = desc ? sortField.slice(1) : sortField;
      items.sort((a: any, b: any) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }
    if (limit && limit > 0) {
      items = items.slice(0, limit);
    }
    return items;
  }

  async get(id: string): Promise<T | null> {
    const item = this.getAll().find((i) => i.id === id);
    return item || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const items = this.getAll();
    const newItem: any = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.unshift(newItem);
    this.setAll(items);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const items = this.getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Item ${id} not found in ${this.key}`);
    }
    const updated: any = {
      ...items[idx],
      ...data,
      updated_date: new Date().toISOString()
    };
    items[idx] = updated;
    this.setAll(items);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const items = this.getAll();
    const filtered = items.filter((i) => i.id !== id);
    this.setAll(filtered);
    return true;
  }
}

// Instantiate storage tables
const tables: Record<string, StorageTable<any>> = {
  AppSettings: new StorageTable<AppSettingsData>('AppSettings', [DEFAULT_SETTINGS]),
  MassageType: new StorageTable<any>('MassageType', DEFAULT_MASSAGES),
  Product: new StorageTable<any>('Product', DEFAULT_PRODUCTS),
  Video: new StorageTable<any>('Video', DEFAULT_VIDEOS),
  Announcement: new StorageTable<any>('Announcement', DEFAULT_ANNOUNCEMENTS),
  Anamnesis: new StorageTable<any>('Anamnesis', DEFAULT_ANAMNESES),
  AnamnesisStep: new StorageTable<any>('AnamnesisStep', DEFAULT_STEPS),
  AnamnesisEntry: new StorageTable<any>('AnamnesisEntry', []),
  AnamnesisResponse: new StorageTable<any>('AnamnesisResponse', []),
  ActivityLog: new StorageTable<any>('ActivityLog', []),
  Appointment: new StorageTable<any>('Appointment', []),
  Message: new StorageTable<any>('Message', []),
  Order: new StorageTable<any>('Order', []),
  Invoice: new StorageTable<any>('Invoice', []),
  Client: new StorageTable<any>('Client', []),
  User: new StorageTable<any>('User', DEFAULT_USERS),
  Profile: new StorageTable<any>('Profile', DEFAULT_USERS),
  profiles: new StorageTable<any>('profiles', DEFAULT_USERS),
  VideoComment: new StorageTable<any>('VideoComment', []),
};

// Current active auth session in localStorage
const AUTH_KEY = 'brm_auth_user';

export const base44 = {
  entities: tables,
  asServiceRole: {
    entities: tables
  },
  auth: {
    async me(): Promise<{ id: string; email: string; full_name: string; role: 'admin' | 'secretary' | 'moderator' | 'user' } | null> {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u;
      } catch {
        return null;
      }
    },
    async login(email: string, _password?: string) {
      const users = tables.User.getAll();
      const cleanEmail = email.trim().toLowerCase();
      let user = users.find((u: any) => u.email?.toLowerCase() === cleanEmail);
      
      if (!user) {
        // default fallback if email matches keywords
        if (cleanEmail.includes('mod') || cleanEmail.includes('admin')) {
          user = users.find((u: any) => u.role === 'moderator' || u.role === 'admin') || users[0];
        } else if (cleanEmail.includes('sec')) {
          user = users.find((u: any) => u.role === 'secretary') || {
            id: crypto.randomUUID(),
            full_name: 'Secrétaire',
            email: cleanEmail,
            role: 'secretary'
          };
        } else {
          user = {
            id: crypto.randomUUID(),
            full_name: 'Client Membre',
            email: cleanEmail,
            role: 'client'
          };
          tables.User.create(user);
        }
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event('brm-auth'));
      return user;
    },
    async logout(redirectTo = '/') {
      localStorage.removeItem(AUTH_KEY);
      window.dispatchEvent(new Event('brm-auth'));
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    },
    async register(data: { email: string; full_name?: string; role?: string }) {
      const cleanEmail = data.email.trim().toLowerCase();
      const role = data.role || 'client';
      const user = await tables.User.create({
        email: cleanEmail,
        full_name: data.full_name || 'Client Membre',
        role
      });
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event('brm-auth'));
      return user;
    },
    async updateMe(data: any) {
      const current = await this.me();
      if (!current) return null;
      const updated = await tables.User.update(current.id, data);
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('brm-auth'));
      return updated;
    }
  },
  functions: {
    async invoke(name: string, payload: any): Promise<any> {
      if (name === 'wellnessAdvisor') {
        // Import production wellnessAdvisor engine (Gemini Flash + Fallback)
        const { runWellnessAdvisor } = await import('@/lib/wellnessAdvisor');
        return runWellnessAdvisor(payload);
      }
      throw new Error(`Unknown function: ${name}`);
    }
  }
};
