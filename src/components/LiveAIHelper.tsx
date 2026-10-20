import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, HelpCircle, Flame, CheckCircle, XCircle, RotateCcw, Brain, Loader2 } from 'lucide-react';
import { ChatMessage, QuizData } from '../types';

interface LiveAIHelperProps {
  onAwardXp: (amount: number, reason: string) => void;
}

export const LiveAIHelper: React.FC<LiveAIHelperProps> = ({ onAwardXp }) => {
  const [mode, setMode] = useState<'explain' | 'socratic' | 'quiz' | 'coach'>('explain');
  const [subject, setSubject] = useState<string>('General Science');
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      sender: 'ai',
      text: "👋 Welcome to your AuraFocus Live AI Tutor. What difficult concept, theory, or theorem are you working on right now? I'm here to explain it using first principles or test your recall.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'explain',
    },
  ]);

  // Quiz interactive state
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5),
          mode,
          subject,
        }),
      });

      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: 'm-ai-' + Date.now(),
        sender: 'ai',
        text: data.reply || "I've reviewed that. How does that align with your understanding?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      };

      setMessages((prev) => [...prev, aiMsg]);
      onAwardXp(15, 'Socratic AI discussion session');
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'm-err-' + Date.now(),
          sender: 'ai',
          text: "I encountered a brief connection error with the AI engine. Here's a core focus principle: Break the problem down into what you know for certain, what is hypothesized, and what the single next logical step is.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Generate Interactive Flash Quiz
  const handleGenerateQuiz = async () => {
    const topic = quizTopic.trim() || subject;
    if (!topic || quizLoading) return;

    setQuizLoading(true);
    setActiveQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty: 'medium' }),
      });

      if (!res.ok) throw new Error('Quiz generation failed');
      const data = await res.json();
      setActiveQuiz(data);
    } catch (err) {
      console.error(err);
      // Fallback sample quiz
      setActiveQuiz({
        topic,
        questions: [
          {
            question: `Which cognitive technique is most effective for long-term retention of ${topic}?`,
            options: [
              'Passive rereading of highlighting passages',
              'Active recall retrieval practice and spaced intervals',
              'Listening to lectures at 2x playback speed',
              'Cramming right before sleep',
            ],
            correctIndex: 1,
            explanation: 'Active recall forces neural pathways to reconstruct memory traces, significantly multiplying retrieval strength.',
          },
          {
            question: 'What is the primary role of sleep in consolidating memory?',
            options: [
              'Clearing all synaptic connections equally',
              'Replaying hippocampal traces and transferring them to the neocortex',
              'Suppressing dopamine secretion',
              'Reducing oxygen consumption in the brain stem',
            ],
            correctIndex: 1,
            explanation: 'During slow-wave and REM sleep, the hippocampus replays waking memory ensembles to integrate them into long-term cortical networks.',
          },
          {
            question: 'According to the Feynman technique, how do you verify you truly master a concept?',
            options: [
              'Memorize the verbatim textbook glossary definition',
              'Explain it simply to someone with zero technical background without jargon',
              'Solve problems only with reference formulas open',
              'Highlight all key terms in multiple fluorescent colors',
            ],
            correctIndex: 1,
            explanation: 'Explaining without jargon exposes hidden cognitive gaps and illusions of explanatory depth.',
          },
        ],
      });
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    setQuizSubmitted(true);

    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const reward = correctCount * 25;
    onAwardXp(reward, `Completed recall quiz (${correctCount}/${activeQuiz.questions.length} correct)`);
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizTopic('');
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'm-reset-' + Date.now(),
        sender: 'ai',
        text: 'Session refreshed. Ready for our next focus objective.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      },
    ]);
  };

  const promptSuggestions = [
    'Explain Bayes Theorem using a deck of cards',
    'What is the difference between SN1 and SN2 reactions?',
    'How does backpropagation work in neural networks?',
    'Socratic test me on cell respiration stages',
    'How do I break through mental study fatigue?',
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">Live AI Study Tutor & Helper</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>Adaptive Gemini 3.8 Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Active Recall Practice</span>
            <span aria-hidden="true">·</span>
            <span>Zero Hallucination Grounding</span>
          </div>
        </div>

        {/* Subject Context Selector */}
        <div className="flex items-center gap-2 text-xs text-neutral-300">
          <span className="text-neutral-400">Target Subject:</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Organic Chem, CS"
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 w-36"
          />
        </div>
      </div>

      {/* Mode Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
          <button
            onClick={() => setMode('explain')}
            className={`px-3.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              mode === 'explain' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Feynman Explainer</span>
          </button>

          <button
            onClick={() => setMode('socratic')}
            className={`px-3.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              mode === 'socratic' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Socratic Guide</span>
          </button>

          <button
            onClick={() => setMode('quiz')}
            className={`px-3.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              mode === 'quiz' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Recall Quiz</span>
          </button>

          <button
            onClick={() => setMode('coach')}
            className={`px-3.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              mode === 'coach' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Focus Coach</span>
          </button>
        </div>

        {mode !== 'quiz' && (
          <button
            onClick={clearChat}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        )}
      </div>

      {/* Main View Area: Chat vs Quiz */}
      {mode === 'quiz' ? (
        /* Interactive Quiz Arena */
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
          {!activeQuiz ? (
            <div className="space-y-4 max-w-lg mx-auto py-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-neutral-100">
                Instant Active Recall Generator
              </h2>
              <p className="text-xs text-neutral-400">
                Strengthen neural retrieval pathways. Enter any concept or chapter to generate a rapid 3-question diagnostic quiz.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. Mitosis vs Meiosis, QuickSort algorithm, Keynesian Multiplier"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                >
                  {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Quiz</span>
                </button>
              </div>

              {/* Sample Topics */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
                {['Stereochemistry', 'TCP vs UDP', 'Euler Formula', 'Neuroplasticity'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setQuizTopic(t);
                    }}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-lg hover:border-neutral-700 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <span className="text-xs text-neutral-400 font-mono">Active Recall Practice</span>
                  <h3 className="text-base font-semibold text-neutral-100">{activeQuiz.topic}</h3>
                </div>
                <button
                  onClick={resetQuiz}
                  className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  New Quiz Topic
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {activeQuiz.questions.map((q, qIndex) => {
                  const selected = userAnswers[qIndex];
                  const isAnswered = selected !== undefined;

                  return (
                    <div key={qIndex} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-mono font-bold text-amber-400 shrink-0 mt-0.5">
                          0{qIndex + 1}.
                        </span>
                        <div className="text-xs font-medium text-neutral-100 leading-relaxed">
                          {q.question}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-6">
                        {q.options.map((opt, optIndex) => {
                          const isOptionSelected = selected === optIndex;
                          let btnStyle = 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 text-neutral-300';

                          if (quizSubmitted) {
                            if (optIndex === q.correctIndex) {
                              btnStyle = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
                            } else if (isOptionSelected && optIndex !== q.correctIndex) {
                              btnStyle = 'border-rose-500/60 bg-rose-500/10 text-rose-300';
                            }
                          } else if (isOptionSelected) {
                            btnStyle = 'border-amber-500 bg-amber-500/10 text-amber-300 font-medium';
                          }

                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleSelectAnswer(qIndex, optIndex)}
                              disabled={quizSubmitted}
                              className={`p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-2 ${btnStyle}`}
                            >
                              <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="flex-1">{opt}</span>
                              {quizSubmitted && optIndex === q.correctIndex && (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                              )}
                              {quizSubmitted && isOptionSelected && optIndex !== q.correctIndex && (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box after submission */}
                      {quizSubmitted && (
                        <div className="ml-6 mt-2 p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                          <span className="text-amber-400 font-semibold block mb-0.5">Conceptual Explanation:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Score Action */}
              <div className="pt-4 flex items-center justify-between border-t border-neutral-800">
                <div className="text-xs text-neutral-400">
                  {quizSubmitted ? (
                    <span className="text-amber-400 font-semibold">
                      Quiz Completed! You earned XP for your active recall practice.
                    </span>
                  ) : (
                    <span>
                      {Object.keys(userAnswers).length} of {activeQuiz.questions.length} answered
                    </span>
                  )}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(userAnswers).length < activeQuiz.questions.length}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl transition-all"
                  >
                    Check Answers & Collect XP
                  </button>
                ) : (
                  <button
                    onClick={resetQuiz}
                    className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-all"
                  >
                    Try Another Topic
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Conversational AI Chat */
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl flex flex-col h-[560px] overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-200'
                    }`}
                  >
                    {isAi ? 'AI' : 'You'}
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                      isAi
                        ? 'bg-neutral-950 border border-neutral-800 text-neutral-200'
                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <span>{isAi ? `AuraFocus ${m.mode || 'Tutor'}` : 'You'}</span>
                      <span className="tabular-nums font-mono">{m.timestamp}</span>
                    </div>
                    {m.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center text-xs font-bold">
                  AI
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 text-xs text-neutral-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Synthesizing cognitive explanation...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-5 py-2 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-neutral-400 shrink-0 font-medium">Quick Prompts:</span>
            {promptSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(suggestion)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors shrink-0"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  mode === 'explain'
                    ? 'Ask me to explain any difficult concept using the Feynman method...'
                    : mode === 'socratic'
                    ? 'Present a problem or thesis statement you want to test...'
                    : 'Ask for active focus strategies, overcoming procrastination, or schedule tuning...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl transition-all shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
