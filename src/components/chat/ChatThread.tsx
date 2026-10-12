import { useState, useEffect, useRef } from 'react';
import { useCachedQuery, sendOrQueue } from '@/lib/offline';
import { useAppSettings } from '@/lib/queries';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ChatBubble from './ChatBubble';
import ChatComposer from './ChatComposer';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ShieldCheck } from 'lucide-react';

interface ChatThreadProps {
  clientKey: string;
  clientName?: string;
  as?: 'client' | 'staff';
  initialText?: string;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export default function ChatThread({
  clientKey,
  clientName = 'Client',
  as = 'client',
  initialText = '',
  onToggleFullscreen,
  isFullscreen = false,
}: ChatThreadProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const markedReadIdsRef = useRef<Set<string>>(new Set());

  // Écouteur temps réel Supabase Realtime pour la messagerie
  useEffect(() => {
    if (!clientKey) return;
    const channelName = `realtime_chat_${clientKey.replace(/[^a-zA-Z0-9]/g, '_')}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          qc.invalidateQueries({ queryKey: ['messages', clientKey] });
          qc.invalidateQueries({ queryKey: ['chat_messages'] });
          qc.invalidateQueries({ queryKey: ['staff-inbox-messages'] });
          qc.invalidateQueries({ queryKey: ['staff-badge-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientKey, qc]);

  const { data: messages = [], isLoading } = useCachedQuery<any[]>({
    queryKey: ['messages', clientKey],
    enabled: Boolean(clientKey),
    queryFn: async () => {
      if (!clientKey) return [];
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('client_key', clientKey)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
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
      } catch (e) {
        // Fallback local
      }
      return base44.entities.Message.filter({ client_key: clientKey }, 'created_date', 500);
    },
  });

  // Mark unread messages as read
  useEffect(() => {
    if (!messages.length) return;
    const targetSender = as === 'client' ? 'staff' : 'client';
    const unread = messages.filter(
      (m: any) => m.sender === targetSender && !m.read && !markedReadIdsRef.current.has(m.id)
    );

    if (!unread.length) return;

    unread.forEach((m: any) => {
      markedReadIdsRef.current.add(m.id);
      try {
        base44.entities.Message.update(m.id, { read: true });
      } catch {}
      try {
        supabase
          .from('chat_messages')
          .update({ read: true })
          .eq('id', m.id)
          .then(() => {});
      } catch {}
    });
  }, [messages, as]);

  // Scroll to bottom on updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (msgData: any) => {
    const isStaffSender = as === 'staff';
    const staffRole = user?.role === 'moderator' ? 'moderator' : 'secretary';
    const senderRole = isStaffSender ? staffRole : 'client';
    const senderDisplayName = isStaffSender
      ? (user?.full_name || user?.nom || user?.email || 'Secrétariat')
      : clientName;

    const payload = {
      client_key: clientKey,
      client_name: clientName,
      sender: as,
      text: msgData.text,
      attachment_url: msgData.attachment_url,
      attachment_type: msgData.attachment_type,
      attachment_name: msgData.attachment_name,
      duration: msgData.duration,
      reply_to: msgData.reply_to,
      read: false,
    };

    try {
      const { data, error } = await supabase.from('chat_messages').insert({
        client_key: clientKey,
        sender: senderRole,
        sender_name: senderDisplayName,
        content: msgData.text || '',
        attachments: msgData.attachment_url
          ? [{ url: msgData.attachment_url, type: msgData.attachment_type, name: msgData.attachment_name }]
          : [],
        read: false,
      }).select().single();
      console.log('Send chat_message:', { data, error });
    } catch (e) {
      // Enregistrement garanti par la file d'attente
    }

    await sendOrQueue('Message', payload, 'Message');
    qc.invalidateQueries({ queryKey: ['messages', clientKey] });
    qc.invalidateQueries({ queryKey: ['chat_messages'] });
    qc.invalidateQueries({ queryKey: ['staff-inbox-messages'] });
    qc.invalidateQueries({ queryKey: ['staff-badge-messages'] });
    setReplyingTo(null);
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['messages', clientKey] });
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-full flex-1' : 'h-[calc(100vh-220px)] min-h-[500px]'}`}>
      {/* Messages Scroll Area */}
      <div
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-2 rounded-3xl transition-all"
        style={{
          backgroundColor: settings?.msg_body_bg_color || undefined,
          backgroundImage: settings?.msg_body_bg_url ? `url(${settings.msg_body_bg_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: settings?.msg_body_bg_opacity ? (settings.msg_body_bg_opacity / 100) : undefined,
        }}
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            <div className="h-16 w-3/4 rounded-3xl bg-white/40 animate-pulse" />
            <div className="h-16 w-2/3 ml-auto rounded-3xl bg-cacao/10 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="card-soft p-8 text-center max-w-sm mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-display text-xl text-cacao font-medium mb-1">
              {as === 'client' ? 'Échange direct avec le centre' : 'Nouvelle conversation'}
            </h4>
            <p className="text-xs text-cacao/65 leading-relaxed font-body">
              {as === 'client'
                ? 'Posez vos questions sur nos soins, demandez un conseil personnalisé ou transmettez vos souhaits au secrétariat.'
                : 'Aucun message encore échangé avec ce client.'}
            </p>
          </div>
        ) : (
          messages.map((m: any) => (
            <ChatBubble
              key={m.id}
              message={m}
              isSelf={m.sender === as}
              onRefresh={handleRefresh}
              onReply={(targetMsg) => setReplyingTo(targetMsg)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer at bottom */}
      <div className="pt-2 shrink-0">
        <ChatComposer
          onSend={handleSend}
          initialText={initialText}
          isStaff={as === 'staff'}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}
