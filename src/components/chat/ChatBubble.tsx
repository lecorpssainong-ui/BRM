import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/format';
import { copyToClipboard } from '@/lib/clipboard';
import { toast } from '@/components/ui/toaster';
import AutoMedia from '@/components/shared/AutoMedia';
import {
  FileText,
  MapPin,
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Reply,
  Copy,
  CheckSquare,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { deleteRecordWithConfirm } from '@/lib/deleteHelper';

interface ChatBubbleProps {
  message: any;
  isSelf: boolean;
  onRefresh?: () => void;
  onReply?: (message: any) => void;
}

export default function ChatBubble({
  message,
  isSelf,
  onRefresh,
  onReply,
}: ChatBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimerRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  // Pointer long press handler (0.5s)
  const handlePointerDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (message.text) {
      await copyToClipboard(message.text);
      toast({ title: 'Texte copié dans le presse-papier' });
    }
    setShowMenu(false);
  };

  const handleSelect = () => {
    setShowMenu(false);
    toast({ title: 'Message sélectionné' });
  };

  const handleStartReply = () => {
    setShowMenu(false);
    onReply?.(message);
  };

  const handleStartEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      try {
        await supabase
          .from('chat_messages')
          .update({ content: editText.trim() })
          .eq('id', message.id);
      } catch {}
      try {
        await base44.entities.Message.update(message.id, {
          text: editText.trim(),
          edited: true,
        });
      } catch {}
      setIsEditing(false);
      onRefresh?.();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMenu(false);
    const success = await deleteRecordWithConfirm(message.id, {
      tableName: 'chat_messages',
      base44Entity: 'Message',
      confirmMessage: 'Supprimer définitivement ce message ?',
      successMessage: 'Message supprimé.',
    });
    if (success) {
      onRefresh?.();
    }
  };

  const timeStr = formatDate(message.created_date || new Date(), 'HH:mm');

  return (
    <div className={`relative flex flex-col ${isSelf ? 'items-end' : 'items-start'} my-2.5 group select-none`}>
      {/* Swipe Horizontal (Swipe-to-Reply) Container */}
      <div className="relative flex items-center w-full">
        {/* Reply Icon revealed during rightward swipe */}
        <div
          className={`absolute left-2 flex items-center gap-1 text-amber-500 transition-opacity pointer-events-none ${
            isSelf ? 'order-first' : ''
          }`}
        >
          <div className="p-2 rounded-full bg-amber-400/20 text-amber-600 shadow-sm">
            <Reply className="w-4 h-4" />
          </div>
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 80 }}
          dragElastic={0.2}
          dragSnapToOrigin={true}
          onDragEnd={(_, info) => {
            if (info.offset.x > 45 || info.velocity.x > 200) {
              onReply?.(message);
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(true);
          }}
          className={`relative max-w-[85%] sm:max-w-md rounded-3xl p-4 shadow-sm text-sm font-body transition-shadow cursor-grab active:cursor-grabbing ${
            isSelf
              ? 'ml-auto bg-cacao text-sand rounded-br-md shadow-md'
              : 'mr-auto bg-white text-cacao rounded-bl-md border border-cacao/10 shadow-sm'
          }`}
        >
          {/* Sender Name for incoming message */}
          {!isSelf && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold block mb-1">
              {message.sender === 'staff' ? 'Le Secrétariat' : message.client_name || 'Client'}
            </span>
          )}

          {/* Quoted Message / ReplyingTo Snippet */}
          {message.reply_to && (
            <div
              className={`mb-2.5 p-2 rounded-xl border-l-4 text-xs ${
                isSelf
                  ? 'bg-black/25 border-amber-400 text-sand/90'
                  : 'bg-stone-100 border-amber-600 text-cacao/80'
              }`}
            >
              <span className="font-bold block text-[11px] opacity-90">
                {message.reply_to.author || 'Message cité'}
              </span>
              <p className="truncate line-clamp-1 opacity-80 mt-0.5">
                {message.reply_to.text || '[Pièce jointe]'}
              </p>
            </div>
          )}

          {/* Attachment: Image */}
          {message.attachment_type === 'image' && message.attachment_url && (
            <div className="mb-2.5 overflow-hidden rounded-2xl bg-black/10">
              <img
                src={message.attachment_url}
                alt={message.attachment_name || 'Image'}
                className="max-h-72 w-full object-cover rounded-2xl cursor-pointer hover:opacity-95 transition"
                onClick={() => window.open(message.attachment_url, '_blank')}
              />
            </div>
          )}

          {/* Attachment: Video */}
          {message.attachment_type === 'video' && message.attachment_url && (
            <div className="mb-2.5 overflow-hidden rounded-2xl bg-black aspect-video max-h-72">
              <AutoMedia
                url={message.attachment_url}
                className="w-full h-full rounded-2xl object-cover"
                controls
                autoPlay={false}
                muted={false}
              />
            </div>
          )}

          {/* Attachment: Audio Voice Message */}
          {message.attachment_type === 'audio' && message.attachment_url && (
            <div className="mb-2.5 p-3 rounded-2xl bg-black/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold opacity-80">
                <span>Message vocal</span>
                {message.duration && <span>{message.duration}s</span>}
              </div>
              <audio
                src={message.attachment_url}
                controls
                className="w-full h-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Attachment: Location */}
          {message.attachment_type === 'location' && message.attachment_url && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 p-3 rounded-2xl bg-gold/15 text-gold hover:bg-gold/25 transition flex items-center gap-2.5 font-semibold text-xs"
            >
              <MapPin className="w-4 h-4 shrink-0 text-gold" />
              <span className="truncate flex-1">Position géographique partagée</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          )}

          {/* Attachment: Generic Document File */}
          {message.attachment_type === 'file' && message.attachment_url && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 p-3 rounded-2xl bg-black/10 flex items-center gap-2.5 text-xs font-semibold hover:bg-black/20 transition"
            >
              <FileText className="w-4 h-4 text-gold shrink-0" />
              <span className="truncate flex-1">{message.attachment_name || 'Document joint'}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          )}

          {/* Text content or Editing mode */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 rounded-xl text-cacao bg-sand text-xs border border-gold outline-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-xs opacity-75 hover:opacity-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleUpdate}
                  className="px-2.5 py-1 rounded-full bg-gold text-cacao font-bold text-xs cursor-pointer"
                >
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          ) : (
            message.text && (
              <p className="leading-relaxed whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )
          )}

          {/* Metadata Footer */}
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-60">
            {message.edited && <span className="italic">modifié</span>}
            <span>{timeStr}</span>
            {isSelf && (
              <span>
                {message.read ? (
                  <CheckCheck className="w-3.5 h-3.5 text-amber-300 inline" />
                ) : (
                  <Check className="w-3.5 h-3.5 inline" />
                )}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Long-Press Interactive Context Menu (Framer Motion) */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              backgroundColor: 'rgb(var(--sand))',
              color: 'rgb(var(--cacao))',
              borderColor: 'rgb(var(--cacao) / 0.18)',
            }}
            className={`absolute z-30 top-full mt-1.5 ${
              isSelf ? 'right-1' : 'left-1'
            } backdrop-blur-xl border rounded-2xl shadow-2xl p-1.5 flex flex-wrap items-center gap-1 text-xs font-semibold`}
          >
            {/* Action 1: Répondre */}
            <button
              type="button"
              onClick={handleStartReply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gold/20 text-amber-700 dark:text-amber-400 transition cursor-pointer"
              title="Répondre au message"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Répondre</span>
            </button>

            {/* Action 2: Copier le texte */}
            {message.text && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#2B1D16]/10 dark:hover:bg-white/10 text-[#2B1D16] dark:text-[#E8DCC4] transition cursor-pointer"
                title="Copier le texte"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </button>
            )}

            {/* Action 3: Sélectionner */}
            <button
              type="button"
              onClick={handleSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#2B1D16]/10 dark:hover:bg-white/10 text-[#2B1D16] dark:text-[#E8DCC4] transition cursor-pointer"
              title="Sélectionner"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Sélectionner</span>
            </button>

            {/* Action 4: Modifier (Self message only) */}
            {isSelf && message.text && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#2B1D16]/10 dark:hover:bg-white/10 text-[#2B1D16] dark:text-[#E8DCC4] transition cursor-pointer"
                title="Modifier mon message"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            )}

            {/* Action 5: Supprimer (Self message only) */}
            {isSelf && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(e);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                title="Supprimer mon message"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="p-1.5 rounded-xl text-[#2B1D16]/50 dark:text-[#E8DCC4]/50 hover:text-[#2B1D16] dark:hover:text-white hover:bg-[#2B1D16]/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Fermer le menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
