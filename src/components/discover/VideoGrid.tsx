import { useState } from 'react';
import VideoThumb from '@/components/video/VideoThumb';
import ShortsViewer from '@/components/video/ShortsViewer';

interface VideoGridProps {
  videos: any[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Filter out long videos from main short grid
  const shortVideos = videos.filter((v) => v.format !== 'long');

  if (shortVideos.length === 0) {
    return (
      <div className="card-soft p-12 text-center max-w-md mx-auto my-6">
        <h4 className="font-display text-xl text-cacao mb-1">Aucune vidéo disponible</h4>
        <p className="text-xs text-cacao/65">Les nouvelles capsules vidéo de réflexologie seront bientôt publiées.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {shortVideos.map((video, idx) => (
          <VideoThumb
            key={video.id || idx}
            video={video}
            onClick={() => setSelectedIdx(idx)}
          />
        ))}
      </div>

      {selectedIdx !== null && (
        <ShortsViewer
          videos={shortVideos}
          initialIndex={selectedIdx}
          onClose={() => setSelectedIdx(null)}
        />
      )}
    </div>
  );
}
