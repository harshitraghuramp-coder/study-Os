import React from 'react';
import { Flame, Headphones, Moon, Sun, Trees, Palette, Sparkles } from 'lucide-react';
import { AppTheme, UserStats } from '../types';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userStats: UserStats;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  onOpenSoundMixer: () => void;
  activeSoundsCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  userStats,
  theme,
  setTheme,
  onOpenSoundMixer,
  activeSoundsCount,
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'timer', label: 'Focus Timer' },
    { id: 'tasks', label: 'Tasks & AI' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'spec', label: 'System Blueprint' },
  ];

  const themes: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Focus Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Clean Paper', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'forest', label: 'Forest Zen', icon: <Trees className="w-3.5 h-3.5" /> },
    { id: 'midnight', label: 'Midnight OLED', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'sunset', label: 'Sunset Warmth', icon: <Palette className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark (Single text element wordmark in display face) */}
        <button
          onClick={() => setActiveTab('timer')}
          className="text-lg font-bold tracking-tight text-neutral-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <span>AuraFocus</span>
          <span className="text-[11px] font-mono text-neutral-400 font-normal hidden sm:inline">
            Focus OS
          </span>
        </button>

        {/* Zone 2: 4-5 single-line clean text nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                  isActive
                    ? 'text-neutral-100 font-semibold'
                    : 'hover:text-neutral-200 text-neutral-400'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Soundscape Quick Access Button */}
          <button
            onClick={onOpenSoundMixer}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeSoundsCount > 0
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
            title="Open Ambient Soundscapes"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Soundscape</span>
            {activeSoundsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Gamified Streak Badge */}
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 whitespace-nowrap shrink-0"
            title={`${userStats.streak} day streak. Longest: ${userStats.longestStreak} days`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-mono tabular-nums font-semibold">{userStats.streak}</span>
            <span className="text-neutral-400 hidden lg:inline">d</span>
          </button>

          {/* Adaptive Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors"
              title="Change visual theme"
              aria-label="Theme selector"
            >
              <Palette className="w-4 h-4" />
            </button>

            {themeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setThemeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-1.5 z-40">
                  <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Visual Style
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                        theme === t.id
                          ? 'text-amber-400 font-medium bg-amber-500/10'
                          : 'text-neutral-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {t.icon}
                        {t.label}
                      </span>
                      {theme === t.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/80 bg-neutral-950 px-2 py-1 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`py-2 px-2 transition-colors whitespace-nowrap ${
              activeTab === item.id
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-neutral-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
