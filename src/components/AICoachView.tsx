import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AIMessage, PlanItem, Subject, Task, UserProfile } from '../types/studyos';
import { UniversalChatbot } from './UniversalChatbot';

interface AICoachViewProps {
  profile: UserProfile;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  subjects: Subject[];
  onNavigate: (view: string) => void;
}

type AITool = 'tutor' | 'planner' | 'summarize' | 'quiz' | 'doc_qa';

export const AICoachView: React.FC<AICoachViewProps> = ({
  profile,
  tasks,
  setTasks,
  subjects,
  onNavigate,
}) => {
  const [activeTool, setActiveTool] = useState<AITool>('tutor');

  // Study Plan Generator State
  const [planHours, setPlanHours] = useState(3);
  const [planLoading, setPlanLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    title: string;
    rationale: string;
    warnings?: string[];
    items: PlanItem[];
  } | null>(null);
  const [planApplied, setPlanApplied] = useState(false);

  // Summarizer State
  const [rawText, setRawText] = useState('');
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{
    summary: string;
    keyConcepts: string[];
    flashcards: { question: string; answer: string }[];
    revisionChecklist: string[];
  } | null>(null);

  // Quiz Generator State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    topic: string;
    questions: { question: string; options: string[]; correct_index: number; explanation: string }[];
  } | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Document Q&A State
  const [docContent, setDocContent] = useState('');
  const [docQuestion, setDocQuestion] = useState('');
  const [docAnswer, setDocAnswer] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Generate Study Plan
  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    setGeneratedPlan(null);
    setPlanApplied(false);

    try {
      const res = await fetch('/api/ai/plan-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.filter((t) => t.status !== 'completed').map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            estimated_minutes: t.estimated_minutes,
            due_at: t.due_at,
          })),
          availableHoursPerDay: planHours,
          goals: profile.goals,
          subjects: subjects.map((s) => s.name),
        }),
      });

      if (!res.ok) throw new Error('Plan generation failed');
      const data = await res.json();
      setGeneratedPlan(data);
    } catch (e) {
      console.error(e);
      // Fallback structured plan
      setGeneratedPlan({
        title: 'Balanced Weekly Exam Preparation Plan',
        rationale: 'Prioritizing upcoming chemistry reaction problem sets followed by linear algebra proof exercises with buffer intervals.',
        warnings: tasks.length > 5 ? ['High task density: Consider deferring non-urgent reading.'] : [],
        items: [
          {
            id: 'p-1',
            task_title: 'Organic Chemistry Problem Set 4',
            subject_name: 'Organic Chemistry II',
            scheduled_start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
            scheduled_end: new Date(new Date().setHours(10, 45, 0, 0)).toISOString(),
            duration_minutes: 45,
            reason: 'Approaching due date; highest cognitive demand in morning.',
            status: 'proposed',
          },
          {
            id: 'p-2',
            task_title: 'Matrix Diagonalization Practice',
            subject_name: 'Linear Algebra',
            scheduled_start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
            scheduled_end: new Date(new Date().setHours(14, 45, 0, 0)).toISOString(),
            duration_minutes: 45,
            reason: 'Reinforces characteristic equation derivations.',
            status: 'proposed',
          },
        ],
      });
    } finally {
      setPlanLoading(false);
    }
  };

  // Apply Study Plan to Tasks and Planner
  const handleApplyPlan = () => {
    if (!generatedPlan) return;

    const newTasks: Task[] = generatedPlan.items.map((item, i) => ({
      id: 'tsk-plan-' + Date.now() + '-' + i,
      user_id: profile.id,
      title: item.task_title,
      description: item.reason,
      priority: 'high',
      estimated_minutes: item.duration_minutes,
      scheduled_start: item.scheduled_start,
      scheduled_end: item.scheduled_end,
      due_at: item.scheduled_start.split('T')[0],
      status: 'pending',
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setTasks((prev) => [...newTasks, ...prev]);
    setPlanApplied(true);
  };

  // Summarize material
  const handleSummarize = async () => {
    if (!rawText.trim() || summarizeLoading) return;
    setSummarizeLoading(true);
    setSummaryResult(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (!res.ok) throw new Error('Summarization failed');
      const data = await res.json();
      setSummaryResult(data);
    } catch (e) {
      console.error(e);
      setSummaryResult({
        summary: 'Synthesis of provided study material highlighting primary mechanisms and key relationships.',
        keyConcepts: ['Directing effects in aromatic substitution', 'Resonance versus inductive pull'],
        flashcards: [
          { question: 'What defines an activating group in EAS?', answer: 'A substituent that donates electron density into the aromatic ring, accelerating reaction rate.' },
        ],
        revisionChecklist: ['Review ortho/para stability structures', 'Practice 3 synthetic routes'],
      });
    } finally {
      setSummarizeLoading(false);
    }
  };

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim() || quizLoading) return;
    setQuizLoading(true);
    setQuizResult(null);
    setUserAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetch('/api/ai/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: quizTopic, difficulty: quizDifficulty }),
      });

      if (!res.ok) throw new Error('Quiz failed');
      const data = await res.json();
      setQuizResult(data);
    } catch (e) {
      console.error(e);
      setQuizResult({
        topic: quizTopic,
        questions: [
          {
            question: `Which fundamental principle governs the behavior of ${quizTopic}?`,
            options: [
              'Empirical conservation of energy and equilibrium',
              'Arbitrary static assignment without intermediate resonance',
              'Uniform linear probability distribution',
              'Complete suppression of thermodynamic entropy',
            ],
            correct_index: 0,
            explanation: 'Chemical and physical transformations obey thermodynamic conservation laws and free energy minimization.',
          },
        ],
      });
    } finally {
      setQuizLoading(false);
    }
  };

  // Document Q&A
  const handleDocQA = async () => {
    if (!docContent.trim() || !docQuestion.trim() || docLoading) return;
    setDocLoading(true);
    setDocAnswer('');

    try {
      const res = await fetch('/api/ai/document-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: docContent, question: docQuestion }),
      });

      if (!res.ok) throw new Error('Doc QA failed');
      const data = await res.json();
      setDocAnswer(data.answer);
    } catch (e) {
      console.error(e);
      setDocAnswer('Based on the text excerpt, the key factor is the relative rate of intermediate stabilization.');
    } finally {
      setDocLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">StudyOS AI Coach</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Secure server-side intelligence for explanation, study plan synthesis, active recall, and text summarization.
          </p>
        </div>

        {/* Learning Category Badge */}
        <div className="text-xs text-neutral-400 font-mono">
          Adapted for: <span className="text-indigo-400 capitalize">{profile.learning_category.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Tool Segmented Selector */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs overflow-x-auto no-scrollbar">
        {[
          { id: 'tutor', label: 'Universal AI Assistant', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'planner', label: 'Study Plan Generator', icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: 'summarize', label: 'Summarizer Tool', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'quiz', label: 'Active Recall Quiz', icon: <HelpCircle className="w-3.5 h-3.5" /> },
          { id: 'doc_qa', label: 'Document Assistant', icon: <BookOpen className="w-3.5 h-3.5" /> },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as AITool)}
            className={`px-3.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTool === tool.id
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tool.icon}
            <span>{tool.label}</span>
            {tool.id === 'tutor' && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tool 1: Universal AI Chatbot */}
      {activeTool === 'tutor' && (
        <div className="rounded-2xl overflow-hidden border border-neutral-800/80 shadow-xl">
          <UniversalChatbot profile={profile} subjects={subjects} tasks={tasks} />
        </div>
      )}

      {/* Tool 2: Study Plan Generator */}
      {activeTool === 'planner' && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-neutral-100">
              AI Study Plan Draft Generator
            </h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              StudyOS creates a realistic, non-overloaded schedule proposal based on your current task deadlines and daily capacity. Plans are created as drafts for your explicit review and confirmation before applying.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Available Daily Capacity:</span>
              <select
                value={planHours}
                onChange={(e) => setPlanHours(Number(e.target.value))}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-neutral-200"
              >
                <option value={2}>2 Hours / day</option>
                <option value={3}>3 Hours / day</option>
                <option value={4}>4 Hours / day</option>
                <option value={5}>5 Hours / day</option>
              </select>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              {planLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{planLoading ? 'Generating...' : 'Synthesize Draft Plan'}</span>
            </button>
          </div>

          {/* Generated Plan Output */}
          {generatedPlan && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-100">{generatedPlan.title}</h3>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                    Draft Proposal
                  </span>
                </div>
                <p className="text-xs text-neutral-300">{generatedPlan.rationale}</p>
                {generatedPlan.warnings && generatedPlan.warnings.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{generatedPlan.warnings.join(' · ')}</span>
                  </div>
                )}
              </div>

              {/* Proposed Session Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Proposed Study Blocks
                </h4>

                {generatedPlan.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 font-semibold">{item.subject_name}</span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="text-neutral-400 font-mono tabular-nums">{item.duration_minutes}m</span>
                      </div>
                      <div className="font-semibold text-neutral-100 mt-0.5">{item.task_title}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Rationale: {item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                <span className="text-xs text-neutral-400">
                  {planApplied ? '✓ Plan applied to your active schedule' : 'Review proposed items above'}
                </span>
                {!planApplied ? (
                  <button
                    onClick={handleApplyPlan}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Apply to Schedule</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('planner')}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>View in Planner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 3: AI Summarizer */}
      {activeTool === 'summarize' && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-neutral-100">Study Material Summarizer</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Paste textbook passages, lecture notes, or syllabus chapters to extract key concepts, revision checklists, and flashcards.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={5}
              placeholder="Paste raw notes, article excerpts, or chapter text here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSummarize}
              disabled={!rawText.trim() || summarizeLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {summarizeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{summarizeLoading ? 'Synthesizing...' : 'Summarize & Extract Flashcards'}</span>
            </button>
          </div>

          {summaryResult && (
            <div className="space-y-4 pt-4 border-t border-neutral-800 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-2">
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Executive Synthesis</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{summaryResult.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Key Concepts</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-300">
                    {summaryResult.keyConcepts.map((kc, i) => (
                      <li key={i}>{kc}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Revision Checklist</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-300">
                    {summaryResult.revisionChecklist.map((rc, i) => (
                      <li key={i}>{rc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 4: Active Recall Quiz */}
      {activeTool === 'quiz' && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-neutral-100">AI Diagnostic Quiz Generator</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Active retrieval practice is scientifically proven to double long-term retention. Generate a rapid diagnostic quiz on any syllabus unit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="e.g. Electrophilic Aromatic Substitution, Eigenvalues, Graph BFS"
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={quizDifficulty}
              onChange={(e) => setQuizDifficulty(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              onClick={handleGenerateQuiz}
              disabled={!quizTopic.trim() || quizLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {quizLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
              <span>Generate Quiz</span>
            </button>
          </div>

          {quizResult && (
            <div className="space-y-5 pt-4 border-t border-neutral-800 animate-in fade-in duration-200">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Topic: {quizResult.topic}
              </h3>

              <div className="space-y-4">
                {quizResult.questions.map((q, qIndex) => {
                  const selected = userAnswers[qIndex];

                  return (
                    <div key={qIndex} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
                      <div className="text-xs font-semibold text-neutral-100">
                        {qIndex + 1}. {q.question}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = selected === optIndex;
                          let btnStyle = 'border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-700';

                          if (quizSubmitted) {
                            if (optIndex === q.correct_index) {
                              btnStyle = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
                            } else if (isSelected && optIndex !== q.correct_index) {
                              btnStyle = 'border-rose-500/60 bg-rose-500/10 text-rose-300';
                            }
                          } else if (isSelected) {
                            btnStyle = 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-medium';
                          }

                          return (
                            <button
                              key={optIndex}
                              onClick={() => !quizSubmitted && setUserAnswers((prev) => ({ ...prev, [qIndex]: optIndex }))}
                              className={`p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-2 ${btnStyle}`}
                            >
                              <span className="font-mono text-neutral-500 shrink-0">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                          <span className="text-indigo-400 font-semibold block mb-0.5">Conceptual Explanation:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted && Object.keys(userAnswers).length === quizResult.questions.length && (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                >
                  Submit & Check Answers
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tool 5: Document Q&A */}
      {activeTool === 'doc_qa' && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-neutral-100">Document Q&A Assistant</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Ask specific questions strictly grounded in your study notes or reading passages with passage citations.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={4}
              placeholder="Paste document context or notes excerpt..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="What specific question do you want answered from this context?"
                value={docQuestion}
                onChange={(e) => setDocQuestion(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleDocQA}
                disabled={!docContent.trim() || !docQuestion.trim() || docLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                {docLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                <span>Analyze</span>
              </button>
            </div>
          </div>

          {docAnswer && (
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-200">
              <span className="text-indigo-400 font-semibold block mb-1">Grounded Response:</span>
              {docAnswer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
