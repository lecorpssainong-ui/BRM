import { useState } from 'react';
import { useMassages } from '@/lib/queries';
import MassageCard from './MassageCard';
import MassageDetailSheet from './MassageDetailSheet';
import ShortsViewer from '@/components/video/ShortsViewer';
import { useTranslation } from '@/lib/i18n';

export default function MassageCollection() {
  const { t } = useTranslation();
  const { data: massages = [], isLoading } = useMassages();
  const [selectedMassage, setSelectedMassage] = useState<any | null>(null);
  const [videoState, setVideoState] = useState<{ list: any[]; index: number } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/40 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="aspect-[4/3] rounded-3xl bg-white/40 animate-pulse" />
          <div className="aspect-[4/3] rounded-3xl bg-white/40 animate-pulse" />
          <div className="aspect-[4/3] rounded-3xl bg-white/40 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="eyebrow block mb-1">{t('massages.eyebrow')}</span>
          <h2 className="font-display text-3xl sm:text-4xl text-cacao font-medium">
            {t('massages.title')}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-cacao/60 max-w-sm">
          {t('massages.subtitle')}
        </p>
      </div>

      <div className="relative">
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 sm:gap-6 pb-4 pt-1 px-1">
          {massages.map((massage: any) => (
            <div
              key={massage.id}
              className="snap-start shrink-0 w-[84vw] sm:w-[340px] md:w-[380px]"
            >
              <MassageCard
                massage={massage}
                onClick={() => setSelectedMassage(massage)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Detail Sheet */}
      {selectedMassage && (
        <MassageDetailSheet
          massage={selectedMassage}
          onClose={() => setSelectedMassage(null)}
          onSelectVideo={(v, related) => {
            const list = related && related.length > 0 ? related : [v];
            const idx = Math.max(0, list.findIndex((item) => item.id === v.id));
            setVideoState({ list, index: idx });
          }}
        />
      )}

      {/* Video Viewer for associated videos */}
      {videoState && (
        <ShortsViewer
          videos={videoState.list}
          initialIndex={videoState.index}
          onClose={() => setVideoState(null)}
        />
      )}
    </section>
  );
}
