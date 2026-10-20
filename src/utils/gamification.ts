import { Badge, Task, UserStats } from '../types';

export const INITIAL_STATS: UserStats = {
  streak: 5,
  longestStreak: 12,
  lastActiveDate: new Date().toISOString().split('T')[0],
  freezesAvailable: 2,
  totalXp: 850,
  level: 4,
  totalFocusMinutes: 480,
  completedTasksCount: 14,
  dailyGoalMinutes: 120,
};

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_spark',
    title: 'First Spark',
    description: 'Complete your first 25-minute Pomodoro session.',
    icon: 'Sparkles',
    unlocked: true,
    unlockedAt: '2026-10-15',
    progress: 1,
    target: 1,
    xpReward: 50,
  },
  {
    id: 'streak_3',
    title: 'Ritualist',
    description: 'Maintain a 3-day study streak.',
    icon: 'Flame',
    unlocked: true,
    unlockedAt: '2026-10-18',
    progress: 3,
    target: 3,
    xpReward: 100,
  },
  {
    id: 'streak_7',
    title: 'Flow State Adept',
    description: 'Achieve a 7-day uninterrupted study streak.',
    icon: 'Zap',
    unlocked: false,
    progress: 5,
    target: 7,
    xpReward: 250,
  },
  {
    id: 'deep_diver_10h',
    title: 'Deep Diver',
    description: 'Accumulate 10 total hours (600 minutes) in focus mode.',
    icon: 'Clock',
    unlocked: false,
    progress: 480,
    target: 600,
    xpReward: 300,
  },
  {
    id: 'task_slayer',
    title: 'Syllabus Crusher',
    description: 'Complete 20 study tasks with all subtasks verified.',
    icon: 'CheckCircle2',
    unlocked: false,
    progress: 14,
    target: 20,
    xpReward: 200,
  },
  {
    id: 'sound_zen',
    title: 'Resonant Mind',
    description: 'Study with binaural beats or ambient soundscapes for 2+ hours.',
    icon: 'Headphones',
    unlocked: true,
    unlockedAt: '2026-10-19',
    progress: 150,
    target: 120,
    xpReward: 120,
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Organic Chemistry: Reaction Mechanisms & Enantiomers',
    subject: 'Chemistry',
    priority: 'urgent',
    estimatedPoms: 3,
    completedPoms: 2,
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-1', title: 'Review SN1 vs SN2 nucleophilic substitution pathways', completed: true, minutes: 25, focusTip: 'Draw electron curly arrows by hand' },
      { id: 'st-2', title: 'Work 5 stereochemistry R/S configuration practice problems', completed: true, minutes: 25, focusTip: 'Use 3D mental rotation visualization' },
      { id: 'st-3', title: 'Summarize solvent polarities (protic vs aprotic)', completed: false, minutes: 20, focusTip: 'Highlight dielectric constants' },
    ],
  },
  {
    id: 't-2',
    title: 'Linear Algebra: Eigenvalues & Principal Component Analysis',
    subject: 'Mathematics',
    priority: 'high',
    estimatedPoms: 2,
    completedPoms: 1,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-4', title: 'Derive characteristic polynomial det(A - lambda*I) = 0', completed: true, minutes: 25 },
      { id: 'st-5', title: 'Connect covariance matrix diagonalization to PCA dimension reduction', completed: false, minutes: 25 },
    ],
  },
  {
    id: 't-3',
    title: 'Cognitive Neuroscience: Hippocampal Memory Consolidation',
    subject: 'Neuroscience',
    priority: 'medium',
    estimatedPoms: 2,
    completedPoms: 0,
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-6', title: 'Read Chapter 4 on Long-Term Potentiation (LTP)', completed: false, minutes: 30 },
      { id: 'st-7', title: 'Create 10 flashcards on NMDA receptor activation', completed: false, minutes: 20 },
    ],
  },
  {
    id: 't-4',
    title: 'Microeconomics: Game Theory & Nash Equilibrium',
    subject: 'Economics',
    priority: 'low',
    estimatedPoms: 1,
    completedPoms: 1,
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    completed: true,
    createdAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-8', title: 'Review Prisoner Dilemma payoff matrix', completed: true, minutes: 20 },
    ],
  },
];

export function calculateLevel(xp: number): { level: number; title: string; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  // Thresholds: L1: 0, L2: 200, L3: 500, L4: 900, L5: 1400, L6: 2000, L7: 2800, L8: 3800, L9: 5000, L10: 6500
  const thresholds = [0, 200, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500, 11000];
  const titles = [
    'Novice Inquirer',
    'Apprentice Scholar',
    'Focused Disciple',
    'Deep Thinker',
    'Knowledge Artisan',
    'Synthesizer',
    'Cognitive Master',
    'Polymath',
    'Grand Archon',
    'Transcendent Sage',
  ];

  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const baseForCurrent = thresholds[level - 1] || 0;
  const nextTarget = thresholds[level] || thresholds[level - 1] + 2000;
  const range = nextTarget - baseForCurrent;
  const currentLevelXp = xp - baseForCurrent;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / range) * 100)));

  const titleIndex = Math.min(titles.length - 1, Math.max(0, level - 1));
  const title = titles[titleIndex];

  return { level, title, currentLevelXp, nextLevelXp: range, progressPercent };
}

export function updateStreakOnStudy(stats: UserStats): UserStats {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = stats.lastActiveDate;

  if (lastDate === today) {
    return stats; // Already counted today
  }

  const dToday = new Date(today);
  const dLast = new Date(lastDate);
  const diffTime = Math.abs(dToday.getTime() - dLast.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const newStreak = stats.streak + 1;
    return {
      ...stats,
      streak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak),
      lastActiveDate: today,
    };
  } else if (diffDays === 2 && stats.freezesAvailable > 0) {
    // Used a streak freeze!
    const newStreak = stats.streak + 1;
    return {
      ...stats,
      streak: newStreak,
      freezesAvailable: stats.freezesAvailable - 1,
      longestStreak: Math.max(stats.longestStreak, newStreak),
      lastActiveDate: today,
    };
  } else {
    // Streak broken
    return {
      ...stats,
      streak: 1,
      lastActiveDate: today,
    };
  }
}
