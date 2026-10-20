import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Sparkles, Clock, Trash2, Calendar, Play, Loader2, ArrowRight } from 'lucide-react';
import { Task, TaskPriority, Subtask } from '../types';

interface TaskManagerViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStartFocus: (taskId: string) => void;
  onAwardXp: (amount: number, reason: string) => void;
  activeTaskId: string | null;
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  tasks,
  setTasks,
  onStartFocus,
  onAwardXp,
  activeTaskId,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [breakdownModalTask, setBreakdownModalTask] = useState<Task | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState<boolean>(false);
  const [breakdownResult, setBreakdownResult] = useState<{ summary: string; subtasks: { title: string; minutes: number; focusTip: string }[] } | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newPoms, setNewPoms] = useState(2);
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Extract distinct subjects
  const subjects = Array.from(new Set(tasks.map((t) => t.subject)));

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (filter === 'urgent' && t.priority !== 'urgent') return false;
    if (selectedSubject !== 'all' && t.subject !== selectedSubject) return false;
    return true;
  });

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willComplete = !t.completed;
          if (willComplete) {
            onAwardXp(60, `Task completed: ${t.title}`);
          }
          return {
            ...t,
            completed: willComplete,
            completedPoms: willComplete ? t.estimatedPoms : t.completedPoms,
            subtasks: t.subtasks.map((st) => ({ ...st, completed: willComplete })),
          };
        }
        return t;
      })
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) => {
            if (st.id === subtaskId) {
              const nextState = !st.completed;
              if (nextState) {
                onAwardXp(15, `Subtask finished: ${st.title}`);
              }
              return { ...st, completed: nextState };
            }
            return st;
          });
          const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
          return {
            ...t,
            subtasks: updatedSubtasks,
            completed: allCompleted ? true : t.completed,
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: 'task-' + Date.now(),
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General',
      priority: newPriority,
      estimatedPoms: Number(newPoms) || 1,
      completedPoms: 0,
      dueDate: newDueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setShowAddModal(false);
    onAwardXp(10, 'Created study objective');
  };

  // AI Task Breakdown
  const handleRequestBreakdown = async (task: Task) => {
    setBreakdownModalTask(task);
    setBreakdownLoading(true);
    setBreakdownResult(null);

    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          subject: task.subject,
          totalMinutes: task.estimatedPoms * 25,
        }),
      });

      if (!res.ok) throw new Error('Breakdown failed');
      const data = await res.json();
      setBreakdownResult(data);
    } catch (err) {
      console.error(err);
      // Fallback structured breakdown if offline or error
      setBreakdownResult({
        summary: `Strategic step-by-step breakdown for ${task.title}`,
        subtasks: [
          { title: 'Core theory review & first principles', minutes: 25, focusTip: 'Read without notes, then write 3 takeaways from memory' },
          { title: 'Practical problem solving & derivation', minutes: 25, focusTip: 'Work through example problem without looking at solution' },
          { title: 'Active recall summary & flash testing', minutes: 20, focusTip: 'Explain key formula or concept out loud' },
        ],
      });
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleApplyBreakdown = () => {
    if (!breakdownModalTask || !breakdownResult) return;

    const newSubtasks: Subtask[] = breakdownResult.subtasks.map((st, i) => ({
      id: `st-${Date.now()}-${i}`,
      title: st.title,
      completed: false,
      minutes: st.minutes,
      focusTip: st.focusTip,
    }));

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === breakdownModalTask.id) {
          return {
            ...t,
            subtasks: [...t.subtasks, ...newSubtasks],
            notes: breakdownResult.summary,
          };
        }
        return t;
      })
    );

    setBreakdownModalTask(null);
    setBreakdownResult(null);
    onAwardXp(20, 'Generated AI study breakdown');
  };

  const priorityLabels: Record<TaskPriority, { text: string; color: string }> = {
    urgent: { text: 'Urgent', color: 'text-rose-400' },
    high: { text: 'High', color: 'text-amber-400' },
    medium: { text: 'Medium', color: 'text-blue-400' },
    low: { text: 'Low', color: 'text-neutral-400' },
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Study Tasks & Objectives</h1>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>{tasks.filter((t) => !t.completed).length} pending</span>
            <span aria-hidden="true">·</span>
            <span>{tasks.filter((t) => t.completed).length} completed</span>
            <span aria-hidden="true">·</span>
            <span>AI task decomposition enabled</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Task</span>
        </button>
      </div>

      {/* Segmented Controls for Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
          {(['all', 'pending', 'urgent', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 font-medium rounded-md capitalize transition-colors ${
                filter === mode
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl">
            <p className="text-neutral-400 text-sm">No study objectives found matching this filter.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg transition-colors"
            >
              Add First Task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isTargeted = activeTaskId === task.id;
            const completedSubCount = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isTargeted
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700'
                } ${task.completed ? 'opacity-65' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Checkbox and Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
                      aria-label="Toggle task completion"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-neutral-400 font-mono">
                          {task.subject}
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className={`text-xs ${priorityLabels[task.priority].color}`}>
                          {priorityLabels[task.priority].text}
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="text-xs text-neutral-400 font-mono tabular-nums flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {task.completedPoms}/{task.estimatedPoms} poms ({task.estimatedPoms * 25}m)
                        </span>
                      </div>

                      <h3 className={`text-sm font-semibold mt-1 text-neutral-100 ${task.completed ? 'line-through text-neutral-500' : ''}`}>
                        {task.title}
                      </h3>

                      {task.notes && (
                        <p className="text-xs text-neutral-400 mt-1 italic line-clamp-2">
                          "{task.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!task.completed && (
                      <>
                        <button
                          onClick={() => handleRequestBreakdown(task)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg flex items-center gap-1 transition-colors"
                          title="Break down objective with Gemini AI"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span className="hidden sm:inline">AI Break Down</span>
                        </button>

                        <button
                          onClick={() => onStartFocus(task.id)}
                          className="px-2.5 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg flex items-center gap-1 transition-colors"
                          title="Start Pomodoro timer for this task"
                        >
                          <Play className="w-3 h-3 fill-neutral-200" />
                          <span>Focus</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-rose-400 transition-colors rounded"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Section */}
                {task.subtasks.length > 0 && (
                  <div className="mt-3.5 pl-8 border-t border-neutral-800/60 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>
                        Actionable Subtasks ({completedSubCount}/{task.subtasks.length})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {task.subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-950/40 border border-neutral-800/50 hover:border-neutral-700/60 transition-colors"
                        >
                          <button
                            onClick={() => handleToggleSubtask(task.id, st.id)}
                            className="mt-0.5 text-neutral-400 hover:text-amber-400 shrink-0"
                            aria-label="Toggle subtask"
                          >
                            {st.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs ${st.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                              {st.title}
                            </span>
                            {st.focusTip && !st.completed && (
                              <div className="text-[11px] text-amber-400/80 mt-0.5 font-mono">
                                Focus tip: {st.focusTip}
                              </div>
                            )}
                          </div>
                          {st.minutes && (
                            <span className="text-[10px] text-neutral-400 font-mono tabular-nums shrink-0">
                              {st.minutes}m
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">Create Study Objective</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1.5">
                  Task Title or Study Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bayes Theorem & Bayesian Priors"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Statistics, CS, Biology"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">
                    Est. Pomodoros (25m each)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newPoms}
                    onChange={(e) => setNewPoms(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-xl shadow-md transition-colors"
                >
                  Create Objective (+10 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Breakdown Modal */}
      {breakdownModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-neutral-100">AI Cognitive Task Breakdown</h2>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Decomposing <span className="text-neutral-200 font-medium">{breakdownModalTask.title}</span> into high-efficiency Pomodoro steps.
            </p>

            {breakdownLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <p className="text-xs text-neutral-400">Gemini is structuring cognitive micro-steps...</p>
              </div>
            ) : breakdownResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  <span className="font-semibold block mb-0.5">Study Strategy:</span>
                  {breakdownResult.summary}
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                    Recommended Subtasks
                  </span>
                  {breakdownResult.subtasks.map((st, i) => (
                    <div key={i} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                      <div className="flex items-center justify-between font-medium text-neutral-200">
                        <span>{i + 1}. {st.title}</span>
                        <span className="font-mono text-neutral-400 text-[11px]">{st.minutes}m</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        <span className="text-amber-400/90 font-mono">Cognitive tip:</span> {st.focusTip}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
                  <button
                    onClick={() => setBreakdownModalTask(null)}
                    className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleApplyBreakdown}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>Apply Subtasks to Task (+20 XP)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
