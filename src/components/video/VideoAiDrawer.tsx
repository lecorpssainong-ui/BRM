import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';

interface VideoAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  video: any;
}

interface AiMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

export default function VideoAiDrawer({ isOpen, onClose, video }: VideoAiDrawerProps) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Bonjour ! Je suis Rébecca, votre conseillère bien-être et réflexologie. Vous regardez « ${video.title || 'cette vidéo'} ». Avez-vous des questions sur les bienfaits de cette pratique ou vos ressentis corporels ?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    'Quels sont les bienfaits ?',
    'Combien de séances conseillées ?',
    'Est-ce efficace contre le stress ?',
    video.massage_name ? `Comment réserver ${video.massage_name} ?` : 'Où se situe le centre ?',
  ];

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 300) {
      onClose();
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: AiMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = `Cette pratique de ${video.massage_name || 'réflexologie'} agit directement sur le système nerveux autonome pour relâcher les tensions musculaires et rééquilibrer la circulation des énergies.`;

      const lower = text.toLowerCase();
      if (lower.includes('séance') || lower.includes('combien')) {
        reply = `Pour un résultat durable et profond, nous recommandons une cure initiale de 3 à 5 séances espacées de 7 à 10 jours, suivie d'un entretien mensuel régulier.`;
      } else if (lower.includes('stress') || lower.includes('fatigue') || lower.includes('sommeil')) {
        reply = `C'est idéal contre le stress et la surcharge mentale ! La stimulation des points réflexes de la voûte plantaire et du plexus solaire induit une libération immédiate d'endorphines.`;
      } else if (lower.includes('réserver') || lower.includes('tarif') || lower.includes('prix')) {
        reply = `Vous pouvez réserver directement en cliquant sur le bouton « Réserver » de cette vidéo. Notre équipe vous accueille avec douceur à Haie Vive, Cotonou.`;
      } else if (lower.includes('bienfait')) {
        reply = `Les bienfaits principaux incluent : décongestion des jambes lourdes, apaisement des maux de dos et de nuque, amélioration du sommeil et régénération cellulaire complète.`;
      }

      const botMsg: AiMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-body">
          {/* Backdrop avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
          />

          {/* Sheet avec glissement gestuel */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              backgroundColor: 'rgb(var(--sand))',
              color: 'rgb(var(--cacao))',
              borderColor: 'rgb(var(--cacao) / 0.18)',
            }}
            className="relative z-10 w-full max-w-lg h-[82vh] rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border backdrop-blur-xl flex flex-col"
          >
            {/* Grab handle pour fermer en glissant vers le bas */}
            <div
              style={{ backgroundColor: 'rgb(var(--cacao) / 0.25)' }}
              className="w-12 h-1.5 rounded-full mx-auto -mt-1 mb-2 cursor-grab active:cursor-grabbing shrink-0"
            />

            {/* Header */}
            <div
              style={{ borderColor: 'rgb(var(--cacao) / 0.12)' }}
              className="flex items-center justify-between pb-3 border-b shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-medium text-base sm:text-lg text-cacao dark:text-sand flex items-center gap-1.5">
                    <span>Rébecca • Conseillère IA</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-cacao/65 dark:text-sand/65 line-clamp-1">
                    Conseils bien-être en direct • Glisser vers le bas pour fermer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-cacao/60 dark:text-sand/60 hover:bg-cacao/10 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 font-body text-xs sm:text-sm">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-gold text-stone-950 font-bold rounded-tr-xs shadow-md'
                        : 'bg-white/80 dark:bg-stone-900/80 text-cacao dark:text-sand border border-cacao/10 dark:border-white/10 rounded-tl-xs leading-relaxed'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`text-[9px] block mt-1 ${
                        m.role === 'user' ? 'text-stone-900/70 text-right' : 'text-cacao/50 dark:text-sand/50'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/10 dark:border-white/10 text-xs text-cacao/70 dark:text-sand/70 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-gold animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-gold animate-bounce [animation-delay:0.4s]" />
                    <span>Rébecca formule sa réponse...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(qp)}
                  className="px-3 py-1 rounded-full bg-white/70 dark:bg-stone-800/80 hover:bg-gold hover:text-stone-950 border border-cacao/10 dark:border-white/10 text-[11px] font-semibold text-cacao/90 dark:text-sand/90 whitespace-nowrap transition cursor-pointer active:scale-95"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="pt-2 border-t border-cacao/10 dark:border-white/10 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question à Rébecca..."
                className="flex-1 py-2.5 px-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-cacao/15 dark:border-white/15 text-cacao dark:text-sand text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="btn-gold p-2.5 rounded-2xl disabled:opacity-40 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
