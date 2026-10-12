import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  eyebrow?: string;
  resultValue?: string;
  resultLabel?: string;
  advice?: string;
  children: ReactNode;
}

export default function ToolCard({
  icon: Icon,
  title,
  eyebrow,
  resultValue,
  resultLabel,
  advice,
  children,
}: ToolCardProps) {
  return (
    <div className="card-soft p-6 sm:p-7 flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            {eyebrow && <span className="eyebrow block text-[10px]">{eyebrow}</span>}
            <h3 className="font-display text-xl sm:text-2xl text-cacao font-medium leading-tight">
              {title}
            </h3>
          </div>
        </div>

        <div className="space-y-4 pt-2 font-body text-xs sm:text-sm">
          {children}
        </div>
      </div>

      {resultValue && (
        <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20 space-y-2 mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-cacao/70 font-semibold">{resultLabel || 'Résultat'}</span>
            <span className="font-display text-2xl font-bold text-cacao">{resultValue}</span>
          </div>
          {advice && (
            <p className="text-xs text-cacao/80 italic font-body pt-1 border-t border-gold/15">
              💡 {advice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
