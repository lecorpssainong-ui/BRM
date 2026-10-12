import { useState, useEffect } from 'react';
import { useDataPref, isWifi, DataPreference } from '@/lib/dataPref';
import { storedCount, clearVideoStore } from '@/lib/videoStore';
import { Wifi, Signal, Hand, Ban, Trash2, CheckCircle2, Database } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { useTranslation } from '@/lib/i18n';

export default function DataSaverSettings() {
  const { t } = useTranslation();
  const [pref, setPref] = useDataPref();
  const [videoCount, setVideoCount] = useState<number>(0);
  const [clearing, setClearing] = useState<boolean>(false);
  const [clearedSuccess, setClearedSuccess] = useState<boolean>(false);
  const currentWifi = isWifi();

  const modes: Array<{
    value: DataPreference;
    label: string;
    desc: string;
    icon: any;
  }> = [
    {
      value: 'wifi',
      label: t('settings.modeWifi'),
      desc: t('settings.modeWifiDesc'),
      icon: Wifi,
    },
    {
      value: 'always',
      label: t('settings.modeAlways'),
      desc: t('settings.modeAlwaysDesc'),
      icon: Signal,
    },
    {
      value: 'manual',
      label: t('settings.modeManual'),
      desc: t('settings.modeManualDesc'),
      icon: Hand,
    },
    {
      value: 'never',
      label: t('settings.modeNever'),
      desc: t('settings.modeNeverDesc'),
      icon: Ban,
    },
  ];

  useEffect(() => {
    storedCount().then(setVideoCount);
  }, [clearedSuccess]);

  const handleSelectPref = (mode: (typeof modes)[0]) => {
    setPref(mode.value);
    toast({
      title: 'Préférence enregistrée',
      description: `Mode "${mode.label}" activé pour la gestion des données.`,
      variant: 'success',
    });
  };

  const handleClearCache = async () => {
    setClearing(true);
    await clearVideoStore();
    setClearing(false);
    setClearedSuccess(true);
    setVideoCount(0);
    toast({
      title: 'Cache vidé',
      description: 'La mémoire locale a été totalement libérée.',
      variant: 'success',
    });
    setTimeout(() => setClearedSuccess(false), 2500);
  };

  return (
    <div className="card-soft p-6 sm:p-8 space-y-6 font-body">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold mb-1">
          <Database className="w-4 h-4" />
          <span>{t('settings.dataSaverSubtitle')}</span>
        </div>
        <h3 className="font-display text-2xl text-cacao font-medium">
          {t('settings.dataConsumption')}
        </h3>
        <p className="text-xs sm:text-sm text-cacao/70 mt-1 flex items-center gap-1.5">
          {currentWifi ? (
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('settings.networkWifi')}</span>
            </span>
          ) : (
            <span className="text-amber-700 font-semibold inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t('settings.networkMobile')}</span>
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = pref === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => handleSelectPref(mode)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer active:scale-98 ${
                isSelected
                  ? 'border-gold bg-gold/15 shadow-md text-cacao font-medium'
                  : 'border-cacao/10 bg-white/50 hover:bg-white/80 text-cacao/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-cacao">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-gold' : 'text-cacao/60'}`} />
                  <span>{mode.label}</span>
                </div>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-gold shrink-0 shadow-xs" />
                )}
              </div>
              <p className="text-xs text-cacao/70 leading-relaxed font-body">
                {mode.desc}
              </p>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-cacao/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-cacao/70">
            {t('settings.localMediaSaved')}
          </div>
          <div className="text-sm font-bold text-cacao flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{videoCount} {t('settings.offlineItems')}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={clearing || videoCount === 0}
          onClick={handleClearCache}
          className="btn-soft text-xs py-2 px-4 inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {clearedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('settings.cacheCleared')}</span>
            </>
          ) : clearing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-cacao border-t-transparent rounded-full animate-spin" />
              <span>{t('settings.cleaning')}</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5 text-cacao/60" />
              <span>{t('settings.clearCache')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
