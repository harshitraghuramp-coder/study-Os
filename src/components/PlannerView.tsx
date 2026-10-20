import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Play,
} from 'lucide-react';
import { Subject, Task, TaskPriority } from '../types/studyos';

interface PlannerViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  subjects: Subject[];
  onStartFocus: (taskId?: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  tasks,
  setTasks,
  subjects,
  onStartFocus,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showMissedModal, setShowMissedModal] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // New task/block scheduling state
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState(subjects[0]?.id || '');
  const [modalStartHour, setModalStartHour] = useState(14);
  const [modalDuration, setModalDuration] = useState(45);
  const [modalPriority, setModalPriority] = useState<TaskPriority>('medium');
  const [modalDueDate, setModalDueDate] = useState(selectedDate);

  // Timeline hours for Day view: 07:00 to 22:00
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  // Missed tasks (pending tasks with due_at < today or scheduled_start in the past)
  const missedTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (t.due_at && t.due_at < selectedDate) return true;
    return false;
  });

  // Filter tasks based on search, subject, priority
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedSubject !== 'all' && t.subject_id !== selectedSubject) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    return true;
  });

  // Day view scheduled tasks
  const dayTasks = filteredTasks.filter((t) => {
    return (
      (t.scheduled_start && t.scheduled_start.startsWith(selectedDate)) ||
      (t.due_at && t.due_at === selectedDate)
    );
  });

  // Shift selected date
  const shiftDate = (days: number) => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleCreateScheduledTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    const start = new Date(selectedDate + 'T00:00:00');
    start.setHours(modalStartHour, 0, 0, 0);
    const end = new Date(start.getTime() + modalDuration * 60000);

    const newTask: Task = {
      id: 'tsk-' + Date.now(),
      user_id: 'usr-default',
      title: modalTitle.trim(),
      description: '',
      subject_id: modalSubjectId,
      priority: modalPriority,
      estimated_minutes: modalDuration,
      due_at: modalDueDate,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: 'pending',
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setModalTitle('');
    setShowScheduleModal(false);
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const next = t.status === 'completed' ? 'pending' : 'completed';
          return { ...t, status: next };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Reschedule missed task to today
  const handleRescheduleTask = (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newStart = new Date();
    newStart.setHours(newStart.getHours() + 1, 0, 0, 0);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            due_at: today,
            scheduled_start: newStart.toISOString(),
            scheduled_end: new Date(newStart.getTime() + t.estimated_minutes * 60000).toISOString(),
            status: 'pending',
          };
        }
        return t;
      })
    );
  };

  // Universal RFC 5545 iCalendar (.ics) export
  const handleExportICS = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/calendar/export-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: tasks.filter((t) => t.scheduled_start).map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description || 'StudyOS study block',
            startTime: t.scheduled_start,
            endTime: t.scheduled_end,
          })),
        }),
      });

      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyos-schedule-${selectedDate}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // Google Calendar 1-Click intent generator
  const getGoogleCalendarUrl = (task: Task) => {
    const start = task.scheduled_start
      ? new Date(task.scheduled_start).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : new Date().toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = task.scheduled_end
      ? new Date(task.scheduled_end).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : new Date(Date.now() + 45 * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const title = encodeURIComponent(`[StudyOS] ${task.title}`);
    const details = encodeURIComponent(
      `Focused study block organized via StudyOS.\nPriority: ${task.priority}\nEst: ${task.estimated_minutes}m`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Smart Study Planner</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Allocate study hours realistically with conflict awareness and universal calendar syncing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {missedTasks.length > 0 && (
            <button
              onClick={() => setShowMissedModal(true)}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{missedTasks.length} Missed</span>
            </button>
          )}

          <button
            onClick={handleExportICS}
            disabled={exporting}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download universal .ics calendar file"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>{exporting ? 'Exporting...' : 'Export .ICS'}</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Block</span>
          </button>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Segmented View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
          {(['day', 'week', 'month', 'list'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 font-medium rounded-lg capitalize transition-colors ${
                viewMode === m
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {m} view
            </button>
          ))}
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-neutral-100 px-2 font-mono">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>

          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 ml-1"
          >
            Today
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search study tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Display: Day Timeline vs List / Calendar */}
      {viewMode === 'day' ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/60">
          {hours.map((hour) => {
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
            // Tasks matching this hour
            const slotTasks = dayTasks.filter((t) => {
              if (!t.scheduled_start) return false;
              const h = new Date(t.scheduled_start).getHours();
              return h === hour;
            });

            return (
              <div key={hour} className="flex min-h-[64px] group hover:bg-neutral-900/30 transition-colors">
                <div className="w-20 sm:w-24 p-3 border-r border-neutral-800/80 text-xs font-mono text-neutral-400 shrink-0">
                  {hourLabel}
                </div>

                <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                  {slotTasks.length === 0 ? (
                    <button
                      onClick={() => {
                        setModalStartHour(hour);
                        setShowScheduleModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[11px] text-neutral-400 hover:text-indigo-400 flex items-center gap-1 transition-opacity px-2 py-1 rounded"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Block {hourLabel}</span>
                    </button>
                  ) : (
                    slotTasks.map((t) => {
                      const subject = subjects.find((s) => s.id === t.subject_id);
                      const isCompleted = t.status === 'completed';

                      return (
                        <div
                          key={t.id}
                          className={`flex-1 min-w-[280px] p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isCompleted
                              ? 'border-neutral-800 bg-neutral-950/60 opacity-60'
                              : 'border-indigo-500/40 bg-indigo-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              onClick={() => handleToggleComplete(t.id)}
                              className="text-neutral-500 hover:text-emerald-400 shrink-0"
                              aria-label="Toggle task"
                            >
                              <CheckCircle2
                                className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : 'text-neutral-600'}`}
                              />
                            </button>

                            <div className="min-w-0">
                              <h4 className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                                {t.title}
                              </h4>
                              <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 font-mono">
                                <span>{subject?.name || 'General'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{t.estimated_minutes}m</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCompleted && (
                              <button
                                onClick={() => onStartFocus(t.id)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                                title="Start focus session"
                              >
                                <Play className="w-3 h-3 fill-neutral-200" />
                              </button>
                            )}

                            <a
                              href={getGoogleCalendarUrl(t)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-indigo-400 transition-colors"
                              title="Sync to Google Calendar"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                              aria-label="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Task List View */
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl">
              <p className="text-neutral-400 text-xs">No tasks found matching current filters.</p>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const subject = subjects.find((s) => s.id === t.subject_id);
              const isCompleted = t.status === 'completed';

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                    isCompleted
                      ? 'border-neutral-800/80 bg-neutral-950/40 opacity-60'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(t.id)}
                      className="text-neutral-500 hover:text-emerald-400 shrink-0"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${isCompleted ? 'text-emerald-500 fill-emerald-500/20' : 'text-neutral-600'}`}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {subject && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                          >
                            {subject.name}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-mono text-neutral-500 font-semibold">
                          {t.priority}
                        </span>
                        {t.due_at && (
                          <span className="text-[11px] text-neutral-400 font-mono">
                            Due: {t.due_at}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-semibold mt-1 truncate ${isCompleted ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                        {t.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={() => onStartFocus(t.id)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-neutral-300" />
                        <span>Focus</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Missed Task Recovery Modal */}
      {showMissedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Missed Task Recovery</span>
            </div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Life happens. StudyOS helps you recalibrate your schedule without guilt or cognitive overload. Reschedule your missed tasks to a fresh window below.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto mb-5 pr-1">
              {missedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-semibold text-neutral-200 truncate">{t.title}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Estimated {t.estimated_minutes}m · Due was {t.due_at}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRescheduleTask(t.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reschedule</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowMissedModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Block Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">Schedule Study Block</h2>
            <form onSubmit={handleCreateScheduledTask} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Objective Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Practice 5 Matrix Diagonalization proofs"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Subject</label>
                  <select
                    value={modalSubjectId}
                    onChange={(e) => setModalSubjectId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Priority</label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value as TaskPriority)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Start Hour</label>
                  <select
                    value={modalStartHour}
                    onChange={(e) => setModalStartHour(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Duration</label>
                  <select
                    value={modalDuration}
                    onChange={(e) => setModalDuration(Number(e.target.value))}
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
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
