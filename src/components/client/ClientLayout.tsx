import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSettings } from '@/lib/queries';
import { useProfile } from '@/lib/clientProfile';
import { useAuth } from '@/lib/AuthContext';
import { useCachedQuery } from '@/lib/offline';
import { base44 } from '@/api/base44Client';
import Header from './Header';
import BottomNav from './BottomNav';
import OfflineBar from './OfflineBar';
import ClosedScreen from './ClosedScreen';
import ClientNotifier from './ClientNotifier';

export default function ClientLayout() {
  const location = useLocation();
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const profile = useProfile();

  const isModerator = user?.role === 'moderator';

  const { data: client } = useCachedQuery({
    queryKey: ['client-check', profile?.client_key || 'guest'],
    enabled: Boolean(profile?.client_key),
    queryFn: async () => {
      if (!profile?.client_key) return null;
      const res = await base44.entities.Client.filter({ client_key: profile.client_key });
      return res[0] || null;
    },
  });

  // Guard: Check countdown expiration
  const isCountdownExpired =
    settings?.is_countdown_active &&
    settings?.countdown_date &&
    Date.now() >= new Date(settings.countdown_date).getTime();

  // Guard: App locked (Kill Switch or Closed) unless master unlocked in session or moderator
  const isLocked =
    settings?.is_locked === true ||
    settings?.app_active === false ||
    settings?.app_opened === false ||
    Boolean(isCountdownExpired);

  const isMasterUnlocked =
    typeof window !== 'undefined' && sessionStorage.getItem('brm_master_unlock') === 'true';

  if (isLocked && !isMasterUnlocked && !isModerator) {
    return <ClosedScreen message={settings?.lock_message || settings?.closed_message} />;
  }

  // Guard: Client blocked
  if (client?.blocked && !isModerator) {
    return (
      <ClosedScreen
        blocked
        clientId={client.id}
        clientKey={profile?.client_key}
        onUnlock={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-sand text-cacao flex flex-col selection:bg-gold/30">
      <Header />
      <OfflineBar />

      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-36 flex-1"
      >
        <Outlet />
      </motion.main>

      <BottomNav />
      {profile && profile.client_key && <ClientNotifier clientKey={profile.client_key} />}
    </div>
  );
}
