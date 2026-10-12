import { useState } from 'react';
import { useAnnouncements } from '@/lib/queries';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Megaphone, Plus } from 'lucide-react';
import StatusStoryViewer from './StatusStoryViewer';

export default function StoriesStrip() {
  const { data: allAnnouncements = [] } = useAnnouncements();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  const now = new Date().getTime();
  const validStories = allAnnouncements
    .filter((a: any) => {
      if (a.active === false) return false;
      if (a.publish_at && new Date(a.publish_at).getTime() > now) return false;
      if (a.expires_at && new Date(a.expires_at).getTime() < now) return false;
      return true;
    })
    .sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (validStories.length === 0) return null;

  return (
    <section className="space-y-2">
      {/* Horizontal Stories Rings Carousel */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1 sm:px-2 snap-x select-none">
        {validStories.map((story: any, index: number) => {
          const title =
            story.title ||
            story.author_name ||
            story.text.slice(0, 18) ||
            `Statut ${index + 1}`;

          return (
            <motion.div
              key={story.id || index}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedStoryIndex(index)}
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 snap-start group"
            >
              {/* Gradient Story Ring */}
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-700 ring-2 ring-amber-400/40 group-hover:ring-amber-400/80 transition-all shadow-md group-hover:scale-105 duration-300 relative">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 flex items-center justify-center">
                  {Boolean(story.image_url && story.image_url.trim()) ? (
                    <img
                      src={story.image_url}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3D2619] to-[#1F140D] flex items-center justify-center text-amber-300">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Status Dot / Indicator */}
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-sand flex items-center justify-center text-[8px] text-stone-950 font-black">
                  ✦
                </span>
              </div>

              {/* Story Title Label */}
              <span className="text-[11px] font-semibold text-center truncate w-18 text-cacao/90 group-hover:text-gold transition-colors">
                {title}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Fullscreen Interactive Stories Viewer */}
      <AnimatePresence>
        {selectedStoryIndex !== null && validStories[selectedStoryIndex] && (
          <StatusStoryViewer
            stories={validStories}
            initialIndex={selectedStoryIndex}
            isOpen={true}
            onClose={() => setSelectedStoryIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
