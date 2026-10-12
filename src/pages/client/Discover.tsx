import { useSearchParams } from 'react-router-dom';
import { useVideos } from '@/lib/queries';
import PageHeader from '@/components/shared/PageHeader';
import SegmentedTabs, { TabItem } from '@/components/shared/SegmentedTabs';
import VideoFeed from '@/components/VideoFeed';
import Playlists from '@/components/discover/Playlists';
import HealthToolsHub from '@/components/tools/HealthToolsHub';
import AnamnesisGallery from '@/components/anamnesis/AnamnesisGallery';
import ProfileSettings from '@/components/discover/ProfileSettings';
import { Clapperboard, ListVideo, Calculator, ClipboardList, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function Discover() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'videos';
  const { data: videos = [] } = useVideos();

  const TABS: TabItem[] = [
    { value: 'videos', label: t('discover.tabVideos'), icon: Clapperboard },
    { value: 'playlists', label: t('discover.tabPlaylists'), icon: ListVideo },
    { value: 'tools', label: t('discover.tabTools'), icon: Calculator },
    { value: 'anamnesis', label: t('discover.tabAnamnesis'), icon: ClipboardList },
    { value: 'settings', label: t('discover.tabSettings'), icon: Settings },
  ];

  const activeTab = ['videos', 'playlists', 'tools', 'anamnesis', 'settings'].includes(currentTab)
    ? currentTab
    : 'videos';

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('discover.eyebrow')}
        title={t('discover.title')}
        subtitle={t('discover.subtitle')}
      >
        <SegmentedTabs
          id="discover-tabs"
          tabs={TABS}
          value={activeTab}
          onChange={handleTabChange}
        />
      </PageHeader>

      {activeTab === 'videos' && <VideoFeed videos={videos} />}
      {activeTab === 'playlists' && <Playlists videos={videos} />}
      {activeTab === 'tools' && <HealthToolsHub />}
      {activeTab === 'anamnesis' && <AnamnesisGallery />}
      {activeTab === 'settings' && <ProfileSettings />}
    </div>
  );
}
