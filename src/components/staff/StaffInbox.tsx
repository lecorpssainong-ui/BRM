import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCachedQuery } from '@/lib/offline';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { formatDate, formatPrice } from '@/lib/format';
import ChatThread from '@/components/chat/ChatThread';
import StaffNewAppointment from './StaffNewAppointment';
import InvoiceForm from './InvoiceForm';
import {
  MessageSquare,
  User,
  Search,
  CheckCheck,
  CalendarPlus,
  Receipt,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Send,
  ChevronLeft,
} from 'lucide-react';

export default function StaffInbox() {
  const queryClient = useQueryClient();
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'directory'>('chats');

  // Modals for quick staff actions prefilled with client info
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Écouteur temps réel Supabase Realtime sur chat_messages pour le staff
  useEffect(() => {
    const channelName = `realtime_chat_staff_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          console.log('Realtime chat_messages event:', payload);
          queryClient.invalidateQueries({ queryKey: ['chat_messages'] });
          queryClient.invalidateQueries({ queryKey: ['staff-inbox-messages'] });
          queryClient.invalidateQueries({ queryKey: ['staff-badge-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Queries for all interactions : lit TOUTES les conversations chat_messages Supabase
  const { data: messages = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-inbox-messages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true });

        console.log('Load chat_messages:', { count: data?.length, error });

        if (!error && Array.isArray(data)) {
          return data.map((m: any) => ({
            id: m.id,
            client_key: m.client_key,
            client_name: m.sender_name,
            sender: m.sender === 'client' ? 'client' : 'staff',
            text: m.content,
            created_date: m.created_at,
            read: m.read,
            attachment_url: m.attachments?.[0]?.url,
            attachment_type: m.attachments?.[0]?.type,
            attachment_name: m.attachments?.[0]?.name,
          }));
        }
      } catch (err) {
        console.warn('Fallback local base44 messages:', err);
      }
      return base44.entities.Message.list('-created_date', 1000);
    },
    staleTime: 3000,
  });

  const { data: clients = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-inbox-clients'],
    queryFn: async () => base44.entities.Client.list('-last_seen', 1000),
    staleTime: 10000,
  });

  const { data: appointments = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-inbox-appointments'],
    queryFn: async () => base44.entities.Appointment.list('-date', 1000),
    staleTime: 10000,
  });

  const { data: orders = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-inbox-orders'],
    queryFn: async () => base44.entities.Order.list('-created_date', 1000),
    staleTime: 10000,
  });

  const { data: invoices = [] } = useCachedQuery<any[]>({
    queryKey: ['staff-inbox-invoices'],
    queryFn: async () => base44.entities.Invoice.list('-created_date', 1000),
    staleTime: 10000,
  });

  // Group messages strictly by client (client_key or phone)
  const conversations = useMemo(() => {
    const map: Record<
      string,
      {
        client_key: string;
        client_name: string;
        client_phone?: string;
        lastMessage: any;
        unreadCount: number;
        messageCount: number;
      }
    > = {};

    // Group all messages
    messages.forEach((m: any) => {
      const k = m.client_key || m.client_phone || 'anonymous';
      if (!map[k]) {
        const clientObj = clients.find((c: any) => c.client_key === k || (c.phone && c.phone === m.client_phone));
        map[k] = {
          client_key: k,
          client_name: clientObj?.name || m.client_name || 'Client',
          client_phone: clientObj?.phone || m.client_phone,
          lastMessage: m,
          unreadCount: 0,
          messageCount: 0,
        };
      }

      map[k].messageCount += 1;
      if (m.sender === 'client' && !m.read) {
        map[k].unreadCount += 1;
      }

      // Check if this message is newer
      const existingTime = new Date(map[k].lastMessage?.created_date || 0).getTime();
      const thisTime = new Date(m.created_date || 0).getTime();
      if (thisTime > existingTime) {
        map[k].lastMessage = m;
      }
    });

    const list = Object.values(map);
    list.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
      const timeA = new Date(a.lastMessage?.created_date || 0).getTime();
      const timeB = new Date(b.lastMessage?.created_date || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [messages, clients]);

  // Comprehensive Client Directory: all clients who have at least one interaction
  const clientDirectory = useMemo(() => {
    const directoryMap: Record<
      string,
      {
        client_key: string;
        client_name: string;
        client_phone?: string;
        totalInteractions: number;
        apptsCount: number;
        ordersCount: number;
        invoicesCount: number;
        lastActivityDate?: string;
      }
    > = {};

    const registerClient = (key: string, name?: string, phone?: string, date?: string, type?: 'appt' | 'order' | 'invoice' | 'msg') => {
      if (!key) return;
      if (!directoryMap[key]) {
        directoryMap[key] = {
          client_key: key,
          client_name: name || 'Client',
          client_phone: phone,
          totalInteractions: 0,
          apptsCount: 0,
          ordersCount: 0,
          invoicesCount: 0,
          lastActivityDate: date,
        };
      }

      const entry = directoryMap[key];
      if (name && name !== 'Client' && entry.client_name === 'Client') entry.client_name = name;
      if (phone && !entry.client_phone) entry.client_phone = phone;
      entry.totalInteractions += 1;

      if (type === 'appt') entry.apptsCount += 1;
      if (type === 'order') entry.ordersCount += 1;
      if (type === 'invoice') entry.invoicesCount += 1;

      if (date) {
        const curTime = new Date(entry.lastActivityDate || 0).getTime();
        const newTime = new Date(date).getTime();
        if (newTime > curTime) entry.lastActivityDate = date;
      }
    };

    // 1. From clients table
    clients.forEach((c: any) => registerClient(c.client_key, c.name, c.phone, c.last_seen));

    // 2. From messages
    messages.forEach((m: any) => registerClient(m.client_key, m.client_name, m.client_phone, m.created_date, 'msg'));

    // 3. From appointments
    appointments.forEach((a: any) => registerClient(a.client_key, a.client_name, a.client_phone, a.date || a.created_date, 'appt'));

    // 4. From orders
    orders.forEach((o: any) => registerClient(o.client_key, o.client_name, o.client_phone, o.created_date, 'order'));

    // 5. From invoices
    invoices.forEach((i: any) => registerClient(i.client_key || i.client_phone || i.client_name, i.client_name, i.client_phone, i.created_date || i.date, 'invoice'));

    const list = Object.values(directoryMap);
    list.sort((a, b) => {
      const timeA = new Date(a.lastActivityDate || 0).getTime();
      const timeB = new Date(b.lastActivityDate || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [clients, messages, appointments, orders, invoices]);

  // Filtered lists
  const filteredConversations = conversations.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.client_phone && c.client_phone.includes(search))
  );

  const filteredDirectory = clientDirectory.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.client_phone && c.client_phone.includes(search))
  );

  // Active client object
  const activeClient = useMemo(() => {
    const key = selectedClientKey || filteredConversations[0]?.client_key || filteredDirectory[0]?.client_key;
    if (!key) return null;

    // Check directory first for rich info
    const fromDir = clientDirectory.find((c) => c.client_key === key);
    const fromConv = conversations.find((c) => c.client_key === key);

    return {
      client_key: key,
      client_name: fromDir?.client_name || fromConv?.client_name || 'Client',
      client_phone: fromDir?.client_phone || fromConv?.client_phone || '',
      apptsCount: fromDir?.apptsCount || 0,
      ordersCount: fromDir?.ordersCount || 0,
      invoicesCount: fromDir?.invoicesCount || 0,
    };
  }, [selectedClientKey, clientDirectory, conversations, filteredConversations, filteredDirectory]);

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-inbox-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['staff-inbox-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['staff-badge-appts'] });
    queryClient.invalidateQueries({ queryKey: ['staff-badge-invoices'] });
  };

  return (
    <div className="card-soft overflow-hidden h-[calc(100vh-140px)] min-h-[600px] grid grid-cols-1 md:grid-cols-12 border border-cacao/15 shadow-xl font-body">
      {/* Left List Pane (Conversations & Annuaire Switcher) */}
      <div
        className={`${
          selectedClientKey ? 'hidden md:flex' : 'flex'
        } md:col-span-5 lg:col-span-4 border-r border-cacao/10 flex-col bg-white/50 h-full`}
      >
        {/* Top Header & Tabs */}
        <div className="p-4 border-b border-cacao/10 space-y-3 bg-white/60">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-cacao font-medium">
              Espace Clients
            </h3>
            <span className="text-xs font-bold text-amber-800 px-2.5 py-0.5 rounded-full bg-amber-500/20">
              {activeTab === 'chats' ? `${conversations.length} fil(s)` : `${clientDirectory.length} contact(s)`}
            </span>
          </div>

          {/* Subtabs: Chats vs Annuaire */}
          <div className="flex rounded-full bg-cacao/10 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1.5 rounded-full transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'chats'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-cacao/70 hover:text-cacao'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Fils ({conversations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-1.5 rounded-full transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-cacao/70 hover:text-cacao'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Annuaire ({clientDirectory.length})</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-cacao/40 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'chats' ? 'Rechercher une discussion...' : 'Rechercher dans l\'annuaire...'}
              className="field text-xs py-2 pl-9"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-cacao/5 font-body">
          {activeTab === 'chats' ? (
            /* CONVERSATIONS LIST */
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-cacao/50">
                Aucune conversation trouvée.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeClient?.client_key === conv.client_key;
                return (
                  <button
                    key={conv.client_key}
                    type="button"
                    onClick={() => setSelectedClientKey(conv.client_key)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-l-4 border-amber-500'
                        : 'hover:bg-cacao/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-cacao/10 text-cacao flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                      {conv.client_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="font-semibold text-xs sm:text-sm text-cacao truncate">
                          {conv.client_name}
                        </h4>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-cacao/50 shrink-0">
                            {formatDate(conv.lastMessage.created_date, 'HH:mm')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-cacao/65 line-clamp-1">
                        {conv.lastMessage?.text ||
                          (conv.lastMessage?.attachment_type
                            ? `[Pièce jointe : ${conv.lastMessage.attachment_type}]`
                            : 'Conversation initiée')}
                      </p>

                      {conv.client_phone && (
                        <span className="text-[10px] text-cacao/45 block mt-0.5 font-mono">
                          {conv.client_phone}
                        </span>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2 shadow" />
                    )}
                  </button>
                );
              })
            )
          ) : (
            /* ANNUAIRE / CLIENTS DIRECTORY */
            filteredDirectory.length === 0 ? (
              <div className="p-8 text-center text-xs text-cacao/50">
                Aucun client dans l'annuaire.
              </div>
            ) : (
              filteredDirectory.map((client) => {
                const isSelected = activeClient?.client_key === client.client_key;
                return (
                  <button
                    key={client.client_key}
                    type="button"
                    onClick={() => setSelectedClientKey(client.client_key)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-l-4 border-amber-500'
                        : 'hover:bg-cacao/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                      {client.client_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-semibold text-xs sm:text-sm text-cacao truncate">
                          {client.client_name}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-400/20 px-1.5 py-0.5 rounded">
                          {client.totalInteractions} act.
                        </span>
                      </div>

                      {client.client_phone ? (
                        <p className="text-xs text-cacao/65 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-gold" />
                          <span>{client.client_phone}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-cacao/50">Client enregistré</p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-cacao/50 mt-1">
                        {client.apptsCount > 0 && <span>{client.apptsCount} RDV</span>}
                        {client.ordersCount > 0 && <span>• {client.ordersCount} com.</span>}
                        {client.invoicesCount > 0 && <span>• {client.invoicesCount} fact.</span>}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Right Discussion Thread & Client Actions Pane */}
      <div
        className={`${
          selectedClientKey ? 'flex' : 'hidden md:flex'
        } md:col-span-7 lg:col-span-8 flex-col h-full bg-white/75`}
      >
        {activeClient ? (
          <>
            {/* Action Bar Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-cacao/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF6F0]">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setSelectedClientKey(null)}
                  className="md:hidden p-2 rounded-xl text-cacao hover:bg-cacao/10 transition shrink-0 cursor-pointer"
                  title="Retour à la liste"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full bg-cacao text-sand flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                  {activeClient.client_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-medium text-lg text-cacao leading-tight truncate">
                    {activeClient.client_name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-cacao/65">
                    {activeClient.client_phone ? (
                      <span className="font-mono text-xs">{activeClient.client_phone}</span>
                    ) : (
                      <span className="text-[11px] opacity-75 truncate">
                        ID : {activeClient.client_key.substring(0, 10)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Actions: Planifier RDV & Émettre facture pré-remplie + Appel / WhatsApp */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Appel Téléphonique Direct */}
                {activeClient.client_phone && (
                  <a
                    href={`tel:${activeClient.client_phone}`}
                    className="p-2 rounded-xl bg-white hover:bg-gold/20 text-gold border border-amber-500/20 shadow-xs transition active:scale-95 cursor-pointer relative group"
                    title="Appeler directement ce client"
                  >
                    <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </a>
                )}

                {/* WhatsApp Direct */}
                {activeClient.client_phone && (
                  <a
                    href={`https://wa.me/${activeClient.client_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 shadow-xs transition active:scale-95 cursor-pointer relative group"
                    title="Ouvrir WhatsApp avec ce client"
                  >
                    <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  title="Planifier un rendez-vous pour ce client"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Planifier un RDV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-cacao border border-cacao/15 font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  title="Émettre une facture pré-remplie"
                >
                  <Receipt className="w-3.5 h-3.5 text-gold" />
                  <span>Émettre facture</span>
                </button>
              </div>
            </div>

            {/* Direct Chat Thread */}
            <div className="flex-1 p-2 sm:p-4 overflow-hidden flex flex-col">
              <ChatThread
                clientKey={activeClient.client_key}
                clientName={activeClient.client_name}
                as="staff"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-cacao/60">
            <MessageSquare className="w-12 h-12 text-gold/40 mb-3" />
            <p className="text-base font-display">Sélectionnez un client ou une conversation</p>
            <p className="text-xs text-cacao/60 max-w-xs mt-1">
              Vous pourrez échanger en direct, lui planifier un rendez-vous ou lui établir une facture instantanée.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Planifier Rendez-vous pré-rempli */}
      {isAppointmentModalOpen && activeClient && (
        <StaffNewAppointment
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          onSuccess={handleRefreshData}
          initialClientName={activeClient.client_name}
          initialClientPhone={activeClient.client_phone}
          initialClientKey={activeClient.client_key}
        />
      )}

      {/* Modal: Émettre Facture pré-remplie */}
      {isInvoiceModalOpen && activeClient && (
        <InvoiceForm
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSuccess={handleRefreshData}
          initialData={{
            client_name: activeClient.client_name,
            client_phone: activeClient.client_phone,
            client_key: activeClient.client_key,
          }}
        />
      )}
    </div>
  );
}
