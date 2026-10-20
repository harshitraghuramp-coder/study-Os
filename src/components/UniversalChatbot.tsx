import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  Paperclip,
  X,
  ChevronDown,
  Search,
  BookOpen,
  HelpCircle,
  Download,
  AlertCircle,
  PanelLeftClose,
  PanelLeft,
  Share2,
  Edit2,
  CheckCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  AIConversation,
  AIMessage,
  ChatAttachment,
  ChatMode,
  Subject,
  Task,
  UserProfile,
} from '../types/studyos';
import { storage } from '../db/storage';
import { MarkdownRenderer } from './MarkdownRenderer';

interface UniversalChatbotProps {
  profile: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  onNavigateToTask?: (taskId: string) => void;
}

export const UniversalChatbot: React.FC<UniversalChatbotProps> = ({
  profile,
  subjects,
  tasks,
}) => {
  // Conversations State
  const [conversations, setConversations] = useState<AIConversation[]>(() =>
    storage.getConversations()
  );
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const list = storage.getConversations();
    return list[0]?.id || 'conv-default';
  });

  // Messages State
  const [messages, setMessages] = useState<AIMessage[]>(() =>
    storage.getMessages(activeConvId)
  );

  // Composer State
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>('universal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);

  // Attachment State
  const [activeAttachment, setActiveAttachment] = useState<ChatAttachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Edit Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Speech Synthesis (TTS) State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editing Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Abort Controller Ref for stopping stream
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Sync messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      const convMsgs = storage.getMessages(activeConvId);
      setMessages(convMsgs);
      const conv = conversations.find((c) => c.id === activeConvId);
      if (conv?.mode) {
        setCurrentMode(conv.mode);
      }
      if (conv?.attached_context) {
        setActiveAttachment(conv.attached_context);
      } else {
        setActiveAttachment(null);
      }
    }
  }, [activeConvId]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Create a new conversation
  const handleNewConversation = (mode: ChatMode = 'universal') => {
    if (isStreaming) {
      handleStopGeneration();
    }
    const newId = 'conv-' + Date.now();
    const newConv: AIConversation = {
      id: newId,
      user_id: profile.id,
      title: 'New Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mode,
      system_context_enabled: true,
    };

    const updatedConvs = [newConv, ...conversations];
    setConversations(updatedConvs);
    storage.saveConversations(updatedConvs);
    setActiveConvId(newId);
    setMessages([]);
    setCurrentMode(mode);
    setActiveAttachment(null);
    setInput('');
  };

  // Delete a conversation
  const handleDeleteConversation = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    storage.deleteConversation(id);
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    storage.saveConversations(remaining);

    if (activeConvId === id) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else {
        handleNewConversation();
      }
    }
  };

  // Save edited conversation title
  const handleSaveTitle = () => {
    if (!titleDraft.trim() || !activeConversation) {
      setIsEditingTitle(false);
      return;
    }
    const updated = conversations.map((c) =>
      c.id === activeConversation.id
        ? { ...c, title: titleDraft.trim(), updated_at: new Date().toISOString() }
        : c
    );
    setConversations(updated);
    storage.saveConversations(updated);
    setIsEditingTitle(false);
  };

  // Send message and stream response from Gemini backend
  const handleSendMessage = async (textToSend?: string, contextOverride?: ChatAttachment | null) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isStreaming) return;

    const attachmentToUse = contextOverride !== undefined ? contextOverride : activeAttachment;

    // Create user message
    const userMsg: AIMessage = {
      id: 'usr-' + Date.now(),
      conversation_id: activeConvId,
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
      attachment: attachmentToUse || undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    storage.saveMessages([...storage.getMessages().filter((m) => m.conversation_id !== activeConvId), ...newMessages]);

    // Create placeholder assistant message
    const assistantMsgId = 'ast-' + (Date.now() + 1);
    const assistantPlaceholder: AIMessage = {
      id: assistantMsgId,
      conversation_id: activeConvId,
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

    // Auto-generate title if it's the first message and still titled 'New Conversation'
    if (messages.length === 0 && activeConversation?.title === 'New Conversation') {
      fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage: prompt }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.title) {
            const renamed = conversations.map((c) =>
              c.id === activeConvId ? { ...c, title: data.title } : c
            );
            setConversations(renamed);
            storage.saveConversations(renamed);
          }
        })
        .catch(() => {});
    }

    // Set up AbortController for stream cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build context payload
      const studentContext = {
        learning_category: profile.learning_category,
        subjects: subjects.map((s) => s.name),
        deadlines: tasks
          .filter((t) => t.due_at && t.status !== 'completed')
          .slice(0, 5)
          .map((t) => ({ title: t.title, due: t.due_at })),
      };

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachment: m.attachment,
          })),
          mode: currentMode,
          context: studentContext,
          documentContext: attachmentToUse?.type === 'document' ? attachmentToUse.content : undefined,
          attachedContext: attachmentToUse || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser');
      }

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
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedText, isStreaming: true }
                      : m
                  )
                );
              }
              if (parsed.error) {
                accumulatedText += `\n\n*[Notice: ${parsed.error}]*`;
              }
            } catch {
              // Ignore non-JSON ping lines
            }
          }
        }
      }

      // Mark streaming done and persist
      const finalizedMessages = [
        ...newMessages,
        {
          id: assistantMsgId,
          conversation_id: activeConvId,
          role: 'assistant' as const,
          content: accumulatedText || 'I am ready to help you learn and solve problems.',
          created_at: new Date().toISOString(),
          isStreaming: false,
          status: 'success' as const,
        },
      ];

      setMessages(finalizedMessages);
      storage.saveMessages([
        ...storage.getMessages().filter((m) => m.conversation_id !== activeConvId),
        ...finalizedMessages,
      ]);

      // Update conversation updated_at
      const updatedConvs = conversations.map((c) =>
        c.id === activeConvId ? { ...c, updated_at: new Date().toISOString() } : c
      );
      setConversations(updatedConvs);
      storage.saveConversations(updatedConvs);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User voluntarily stopped generation
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, isStreaming: false, status: 'interrupted' }
              : m
          )
        );
      } else {
        console.error('Chat stream error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  status: 'error',
                  content:
                    m.content ||
                    `⚠️ **Connection Notice:** Unable to reach the AI model (${err.message || 'Network error'}). If you have not set up your Gemini API key, please configure \`GEMINI_API_KEY\` in your environment secrets.`,
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

  // Stop generation in progress
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Regenerate last assistant answer
  const handleRegenerate = () => {
    if (isStreaming || messages.length === 0) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualUserIndex = messages.length - 1 - lastUserIndex;
    const userPrompt = messages[actualUserIndex].content;
    const attachment = messages[actualUserIndex].attachment;

    // Prune up to the user message
    const trimmed = messages.slice(0, actualUserIndex);
    setMessages(trimmed);
    handleSendMessage(userPrompt, attachment);
  };

  // Edit an existing user message and resend
  const handleStartEdit = (message: AIMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (!editingText.trim()) return;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Slice messages up to the edited message, replace it, and regenerate
    const attachment = messages[msgIndex].attachment;
    const trimmed = messages.slice(0, msgIndex);
    setMessages(trimmed);
    setEditingMessageId(null);
    handleSendMessage(editingText.trim(), attachment);
  };

  // Text-to-Speech (read message aloud)
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~]/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Mathematical equation.');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy message text to clipboard
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export conversation to Markdown file
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const lines = [
      `# ${activeConversation?.title || 'StudyOS Conversation'}`,
      `*Exported on ${new Date().toLocaleString()}*`,
      `*Mode: ${currentMode}*`,
      '',
      '---',
      '',
    ];

    for (const m of messages) {
      lines.push(`### ${m.role === 'user' ? '👤 User' : '🤖 StudyOS AI'}`);
      if (m.attachment) {
        lines.push(`*[Attached ${m.attachment.type}: ${m.attachment.name}]*`);
      }
      lines.push(m.content);
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeConversation?.title || 'conversation').toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle local file upload (text, markdown, code, pdf text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const attachment: ChatAttachment = {
        name: file.name,
        type: 'document',
        content,
        size: file.size,
      };
      setActiveAttachment(attachment);
      setShowAttachMenu(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-5.5rem)] md:h-[calc(100vh-4.5rem)] -my-4 -mx-4 md:-my-6 md:-mx-6 overflow-hidden bg-neutral-950 text-neutral-100">
      {/* 1. LEFT SIDEBAR: Conversations History */}
      <aside
        className={`${
          isSidebarOpen ? 'w-72' : 'w-0'
        } shrink-0 border-r border-neutral-800/80 bg-neutral-900/50 flex flex-col transition-all duration-200 overflow-hidden z-20`}
      >
        {/* Sidebar Header & New Chat Action */}
        <div className="p-3.5 border-b border-neutral-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-tight text-neutral-200">
                Universal AI
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
              title="Close history sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => handleNewConversation(currentMode)}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversation</span>
          </button>

          {/* Search Conversations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-neutral-800/90 text-neutral-100 font-medium shadow-sm border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-6">
                    <Sparkles
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-400' : 'text-neutral-400'
                      }`}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  {/* Delete Conversation Button */}
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 transition-all absolute right-2"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* AI Model Indicator Footer */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-neutral-300">gemini-3.8-flash</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Continuous Chat</span>
        </div>
      </aside>

      {/* 2. MAIN CONVERSATION PANEL */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">
        {/* Main Header */}
        <header className="h-13 border-b border-neutral-800/80 px-4 flex items-center justify-between bg-neutral-950/90 backdrop-blur shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
                title="Open history sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* Conversation Title (Editable) */}
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="px-2 py-0.5 text-xs font-semibold bg-neutral-900 border border-indigo-500 rounded text-neutral-100 focus:outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h2
                  onDoubleClick={() => {
                    setTitleDraft(activeConversation?.title || '');
                    setIsEditingTitle(true);
                  }}
                  className="text-xs md:text-sm font-bold text-neutral-100 truncate cursor-pointer hover:text-indigo-300 transition-colors"
                  title="Double click to rename"
                >
                  {activeConversation?.title || 'Universal AI Assistant'}
                </h2>
                <button
                  onClick={() => {
                    setTitleDraft(activeConversation?.title || '');
                    setIsEditingTitle(true);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-300 opacity-60 hover:opacity-100"
                  title="Rename title"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Header Controls: Mode Selector & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mode Selector */}
            <div className="relative">
              <select
                value={currentMode}
                onChange={(e) => setCurrentMode(e.target.value as ChatMode)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-200 hover:border-neutral-700 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                <option value="universal">🌐 Universal AI (All Subjects)</option>
                <option value="feynman">💡 Feynman Explainer</option>
                <option value="socratic">🔍 Socratic Tutor</option>
                <option value="code">💻 Code & Debugger</option>
                <option value="math">📐 Math & Science</option>
                <option value="exam">🎯 Exam Prep & Recall</option>
                <option value="writing">✍️ Writing & Editing</option>
              </select>
            </div>

            {/* Context Drawer Toggle */}
            <button
              onClick={() => setIsContextDrawerOpen(!isContextDrawerOpen)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                isContextDrawerOpen || activeAttachment
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle StudyOS Context & Document panel"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">Context</span>
            </button>

            {/* Export Chat Button */}
            <button
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 disabled:opacity-40 transition-colors"
              title="Export chat as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {messages.length === 0 ? (
            /* EMPTY STATE */
            <div className="max-w-2xl mx-auto py-8 text-center space-y-8 animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-100">
                  What would you like to understand today?
                </h1>
                <p className="text-xs md:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
                  Ask anything. Learn something new, solve a problem, understand difficult theorems, or explore an idea.
                </p>
              </div>

              {/* Categorized Quick Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                {[
                  {
                    title: 'Solve math step-by-step',
                    prompt: 'Solve the integral ∫ x * e^(2x) dx showing every integration by parts step clearly.',
                    mode: 'math' as ChatMode,
                    tag: 'Math',
                  },
                  {
                    title: 'Explain with Feynman analogy',
                    prompt: 'Explain how quantum superposition works using a simple, relatable coin flip analogy.',
                    mode: 'feynman' as ChatMode,
                    tag: 'Science',
                  },
                  {
                    title: 'Debug & explain code',
                    prompt: 'Explain the difference between Dijkstra and A* pathfinding with a clean TypeScript implementation.',
                    mode: 'code' as ChatMode,
                    tag: 'Coding',
                  },
                  {
                    title: 'Exam revision strategy',
                    prompt: 'Create a 3-week active recall study roadmap for organic chemistry reaction mechanisms.',
                    mode: 'exam' as ChatMode,
                    tag: 'Study Strategy',
                  },
                  {
                    title: 'Socratic dialogue on concepts',
                    prompt: 'Guide me with Socratic questions to understand why the central bank adjusts interest rates to control inflation.',
                    mode: 'socratic' as ChatMode,
                    tag: 'Economics',
                  },
                  {
                    title: 'Refine essay argument',
                    prompt: 'Review and improve the logical strength of this thesis: "Technological automation increases productivity but requires new social safety nets."',
                    mode: 'writing' as ChatMode,
                    tag: 'Writing',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentMode(item.mode);
                      handleSendMessage(item.prompt);
                    }}
                    className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900 text-left transition-all group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-neutral-200 group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-neutral-400 line-clamp-2 leading-relaxed">
                      "{item.prompt}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* RENDER MESSAGES */
            messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              const isEditing = editingMessageId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex gap-3 md:gap-4 max-w-3xl mx-auto ${
                    isAssistant ? '' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md shadow-indigo-600/20 mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col space-y-1.5 ${
                      isAssistant ? 'w-full min-w-0' : 'max-w-[85%]'
                    }`}
                  >
                    {/* User Attachment Banner if message had one */}
                    {m.attachment && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-indigo-300 self-end mb-1">
                        <Paperclip className="w-3 h-3" />
                        <span className="font-medium truncate max-w-xs">{m.attachment.name}</span>
                      </div>
                    )}

                    {/* Message Card */}
                    <div
                      className={`rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                        isAssistant
                          ? 'bg-neutral-900/70 border border-neutral-800/80 text-neutral-200 shadow-sm'
                          : 'bg-indigo-600 text-white shadow-md'
                      }`}
                    >
                      {/* Editing User Message */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                            rows={3}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2.5 py-1 rounded bg-neutral-800 text-[11px] text-neutral-300 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(m.id)}
                              className="px-2.5 py-1 rounded bg-indigo-500 text-[11px] font-semibold text-white hover:bg-indigo-400"
                            >
                              Save & Resend
                            </button>
                          </div>
                        </div>
                      ) : isAssistant ? (
                        <div>
                          {m.content ? (
                            <MarkdownRenderer content={m.content} />
                          ) : (
                            <div className="flex items-center gap-2 text-neutral-400 py-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                              <span className="text-xs">Thinking and reasoning...</span>
                            </div>
                          )}

                          {/* Streaming Blinking Cursor */}
                          {m.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>

                    {/* Message Action Bar */}
                    <div
                      className={`flex items-center gap-2 text-[11px] text-neutral-400 px-1 ${
                        isAssistant ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {/* Copy message */}
                      <button
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        className="hover:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      {/* Text-to-Speech for Assistant */}
                      {isAssistant && m.content && !m.isStreaming && (
                        <button
                          onClick={() => handleToggleSpeech(m.id, m.content)}
                          className={`hover:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer ${
                            speakingMessageId === m.id ? 'text-indigo-400 font-semibold' : ''
                          }`}
                          title="Read aloud"
                        >
                          {speakingMessageId === m.id ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              <span className="text-[10px]">Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span className="text-[10px]">Listen</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Retry button on error or interrupted */}
                      {isAssistant && (m.status === 'error' || m.status === 'interrupted') && (
                        <button
                          onClick={handleRegenerate}
                          className="hover:text-indigo-300 text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                          title="Retry generating response"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="text-[10px]">Retry</span>
                        </button>
                      )}

                      {/* Edit user message */}
                      {!isAssistant && (
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="hover:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit message"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span className="text-[10px]">Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer Anchored at Bottom */}
        <div className="p-3 md:p-4 bg-neutral-950/95 border-t border-neutral-800/80 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Active Attachment Pill */}
            {activeAttachment && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-neutral-900 border border-indigo-500/40 text-xs text-indigo-300 animate-in fade-in">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-neutral-200 truncate">
                    {activeAttachment.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">
                    ({activeAttachment.type})
                  </span>
                </div>
                <button
                  onClick={() => setActiveAttachment(null)}
                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Container */}
            <div className="relative flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 focus-within:border-indigo-500/80 transition-all shadow-sm">
              {/* Attachment Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Attach file or coursework"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Attachment Dropdown Menu */}
                {showAttachMenu && (
                  <div className="absolute bottom-12 left-0 w-64 bg-neutral-900 border border-neutral-800 rounded-xl p-2 shadow-xl z-30 space-y-1 text-xs">
                    <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase">
                      Attach Context
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-800 text-neutral-200 text-left transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Upload Notes / Doc (.txt, .md, code)</span>
                    </button>

                    <div className="pt-1 border-t border-neutral-800">
                      <div className="px-2 py-1 text-[10px] text-neutral-400">
                        Link Active StudyOS Course:
                      </div>
                      {subjects.slice(0, 3).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveAttachment({
                              name: s.name,
                              type: 'subject',
                              content: `Subject: ${s.name}\nDescription: ${s.description}\nCourse: ${s.course_or_semester || ''}`,
                            });
                            setShowAttachMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 text-left truncate transition-colors text-[11.5px]"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.ts,.js,.py,.html,.css"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Textarea */}
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
                placeholder="Ask anything (e.g., explain concepts, debug code, solve equations, exam prep)..."
                rows={1}
                className="flex-1 bg-transparent border-0 text-xs text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none max-h-40 py-2"
              />

              {/* Action Buttons: Stop Generation or Send */}
              {isStreaming ? (
                <button
                  onClick={handleStopGeneration}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-neutral-700 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline text-[11px]">Stop</span>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  {/* Regenerate Answer */}
                  {messages.length > 1 && (
                    <button
                      onClick={handleRegenerate}
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Regenerate last response"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-sm"
                    title="Send message (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Hint text */}
            <div className="flex items-center justify-between text-[10.5px] text-neutral-400 px-1">
              <span>
                Press <kbd className="font-mono text-neutral-300">Enter</kbd> to send,{' '}
                <kbd className="font-mono text-neutral-300">Shift+Enter</kbd> for newline
              </span>
              <span>Gemini 3.8 Flash · Unlimited multi-turn reasoning</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. RIGHT CONTEXTUAL DRAWER (Collapsible) */}
      {isContextDrawerOpen && (
        <aside className="w-80 border-l border-neutral-800/80 bg-neutral-900/60 p-4 shrink-0 flex flex-col space-y-4 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-neutral-100">StudyOS Context</h3>
            </div>
            <button
              onClick={() => setIsContextDrawerOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Profile Info */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-400 text-[11px]">
              <span>Student Profile</span>
              <span className="text-indigo-400 font-mono capitalize">
                {profile.learning_category.replace('_', ' ')}
              </span>
            </div>
            <div className="text-neutral-200 font-medium">{profile.display_name}</div>
            <div className="text-[11px] text-neutral-400">
              Primary Goal: {profile.goals[0] || 'Academic Mastery'}
            </div>
          </div>

          {/* Attached Document Content Preview */}
          {activeAttachment ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
                <span>Attached {activeAttachment.type}</span>
                <button
                  onClick={() => setActiveAttachment(null)}
                  className="text-rose-400 hover:underline text-[10px]"
                >
                  Clear
                </button>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-indigo-900/40 text-[11px] font-mono text-neutral-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {activeAttachment.content.slice(0, 1000)}
                {activeAttachment.content.length > 1000 && '... [truncated]'}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-neutral-800 text-center space-y-2">
              <p className="text-xs text-neutral-400">No document attached.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium"
              >
                Upload Document
              </button>
            </div>
          )}

          {/* Quick Context Injection from User Tasks */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block">
              Inject Active Study Tasks
            </span>
            <div className="space-y-1.5">
              {tasks.slice(0, 4).map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    handleSendMessage(
                      `Can you help me break down and study for my upcoming task: "${task.title}"? Give me a 30-minute structured study sprint.`
                    );
                  }}
                  className="w-full p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-left transition-colors text-xs flex items-center justify-between group"
                >
                  <span className="text-neutral-300 truncate pr-2 group-hover:text-indigo-300">
                    {task.title}
                  </span>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
