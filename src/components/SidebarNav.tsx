import React from 'react';
import {
  Home,
  Calendar,
  Timer,
  BookOpen,
  Sparkles,
  BarChart2,
  RotateCw,
  Sun,
  Moon,
  Laptop,
  User,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { ThemePreference, UserProfile } from '../types/studyos';

interface SidebarNavProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  profile: UserProfile;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  onOpenSoundMixer: () => void;
  onOpenProfile: () => void;
  activeSoundsCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeNav,
  setActiveNav,
  profile,
  themePreference,
  setThemePreference,
  onOpenSoundMixer,
  onOpenProfile,
  activeSoundsCount,
}) => {
  const mainNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'planner', label: 'Planner', icon: <Calendar className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus', icon: <Timer className="w-4 h-4" /> },
    { id: 'library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'coach', label: 'Universal AI', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'revision', label: 'Revision', icon: <RotateCw className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-950 p-4 shrink-0 justify-between select-none">
        <div className="space-y-6">
          {/* Brand Lockup */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => setActiveNav('home')}
              className="flex items-center gap-2.5 text-left text-neutral-100 hover:text-indigo-400 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30">
                S
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block leading-tight">StudyOS</span>
                <span className="text-[10px] text-neutral-400 font-mono">Personal Study OS</span>
              </div>
            </button>
          </div>

          {/* Quick Focus Action Button */}
          <button
            onClick={() => setActiveNav('focus')}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Start Focus Session</span>
          </button>

          {/* Main Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Workspace
            </div>
            {mainNavItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-neutral-100 font-semibold border border-neutral-800 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-400' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility & Profile Controls */}
        <div className="space-y-3 pt-4 border-t border-neutral-800/80">
          {/* Ambient Soundscapes Button */}
          <button
            onClick={onOpenSoundMixer}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-colors ${
              activeSoundsCount > 0
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5" />
              <span>Ambient Audio</span>
            </div>
            {activeSoundsCount > 0 && (
              <span className="text-[10px] font-mono font-medium text-indigo-400">
                {activeSoundsCount} on
              </span>
            )}
          </button>

          {/* Theme Preference Segmented Control */}
          <div className="flex items-center justify-between p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
            <button
              onClick={() => setThemePreference('light')}
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors ${
                themePreference === 'light' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemePreference('dark')}
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors ${
                themePreference === 'dark' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemePreference('system')}
              className={`flex-1 py-1 rounded flex items-center justify-center transition-colors ${
                themePreference === 'system' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="System Default Theme"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Profile Summary */}
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-neutral-900 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200 shrink-0">
                {profile.display_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-neutral-200 truncate">{profile.display_name}</div>
                <div className="text-[10px] text-neutral-400 capitalize truncate">{profile.learning_category.replace('_', ' ')}</div>
              </div>
            </div>
            <User className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setActiveNav('home')}
          className="flex items-center gap-2 text-neutral-100 font-bold text-sm"
        >
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs">
            S
          </div>
          <span>StudyOS</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSoundMixer}
            className={`p-1.5 rounded-lg border text-xs ${
              activeSoundsCount > 0
                ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
                : 'border-neutral-800 text-neutral-400'
            }`}
            aria-label="Soundscape mixer"
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenProfile}
            className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-semibold flex items-center justify-center text-neutral-200"
            aria-label="Profile"
          >
            {profile.display_name.charAt(0)}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around z-40">
        {mainNavItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-neutral-500'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
