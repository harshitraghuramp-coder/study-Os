import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Headphones,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
  X,
  Volume2,
} from 'lucide-react';
import { StudySession, Subject, Task } from '../types/studyos';
import { soundEngine } from '../utils/soundEngine';

interface FocusTimerViewProps {
  tasks: Task[];
  subjects: Subject[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  onSaveSession: (session: StudySession) => void;
  onOpenSoundMixer: () => void;
  activeSoundsCount: number;
}

const TIMER_STORAGE_KEY = 'studyos_active_timer_state';

interface PersistedTimerState {
  status: 'idle' | 'running' | 'paused';
  mode: 'focus' | 'short_break' | 'long_break';
  totalDurationSeconds: number;
  focusedSeconds: number;
  pausedSeconds: number;
  startTimestamp: number | null;
  lastActiveTimestamp: number | null;
  taskId: string | null;
  sessionObjective: string;
}

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  tasks,
  subjects,
  activeTaskId,
  setActiveTaskId,
  onSaveSession,
  onOpenSoundMixer,
  activeSoundsCount,
}) => {
  // Restore persistent timer state if present
  const [timerState, setTimerState] = useState<PersistedTimerState>(() => {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (raw) {
      try {
        const parsed: PersistedTimerState = JSON.parse(raw);
        // If it was running, calculate elapsed time since last active
        if (parsed.status === 'running' && parsed.lastActiveTimestamp) {
          const now = Date.now();
          const elapsedSecs = Math.floor((now - parsed.lastActiveTimestamp) / 1000);
          const newFocused = parsed.focusedSeconds + elapsedSecs;
          return {
            ...parsed,
            focusedSeconds: Math.min(parsed.totalDurationSeconds, newFocused),
            lastActiveTimestamp: now,
          };
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      status: 'idle',
      mode: 'focus',
      totalDurationSeconds: 25 * 60,
      focusedSeconds: 0,
      pausedSeconds: 0,
      startTimestamp: null,
      lastActiveTimestamp: null,
      taskId: activeTaskId,
      sessionObjective: '',
    };
  });

  const [distractionNotes, setDistractionNotes] = useState<string>('');
  const [showDistractionPad, setShowDistractionPad] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryNotes, setSummaryNotes] = useState<string>('');

  const intervalRef = useRef<number | null>(null);

  // Active task details
  const currentTask = tasks.find((t) => t.id === (timerState.taskId || activeTaskId));
  const currentSubject = subjects.find((s) => s.id === currentTask?.subject_id);

  // Sync state to localStorage on update
  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  // Main countdown / active time tracking effect using timestamps
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          const now = Date.now();
          const newFocused = prev.focusedSeconds + 1;

          if (newFocused >= prev.totalDurationSeconds) {
            // Finished!
            handleTimerComplete();
            return {
              ...prev,
              focusedSeconds: prev.totalDurationSeconds,
              status: 'idle',
              lastActiveTimestamp: now,
            };
          }

          return {
            ...prev,
            focusedSeconds: newFocused,
            lastActiveTimestamp: now,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState.status]);

  // Keyboard shortcut listener (Space to play/pause, Esc to exit Zen)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [timerState.status, isFullscreen]);

  const toggleTimer = () => {
    const now = Date.now();
    if (timerState.status === 'running') {
      // Pause
      setTimerState((prev) => ({
        ...prev,
        status: 'paused',
        lastActiveTimestamp: now,
      }));
    } else {
      // Start or Resume
      setTimerState((prev) => ({
        ...prev,
        status: 'running',
        startTimestamp: prev.startTimestamp || now,
        lastActiveTimestamp: now,
      }));
    }
  };

  const switchMode = (mode: 'focus' | 'short_break' | 'long_break', durationMins: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState({
      status: 'idle',
      mode,
      totalDurationSeconds: durationMins * 60,
      focusedSeconds: 0,
      pausedSeconds: 0,
      startTimestamp: null,
      lastActiveTimestamp: null,
      taskId: activeTaskId,
      sessionObjective: timerState.sessionObjective,
    });
  };

  const handleTimerComplete = () => {
    soundEngine.playCompletionChime();
    setShowSummaryModal(true);
  };

  const handleFinishEarly = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState((prev) => ({ ...prev, status: 'idle' }));
    setShowSummaryModal(true);
  };

  const handleCancelSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowCancelConfirm(false);
    setTimerState({
      status: 'idle',
      mode: 'focus',
      totalDurationSeconds: 25 * 60,
      focusedSeconds: 0,
      pausedSeconds: 0,
      startTimestamp: null,
      lastActiveTimestamp: null,
      taskId: activeTaskId,
      sessionObjective: '',
    });
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const handleSaveSessionLog = () => {
    const session: StudySession = {
      id: 'sess-' + Date.now(),
      user_id: 'usr-default',
      task_id: currentTask?.id,
      subject_id: currentSubject?.id,
      started_at: new Date(timerState.startTimestamp || Date.now()).toISOString(),
      ended_at: new Date().toISOString(),
      focused_seconds: timerState.focusedSeconds,
      paused_seconds: timerState.pausedSeconds,
      status: 'completed',
      session_notes: summaryNotes.trim() || undefined,
      distraction_notes: distractionNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    onSaveSession(session);
    setShowSummaryModal(false);
    setSummaryNotes('');
    setDistractionNotes('');
    switchMode('focus', 25);
  };

  // Remaining time math
  const remainingSeconds = Math.max(0, timerState.totalDurationSeconds - timerState.focusedSeconds);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // SVG circular progress calculation
  const progressPercent = timerState.totalDurationSeconds > 0
    ? (timerState.focusedSeconds / timerState.totalDurationSeconds) * 100
    : 0;

  const radius = 125;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-center items-center p-6' : 'py-6'}`}>
      <div className={`w-full max-w-2xl mx-auto flex flex-col items-center ${isFullscreen ? 'max-w-xl' : ''}`}>
        
        {/* Preset Mode Segmented Selector */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl mb-6 text-xs">
          <button
            onClick={() => switchMode('focus', 25)}
            className={`px-4 py-1.5 font-medium rounded-lg transition-colors ${
              timerState.mode === 'focus' && timerState.totalDurationSeconds === 25 * 60
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => switchMode('focus', 50)}
            className={`px-4 py-1.5 font-medium rounded-lg transition-colors ${
              timerState.mode === 'focus' && timerState.totalDurationSeconds === 50 * 60
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            50m Ultradian
          </button>
          <button
            onClick={() => switchMode('short_break', 5)}
            className={`px-4 py-1.5 font-medium rounded-lg transition-colors ${
              timerState.mode === 'short_break'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            5m Short Break
          </button>
          <button
            onClick={() => switchMode('long_break', 15)}
            className={`px-4 py-1.5 font-medium rounded-lg transition-colors ${
              timerState.mode === 'long_break'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            15m Long Break
          </button>
        </div>

        {/* Circular Progress Timer Visualizer */}
        <div className="relative flex items-center justify-center my-4">
          <svg className="w-72 h-72 transform -rotate-90" viewBox="0 0 280 280">
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-neutral-800/80"
            />
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
              className="text-indigo-500 transition-all duration-300 ease-linear"
            />
          </svg>

          {/* Time & State Centerpiece */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-mono font-bold tracking-tight text-neutral-100 tabular-nums">
              {timeFormatted}
            </span>
            <div className="text-xs text-neutral-400 mt-2 flex items-center gap-2">
              <span className="capitalize">{timerState.mode.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-mono tabular-nums ${timerState.status === 'running' ? 'text-indigo-400' : 'text-neutral-500'}`}>
                {timerState.status === 'running' ? 'Active' : timerState.status === 'paused' ? 'Paused' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Target Task & Session Objective Card */}
        <div className="w-full max-w-md my-4 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Focus Objective:</span>
            {currentSubject && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: `${currentSubject.color}20`, color: currentSubject.color }}
              >
                {currentSubject.name}
              </span>
            )}
          </div>

          <div className="text-xs font-semibold text-neutral-100 truncate">
            {currentTask ? currentTask.title : 'General Deep Work Session'}
          </div>

          {/* Optional Session Goal / Scratchpad Input */}
          <input
            type="text"
            placeholder="What specific outcome will you complete this block?"
            value={timerState.sessionObjective}
            onChange={(e) => setTimerState((prev) => ({ ...prev, sessionObjective: e.target.value }))}
            className="w-full bg-neutral-950 border border-neutral-800/80 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 mt-3">
          {timerState.status !== 'idle' && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="p-3 rounded-full text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 border border-neutral-800 transition-colors"
              title="Cancel Session"
              aria-label="Cancel Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleTimer}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center gap-2.5 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all text-sm"
            aria-label={timerState.status === 'running' ? 'Pause' : 'Start'}
          >
            {timerState.status === 'running' ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>{timerState.status === 'paused' ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>

          {timerState.focusedSeconds > 60 && (
            <button
              onClick={handleFinishEarly}
              className="p-3 rounded-full text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 border border-neutral-800 transition-colors"
              title="Finish Early & Log"
              aria-label="Finish Early"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Utility Strip: Ambient Sound, Distraction Pad, Zen Fullscreen */}
        <div className="flex items-center gap-3 mt-8 text-xs text-neutral-400">
          <button
            onClick={onOpenSoundMixer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              activeSoundsCount > 0
                ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
                : 'border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Soundscape ({activeSoundsCount})</span>
          </button>

          <button
            onClick={() => setShowDistractionPad(!showDistractionPad)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              distractionNotes.trim()
                ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                : 'border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 text-neutral-300 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Zen' : 'Zen Mode'}</span>
          </button>
        </div>

        {/* Distraction Scratchpad Drawer */}
        {showDistractionPad && (
          <div className="w-full max-w-md mt-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2 animate-in fade-in duration-100">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200">Distraction Scratchpad</span>
              <span className="text-[11px]">Jot intrusive thoughts to stay in flow</span>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Remember to email professor, check laundry..."
              value={distractionNotes}
              onChange={(e) => setDistractionNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Cancel Current Session?</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to discard this focus session? Active elapsed time will not be recorded.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
              >
                Keep Going
              </button>
              <button
                onClick={handleCancelSession}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Discard Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Completion Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5" />
              <span>Session Completed!</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Great work. You logged <strong>{Math.round(timerState.focusedSeconds / 60)} minutes</strong> of active, uninterrupted concentration.
            </p>

            <div>
              <label className="text-xs text-neutral-300 font-medium block mb-1">
                Session Reflection & Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="What did you accomplish or learn in this block?"
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleSaveSessionLog}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                Log Session & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
