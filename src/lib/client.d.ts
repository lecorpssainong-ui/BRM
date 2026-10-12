export interface MockQueryBuilder<T = any> extends PromiseLike<{ data: T | null; error: any }> {
  select(columns?: string): this;
  insert(data: any): this;
  update(data: any): this;
  delete(): this;
  eq(column: string, value: any): this;
  match(criteria?: Record<string, any>): this;
  order(column: string, options?: { ascending?: boolean }): this;
  limit(count: number): this;
  single(): this;
  maybeSingle(): this;
}

export interface MockSupabaseClient {
  from(tableName: string): MockQueryBuilder;
  channel(name: string): {
    on(event: string, filter: any, callback?: any): any;
    subscribe(cb?: (status: string) => void): any;
    unsubscribe(): void;
  };
  removeChannel(channel: any): void;
  auth: {
    getSession(): Promise<{ data: { session: any }; error: any }>;
    getUser(): Promise<{ data: { user: any }; error: any }>;
  };
}

export const supabase: MockSupabaseClient;

export function fetchAiConfig(): Promise<any>;

export function askGeminiAdvisor(
  userQuery: string,
  options?: {
    history?: any[];
    client_key?: string;
    ai_config?: any;
  }
): Promise<{
  analysis: string;
  recommended_massage_ids: string[];
  suggested_products: string[];
  lifestyle_advice?: string[];
  urgency_level?: string;
  answer: string;
  suggestions?: string[];
  actions?: Array<any>;
  executed_action?: any;
}>;

export function subscribeToChatMessages(
  clientKey: string,
  onMessageReceived: (msg: any) => void
): () => void;

export function subscribeToAppSettings(
  onSettingsUpdated: (settings: any) => void
): () => void;

export function saveAppointmentToSupabase(appointmentData: any): Promise<any>;

declare const _default: {
  supabase: MockSupabaseClient;
  fetchAiConfig: typeof fetchAiConfig;
  askGeminiAdvisor: typeof askGeminiAdvisor;
  subscribeToChatMessages: typeof subscribeToChatMessages;
  subscribeToAppSettings: typeof subscribeToAppSettings;
  saveAppointmentToSupabase: typeof saveAppointmentToSupabase;
};

export default _default;
