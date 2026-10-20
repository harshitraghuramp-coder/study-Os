import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Folder,
  FileText,
  Sparkles,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Flashcard, Resource, Subject, Topic, TopicStatus } from '../types/studyos';

interface LibraryViewProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  resources: Resource[];
  flashcards: Flashcard[];
  onNavigate: (view: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  subjects,
  setSubjects,
  topics,
  setTopics,
  resources,
  flashcards,
  onNavigate,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [showAddSubject, setShowAddSubject] = useState<boolean>(false);
  const [showAddTopic, setShowAddTopic] = useState<boolean>(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // New subject form
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjDesc, setNewSubjDesc] = useState('');
  const [newSubjCourse, setNewSubjCourse] = useState('');
  const [newSubjColor, setNewSubjColor] = useState('#6366f1');

  // New topic form
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicDiff, setNewTopicDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newTopicMinutes, setNewTopicMinutes] = useState(45);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const subjectTopics = topics.filter((t) => t.subject_id === activeSubject?.id);
  const subjectResources = resources.filter((r) => r.subject_id === activeSubject?.id);
  const subjectFlashcards = flashcards.filter((f) => f.subject_id === activeSubject?.id);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    const newSubj: Subject = {
      id: 'subj-' + Date.now(),
      user_id: 'usr-default',
      name: newSubjName.trim(),
      description: newSubjDesc.trim(),
      color: newSubjColor,
      course_or_semester: newSubjCourse.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSubjects((prev) => [...prev, newSubj]);
    setSelectedSubjectId(newSubj.id);
    setNewSubjName('');
    setNewSubjDesc('');
    setShowAddSubject(false);
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !activeSubject) return;

    const newTopic: Topic = {
      id: 'top-' + Date.now(),
      subject_id: activeSubject.id,
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim(),
      difficulty: newTopicDiff,
      priority: 'medium',
      status: 'not_started',
      estimated_minutes: Number(newTopicMinutes) || 45,
    };

    setTopics((prev) => [...prev, newTopic]);
    setNewTopicTitle('');
    setNewTopicDesc('');
    setShowAddTopic(false);
  };

  const handleUpdateTopicStatus = (topicId: string, status: TopicStatus) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const statusColors: Record<TopicStatus, { label: string; text: string; bg: string }> = {
    not_started: { label: 'Not Started', text: 'text-neutral-400', bg: 'bg-neutral-800' },
    in_progress: { label: 'In Progress', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    needs_revision: { label: 'Needs Revision', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    completed: { label: 'Completed', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  };

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Study Library & Syllabus</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Organize courses, subjects, chapters, notes, and revision materials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddSubject(true)}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </button>

          <button
            onClick={() => setShowAddTopic(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter / Topic</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Subjects Sidebar + Topic Syllabus Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Subjects List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
            Courses & Subjects ({subjects.length})
          </div>

          <div className="space-y-1.5">
            {subjects.map((s) => {
              const isSelected = s.id === activeSubject?.id;
              const count = topics.filter((t) => t.subject_id === s.id).length;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-500/10 shadow-sm'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200 truncate">{s.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                  </div>
                  {s.course_or_semester && (
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                      {s.course_or_semester}
                    </div>
                  )}
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {count} topic{count !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Subject Content (3 Columns) */}
        {activeSubject && (
          <div className="md:col-span-3 space-y-6">
            {/* Subject Detail Header */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-100">{activeSubject.name}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{activeSubject.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('revision')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{subjectFlashcards.length} Flashcards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Topics & Chapters List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Syllabus Units & Topics ({subjectTopics.length})
                </h3>
              </div>

              {subjectTopics.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-800 rounded-xl space-y-2">
                  <p className="text-xs text-neutral-400">No topics added to this subject yet.</p>
                  <button
                    onClick={() => setShowAddTopic(true)}
                    className="text-xs text-indigo-400 font-medium hover:underline"
                  >
                    Add first topic
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subjectTopics.map((top) => {
                    const statusInfo = statusColors[top.status];

                    return (
                      <div
                        key={top.id}
                        className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase font-semibold text-neutral-400">
                              {top.difficulty}
                            </span>
                            <span aria-hidden="true" className="text-neutral-600">·</span>
                            <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
                              Est. {top.estimated_minutes}m
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-neutral-100 mt-1">
                            {top.title}
                          </h4>
                          {top.description && (
                            <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                              {top.description}
                            </p>
                          )}
                        </div>

                        {/* Status Select Control */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={top.status}
                            onChange={(e) => handleUpdateTopicStatus(top.id, e.target.value as TopicStatus)}
                            className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border border-neutral-800 focus:outline-none ${statusInfo.bg} ${statusInfo.text}`}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="needs_revision">Needs Revision</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes & Cheatsheets Section */}
            {subjectResources.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Notes & Cheatsheets ({subjectResources.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subjectResources.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => setSelectedResource(res)}
                      className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-indigo-400 text-xs">
                        <FileText className="w-4 h-4" />
                        <span className="font-semibold text-neutral-200 truncate">{res.title}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        {res.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resource Modal Reader */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h2 className="text-sm font-bold text-neutral-100">{selectedResource.title}</h2>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
              {selectedResource.content}
            </pre>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">Add New Subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cognitive Psychology"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Course or Semester (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Semester 2 · PSY 101"
                  value={newSubjCourse}
                  onChange={(e) => setNewSubjCourse(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Memory, attention, perception models"
                  value={newSubjDesc}
                  onChange={(e) => setNewSubjDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">
              Add Topic to {activeSubject?.name}
            </h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Working Memory & Baddeley Model"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Topic Scope or Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phonological loop, visuospatial sketchpad"
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Difficulty</label>
                  <select
                    value={newTopicDiff}
                    onChange={(e) => setNewTopicDiff(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={newTopicMinutes}
                    onChange={(e) => setNewTopicMinutes(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTopic(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
