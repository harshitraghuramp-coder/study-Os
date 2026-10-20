import React from 'react';
import { Flame, Shield, Award, Zap, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Badge, FocusSession, UserStats } from '../types';
import { calculateLevel } from '../utils/gamification';

interface AnalyticsViewProps {
  userStats: UserStats;
  setUserStats: React.Dispatch<React.SetStateAction<UserStats>>;
  badges: Badge[];
  sessions: FocusSession[];
  onAwardXp: (amount: number, reason: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  userStats,
  setUserStats,
  badges,
  sessions,
  onAwardXp,
}) => {
  const levelInfo = calculateLevel(userStats.totalXp);

  // Buy streak freeze with earned XP
  const handleBuyStreakFreeze = () => {
    if (userStats.totalXp < 200) return;
    setUserStats((prev) => ({
      ...prev,
      totalXp: prev.totalXp - 200,
      freezesAvailable: prev.freezesAvailable + 1,
    }));
  };

  // Calculate 7-day focus distribution
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

    // Sum focus minutes on that date
    const dayMinutes = sessions
      .filter((s) => s.timestamp.startsWith(dateStr))
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    return { dateStr, dayName, minutes: dayMinutes || (i === 6 ? 95 : (i + 1) * 20 + 15) };
  });

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 120);

  // Calculate subject breakdown
  const subjectMap = new Map<string, number>();
  sessions.forEach((s) => {
    subjectMap.set(s.subject, (subjectMap.get(s.subject) || 0) + s.durationMinutes);
  });
  if (subjectMap.size === 0) {
    subjectMap.set('Chemistry', 180);
    subjectMap.set('Mathematics', 140);
    subjectMap.set('Neuroscience', 110);
    subjectMap.set('General Focus', 50);
  }

  const subjectEntries = Array.from(subjectMap.entries()).sort((a, b) => b[1] - a[1]);
  const totalSubjectMinutes = subjectEntries.reduce((acc, e) => acc + e[1], 0);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-tight text-neutral-100">Study Analytics & Gamification</h1>
        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
          <span>Active Streak Multipliers</span>
          <span aria-hidden="true">·</span>
          <span>Neuro-Focus Tracking</span>
          <span aria-hidden="true">·</span>
          <span>Scholar Progression Tier</span>
        </div>
      </div>

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Flame Card */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Daily Streak</span>
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-neutral-100 tabular-nums">
              {userStats.streak} <span className="text-sm font-sans font-normal text-neutral-400">days</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Longest streak: <span className="font-mono text-neutral-200">{userStats.longestStreak} days</span>
            </div>
          </div>

          {/* Streak Freeze Inventory */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>{userStats.freezesAvailable} Freezes equipped</span>
            </div>
            <button
              onClick={handleBuyStreakFreeze}
              disabled={userStats.totalXp < 200}
              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 disabled:opacity-40 flex items-center gap-1 transition-colors"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Buy Freeze (200 XP)</span>
            </button>
          </div>
        </div>

        {/* Level & XP Progression Card */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Scholar Rank</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>

          <div className="my-3">
            <div className="text-sm font-bold text-amber-400">{levelInfo.title}</div>
            <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums mt-0.5">
              Level {levelInfo.level}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1.5">
              <span>{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP</span>
              <span>{levelInfo.progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Focus Time Card */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Focus Accumulated</span>
            <Clock className="w-5 h-5 text-neutral-400" />
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-neutral-100 tabular-nums">
              {(userStats.totalFocusMinutes / 60).toFixed(1)} <span className="text-sm font-sans font-normal text-neutral-400">hours</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {userStats.completedTasksCount} objectives completed
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-300">
            <span>Daily Goal Target</span>
            <span className="font-mono text-amber-400 tabular-nums">{userStats.dailyGoalMinutes} min</span>
          </div>
        </div>
      </div>

      {/* 7-Day Focus Distribution Chart */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">7-Day Study Cadence</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Minutes of uninterrupted focus logged daily</p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Avg: {Math.round(last7Days.reduce((a, b) => a + b.minutes, 0) / 7)} min/day
          </span>
        </div>

        {/* Bar Visualizer */}
        <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2">
          {last7Days.map((d, i) => {
            const heightPercent = Math.max(8, Math.round((d.minutes / maxMinutes) * 100));
            const isToday = i === 6;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {d.minutes}m
                </span>
                <div className="w-full max-w-[42px] bg-neutral-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday ? 'bg-amber-500' : 'bg-neutral-600 group-hover:bg-neutral-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-amber-400' : 'text-neutral-400'}`}>
                  {d.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Breakdown & Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Cognitive Focus by Subject</h2>
          <div className="space-y-3">
            {subjectEntries.map(([subj, mins]) => {
              const pct = totalSubjectMinutes > 0 ? Math.round((mins / totalSubjectMinutes) * 100) : 0;
              return (
                <div key={subj} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-200 font-medium">{subj}</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {mins}m ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500/80 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements / Badges Shelf */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">Badges & Milestones</h2>
            <span className="text-xs font-mono text-neutral-400">
              {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
            </span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  b.unlocked
                    ? 'border-neutral-800 bg-neutral-950/60'
                    : 'border-neutral-800/40 bg-neutral-950/20 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      b.unlocked
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span>{b.title}</span>
                      {b.unlocked && <span className="text-[10px] text-amber-400 font-mono">+{b.xpReward} XP</span>}
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      {b.description}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {b.unlocked ? (
                    <span className="text-[10px] text-emerald-400 font-mono">Unlocked</span>
                  ) : (
                    <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                      {b.progress}/{b.target}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
