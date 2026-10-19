'use client';

import React from 'react';
import {
  Compass,
  Film,
  Music2,
  Tv,
  ListMusic,
  Sparkles,
  Flame,
  Radio,
} from 'lucide-react';

interface NavigationProps {
  currentView: 'videos' | 'music' | 'shorts' | 'queue';
  onViewChange: (view: 'videos' | 'music' | 'shorts' | 'queue') => void;
  queueCount: number;
}

export function NavigationRail({
  currentView,
  onViewChange,
  queueCount,
}: NavigationProps) {
  interface NavItem {
    id: 'videos' | 'music' | 'shorts' | 'queue';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'videos', label: 'Videos', icon: Tv },
    { id: 'music', label: 'Music', icon: Music2 },
    { id: 'shorts', label: 'Shorts', icon: Film },
    { id: 'queue', label: 'Queue', icon: ListMusic, badge: queueCount > 0 ? queueCount : undefined },
  ];

  return (
    <>
      {/* Desktop Left MD3E Navigation Rail (>= 768px) */}
      <aside className="hidden md:flex flex-col items-center w-20 lg:w-60 bg-[#0e1117] border-r border-[#212737] py-4 flex-shrink-0 select-none">
        {/* Navigation Items List */}
        <nav className="flex-1 w-full px-2 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-full text-xs font-medium transition-all group min-h-[48px] ${
                  isActive
                    ? 'bg-[#5d1a04] text-[#ffdbd1] font-semibold'
                    : 'text-[#9da4b6] hover:text-white hover:bg-[#191e2a]'
                }`}
                aria-label={item.label}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#ff6f43] text-black shadow-md' : 'text-[#9da4b6] group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span className="hidden lg:inline text-sm">{item.label}</span>

                {item.badge !== undefined && (
                  <span className="hidden lg:inline ml-auto px-2 py-0.5 rounded-full bg-[#ff6f43] text-black text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Rail Widget */}
        <div className="hidden lg:block w-full px-4 pt-4 border-t border-[#212737]">
          <div className="p-3 rounded-2xl bg-[#191e2a] text-xs text-[#9da4b6]">
            <div className="flex items-center gap-1.5 text-white font-medium mb-1">
              <Radio className="w-4 h-4 text-[#ff6f43]" />
              InnerTube Direct
            </div>
            <p className="text-[11px] leading-tight">
              Ad-free, tracking-free streaming with native HLS & adaptive audio formats.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) with Safe Area inset */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e1117]/95 backdrop-blur-xl border-t border-[#212737] flex items-center justify-around px-2 py-1 pb-[max(8px,env(safe-area-inset-bottom))] select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 active:scale-95 transition-transform"
              aria-label={item.label}
            >
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#5d1a04] text-[#ff6f43]'
                    : 'text-[#9da4b6] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#ff6f43]' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-[#ff6f43] text-black text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 ${
                  isActive ? 'text-[#ffdbd1] font-semibold' : 'text-[#9da4b6]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
