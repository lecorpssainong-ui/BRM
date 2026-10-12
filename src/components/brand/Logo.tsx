import { useAppSettings } from '@/lib/queries';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const { data: settings } = useAppSettings();

  const dims = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  const appTitle = settings?.header_title || settings?.center_name || 'Bénin Réflexologie Massage';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${dims} rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-gold/40 relative bg-[#1E130D] flex items-center justify-center`}>
        <img
          src="/logo-brm-v2.png"
          alt={appTitle}
          className="w-full h-full object-contain p-0.5 rounded-2xl"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-display font-bold text-cacao dark:text-sand text-base md:text-lg tracking-wide">
            {appTitle}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
            Massage & Réflexologie
          </span>
        </div>
      )}
    </div>
  );
}
