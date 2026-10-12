import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  SendHorizontal,
  CalendarHeart,
  ShoppingBag,
  Trash2,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Phone,
  Video,
  ChevronDown,
} from 'lucide-react';
import { useProfile } from '@/lib/clientProfile';
import { useCart } from '@/lib/useCart';
import { askGeminiAdvisor, fetchAiConfig } from '@/lib/client';
import { executeAiAction, ActionResult } from '@/lib/aiActionRunner';
import { toast } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import CartSheet from '@/components/shop/CartSheet';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actions?: Array<{ kind: string; label: string; value?: string }>;
  actionResult?: ActionResult | null;
  urgency_level?: string;
  lifestyle_advice?: string[];
}

interface AiChatFullScreenProps {
  initialFullScreen?: boolean;
  isPageMode?: boolean;
  onClose?: () => void;
}

export default function AiChatFullScreen({
  initialFullScreen = false,
  isPageMode = false,
  onClose,
}: AiChatFullScreenProps) {
  const profile = useProfile();
  const cart = useCart();
  const navigate = useNavigate();

  const [isFullScreen, setIsFullScreen] = useState(initialFullScreen);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const storageKey = `brm_ai_chat_session_${profile?.client_key || 'guest'}`;

  // Load initial messages from localStorage or initialize with AI greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved chat session', e);
    }

    const greetingName = profile?.name ? `, ${profile.name}` : '';
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: `Bonjour${greetingName} ! Je suis votre conseillère en réflexologie & santé holistique chez Bénin Réflexologie Massage.\n\nComment vous sentez-vous aujourd'hui ? Avez-vous des douleurs, de la fatigue ou du stress ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Réserver un massage anti-stress 💆‍♂️',
          'Acheter une huile essentielle aux fleurs d’oranger 🌿',
          'Parler directement au secrétariat 📞',
          'J’ai mal au bas du dos et aux épaules',
        ],
      },
    ];
  });

  const messagesContainerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Prevent any window scrolling or displacement on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch AI Studio Configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await fetchAiConfig();
        setAiConfig(config);
      } catch (err) {
        console.warn('Could not load AI Config', err);
      }
    }
    loadConfig();
  }, []);

  // Save conversation state
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save conversation to localStorage', e);
    }
  }, [messages, storageKey]);

  // Auto-scroll ONLY within the messages container (never scrolls window or page)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  // Handle clearing history
  const handleClearHistory = () => {
    localStorage.removeItem(storageKey);
    const greetingName = profile?.name ? `, ${profile.name}` : '';
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: `Nouvelle consultation démarrée${greetingName}. Que puis-je faire pour votre bien-être ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Calculer mon soin recommandé 💆',
          'Conseils contre l’insomnie 🌙',
          'Prendre rendez-vous en ligne 📅',
        ],
      },
    ]);
    toast({ title: 'Conversation réinitialisée' });
  };

  const handleSend = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(false);
    setLoading(true);

    try {
      const historyForGemini = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const aiResponse = await askGeminiAdvisor(userText, {
        history: historyForGemini,
        client_key: profile?.client_key,
      });

      let actionRes: ActionResult | null = null;
      if (aiResponse.executed_action) {
        actionRes = await executeAiAction(
          aiResponse.executed_action,
          {
            clientKey: profile?.client_key,
            clientName: profile?.name,
            clientPhone: profile?.phone,
            cart: {
              addItemWithDiscount: (p: any) => cart.addItemWithDiscount(p),
              add: (p: any) => cart.add(p),
            },
            onOpenCart: () => setIsCartOpen(true),
          }
        );
      }

      const responseText =
        (aiResponse as any).answer ||
        (aiResponse as any).analysis ||
        (aiResponse as any).text ||
        'Voici mes recommandations pour votre bien-être.';

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: aiResponse.suggestions || [],
        actions: aiResponse.actions || [],
        actionResult: actionRes,
        urgency_level: aiResponse.urgency_level,
        lifestyle_advice: aiResponse.lifestyle_advice,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      const fallbackMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        text: "Je rencontre une courte interruption de réseau. En attendant, n'hésitez pas à consulter nos massages ou à contacter directement notre secrétariat au 229 97 00 00 00.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Réserver un massage 💆',
          'Contacter le secrétariat 📞',
          'Voir la boutique 🌿',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleActionClick = (action: { kind: string; label: string; value?: string }) => {
    if (action.kind === 'appointment') {
      navigate('/rendez-vous');
    } else if (action.kind === 'product') {
      navigate('/boutique');
    } else if (action.kind === 'momo_plan') {
      navigate('/rendez-vous');
    } else if (action.kind === 'anamnesis') {
      navigate('/decouvertes?tab=anamnesis');
    }
  };

  const advisorName = aiConfig?.ai_name || aiConfig?.persona?.ai_name || 'Rébecca la lionne';

  const handleBackOrClose = () => {
    if (onClose) {
      onClose();
    } else if (isFullScreen) {
      setIsFullScreen(false);
    } else {
      navigate(-1);
    }
  };

  // Standalone Full-Screen View
  if (isPageMode || isFullScreen) {
    return (
      <div
        style={{
          backgroundColor: 'rgb(var(--cacao))',
          color: 'rgb(var(--sand))',
        }}
        className="fixed inset-0 z-50 w-screen h-screen h-[100dvh] flex flex-col overflow-hidden font-body select-none"
      >
        {/* Dynamic Ambient Glowing Aura */}
        <div
          className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ${
            loading ? 'bg-amber-500/35 animate-pulse' : isTyping ? 'bg-amber-400/25' : 'bg-gold/15'
          }`}
        />
        <div
          className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ${
            loading ? 'bg-amber-600/30' : 'bg-emerald-500/10'
          }`}
        />

        {/* 1. FLEX HEADER - Top flex item, clean, stable */}
        <header
          style={{
            backgroundColor: 'rgb(var(--cacao) / 0.98)',
            borderColor: 'rgb(var(--sand) / 0.15)',
          }}
          className="shrink-0 h-16 w-full z-40 backdrop-blur-xl border-b px-4 sm:px-8 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            {/* Bouton retour épuré : UNIQUEMENT l'icône ArrowLeft */}
            <button
              type="button"
              onClick={handleBackOrClose}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-gold/20 text-sand hover:text-gold transition active:scale-95 cursor-pointer flex items-center justify-center shadow-xs shrink-0"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-gold" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center text-stone-950 shadow-md ${
                    loading ? 'ring-2 ring-amber-400 animate-pulse' : 'ring-1 ring-amber-400/40'
                  }`}
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-950 shadow-xs" />
              </div>

              <div>
                <h3 className="font-display font-medium text-sm sm:text-base leading-tight text-sand">
                  Conseillère Santé • {advisorName}
                </h3>
                <p className="text-[10px] sm:text-xs text-sand/65">
                  {loading ? 'Analyse thérapeutique en cours...' : 'Prise de rendez-vous & conseils holistiques'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Déroulant rangé sous icône Chevron */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOptionsMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-gold/20 text-sand hover:text-gold transition active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
              title="Options et actions bien-être"
            >
              <ChevronDown className={`w-5 h-5 text-gold transition-transform duration-200 ${optionsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {optionsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOptionsMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    style={{
                      backgroundColor: 'rgb(var(--cacao))',
                      color: 'rgb(var(--sand))',
                      borderColor: 'rgb(var(--gold) / 0.3)',
                    }}
                    className="absolute right-0 top-12 z-50 w-60 rounded-2xl border p-2 shadow-2xl space-y-1 text-xs font-body"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        handleClearHistory();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-rose-950/40 text-rose-300 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="font-bold block">Effacer l'historique</span>
                        <span className="text-[10px] text-rose-300/60">Nouvelle session</span>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* 2. SCROLLABLE BODY CONTENT - Ultra stable, locked container */}
        <main
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain z-10 w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 select-text"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center shrink-0 mt-1 shadow-md">
                      <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                  )}

                  <div className="space-y-2.5 flex-1">
                    <div
                      style={{
                        backgroundColor: isUser ? 'rgb(var(--gold))' : 'rgb(var(--cacao) / 0.88)',
                        color: isUser ? 'rgb(var(--cacao))' : 'rgb(var(--sand))',
                        borderColor: isUser ? 'rgb(var(--gold))' : 'rgb(var(--gold) / 0.25)',
                      }}
                      className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-lg border ${
                        isUser ? 'rounded-br-xs font-semibold' : 'rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Lifestyle Tips */}
                      {msg.lifestyle_advice && msg.lifestyle_advice.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>Conseils d'auto-soin :</span>
                          </span>
                          <ul className="space-y-1 text-xs opacity-90 pl-3 list-disc">
                            {msg.lifestyle_advice.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Executed Action Card */}
                      {msg.actionResult && msg.actionResult.success && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-semibold">{msg.actionResult.summary}</span>
                          </div>

                          {msg.actionResult.type === 'MANAGE_CART' && (
                            <button
                              type="button"
                              onClick={() => setIsCartOpen(true)}
                              className="btn-gold py-1.5 px-3 rounded-xl text-[11px] font-bold shadow-xs active:scale-95 cursor-pointer shrink-0"
                            >
                              Voir le panier
                            </button>
                          )}
                          {msg.actionResult.type === 'BOOK_APPOINTMENT' && (
                            <button
                              type="button"
                              onClick={() => navigate('/rendez-vous')}
                              className="btn-gold py-1.5 px-3 rounded-xl text-[11px] font-bold shadow-xs active:scale-95 cursor-pointer shrink-0"
                            >
                              Mes Rendez-vous
                            </button>
                          )}
                        </motion.div>
                      )}

                      <span className="block mt-2 text-[10px] opacity-50 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Dynamic Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.actions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleActionClick(act)}
                            className="btn-gold py-2 px-3.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                          >
                            {act.kind === 'appointment' && <CalendarHeart className="w-3.5 h-3.5" />}
                            {act.kind === 'product' && <ShoppingBag className="w-3.5 h-3.5" />}
                            <span>{act.label}</span>
                            <ArrowRight className="w-3 h-3 opacity-70" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggestions Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(sug)}
                            style={{
                              backgroundColor: 'rgb(var(--sand) / 0.12)',
                              color: 'rgb(var(--sand))',
                              borderColor: 'rgb(var(--gold) / 0.3)',
                            }}
                            className="px-3.5 py-1.5 rounded-full text-[11px] font-medium border hover:bg-gold hover:text-cacao transition active:scale-95 cursor-pointer text-left backdrop-blur-sm"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* AI Thinking Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-xs text-sand/70 font-medium pl-11"
            >
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-stone-900/90 border border-amber-500/20 backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] ml-1.5 font-semibold text-gold">{advisorName} réfléchit...</span>
              </div>
            </motion.div>
          )}
        </main>

        {/* 3. FLEX FOOTER - Bottom item */}
        <footer
          style={{
            backgroundColor: 'rgb(var(--cacao) / 0.98)',
            borderColor: 'rgb(var(--sand) / 0.15)',
          }}
          className="shrink-0 w-full z-40 backdrop-blur-2xl border-t p-3 sm:p-4 pb-safe shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsTyping(Boolean(e.target.value.trim()));
                }}
                placeholder="Décrivez vos douleurs, tensions ou demandez une réservation..."
                style={{
                  backgroundColor: 'rgb(var(--sand) / 0.12)',
                  color: 'rgb(var(--sand))',
                  borderColor: 'rgb(var(--sand) / 0.2)',
                }}
                className="w-full py-3.5 pl-4 pr-12 rounded-2xl placeholder-sand/50 border focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-xs sm:text-sm shadow-inner transition font-body"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-gold py-3.5 px-5 sm:px-7 rounded-2xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 active:scale-95 transition cursor-pointer shrink-0"
            >
              <SendHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </form>
        </footer>

        <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    );
  }

  // Inline fallback view
  return (
    <div
      style={{
        backgroundColor: 'rgb(var(--cacao))',
        color: 'rgb(var(--sand))',
        borderColor: 'rgb(var(--gold) / 0.25)',
      }}
      className="w-full rounded-3xl border shadow-2xl h-[620px] flex flex-col overflow-hidden font-body relative"
    >
      <header
        style={{
          backgroundColor: 'rgb(var(--cacao) / 0.98)',
          borderColor: 'rgb(var(--sand) / 0.15)',
        }}
        className="h-14 shrink-0 px-5 border-b flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-display font-medium text-sm text-sand">Conseillère Santé • {advisorName}</span>
        </div>
        <button
          type="button"
          onClick={handleClearHistory}
          className="p-2 text-sand/60 hover:text-rose-400 transition cursor-pointer"
          title="Effacer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-3.5 rounded-2xl text-xs ${msg.role === 'user' ? 'bg-amber-800 text-white ml-auto max-w-xs' : 'bg-stone-900 text-sand mr-auto max-w-xs'}`}>
            <p className="whitespace-pre-line">{msg.text}</p>
          </div>
        ))}
      </main>

      <footer
        style={{
          backgroundColor: 'rgb(var(--cacao) / 0.98)',
          borderColor: 'rgb(var(--sand) / 0.15)',
        }}
        className="shrink-0 p-3 border-t bg-cacao"
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 text-xs text-sand placeholder-sand/50 border border-white/10"
          />
          <button type="submit" disabled={!input.trim()} className="btn-gold px-4 rounded-xl text-xs font-bold cursor-pointer">
            Envoyer
          </button>
        </form>
      </footer>
    </div>
  );
}
