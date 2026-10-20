import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2, CheckCircle2, Headphones, Flame, Award, ChevronDown } from 'lucide-react';
import { FocusSession, Task, TimerMode, UserStats } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface TimerViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  onSessionComplete: (session: FocusSession) => void;
  userStats: UserStats;
  onOpenSoundMixer: () => void;
  activeSoundsCount: number;
}

const MODE_CONFIGS: Record<TimerMode, { label: string; durationMinutes: number; xp: number }> = {
  pomodoro: { label: 'Pomodoro', durationMinutes: 25, xp: 50 },
  short_break: { label: 'Short Break', durationMinutes: 5, xp: 10 },
  long_break: { label: 'Long Break', durationMinutes: 15, xp: 20 },
  flow: { label: 'Flow Stopwatch', durationMinutes: 0, xp: 60 },
};

export const TimerView: React.FC<TimerViewProps> = ({
  tasks,
  activeTaskId,
  setActiveTaskId,
  onSessionComplete,
  userStats,
  onOpenSoundMixer,
  activeSoundsCount,
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedFlowSeconds, setElapsedFlowSeconds] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const totalDuration = MODE_CONFIGS[mode].durationMinutes * 60;

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  // Sync timer when mode changes
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMode(newMode);
    if (newMode === 'flow') {
      setElapsedFlowSeconds(0);
    } else {
      setTimeLeft(MODE_CONFIGS[newMode].durationMinutes * 60);
    }
  };

  // Keyboard shortcut: Spacebar to toggle timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.code === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Main countdown/countup effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        if (mode === 'flow') {
          setElapsedFlowSeconds((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleCompleteSession();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleCompleteSession = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    soundEngine.playCompletionChime();

    const duration = mode === 'flow' ? Math.max(1, Math.round(elapsedFlowSeconds / 60)) : MODE_CONFIGS[mode].durationMinutes;
    const session: FocusSession = {
      id: 'sess-' + Date.now(),
      timestamp: new Date().toISOString(),
      durationMinutes: duration,
      mode,
      taskId: activeTask ? activeTask.id : undefined,
      taskTitle: activeTask ? activeTask.title : undefined,
      subject: activeTask ? activeTask.subject : 'General Focus',
      completed: true,
    };

    onSessionComplete(session);

    setNotificationMsg(`🎉 Focus session logged! +${MODE_CONFIGS[mode].xp} XP earned.`);
    setTimeout(() => setNotificationMsg(null), 5000);

    // Switch to appropriate break if pomodoro finished
    if (mode === 'pomodoro') {
      switchMode('short_break');
    } else {
      switchMode('pomodoro');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === 'flow') {
      setElapsedFlowSeconds(0);
    } else {
      setTimeLeft(MODE_CONFIGS[mode].durationMinutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate SVG progress ring percentage
  const progressPercent = mode === 'flow'
    ? Math.min(100, (elapsedFlowSeconds % 3600) / 36)
    : totalDuration > 0
    ? ((totalDuration - timeLeft) / totalDuration) * 100
    : 0;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-center items-center p-6' : 'py-8'}`}>
      <div className={`w-full max-w-2xl mx-auto flex flex-col items-center ${isFullscreen ? 'max-w-xl' : ''}`}>
        
        {/* Notification Toast */}
        {notificationMsg && (
          <div className="mb-6 px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Mode Selector Tabs (Clean segmented control per Constitution) */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl mb-8">
          {(Object.keys(MODE_CONFIGS) as TimerMode[]).map((m) => {
            const isSelected = mode === m;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {MODE_CONFIGS[m].label}
              </button>
            );
          })}
        </div>

        {/* Circular Progress Display */}
        <div className="relative flex items-center justify-center my-4">
          <svg className="w-72 h-72 transform -rotate-90" viewBox="0 0 280 280">
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-neutral-800/80"
            />
            {/* Active progress ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-amber-500 transition-all duration-300 ease-linear"
            />
          </svg>

          {/* Time & State Centerpiece */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-mono font-bold tracking-tight text-neutral-100 tabular-nums">
              {mode === 'flow' ? formatTime(elapsedFlowSeconds) : formatTime(timeLeft)}
            </span>
            <div className="text-xs text-neutral-400 mt-2 flex items-center gap-2">
              <span className="capitalize">{mode.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-400/90 tabular-nums">
                {isRunning ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Linked Task Bar */}
        <div className="w-full max-w-md my-4 relative">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <span>Focus Target:</span>
                {activeTask && (
                  <span className="text-neutral-300 font-mono text-[10px]">
                    {activeTask.subject}
                  </span>
                )}
              </div>
              <div className="text-xs font-medium text-neutral-200 truncate mt-0.5">
                {activeTask ? activeTask.title : 'General Deep Study Session'}
              </div>
            </div>

            <button
              onClick={() => setShowTaskDropdown(!showTaskDropdown)}
              className="text-xs text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 flex items-center gap-1"
              aria-label="Change target task"
            >
              <span className="text-[11px]">Select</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Task Dropdown Menu */}
          {showTaskDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowTaskDropdown(false)} />
              <div className="absolute top-full mt-2 left-0 right-0 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-40 max-h-52 overflow-y-auto p-1.5">
                <button
                  onClick={() => {
                    setActiveTaskId(null);
                    setShowTaskDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs hover:bg-neutral-800 transition-colors ${
                    !activeTaskId ? 'text-amber-400 font-medium' : 'text-neutral-300'
                  }`}
                >
                  General Deep Study (No task linked)
                </button>
                {tasks.filter(t => !t.completed).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTaskId(t.id);
                      setShowTaskDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs hover:bg-neutral-800 transition-colors flex items-center justify-between ${
                      activeTaskId === t.id ? 'text-amber-400 font-medium' : 'text-neutral-300'
                    }`}
                  >
                    <span className="truncate pr-2">{t.title}</span>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">{t.subject}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Active Task Subtasks Preview */}
          {activeTask && activeTask.subtasks && activeTask.subtasks.length > 0 && (
            <div className="mt-2 p-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-lg text-xs space-y-1.5">
              <div className="text-[11px] text-neutral-400 font-medium">Session Micro-Steps</div>
              {activeTask.subtasks.slice(0, 3).map((st) => (
                <div key={st.id} className="flex items-center gap-2 text-neutral-300 text-[11px]">
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${st.completed ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700'}`}>
                    {st.completed ? '✓' : ''}
                  </span>
                  <span className={st.completed ? 'line-through text-neutral-500' : ''}>{st.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-all"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl flex items-center gap-2.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm"
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-neutral-950" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-neutral-950 ml-0.5" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleCompleteSession}
            className="p-3 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-all"
            title="Complete & Log Session"
            aria-label="Complete Session"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Utility Bar */}
        <div className="flex items-center gap-4 mt-8 text-xs text-neutral-400">
          <button
            onClick={onOpenSoundMixer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              activeSoundsCount > 0
                ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                : 'border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Soundscapes ({activeSoundsCount})</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 text-neutral-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Zen' : 'Zen Mode'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-neutral-400">
            <span>[Space]</span>
            <span>play/pause</span>
          </div>
        </div>

        {/* Daily Goal Quick Progress */}
        {!isFullscreen && (
          <div className="w-full max-w-md mt-10 p-4 rounded-xl border border-neutral-800 bg-neutral-900/40">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-300 font-medium">Daily Focus Goal</span>
              <span className="font-mono text-neutral-400 tabular-nums">
                {userStats.totalFocusMinutes % 240} / {userStats.dailyGoalMinutes} min
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((userStats.totalFocusMinutes % 240) / userStats.dailyGoalMinutes) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
