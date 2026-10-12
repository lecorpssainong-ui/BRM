import { Heart, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useLike } from '@/lib/useLike';
import AutoMedia from '@/components/shared/AutoMedia';

interface MassageCardProps {
  massage: any;
  onClick: () => void;
}

export default function MassageCard({ massage, onClick }: MassageCardProps) {
  const { hasLiked, count, toggleLike } = useLike('MassageType', massage);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
  };

  return (
    <div
      onClick={onClick}
      className="card-soft overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cacao/10">
          <AutoMedia
            url={massage.image_url}
            alt={massage.name}
            fallbackImage="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />

          {/* Like button */}
          <button
            type="button"
            onClick={handleLike}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition active:scale-[0.9] cursor-pointer"
            title="J'aime ce soin"
          >
            <Heart
              className={`w-4 h-4 transition ${
                hasLiked ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>

          {/* Duration badge */}
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium pointer-events-none">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span>{massage.duration_min || 60} min</span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-display text-xl sm:text-2xl text-cacao font-medium group-hover:text-gold transition-colors leading-tight mb-1.5">
            {massage.name}
          </h3>
          <p className="text-xs sm:text-sm text-cacao/65 line-clamp-2 leading-relaxed font-body">
            {massage.tagline || massage.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-cacao/5 mt-auto">
        <span className="font-display text-lg sm:text-xl font-bold text-cacao">
          {formatPrice(massage.price)}
        </span>
        <span className="text-xs font-semibold text-gold group-hover:underline">
          Découvrir →
        </span>
      </div>
    </div>
  );
}
