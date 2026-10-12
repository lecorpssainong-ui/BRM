import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CalendarHeart,
  MessageCircle,
  ShoppingBag,
  Compass,
  Calculator,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function QuickBridges() {
  const { t } = useTranslation();

  const BRIDGES = [
    {
      to: '/rendez-vous',
      title: t('bridges.myAppointments'),
      subtitle: t('bridges.myAppointmentsSub'),
      icon: CalendarHeart,
      style: 'bg-stone-900 text-sand hover:bg-stone-850',
      iconColor: 'text-amber-300',
    },
    {
      to: '/messages',
      title: t('bridges.communication'),
      subtitle: t('bridges.communicationSub'),
      icon: MessageCircle,
      style: 'bg-gradient-to-br from-amber-700 to-amber-800 text-sand hover:from-amber-650 hover:to-amber-750',
      iconColor: 'text-sand',
    },
    {
      to: '/boutique',
      title: t('bridges.shop'),
      subtitle: t('bridges.shopSub'),
      icon: ShoppingBag,
      style: 'bg-white/80 text-cacao hover:bg-white border border-white',
      iconColor: 'text-gold',
    },
    {
      to: '/decouvertes',
      title: t('bridges.discover'),
      subtitle: t('bridges.discoverSub'),
      icon: Compass,
      style: 'bg-white/80 text-cacao hover:bg-white border border-white',
      iconColor: 'text-gold',
    },
    {
      to: '/decouvertes?tab=tools',
      title: t('bridges.healthTools'),
      subtitle: t('bridges.healthToolsSub'),
      icon: Calculator,
      style: 'bg-emerald-800 text-emerald-50 hover:bg-emerald-750',
      iconColor: 'text-emerald-300',
    },
    {
      to: '/historique-commandes',
      title: t('bridges.myOrders'),
      subtitle: t('bridges.myOrdersSub'),
      icon: Receipt,
      style: 'bg-white/80 text-cacao hover:bg-white border border-white',
      iconColor: 'text-gold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Big Advisor Banner */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 md:p-10 bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-sand shadow-xl border border-amber-500/20">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-gold/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xl">
          <span className="eyebrow text-amber-200 block mb-2">
            {t('bridges.badge')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-sand font-normal mb-3">
            {t('bridges.advisorTitle')}
          </h2>
          <p className="text-sand/80 text-xs sm:text-sm leading-relaxed mb-6 font-body">
            {t('bridges.advisorDesc')}
          </p>

          <Link
            to="/conseiller-ia"
            className="btn-dark bg-stone-950 text-sand hover:bg-black inline-flex items-center gap-2 text-xs sm:text-sm shadow-md"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>{t('bridges.talkToAdvisor')}</span>
          </Link>
        </div>
      </div>

      {/* Grid of 6 Bridge Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
        {BRIDGES.map((bridge, i) => {
          const Icon = bridge.icon;
          return (
            <motion.div
              key={bridge.to}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <Link
                to={bridge.to}
                className={`group relative h-32 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] ${bridge.style}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-2xl bg-black/10 shrink-0 ${bridge.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>

                <div>
                  <h3 className="font-display font-medium text-base sm:text-lg leading-tight">
                    {bridge.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs opacity-70 truncate mt-0.5">
                    {bridge.subtitle}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
