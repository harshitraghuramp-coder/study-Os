import React, { useState } from 'react';
import {
  RotateCw,
  Plus,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Flashcard, ReviewRating, Subject, Topic } from '../types/studyos';
import { calculateNextReview } from '../db/storage';

interface RevisionViewProps {
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  subjects: Subject[];
  topics: Topic[];
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  flashcards,
  setFlashcards,
  subjects,
  topics,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // New flashcard form
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || '');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const now = new Date().toISOString();

  // Cards due for review today or overdue
  const dueQueue = flashcards.filter((f) => f.due_at <= now);
  const currentCard = dueQueue[activeCardIndex] || null;

  const handleReviewRating = (rating: ReviewRating) => {
    if (!currentCard) return;

    const nextReviewInfo = calculateNextReview(currentCard, rating);

    setFlashcards((prev) =>
      prev.map((fc) => {
        if (fc.id === currentCard.id) {
          return {
            ...fc,
            interval_days: nextReviewInfo.interval_days,
            repetitions: nextReviewInfo.repetitions,
            ease_factor: nextReviewInfo.ease_factor,
            due_at: nextReviewInfo.due_at,
            updated_at: new Date().toISOString(),
          };
        }
        return fc;
      })
    );

    setIsAnswerRevealed(false);
    if (activeCardIndex >= dueQueue.length - 1) {
      setActiveCardIndex(0);
    }
  };

  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: Flashcard = {
      id: 'fc-' + Date.now(),
      user_id: 'usr-default',
      subject_id: newSubjectId,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      difficulty: newDifficulty,
      interval_days: 1,
      repetitions: 0,
      ease_factor: 2.5,
      due_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setFlashcards((prev) => [newCard, ...prev]);
    setNewQuestion('');
    setNewAnswer('');
    setShowAddModal(false);
  };

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">
              Spaced Repetition & Flashcards
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic SM-2 memory retention engine. Active retrieval before synaptic decay.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Flashcard</span>
        </button>
      </div>

      {/* Queue Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <span className="text-xs text-neutral-400">Due Today</span>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1 tabular-nums">
            {dueQueue.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Cards awaiting spaced review</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <span className="text-xs text-neutral-400">Total Deck Size</span>
          <div className="text-2xl font-bold font-mono text-neutral-100 mt-1 tabular-nums">
            {flashcards.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Cards across all subjects</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <span className="text-xs text-neutral-400">Average Ease Factor</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {(
              flashcards.reduce((acc, f) => acc + f.ease_factor, 0) / (flashcards.length || 1)
            ).toFixed(2)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Memory multiplier curve</div>
        </div>
      </div>

      {/* Main Review Arena */}
      {currentCard ? (
        <div className="max-w-xl mx-auto p-8 rounded-3xl border border-neutral-800 bg-neutral-900/60 shadow-xl space-y-6">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>
              Card {activeCardIndex + 1} of {dueQueue.length}
            </span>
            <span className="capitalize text-indigo-400 font-semibold">
              Interval: {currentCard.interval_days}d · Reps: {currentCard.repetitions}
            </span>
          </div>

          {/* Flashcard Body */}
          <div className="min-h-[180px] flex flex-col justify-center items-center text-center p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Prompt
            </span>
            <div className="text-sm sm:text-base font-semibold text-neutral-100 leading-relaxed max-w-md">
              {currentCard.question}
            </div>

            {/* Answer Reveal Area */}
            {isAnswerRevealed ? (
              <div className="w-full pt-4 border-t border-neutral-800/80 animate-in fade-in duration-150 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Answer
                </span>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
                  {currentCard.answer}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setIsAnswerRevealed(true)}
                className="mt-2 px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show Answer</span>
              </button>
            )}
          </div>

          {/* SuperMemo SM-2 Rating Controls */}
          {isAnswerRevealed && (
            <div className="space-y-2 pt-2 animate-in fade-in duration-200">
              <span className="text-xs text-neutral-400 font-medium block text-center mb-2">
                How well did you recall this concept?
              </span>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => handleReviewRating('again')}
                  className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold transition-colors flex flex-col items-center"
                >
                  <span>Again</span>
                  <span className="text-[10px] font-mono opacity-80 mt-0.5">1d</span>
                </button>

                <button
                  onClick={() => handleReviewRating('hard')}
                  className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold transition-colors flex flex-col items-center"
                >
                  <span>Hard</span>
                  <span className="text-[10px] font-mono opacity-80 mt-0.5">
                    {Math.max(1, Math.round(currentCard.interval_days * 1.2))}d
                  </span>
                </button>

                <button
                  onClick={() => handleReviewRating('good')}
                  className="p-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold transition-colors flex flex-col items-center"
                >
                  <span>Good</span>
                  <span className="text-[10px] font-mono opacity-80 mt-0.5">
                    {Math.max(2, Math.round(currentCard.interval_days * currentCard.ease_factor))}d
                  </span>
                </button>

                <button
                  onClick={() => handleReviewRating('easy')}
                  className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold transition-colors flex flex-col items-center"
                >
                  <span>Easy</span>
                  <span className="text-[10px] font-mono opacity-80 mt-0.5">
                    {Math.max(3, Math.round(currentCard.interval_days * currentCard.ease_factor * 1.3))}d
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Queue Clear Empty State */
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-100">Revision Queue Cleared!</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            All due cards have been successfully retrieved today. The spaced repetition algorithm will schedule next reviews as optimal memory windows arrive.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Create New Flashcard
          </button>
        </div>
      )}

      {/* Add Flashcard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-neutral-100 mb-4">Create Study Flashcard</h2>
            <form onSubmit={handleCreateFlashcard} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Question / Retrieval Prompt *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. What is the time complexity of Dijkstra using a min-heap?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Answer *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. O((V + E) log V) because each vertex extract-min takes O(log V)..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Subject</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-medium block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
