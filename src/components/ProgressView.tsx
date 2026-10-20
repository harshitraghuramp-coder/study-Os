import React from 'react';
import {
  BarChart2,
  Clock,
  CheckCircle2,
  TrendingUp,
  PieChart,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { StudySession, Subject, Task, Topic, UserProfile } from '../types/studyos';

interface ProgressViewProps {
  profile: UserProfile;
  sessions: StudySession[];
  tasks: Task[];
  subjects: Subject[];
  topics: Topic[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  sessions,
  tasks,
  subjects,
  topics,
}) => {
  // Total focused minutes (strictly summing actual focused_seconds!)
  const totalFocusedMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.focused_seconds, 0) / 60
  );

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // 7-day daily study time trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });

    const dayMinutes = Math.round(
      sessions
        .filter((s) => s.started_at.startsWith(dateStr))
        .reduce((acc, s) => acc + s.focused_seconds, 0) / 60
    );

    return { dateStr, dayLabel, minutes: dayMinutes };
  });

  const maxDailyMin = Math.max(...last7Days.map((d) => d.minutes), 60);

  // Subject-level time distribution
  const subjectTimeMap = new Map<string, number>();
  sessions.forEach((s) => {
    const subj = subjects.find((sub) => sub.id === s.subject_id);
    const name = subj ? subj.name : 'General Focus';
    const mins = Math.round(s.focused_seconds / 60);
    subjectTimeMap.set(name, (subjectTimeMap.get(name) || 0) + mins);
  });

  const subjectEntries = Array.from(subjectTimeMap.entries()).sort((a, b) => b[1] - a[1]);
  const totalSubjectMins = subjectEntries.reduce((acc, e) => acc + e[1], 0);

  // Topic completion stats
  const completedTopics = topics.filter((t) => t.status === 'completed');
  const topicCompletionRate = topics.length > 0 ? Math.round((completedTopics.length / topics.length) * 100) : 0;

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="pb-4 border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-tight text-neutral-100">Learning Progress & Analytics</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Measured strictly from your verified study sessions and completed objectives.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Time */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Focused Time</span>
            <Clock className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {(totalFocusedMinutes / 60).toFixed(1)} <span className="text-sm font-normal text-neutral-400">hours</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across {sessions.length} completed session{sessions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {taskCompletionRate}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {completedTasks.length} of {tasks.length} objectives finished
          </div>
        </div>

        {/* Topic Mastery Rate */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Syllabus Completion</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {topicCompletionRate}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {completedTopics.length} of {topics.length} topics mastered
          </div>
        </div>

        {/* Weekly Target Progress */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Weekly Target</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {Math.floor(totalFocusedMinutes / 60)}h / {Math.floor(profile.weekly_goal_minutes / 60)}h
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((totalFocusedMinutes / profile.weekly_goal_minutes) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 7-Day Study Cadence Bar Chart */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">7-Day Study Cadence</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Active focused minutes logged each day</p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Total: {last7Days.reduce((a, b) => a + b.minutes, 0)}m
          </span>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2">
          {last7Days.map((d, i) => {
            const heightPercent = Math.max(6, Math.round((d.minutes / maxDailyMin) * 100));
            const isToday = i === 6;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {d.minutes}m
                </span>
                <div className="w-full max-w-[42px] bg-neutral-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday ? 'bg-indigo-500' : 'bg-neutral-600 group-hover:bg-neutral-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${isToday ? 'text-indigo-400 font-semibold' : 'text-neutral-400'}`}>
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Distribution & Recent Session Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject-Level Time Allocation */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-100">Subject Time Allocation</h2>
          {subjectEntries.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">No study time recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {subjectEntries.map(([subj, mins]) => {
                const pct = totalSubjectMins > 0 ? Math.round((mins / totalSubjectMins) * 100) : 0;
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
                        className="h-full bg-indigo-500/80 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Session Logs */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">Recent Session Audit</h2>
            <span className="text-xs font-mono text-neutral-500">
              {sessions.length} total
            </span>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">No sessions logged yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {sessions.slice(0, 6).map((s) => {
                const subj = subjects.find((sub) => sub.id === s.subject_id);
                const task = tasks.find((t) => t.id === s.task_id);

                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200">
                        {task ? task.title : 'Deep Focus Block'}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {subj?.name || 'General Focus'} · {new Date(s.started_at).toLocaleDateString()}
                      </div>
                      {s.session_notes && (
                        <div className="text-[11px] text-neutral-500 italic mt-0.5 line-clamp-1">
                          "{s.session_notes}"
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-neutral-300 tabular-nums font-semibold shrink-0">
                      {Math.round(s.focused_seconds / 60)}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
