export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  minutes?: number;
  focusTip?: string;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  estimatedPoms: number;
  completedPoms: number;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  subtasks: Subtask[];
  notes?: string;
  createdAt: string;
}

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'flow';

export interface FocusSession {
  id: string;
  timestamp: string; // ISO
  durationMinutes: number;
  mode: TimerMode;
  taskId?: string;
  taskTitle?: string;
  subject: string;
  completed: boolean;
}

export interface UserStats {
  streak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  freezesAvailable: number;
  totalXp: number;
  level: number;
  totalFocusMinutes: number;
  completedTasksCount: number;
  dailyGoalMinutes: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  xpReward: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  subject: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  taskId?: string;
  isCompleted?: boolean;
}

export type SoundType = 'rain' | 'binaural' | 'brownnoise' | 'pinknoise' | 'forest' | 'lofi';

export interface SoundTrackState {
  id: SoundType;
  name: string;
  description: string;
  category: 'nature' | 'neuro' | 'noise' | 'ambient';
  volume: number; // 0 to 1
  isPlaying: boolean;
}

export type AppTheme = 'dark' | 'light' | 'forest' | 'midnight' | 'sunset';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mode?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}
