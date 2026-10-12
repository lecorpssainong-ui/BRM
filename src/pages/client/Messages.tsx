import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProfile, saveProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { useAppSettings } from '@/lib/queries';
import PageHeader from '@/components/shared/PageHeader';
import ProfileRequired from '@/components/shared/ProfileRequired';
import ChatThread from '@/components/chat/ChatThread';
import { Phone, MessageCircle, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function Messages() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const [searchParams] = useSearchParams();
  const initialText = searchParams.get('text') || '';

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Détermination robuste et garantie de la clé client et du nom pour l'échange de messages
  const effectiveClientKey = profile?.client_key || user?.id || user?.email || 'client';
  const effectiveClientName = profile?.name || user?.full_name || user?.nom || user?.email || 'Client';

  const phone = settings?.center_phone || '+229 97 00 00 00';
  const cleanPhone = String(settings?.whatsapp || phone).replace(/\D/g, '');
  const waUrl = cleanPhone.startsWith('229')
    ? `https://wa.me/${cleanPhone}`
    : `https://wa.me/229${cleanPhone}`;

  // Keyboard shortcut: Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (!isFullscreen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  return (
    <ProfileRequired reason="Pour écrire au secrétariat, veuillez renseigner votre nom et votre numéro de téléphone.">
      <div className="space-y-4">
        <PageHeader
          eyebrow={t('messages.eyebrow')}
          title={t('messages.title')}
          subtitle={t('messages.subtitle')}
        >
          <div className="flex items-center gap-2">
            {/* Bouton Appel Téléphonique Direct */}
            <a
              href={`tel:${phone}`}
              className="p-2.5 rounded-full bg-white/80 hover:bg-gold/20 text-cacao border border-amber-500/30 shadow-sm transition active:scale-95 cursor-pointer relative group"
              title={t('messages.callCenter')}
            >
              <Phone className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            </a>

            {/* Bouton WhatsApp Direct */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-white/80 hover:bg-emerald-500/20 text-cacao border border-emerald-500/30 shadow-sm transition active:scale-95 cursor-pointer relative group"
              title={t('messages.openWhatsapp')}
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2.5 rounded-full bg-white/70 hover:bg-white text-cacao border border-cacao/10 shadow-sm transition active:scale-[0.95] cursor-pointer"
              title={isFullscreen ? 'Quitter le mode plein écran' : 'Mode plein écran'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-cacao" />
              ) : (
                <Maximize2 className="w-4 h-4 text-cacao" />
              )}
            </button>
          </div>
        </PageHeader>

        {effectiveClientKey && (
          <>
            {/* Standard In-Page Conversation Box */}
            {!isFullscreen && (
              <div className="card-soft p-2 sm:p-4 min-h-[540px] flex flex-col transition-all">
                <ChatThread
                  clientKey={effectiveClientKey}
                  clientName={effectiveClientName}
                  as="client"
                  initialText={initialText}
                  onToggleFullscreen={() => setIsFullscreen(true)}
                  isFullscreen={false}
                />
              </div>
            )}

            {/* Fluid Fullscreen Modal Mode */}
            <AnimatePresence>
              {isFullscreen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-[#FAF6F0] dark:bg-[#1E1510] text-cacao dark:text-sand backdrop-blur-2xl p-3 sm:p-6 flex flex-col h-screen w-screen overflow-hidden"
                >
                  {/* Fullscreen Header */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-cacao/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm">
                        BR
                      </div>
                      <div>
                        <h3 className="font-display font-medium text-lg leading-tight">
                          {t('messages.title')}
                        </h3>
                        <p className="text-[11px] text-cacao/60 dark:text-sand/60">
                          {t('messages.directLine')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 rounded-full bg-white/70 dark:bg-stone-800 text-cacao dark:text-sand border border-cacao/10 hover:bg-white transition cursor-pointer"
                        title="Réduire"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fullscreen Chat Thread */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <ChatThread
                      clientKey={effectiveClientKey}
                      clientName={effectiveClientName}
                      as="client"
                      initialText={initialText}
                      onToggleFullscreen={() => setIsFullscreen(false)}
                      isFullscreen={true}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </ProfileRequired>
  );
}
