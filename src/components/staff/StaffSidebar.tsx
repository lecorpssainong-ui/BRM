import { motion } from 'framer-motion';
import {
  LogOut,
  Sparkles,
} from 'lucide-react';

export interface StaffSectionItem {
  value: string;
  label: string;
  icon: any;
  badgeCount?: number;
  description?: string;
}

interface StaffSidebarProps {
  sections: StaffSectionItem[];
  currentSection: string;
  onSelectSection: (val: string) => void;
  user: any;
  onLogout: () => void;
  viewMode?: 'tabs' | 'grid';
  onToggleViewMode?: () => void;
}

export default function StaffSidebar({
  sections,
  currentSection,
  onSelectSection,
  user,
  onLogout,
  viewMode = 'tabs',
}: StaffSidebarProps) {
  return (
    <>
      {/* DESKTOP SIDEBAR (280px left navigation in Tabs mode) */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-[#241711] text-sand flex-col justify-between p-5 border-r border-amber-900/40 shadow-2xl z-20 select-none sticky top-16 h-[calc(100vh-4rem)]">
        <div className="space-y-3 overflow-hidden flex flex-col flex-1">
          <div className="px-2 pt-1 flex items-center justify-between">
            <span className="eyebrow text-amber-300/90 text-[10px] block font-bold tracking-widest uppercase">
              Rubriques & Modules
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-400/20">
              {sections.length} onglets
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 overflow-y-auto flex-1 no-scrollbar pr-1 py-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.value === currentSection && viewMode !== 'grid';

              return (
                <button
                  key={sec.value}
                  type="button"
                  onClick={() => onSelectSection(sec.value)}
                  className={`relative w-full px-3 py-2.5 rounded-2xl flex items-center justify-between text-xs font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'text-stone-950 font-bold bg-gold shadow-md'
                      : 'text-sand/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 z-10 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-950' : 'text-amber-300/80'}`} />
                    <span className="truncate">{sec.label}</span>
                  </div>

                  {sec.badgeCount !== undefined && sec.badgeCount > 0 && (
                    <span
                      className={`z-10 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                        isActive ? 'bg-stone-950 text-amber-300' : 'bg-amber-400 text-stone-950'
                      }`}
                    >
                      {sec.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile info */}
        <div className="pt-3 border-t border-amber-900/40 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-bold text-sand block truncate">
              {user?.nom || user?.full_name || 'Staff BRM'}
            </span>
            <span className="text-[10px] text-amber-300/70 block uppercase tracking-wider font-mono truncate">
              {user?.email}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-500/20 transition cursor-pointer shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE HORIZONTAL SCROLL NAV UNDER GLOBAL HEADER */}
      <div className="lg:hidden sticky top-16 z-20 bg-[#241711]/95 text-sand border-b border-amber-900/40 backdrop-blur-md px-3 py-2">
        <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = sec.value === currentSection && viewMode !== 'grid';

            return (
              <button
                key={sec.value}
                type="button"
                onClick={() => onSelectSection(sec.value)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gold text-stone-950 font-bold shadow-sm'
                    : 'bg-white/10 text-sand/80 hover:bg-white/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
                {sec.badgeCount !== undefined && sec.badgeCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    isActive ? 'bg-stone-950 text-amber-300' : 'bg-amber-400 text-stone-950'
                  }`}>
                    {sec.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
