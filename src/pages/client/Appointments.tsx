import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import SegmentedTabs, { TabItem } from '@/components/shared/SegmentedTabs';
import ProfileRequired from '@/components/shared/ProfileRequired';
import MyAppointments from '@/components/appointments/MyAppointments';
import BookAppointment from '@/components/appointments/BookAppointment';
import InvoicesTab from '@/components/client/InvoicesTab';
import { CalendarHeart, CalendarPlus, Receipt } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function Appointments() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'appointments';
  const massageParam = searchParams.get('massage') || '';

  // Support both 'appointments' and 'mine' as active tab key (default: appointments)
  const currentTab = rawTab === 'mine' ? 'appointments' : rawTab;

  const TABS: TabItem[] = [
    { value: 'appointments', label: t('appointments.tabMine', 'Rendez-vous'), icon: CalendarHeart },
    { value: 'book', label: t('appointments.tabBook', 'Planifier'), icon: CalendarPlus },
    { value: 'invoices', label: t('appointments.tabInvoices', 'Factures'), icon: Receipt },
  ];

  const activeTab = ['appointments', 'book', 'invoices'].includes(currentTab) ? currentTab : 'appointments';

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <ProfileRequired reason="Pour gérer vos rendez-vous, réservations et factures, veuillez indiquer votre identité.">
      <div className="space-y-6">
        <PageHeader
          eyebrow={t('appointments.eyebrow')}
          title={t('appointments.title')}
          subtitle={t('appointments.subtitle')}
        >
          <SegmentedTabs
            id="appts-tabs"
            tabs={TABS}
            value={activeTab}
            onChange={handleTabChange}
          />
        </PageHeader>

        {(activeTab === 'appointments' || activeTab === 'mine') && (
          <MyAppointments onGoToBook={() => handleTabChange('book')} />
        )}

        {activeTab === 'book' && (
          <BookAppointment
            initialMassageName={massageParam}
            onSuccess={() => handleTabChange('appointments')}
          />
        )}

        {activeTab === 'invoices' && <InvoicesTab />}
      </div>
    </ProfileRequired>
  );
}
