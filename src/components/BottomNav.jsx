import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarHeart, MessageCircle, ShoppingBag, Compass } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAppSettings, useAppointments } from '@/lib/queries';
import { useAuth } from '@/lib/AuthContext';
import { useProfile } from '@/lib/clientProfile';
import { subscribeToAppSettings } from '@/lib/client';
import { useCart } from '@/lib/useCart';
import { useTranslation } from '@/lib/i18n';

/**
 * Composant Navigateur Inférieur Mobile Dynamique (BottomNav)
 * Piloté en temps réel par les variables d'ajustement du cockpit modérateur :
 * - nav_offset_x : Décalage horizontal (px)
 * - nav_offset_y : Marge du bas (px)
 * - nav_width : Largeur relative (% ou px)
 * - nav_padding_y : Hauteur interne / rembourrage vertical (px)
 * - nav_border_radius : Rayon d'arrondi des bordures (px)
 */
export default function BottomNav() {
  const { pathname } = useLocation();
  const { data: initialSettings } = useAppSettings();
  const cart = useCart();
  const { t } = useTranslation();
  const { user } = useAuth();
  const profile = useProfile();

  const effectiveUserId = user?.id || (profile?.client_key && profile.client_key.length === 36 ? profile.client_key : undefined);
  const effectivePhone = user?.telephone || profile?.phone;
  const effectiveEmail = user?.email || profile?.email;
  const { data: clientAppointments = [] } = useAppointments(effectiveUserId, effectivePhone, effectiveEmail);

  const activeApptsCount = useMemo(() => {
    return clientAppointments.filter((a) => ['pending', 'accepted', 'confirmed'].includes(a.status)).length;
  }, [clientAppointments]);

  const navItems = useMemo(
    () => [
      { to: '/', label: t('nav.home', 'Accueil'), icon: Home },
      { to: '/rendez-vous', label: t('nav.appointments', 'RDV'), icon: CalendarHeart },
      { to: '/messages', label: t('nav.messages', 'Messages'), icon: MessageCircle },
      { to: '/boutique', label: t('nav.shop', 'Boutique'), icon: ShoppingBag },
      { to: '/decouvertes', label: t('nav.discover', 'Découvrir'), icon: Compass },
    ],
    [t]
  );

  // Écouteur en temps réel pour les ajustements du cockpit
  const [realtimeOverrides, setRealtimeOverrides] = useState({});

  useEffect(() => {
    const relevantKeys = [
      'nav_offset_x',
      'nav_offset_y',
      'nav_bottom',
      'nav_width',
      'nav_padding_y',
      'nav_border_radius',
    ];

    const unsubscribe = subscribeToAppSettings((newSettings) => {
      if (newSettings && typeof newSettings === 'object') {
        setRealtimeOverrides((prev) => {
          let hasDiff = false;
          for (const k of relevantKeys) {
            if (newSettings[k] !== undefined && prev[k] !== newSettings[k]) {
              hasDiff = true;
              break;
            }
          }
          if (!hasDiff) return prev;
          const next = { ...prev };
          for (const k of relevantKeys) {
            if (newSettings[k] !== undefined) {
              next[k] = newSettings[k];
            }
          }
          return next;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const settings = useMemo(
    () => ({ ...(initialSettings || {}), ...realtimeOverrides }),
    [initialSettings, realtimeOverrides]
  );

  // Extraction et normalisation des 5 variables de réglage
  const navOffsetX = Number(settings?.nav_offset_x ?? 0);
  const navOffsetY = Number(settings?.nav_offset_y ?? settings?.nav_bottom ?? 16);

  const rawWidth = settings?.nav_width ?? 92;
  const navWidth =
    typeof rawWidth === 'number'
      ? `${rawWidth}%`
      : String(rawWidth).includes('%') || String(rawWidth).includes('px')
      ? String(rawWidth)
      : `${rawWidth}%`;

  const navPaddingY = Number(settings?.nav_padding_y ?? 12);
  const navBorderRadius = Number(settings?.nav_border_radius ?? 24);
  const pillRadius = Math.max(8, navBorderRadius - 4);

  return (
    <div
      className="fixed left-0 right-0 z-40 pointer-events-none flex justify-center items-end"
      style={{
        bottom: `${navOffsetY}px`,
        transform: navOffsetX ? `translateX(${navOffsetX}px)` : undefined,
        transition: 'bottom 0.25s ease-out, transform 0.25s ease-out',
      }}
    >
      <nav
        style={{
          width: navWidth,
          maxWidth: '560px',
          paddingTop: `${navPaddingY}px`,
          paddingBottom: `${navPaddingY}px`,
          borderRadius: `${navBorderRadius}px`,
          backgroundColor: 'rgb(var(--cacao) / 0.96)',
          borderColor: 'rgb(var(--sand) / 0.2)',
          transition: 'width 0.25s ease-out, padding 0.25s ease-out, border-radius 0.25s ease-out, background-color 0.25s ease-out',
        }}
        className="pointer-events-auto backdrop-blur-xl border px-2 flex items-center justify-between sm:justify-center gap-1 sm:gap-2 shadow-2xl"
      >
        <LayoutGroup id="bottom-nav-group">
          {navItems.map((item) => {
            const isActive =
              item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  borderRadius: `${pillRadius}px`,
                  color: isActive ? 'rgb(var(--cacao))' : 'rgb(var(--sand) / 0.85)',
                }}
                className={`relative flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-center transition-all duration-200 z-10 select-none ${
                  isActive ? 'font-black' : 'hover:opacity-100 font-medium'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill-active"
                    style={{
                      zIndex: -1,
                      borderRadius: `${pillRadius}px`,
                      backgroundColor: 'rgb(var(--sand))',
                    }}
                    className="absolute inset-0 shadow-lg shadow-black/30"
                    transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                  />
                )}
                <div className="relative">
                  <Icon
                    style={{
                      color: isActive ? 'rgb(var(--cacao))' : 'rgb(var(--sand) / 0.85)',
                    }}
                    className="w-5 h-5 shrink-0 transition-colors duration-200"
                  />
                  {item.to === '/boutique' && cart.count > 0 && (
                    <AnimatePresence>
                      <motion.span
                        key={cart.count}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                        style={{
                          backgroundColor: 'rgb(var(--gold))',
                          color: 'rgb(var(--cacao))',
                          borderColor: 'rgb(var(--cacao))',
                        }}
                        className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-black font-mono flex items-center justify-center shadow-md border"
                      >
                        {cart.count}
                      </motion.span>
                    </AnimatePresence>
                  )}
                  {item.to === '/rendez-vous' && activeApptsCount > 0 && (
                    <AnimatePresence>
                      <motion.span
                        key={activeApptsCount}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                        style={{
                          backgroundColor: 'rgb(var(--gold))',
                          color: 'rgb(var(--cacao))',
                          borderColor: 'rgb(var(--cacao))',
                        }}
                        className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-black font-mono flex items-center justify-center shadow-md border"
                      >
                        {activeApptsCount}
                      </motion.span>
                    </AnimatePresence>
                  )}
                </div>
                <span
                  style={{
                    color: isActive ? 'rgb(var(--cacao))' : 'rgb(var(--sand) / 0.85)',
                  }}
                  className={`text-[10px] sm:text-xs tracking-tight transition-colors duration-200 ${
                    isActive ? 'font-black' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </LayoutGroup>
      </nav>
    </div>
  );
}
