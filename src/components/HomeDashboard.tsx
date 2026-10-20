import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Timer,
} from 'lucide-react';
import { StudySession, Subject, Task, UserProfile } from '../types/studyos';

interface HomeDashboardProps {
  profile: UserProfile;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  subjects: Subject[];
  sessions: StudySession[];
  onNavigate: (view: string) => void;
  onStartFocus: (taskId?: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  tasks,
  setTasks,
  subjects,
  sessions,
  onNavigate,
  onStartFocus,
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickSubjectId, setQuickSubjectId] = useState<string>(subjects[0]?.id || '');
  const [quickDuration, setQuickDuration] = useState<number>(25);

  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic greeting based on current hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate today's tasks & planned time
  const todayTasks = tasks.filter((t) => {
    if (t.scheduled_start && t.scheduled_start.startsWith(todayStr)) return true;
    if (t.due_at && t.due_at.startsWith(todayStr)) return true;
    return false;
  });

  const totalPlannedMinutesToday = todayTasks.reduce((acc, t) => acc + t.estimated_minutes, 0);
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');

  // Calculate week focused time from stored sessions
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekSessions = sessions.filter((s) => new Date(s.started_at) >= startOfWeek);
  const weekFocusedMinutes = Math.round(
    weekSessions.reduce((acc, s) => acc + s.focused_seconds, 0) / 60
  );

  const weekProgressPercent = Math.min(
    100,
    Math.round((weekFocusedMinutes / (profile.weekly_goal_minutes || 600)) * 100)
  );

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = tasks
    .filter((t) => t.due_at && t.status !== 'completed' && new Date(t.due_at) >= new Date())
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 4);

  // Last session for continue action
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  const lastTask = lastSession?.task_id ? tasks.find((t) => t.id === lastSession.task_id) : null;

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: Task = {
      id: 'tsk-' + Date.now(),
      user_id: profile.id,
      title: quickTitle.trim(),
      description: '',
      subject_id: quickSubjectId || undefined,
      priority: 'medium',
      estimated_minutes: Number(quickDuration) || 25,
      due_at: todayStr,
      scheduled_start: new Date().toISOString(),
      status: 'pending',
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setQuickTitle('');
    setShowQuickAdd(false);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          return {
            ...t,
            status: nextStatus,
            subtasks: t.subtasks.map((st) => ({ ...st, completed: nextStatus === 'completed' })),
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <span className="text-xs font-mono text-neutral-400">{formattedDate}</span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mt-0.5">
            {greeting}, {profile.display_name.split(' ')[0]}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            "Know what to study. Start focusing. Learn effectively. Stay consistent."
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => onStartFocus()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Focus</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned Time Today */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Planned Today</span>
            <Clock className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {Math.floor(totalPlannedMinutesToday / 60)}h {totalPlannedMinutesToday % 60}m
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across {todayTasks.length} planned session{todayTasks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Task Completion Ratio */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Tasks Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {completedTodayTasks.length} / {todayTasks.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {todayTasks.length - completedTodayTasks.length} remaining
          </div>
        </div>

        {/* Weekly Focus Goal Progress */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Weekly Goal</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {Math.floor(weekFocusedMinutes / 60)}h / {Math.floor(profile.weekly_goal_minutes / 60)}h
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${weekProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Spaced Revision Prompt */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Daily Revision</span>
            <RotateCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-xs font-semibold text-neutral-200">2 Cards Due Today</div>
            <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
              Organic Chem · Linear Algebra
            </p>
          </div>
          <button
            onClick={() => onNavigate('revision')}
            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1 self-start"
          >
            <span>Review Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Continue Last Session Banner (when applicable) */}
      {lastSession && (
        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-indigo-400 font-mono font-medium">Continue Where You Left Off</div>
              <h3 className="text-sm font-semibold text-neutral-100 mt-0.5">
                {lastTask ? lastTask.title : 'Deep Focus Review Session'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Last logged session was {Math.round(lastSession.focused_seconds / 60)} minutes of active concentration.
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartFocus(lastTask?.id)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Resume Focus</span>
          </button>
        </div>
      )}

      {/* Split Grid: Today's Schedule Timeline & Deadlines / AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule & Actionable Tasks (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Today's Study Schedule</h2>
              <p className="text-xs text-neutral-400">Scheduled time blocks and priority objectives</p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Open Planner
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
              <CalendarIcon className="w-6 h-6 text-neutral-500 mx-auto" />
              <p className="text-xs text-neutral-400">No study blocks planned for today yet.</p>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="text-xs text-indigo-400 font-medium hover:underline"
              >
                Schedule your first session
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => {
                const subject = subjects.find((s) => s.id === task.subject_id);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isCompleted
                        ? 'border-neutral-800/80 bg-neutral-950/40 opacity-60'
                        : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-neutral-500 hover:text-emerald-400 transition-colors shrink-0"
                        aria-label="Toggle task completion"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${isCompleted ? 'text-emerald-500 fill-emerald-500/20' : 'text-neutral-600'}`}
                        />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {subject && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded text-neutral-300"
                              style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                            >
                              {subject.name}
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
                            {task.estimated_minutes}m
                          </span>
                        </div>
                        <h4 className={`text-xs font-semibold mt-1 truncate ${isCompleted ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => onStartFocus(task.id)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                        title="Start timer for this task"
                      >
                        <Play className="w-3 h-3 fill-neutral-300" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Column: Deadlines & Contextual AI Advice */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                Upcoming Deadlines
              </h3>
              <button
                onClick={() => onNavigate('planner')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No approaching deadlines.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((task) => {
                  const subject = subjects.find((s) => s.id === task.subject_id);
                  const daysLeft = Math.ceil(
                    (new Date(task.due_at!).getTime() - new Date().getTime()) / 86400000
                  );

                  return (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl border border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-medium text-neutral-200 truncate">{task.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {subject?.name || 'General'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                          daysLeft <= 1
                            ? 'text-rose-400 bg-rose-500/10'
                            : daysLeft <= 3
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-neutral-400 bg-neutral-800'
                        }`}
                      >
                        {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contextual AI Study Suggestion */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI Coach Observation</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              You have an exam deadline approaching for <strong>Organic Chemistry II</strong>. Based on your retention history, tackling 10 reaction mechanisms during your morning focus window yields 34% higher retention.
            </p>
            <button
              onClick={() => onNavigate('coach')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 pt-1"
            >
              <span>Ask AI Coach for Study Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">Quick Add Study Task</h2>
            <form onSubmit={handleQuickAddTask} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Chapter 5 on Graph Traversals"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Subject</label>
                  <select
                    value={quickSubjectId}
                    onChange={(e) => setQuickSubjectId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    Duration (mins)
                  </label>
                  <select
                    value={quickDuration}
                    onChange={(e) => setQuickDuration(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={25}>25 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={50}>50 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
