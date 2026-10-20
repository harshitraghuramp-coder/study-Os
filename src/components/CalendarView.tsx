import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Download, ExternalLink, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent, Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  onAwardXp: (amount: number, reason: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  events,
  setEvents,
  onAwardXp,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('General');
  const [newStartHour, setNewStartHour] = useState<number>(14); // 2:00 PM
  const [newDuration, setNewDuration] = useState<number>(50); // 50 mins
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');
  const [exporting, setExporting] = useState<boolean>(false);

  // Time slots for Day View (from 07:00 to 22:00)
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  // Filter events for selected date
  const dayEvents = events.filter((ev) => ev.startTime.startsWith(selectedDate));

  // Change date by offset
  const shiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const start = new Date(selectedDate);
    start.setHours(newStartHour, 0, 0, 0);

    const end = new Date(start.getTime() + newDuration * 60 * 1000);

    const newEvent: CalendarEvent = {
      id: 'cal-' + Date.now(),
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      taskId: linkedTaskId || undefined,
      isCompleted: false,
    };

    setEvents((prev) => [...prev, newEvent]);
    setNewTitle('');
    setShowAddModal(false);
    onAwardXp(15, 'Time-blocked a study session');
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const willComplete = !e.isCompleted;
          if (willComplete) {
            onAwardXp(30, `Completed scheduled session: ${e.title}`);
          }
          return { ...e, isCompleted: willComplete };
        }
        return e;
      })
    );
  };

  // Real .ics download generator
  const handleExportICS = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/calendar/export-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurafocus-schedule-${selectedDate}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onAwardXp(25, 'Exported calendar schedule to .ics');
    } catch (err) {
      console.error(err);
      // Client-side fallback .ics generation
      let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AuraFocus//EN',
        'CALSCALE:GREGORIAN',
      ];
      events.forEach((e) => {
        const start = new Date(e.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = new Date(e.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics.push(
          'BEGIN:VEVENT',
          `SUMMARY:${e.title}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `DESCRIPTION:AuraFocus study session for ${e.subject}`,
          'END:VEVENT'
        );
      });
      ics.push('END:VCALENDAR');
      const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurafocus-schedule.ics`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  // Google Calendar 1-Click Sync Intent URL
  const getGoogleCalendarUrl = (ev: CalendarEvent) => {
    const startStr = new Date(ev.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endStr = new Date(ev.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`[AuraFocus] ${ev.title} (${ev.subject})`);
    const details = encodeURIComponent(
      `Focused study block scheduled with AuraFocus.\nSubject: ${ev.subject}\nTarget: Uninterrupted concentration.`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Sync Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">Study Calendar & Time Blocking</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>Daily Schedule Grid</span>
            <span aria-hidden="true">·</span>
            <span>Google Calendar & iCal Compatible</span>
            <span aria-hidden="true">·</span>
            <span>Active Time Blocking</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportICS}
            disabled={exporting}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            title="Download standard .ics file for Google Calendar, Apple Calendar or Outlook"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{exporting ? 'Generating...' : 'Export .ICS File'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Block Time</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-neutral-100 px-2 font-mono">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>

          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="ml-2 text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-1 bg-neutral-800/60 rounded"
          >
            Today
          </button>
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          {dayEvents.length} study block{dayEvents.length !== 1 ? 's' : ''} scheduled
        </div>
      </div>

      {/* Day Time-Blocking Grid */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/60">
        {hours.map((hour) => {
          const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
          // Find events that start at this hour
          const slotEvents = dayEvents.filter((ev) => {
            const h = new Date(ev.startTime).getHours();
            return h === hour;
          });

          return (
            <div key={hour} className="flex min-h-[64px] group hover:bg-neutral-900/30 transition-colors">
              {/* Hour Column */}
              <div className="w-20 sm:w-24 p-3 border-r border-neutral-800/80 text-xs font-mono text-neutral-400 shrink-0">
                {hourLabel}
              </div>

              {/* Event slot area */}
              <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                {slotEvents.length === 0 ? (
                  <button
                    onClick={() => {
                      setNewStartHour(hour);
                      setShowAddModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-opacity px-2 py-1 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Block {hourLabel}</span>
                  </button>
                ) : (
                  slotEvents.map((ev) => {
                    const startT = new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endT = new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={ev.id}
                        className={`flex-1 min-w-[280px] p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          ev.isCompleted
                            ? 'border-neutral-800 bg-neutral-950/60 opacity-60'
                            : 'border-amber-500/40 bg-amber-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleComplete(ev.id)}
                            className="text-neutral-400 hover:text-amber-400 shrink-0"
                            aria-label="Toggle completion"
                          >
                            <CheckCircle2 className={`w-4 h-4 ${ev.isCompleted ? 'text-amber-500' : 'text-neutral-500'}`} />
                          </button>

                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-neutral-100 truncate">
                              {ev.title}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-mono">
                              <span className="text-amber-400/90">{ev.subject}</span>
                              <span aria-hidden="true">·</span>
                              <span>{startT} - {endT}</span>
                            </div>
                          </div>
                        </div>

                        {/* Event Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Sync to Google Calendar 1-Click Link */}
                          <a
                            href={getGoogleCalendarUrl(ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors"
                            title="Add to your personal Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                            aria-label="Delete event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Calendar Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">Schedule Study Block</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1.5">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Work: Matrix Diagonalization Proofs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">Start Hour</label>
                  <select
                    value={newStartHour}
                    onChange={(e) => setNewStartHour(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">Duration</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value={25}>25 minutes (1 Pomodoro)</option>
                    <option value={50}>50 minutes (Double Block)</option>
                    <option value={90}>90 minutes (Ultradian Rhythm)</option>
                    <option value={120}>120 minutes (Deep Focus Sprint)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1.5">
                    Link Existing Task
                  </label>
                  <select
                    value={linkedTaskId}
                    onChange={(e) => {
                      setLinkedTaskId(e.target.value);
                      const t = tasks.find((item) => item.id === e.target.value);
                      if (t) {
                        setNewTitle(t.title);
                        setNewSubject(t.subject);
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">None (Custom Block)</option>
                    {tasks.filter(t => !t.completed).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.subject})
                      </option>
                    ))}
                  </select>
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
                  Block Schedule (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
