import AiChatFullScreen from '@/components/chat/AiChatFullScreen';
import { useAppSettings } from '@/lib/queries';
import { useAuth } from '@/lib/AuthContext';
import ClosedScreen from '@/components/client/ClosedScreen';

export default function Advisor() {
  const { data: settings } = useAppSettings();
  const { user } = useAuth();

  const isModerator = user?.role === 'moderator';

  const isCountdownExpired =
    settings?.is_countdown_active &&
    settings?.countdown_date &&
    Date.now() >= new Date(settings.countdown_date).getTime();

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

  return <AiChatFullScreen isPageMode={true} initialFullScreen={true} />;
}
