import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Square,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  Paperclip,
  BookOpen,
  Volume2,
  VolumeX,
  Plus,
} from 'lucide-react';
import { AIMessage, ChatMode, Subject, Task, UserProfile } from '../types/studyos';
import { storage } from '../db/storage';
import { MarkdownRenderer } from './MarkdownRenderer';

interface RightAIChatbotWidgetProps {
  profile: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  activeTaskId?: string | null;
  onNavigateToFullAI: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const RightAIChatbotWidget: React.FC<RightAIChatbotWidgetProps> = ({
  profile,
  subjects,
  tasks,
  activeTaskId,
  onNavigateToFullAI,
  isOpen,
  setIsOpen,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    const list = storage.getMessages();
    return list.slice(-10);
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('universal');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active focus task if any
  const currentTask = tasks.find((t) => t.id === activeTaskId);

  // Keyboard shortcut listener (Cmd+J or Ctrl+J to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, isOpen]);

  // Adjust textarea height
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isStreaming) return;

    const userMsg: AIMessage = {
      id: 'usr-widget-' + Date.now(),
      conversation_id: 'conv-widget',
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const assistantMsgId = 'ast-widget-' + Date.now();
    const assistantPlaceholder: AIMessage = {
      id: assistantMsgId,
      conversation_id: 'conv-widget',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages([...newMessages, assistantPlaceholder]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const studentContext = {
        learning_category: profile.learning_category,
        subjects: subjects.map((s) => s.name),
        active_task: currentTask ? currentTask.title : undefined,
        deadlines: tasks
          .filter((t) => t.due_at && t.status !== 'completed')
          .slice(0, 3)
          .map((t) => ({ title: t.title, due: t.due_at })),
      };

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: currentMode,
          context: studentContext,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }

      if (!response.body) throw new Error('No response stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText, isStreaming: true } : m
                  )
                );
              }
            } catch {}
          }
        }
      }

      const finalized = [
        ...newMessages,
        {
          id: assistantMsgId,
          conversation_id: 'conv-widget',
          role: 'assistant' as const,
          content: accumulatedText || 'How can I assist you with your current study task?',
          created_at: new Date().toISOString(),
          isStreaming: false,
        },
      ];
      setMessages(finalized);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  status: 'error',
                  content:
                    '⚠️ Unable to fetch response from the AI model. Please verify your internet connection or retry.',
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_~]/g, ''));
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER ON THE RIGHT SIDE */}
      {!isOpen && (
        <div className="fixed right-4 bottom-20 md:bottom-6 z-40 group">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/30"
            aria-label="Open AI Assistant"
            title="Open AI Chatbot (Ctrl+J or ⌘J)"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-semibold tracking-tight pr-0.5">Ask AI</span>
            <kbd className="hidden lg:inline text-[9px] font-mono bg-indigo-700/60 px-1.5 py-0.5 rounded text-indigo-200">
              ⌘J
            </kbd>
          </button>
        </div>
      )}

      {/* SLIDE-OVER AI CHATBOT DRAWER ON THE RIGHT SIDE */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
          {/* Subtle Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity animate-in fade-in duration-150"
          />

          {/* Drawer Flyout Panel */}
          <aside className="relative w-full sm:w-[440px] h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col pointer-events-auto z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-neutral-100">StudyOS AI Assistant</h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono">gemini-3.8-flash · instant</p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1">
                {/* Mode Selector */}
                <select
                  value={currentMode}
                  onChange={(e) => setCurrentMode(e.target.value as ChatMode)}
                  className="bg-neutral-950 border border-neutral-800 text-[11px] rounded-lg px-2 py-1 text-neutral-200 focus:outline-none"
                >
                  <option value="universal">Universal</option>
                  <option value="feynman">Feynman</option>
                  <option value="socratic">Socratic</option>
                  <option value="code">Code</option>
                  <option value="math">Math</option>
                  <option value="exam">Exam</option>
                </select>

                {/* Maximize to full Universal AI view */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToFullAI();
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Expand to Fullscreen Universal AI"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Close Drawer */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Study Context Banner */}
            {currentTask && (
              <div className="px-3.5 py-1.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between text-[11px] text-indigo-300 shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="text-neutral-400">Context:</span>
                  <span className="font-semibold text-neutral-200 truncate">{currentTask.title}</span>
                </div>
                <button
                  onClick={() =>
                    handleSendMessage(`Can you explain the key concepts and solve problems for: "${currentTask.title}"?`)
                  }
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium shrink-0 ml-2"
                >
                  Ask about task
                </button>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-200">How can I help you right now?</h4>
                    <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto">
                      Ask any question, explain difficult concepts, solve equations, or debug code on the fly.
                    </p>
                  </div>

                  {/* Quick Starter Chips */}
                  <div className="flex flex-col gap-1.5 text-left pt-2">
                    {[
                      'Explain the concept I am studying right now with an analogy',
                      'Solve this calculus derivative step by step',
                      'Give me 3 active recall quiz questions on my subject',
                      'Help me debug this TypeScript recursive function',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/40 hover:bg-neutral-800 text-left text-neutral-300 text-[11px] transition-colors"
                      >
                        "{chip}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isAssistant = m.role === 'assistant';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isAssistant ? '' : 'justify-end'}`}
                    >
                      {isAssistant && (
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-[10px] shadow-sm mt-0.5">
                          AI
                        </div>
                      )}

                      <div className={`space-y-1 ${isAssistant ? 'w-full min-w-0' : 'max-w-[85%]'}`}>
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed ${
                            isAssistant
                              ? 'bg-neutral-900/80 border border-neutral-800 text-neutral-200 shadow-sm'
                              : 'bg-indigo-600 text-white shadow-md'
                          }`}
                        >
                          {isAssistant ? (
                            <div>
                              {m.content ? (
                                <MarkdownRenderer content={m.content} />
                              ) : (
                                <div className="flex items-center gap-1.5 text-neutral-400 py-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                  <span className="text-[11px]">Reasoning...</span>
                                </div>
                              )}
                              {m.isStreaming && (
                                <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-1 animate-pulse" />
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          )}
                        </div>

                        {/* Actions Toolbar */}
                        {isAssistant && m.content && !m.isStreaming && (
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 px-1">
                            <button
                              onClick={() => handleCopy(m.id, m.content)}
                              className="hover:text-neutral-200 flex items-center gap-0.5"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy</span>
                            </button>

                            <button
                              onClick={() => handleSpeech(m.id, m.content)}
                              className="hover:text-neutral-200 flex items-center gap-0.5"
                            >
                              {speakingId === m.id ? (
                                <VolumeX className="w-3 h-3 text-indigo-400" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                              <span>Listen</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800/80 shrink-0">
              <div className="flex items-end gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 focus-within:border-indigo-500/80 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask AI anything (Enter to send)..."
                  rows={1}
                  className="flex-1 bg-transparent border-0 text-xs text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none max-h-28 py-1 px-1.5"
                />

                {isStreaming ? (
                  <button
                    onClick={handleStop}
                    className="p-1.5 rounded-lg bg-neutral-800 text-rose-400 hover:bg-neutral-700 transition-colors"
                    title="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1.5 px-1">
                <span>Enter to send · Shift+Enter newline</span>
                <button
                  onClick={() => setMessages([])}
                  className="hover:text-neutral-200"
                >
                  Clear history
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
