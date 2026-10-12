import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedTabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

export default function SegmentedTabs({
  tabs,
  value,
  onChange,
  id = 'segmented-tabs',
  className = '',
}: SegmentedTabsProps) {
  return (
    <div className={`overflow-x-auto no-scrollbar py-1 ${className}`}>
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-cacao/10 border border-cacao/10 backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer z-10 ${
                isActive ? 'text-cacao font-semibold' : 'text-cacao/65 hover:text-cacao'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`pill-${id}`}
                  className="absolute inset-0 rounded-full bg-sand shadow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  style={{ zIndex: -1 }}
                />
              )}
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
