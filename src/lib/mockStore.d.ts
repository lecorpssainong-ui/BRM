export interface MockStoreService {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  role: string;
  objective: string;
  benefits: string[];
  duration_min: number;
  price: number;
  bulk_min_qty: number;
  bulk_discount_percent: number;
  image_url: string;
  likes: number;
  order: number;
}

export interface MockStoreProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  stock: number;
  active: boolean;
  image_url: string;
}

export interface MockStoreVideo {
  id: string;
  title: string;
  category: string;
  playlist: string;
  description: string;
  format: 'short' | 'long';
  thumbnail_url: string;
  video_url: string;
  duration: number;
  views: number;
  likes: number;
  massage_name?: string;
}

export interface MockStoreSettings {
  id: string;
  center_name: string;
  center_city: string;
  center_landmark: string;
  address: string;
  center_map_url: string;
  center_phone: string;
  whatsapp: string;
  center_email: string;
  opening_hours: string;
  welcome_message: string;
  theme: string;
  nav_bottom: number;
  nav_side: number;
  nav_offset_x: number;
  nav_offset_y: number;
  nav_width: number | string;
  nav_padding_y: number;
  nav_border_radius: number;
  nav_elevation: number;
  header_title: string;
  header_align: string;
  ai_name: string;
  ai_tone: string;
  ai_greeting: string;
  ai_instructions: string;
  ai_topics: string[];
  momo_number: string;
  momo_name: string;
  loyalty_percent: number;
  loyalty_threshold: number;
  [key: string]: any;
}

export class MockDataStore {
  getTable(tableName: string): any[];
  setTable(tableName: string, data: any[]): void;
  getServices(): Promise<MockStoreService[]>;
  getServiceById(id: string): Promise<MockStoreService | null>;
  saveService(serviceData: any): Promise<MockStoreService>;
  deleteService(id: string): Promise<boolean>;
  getProducts(): Promise<MockStoreProduct[]>;
  getProductById(id: string): Promise<MockStoreProduct | null>;
  getProductCategories(): Promise<string[]>;
  saveProductCategory(categoryName: string): Promise<void>;
  deleteCategory(categoryName: string): Promise<boolean>;
  saveProduct(productData: any): Promise<MockStoreProduct>;
  deleteProduct(id: string): Promise<boolean>;
  getVideos(): Promise<MockStoreVideo[]>;
  getVideoPlaylists(): Promise<string[]>;
  deletePlaylist(playlistName: string): Promise<boolean>;
  saveVideo(videoData: any): Promise<MockStoreVideo>;
  deleteVideo(id: string): Promise<boolean>;
  getVideoComments(videoId?: string): Promise<any[]>;
  addVideoComment(videoId: string, commentData: any): Promise<any>;
  updateVideoComment(commentId: string, newContent: string): Promise<any>;
  toggleVideoCommentLike(commentId: string, userId: string): Promise<any>;
  deleteVideoComment(commentId: string): Promise<boolean>;
  getAnnouncements(): Promise<any[]>;
  saveAnnouncement(data: any): Promise<any>;
  deleteAnnouncement(id: string): Promise<boolean>;
  getAnamnesis(): Promise<any>;
  getAnamnesisProtocols(): Promise<any[]>;
  saveAnamnesisProtocol(protocol: any): Promise<any>;
  deleteAnamnesisProtocol(id: string): Promise<boolean>;
  saveAnamnesisEntry(entryData: any): Promise<any>;
  getAnamnesisEntries(clientKey?: string): Promise<any[]>;
  getAppSettings(): Promise<MockStoreSettings>;
  saveAppSettings(updates: Partial<MockStoreSettings>): Promise<MockStoreSettings>;
  getAppointments(filter?: any): Promise<any[]>;
  saveAppointment(data: any): Promise<any>;
  updateAppointment(id: string, updates: any): Promise<any>;
  deleteAppointment(id: string): Promise<boolean>;
  getChatHistory(clientKey?: string): Promise<any[]>;
  saveChatMessage(messageData: any): Promise<any>;
  clearChatHistory(clientKey?: string): Promise<boolean>;
  getOrders(filter?: any): Promise<any[]>;
  saveOrder(orderData: any): Promise<any>;
  saveHealthReport(reportData: any): Promise<any>;
  getHealthReports(clientKey?: string): Promise<any[]>;
  deleteHealthReport(id: string): Promise<boolean>;
}

export const mockStore: MockDataStore;

export function useMockStore<T = any>(
  tableName: string,
  fetcher: (store: MockDataStore) => Promise<T>
): { data: T | null; loading: boolean; refetch: () => Promise<void> };

export default mockStore;
