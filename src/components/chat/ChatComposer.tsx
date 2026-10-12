import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  SendHorizontal,
  Paperclip,
  MapPin,
  Mic,
  Square,
  X,
  Reply,
} from 'lucide-react';
import { useAppSettings } from '@/lib/queries';
import { modeOf, powerOf } from '@/lib/credits';
import { prepareUpload, uploadPublicFile } from '@/lib/media';
import { toast } from '@/components/ui/toaster';
import { useTranslation } from '@/lib/i18n';

interface ChatComposerProps {
  onSend: (message: {
    text?: string;
    attachment_url?: string;
    attachment_type?: 'image' | 'video' | 'file' | 'location' | 'audio';
    attachment_name?: string;
    duration?: number;
    reply_to?: {
      id: string;
      text?: string;
      sender: string;
      author: string;
    };
  }) => Promise<void>;
  initialText?: string;
  isStaff?: boolean;
  replyingTo?: any | null;
  onCancelReply?: () => void;
}

export default function ChatComposer({
  onSend,
  initialText = '',
  isStaff = false,
  replyingTo,
  onCancelReply,
}: ChatComposerProps) {
  const { t } = useTranslation();
  const { data: settings } = useAppSettings();

  // Settings features
  const showFile = settings?.msg_show_file !== false;
  const showLocation = settings?.msg_show_location !== false;
  const showVoice = settings?.msg_show_voice !== false;
  const maxVoiceSeconds = Number(settings?.msg_voice_max ?? 60);

  const quickReplies =
    Array.isArray(settings?.msg_quick_replies) && settings.msg_quick_replies.length > 0
      ? settings.msg_quick_replies
      : [
          'Bonjour 👋',
          'Je souhaite réserver une séance',
          'Quels sont vos tarifs ?',
          'Où se trouve le centre ?',
          'Puis-je décaler mon rendez-vous ?',
        ];

  const [text, setText] = useState<string>(initialText);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-growing textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Clamp between min 40px and max 150px
      textareaRef.current.style.height = `${Math.min(150, Math.max(40, scrollHeight))}px`;
    }
  }, [text]);

  // Attachment states
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    url: string;
    type: 'image' | 'video' | 'file';
    savedBytes: number;
  } | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<{
    blob: Blob;
    url: string;
    duration: number;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Focus textarea when replyingTo is set
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // File selection & compression
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    // Check size limit (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale autorisée est de 25 Mo.',
        variant: 'destructive',
      });
      return;
    }

    const messagesMode = modeOf(settings, 'messages');
    const messagesPower = powerOf(settings, 'messages');

    // In standard mode for client, video is blocked
    if (!isStaff && messagesMode === 'standard' && file.type.startsWith('video/')) {
      toast({
        title: 'Vidéos désactivées en mode économie',
        description:
          'Envoyez une photo ou un message écrit — ou demandez au centre d\'activer le mode intégration.',
        variant: 'destructive',
      });
      return;
    }

    let fileToSend = file;
    let saved = 0;

    if (!isStaff && file.type.startsWith('image/')) {
      const res = await prepareUpload(file, messagesMode, messagesPower);
      fileToSend = res.file;
      saved = res.saved;
    }

    const objectUrl = URL.createObjectURL(fileToSend);
    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : 'file';

    setPendingFile({
      file: fileToSend,
      url: objectUrl,
      type,
      savedBytes: saved,
    });
  };

  // Location sharing
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Géolocalisation indisponible',
        description: 'Votre navigateur ne supporte pas la géolocalisation.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Localisation en cours...',
      description: 'Récupération de vos coordonnées GPS...',
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        onSend({
          text: `📍 Ma position : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          attachment_url: mapsUrl,
          attachment_type: 'location',
          attachment_name: 'Position GPS',
        });
      },
      (err) => {
        toast({
          title: 'Erreur GPS',
          description: err.message || 'Impossible d\'obtenir votre position.',
          variant: 'destructive',
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setPendingAudio({
          blob: audioBlob,
          url: audioUrl,
          duration: recordingSeconds,
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxVoiceSeconds) {
            stopRecording();
            return maxVoiceSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast({
        title: 'Microphone inaccessible',
        description: 'Vérifiez les permissions du navigateur pour enregistrer un vocal.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setPendingAudio(null);
  };

  // Send message
  const handleSend = async () => {
    if (!text.trim() && !pendingFile && !pendingAudio) return;

    setSending(true);
    try {
      let attachmentUrl: string | undefined = undefined;
      let attachmentType: any = undefined;
      let attachmentName: string | undefined = undefined;
      let duration: number | undefined = undefined;

      if (pendingFile) {
        attachmentUrl = await uploadPublicFile(pendingFile.file);
        attachmentType = pendingFile.type;
        attachmentName = pendingFile.file.name;
      } else if (pendingAudio) {
        const audioFile = new File([pendingAudio.blob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        attachmentUrl = await uploadPublicFile(audioFile);
        attachmentType = 'audio';
        attachmentName = 'Message vocal';
        duration = pendingAudio.duration;
      }

      const replyToPayload = replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text,
            sender: replyingTo.sender,
            author: replyingTo.sender === 'staff' ? 'Le Secrétariat' : (replyingTo.client_name || 'Client'),
          }
        : undefined;

      await onSend({
        text: text.trim() || undefined,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_name: attachmentName,
        duration,
        reply_to: replyToPayload,
      });

      setText('');
      setPendingFile(null);
      setPendingAudio(null);
      onCancelReply?.();
    } catch (err: any) {
      toast({
        title: 'Erreur d\'envoi',
        description: err.message || 'Impossible d\'envoyer le message.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Quick replies suggestion chips */}
      {!isStaff && quickReplies.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(reply)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 hover:bg-white text-cacao border border-cacao/10 transition shrink-0 active:scale-95 cursor-pointer shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className="p-3 sm:p-4 rounded-3xl bg-white/90 dark:bg-stone-900/90 border border-cacao/15 shadow-md flex flex-col font-body transition-all"
        style={{
          backgroundColor: settings?.msg_bg_color || undefined,
          backgroundImage: settings?.msg_bg_url ? `url(${settings.msg_bg_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: settings?.msg_bg_opacity ? (settings.msg_bg_opacity / 100) : undefined,
          width: settings?.msg_composer_width ? `${settings.msg_composer_width}%` : '100%',
          margin: '0 auto',
        }}
      >
        {/* Quote / Replying To Bar */}
        {replyingTo && (
          <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-500/15 border-l-4 border-amber-500 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                <Reply className="w-3.5 h-3.5" />
                <span>
                  Réponse à{' '}
                  {replyingTo.sender === 'staff'
                    ? 'Le Secrétariat'
                    : (replyingTo.client_name || 'Client')}
                </span>
              </div>
              <p className="text-cacao/75 dark:text-sand/75 truncate mt-0.5 font-body">
                {replyingTo.text ||
                  (replyingTo.attachment_type
                    ? `[Pièce jointe : ${replyingTo.attachment_type}]`
                    : 'Message')}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 rounded-full text-cacao/60 hover:text-cacao cursor-pointer transition"
              title="Annuler la réponse"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pending File Preview Banner */}
        {pendingFile && (
          <div className="p-2.5 mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              {pendingFile.type === 'image' && (
                <img
                  src={pendingFile.url}
                  alt=""
                  className="w-10 h-10 object-cover rounded-xl shrink-0"
                />
              )}
              <div className="truncate">
                <p className="font-semibold text-cacao truncate">{pendingFile.file.name}</p>
                <p className="text-[10px] text-cacao/60">
                  {(pendingFile.file.size / 1024).toFixed(0)} Ko
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="p-1 rounded-full text-cacao/60 hover:text-cacao cursor-pointer"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pending Audio Preview Banner */}
        {pendingAudio && (
          <div className="p-2.5 mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cacao">
                Message vocal • {pendingAudio.duration}s
              </span>
              {pendingAudio.url && (
                <audio
                  src={pendingAudio.url}
                  controls
                  className="h-7 w-44"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={cancelRecording}
              className="p-1 rounded-full text-cacao/60 hover:text-cacao cursor-pointer"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Recording State */}
        {isRecording && (
          <div className="flex-1 flex items-center justify-between px-4 py-2 bg-rose-50 border border-rose-200 rounded-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <span className="text-sm font-semibold text-rose-800">
                Enregistrement en cours... {recordingSeconds}s / {maxVoiceSeconds}s
              </span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="btn-dark py-1.5 px-4 text-xs inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Terminer</span>
            </button>
          </div>
        )}

        {/* Auto-growing Text Area */}
        {!isRecording && (
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('messages.placeholder') || "Écrivez votre message au secrétariat..."}
            style={{ color: settings?.msg_text_color || undefined }}
            className="w-full bg-transparent border-none outline-none resize-none text-sm sm:text-base font-body text-cacao dark:text-sand placeholder:text-cacao/40 p-2 leading-relaxed max-h-36 overflow-y-auto"
          />
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-cacao/10">
          {/* Action buttons (File, Location, Mic) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {showFile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-2.5 rounded-full text-cacao/65 hover:text-cacao hover:bg-cacao/10 transition active:scale-[0.9] cursor-pointer"
                  title="Joindre un fichier"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}

            {showLocation && (
              <button
                type="button"
                onClick={handleShareLocation}
                className="p-2 sm:p-2.5 rounded-full text-cacao/65 hover:text-cacao hover:bg-cacao/10 transition active:scale-[0.9] cursor-pointer"
                title="Partager ma position"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {showVoice && !isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="p-2 sm:p-2.5 rounded-full text-cacao/65 hover:text-cacao hover:bg-cacao/10 transition active:scale-[0.9] cursor-pointer"
                title="Enregistrer un message vocal"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            disabled={sending || (!text.trim() && !pendingFile && !pendingAudio)}
            onClick={handleSend}
            className="btn-gold py-2.5 px-5 sm:px-6 text-xs sm:text-sm inline-flex items-center gap-2 font-semibold shadow-md disabled:opacity-40 cursor-pointer"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
            <span>{t('messages.send') || "Envoyer"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
