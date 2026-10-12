import { MapPin, Clock, Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { useAppSettings } from '@/lib/queries';
import { useTranslation } from '@/lib/i18n';

export default function CenterCard() {
  const { data: settings } = useAppSettings();
  const { t, currentLang } = useTranslation();

  const isFrench = currentLang === 'fr';
  const centerName = settings?.center_name || t('center.name');
  const address = settings?.address || 'Rue 340, Haie Vive, Cotonou, Bénin';
  const landmark = settings?.center_landmark;
  const city = settings?.center_city || 'Cotonou';
  const hours = !isFrench || !settings?.opening_hours ? t('center.hoursSchedule') : settings.opening_hours;
  const phone = settings?.center_phone || '+229 97 00 00 00';
  const whatsapp = settings?.whatsapp || phone;
  const mapUrl = settings?.center_map_url || 'https://maps.google.com/?q=6.3535,2.4045';

  const cleanWhatsapp = String(whatsapp).replace(/\D/g, '');

  return (
    <div className="card-soft p-6 sm:p-10 space-y-8">
      <div>
        <span className="eyebrow block mb-1">{t('center.eyebrow')}</span>
        <h2 className="font-display text-3xl sm:text-4xl text-cacao font-medium">
          {centerName}
        </h2>
        {settings?.welcome_message && (
          <p className="text-xs sm:text-sm text-cacao/70 max-w-xl mt-2 leading-relaxed font-body">
            {settings.welcome_message}
          </p>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-cacao/10 font-body">
        {/* Address */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cacao/50 block mb-1">
              {t('center.location')}
            </span>
            <p className="text-sm font-semibold text-cacao">{address}</p>
            {landmark && (
              <p className="text-xs text-cacao/65 mt-0.5">{t('center.landmark')} : {landmark}</p>
            )}
            <p className="text-xs text-cacao/55">{city}, Bénin</p>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cacao/50 block mb-1">
              {t('center.hours')}
            </span>
            <p className="text-sm font-semibold text-cacao">{hours}</p>
            <p className="text-xs text-cacao/65 mt-0.5">{t('center.byAppointment')}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold shrink-0 mt-0.5">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cacao/50 block mb-1">
              {t('center.phoneAndDesk')}
            </span>
            <p className="text-sm font-semibold text-cacao">{phone}</p>
            {settings?.center_email && (
              <p className="text-xs text-cacao/65 mt-0.5">{settings.center_email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3.5 pt-2">
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>{t('center.locateOnMap')}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        )}

        {cleanWhatsapp && (
          <a
            href={`https://wa.me/${cleanWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>{t('center.contactWhatsapp')}</span>
          </a>
        )}
      </div>
    </div>
  );
}
