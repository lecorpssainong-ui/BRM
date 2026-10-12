import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <span className="eyebrow block mb-1.5">{eyebrow}</span>}
        <h1 className="font-display text-3xl md:text-5xl text-cacao font-medium tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-cacao/60 text-sm md:text-base max-w-xl mt-2 leading-relaxed font-body">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="shrink-0 flex items-center gap-2">{children}</div>}
    </div>
  );
}
