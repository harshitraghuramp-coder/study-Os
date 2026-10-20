import {
  AIConversation,
  AIMessage,
  ChatMode,
  Flashcard,
  PlanItem,
  Resource,
  ReviewRating,
  StudyPlan,
  StudySession,
  Subject,
  Task,
  Topic,
  UserProfile,
} from '../types/studyos';

const PROFILE_KEY = 'studyos_profile';
const SUBJECTS_KEY = 'studyos_subjects';
const TOPICS_KEY = 'studyos_topics';
const TASKS_KEY = 'studyos_tasks';
const SESSIONS_KEY = 'studyos_sessions';
const PLANS_KEY = 'studyos_plans';
const RESOURCES_KEY = 'studyos_resources';
const FLASHCARDS_KEY = 'studyos_flashcards';
const CONVERSATIONS_KEY = 'studyos_conversations';
const MESSAGES_KEY = 'studyos_messages';

export const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-default',
  email: 'learner@studyos.io',
  display_name: 'Alex Chen',
  learning_category: 'college',
  goals: ['Improve focus', 'Prepare for exams', 'Build a consistent routine'],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  theme_preference: 'system',
  weekly_goal_minutes: 600,
  preferred_study_time: 'morning',
  default_focus_minutes: 25,
  default_break_minutes: 5,
  onboarding_completed: true,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-1',
    user_id: 'usr-default',
    name: 'Organic Chemistry II',
    description: 'Reaction mechanisms, stereochemistry, and synthesis pathways',
    color: '#6366f1',
    course_or_semester: 'Semester 4 · Chem 202',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'subj-2',
    user_id: 'usr-default',
    name: 'Linear Algebra & Calculus',
    description: 'Eigenvalues, vector spaces, and multivariate integration',
    color: '#8b5cf6',
    course_or_semester: 'Semester 4 · Math 210',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'subj-3',
    user_id: 'usr-default',
    name: 'Data Structures & Algorithms',
    description: 'Asymptotic complexity, trees, graphs, and dynamic programming',
    color: '#0ea5e9',
    course_or_semester: 'Semester 4 · CS 201',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'top-1',
    subject_id: 'subj-1',
    title: 'Electrophilic Aromatic Substitution (EAS)',
    description: 'Directing groups (ortho/para vs meta) and resonance stabilization',
    difficulty: 'hard',
    priority: 'urgent',
    status: 'in_progress',
    estimated_minutes: 60,
  },
  {
    id: 'top-2',
    subject_id: 'subj-1',
    title: 'SN1 vs SN2 Nucleophilic Substitution',
    description: 'Solvent effects, stereochemical inversion, and carbocation stability',
    difficulty: 'medium',
    priority: 'high',
    status: 'completed',
    estimated_minutes: 45,
    completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'top-3',
    subject_id: 'subj-2',
    title: 'Eigenvalues & Diagonalization',
    description: 'Characteristic equation det(A - lambda*I) = 0 and eigenspaces',
    difficulty: 'hard',
    priority: 'urgent',
    status: 'needs_revision',
    estimated_minutes: 75,
  },
  {
    id: 'top-4',
    subject_id: 'subj-3',
    title: 'Graph Traversals (BFS & DFS)',
    description: 'Adjacency lists, shortest paths, and topological sort',
    difficulty: 'medium',
    priority: 'medium',
    status: 'completed',
    estimated_minutes: 50,
    completed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-1',
    user_id: 'usr-default',
    subject_id: 'subj-1',
    topic_id: 'top-1',
    title: 'Solve 10 EAS mechanism reaction problems',
    description: 'Focus on friedel-crafts acylation and ortho/para directing effects.',
    priority: 'urgent',
    estimated_minutes: 50,
    due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    scheduled_start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    scheduled_end: new Date(new Date().setHours(10, 50, 0, 0)).toISOString(),
    status: 'pending',
    subtasks: [
      { id: 'sub-1', title: 'Work through problem set 4.1 to 4.5', completed: true },
      { id: 'sub-2', title: 'Review halogens deactivating but o/p directing rationale', completed: false },
      { id: 'sub-3', title: 'Check answers in solutions manual', completed: false },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tsk-2',
    user_id: 'usr-default',
    subject_id: 'subj-2',
    topic_id: 'top-3',
    title: 'Matrix Diagonalization Practice Quiz',
    description: 'Calculate eigenvalues and construct modal matrix P such that P^-1 A P = D.',
    priority: 'high',
    estimated_minutes: 45,
    due_at: new Date(Date.now() + 3 * 86400000).toISOString(),
    scheduled_start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    scheduled_end: new Date(new Date().setHours(14, 45, 0, 0)).toISOString(),
    status: 'pending',
    subtasks: [
      { id: 'sub-4', title: 'Set up 3x3 characteristic polynomial', completed: false },
      { id: 'sub-5', title: 'Find basis for nullspace (A - lambda*I)', completed: false },
    ],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tsk-3',
    user_id: 'usr-default',
    subject_id: 'subj-3',
    topic_id: 'top-4',
    title: 'Implement Dijkstra algorithm in Python',
    description: 'Use min-heap priority queue and verify against directed cyclic graph.',
    priority: 'medium',
    estimated_minutes: 40,
    due_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'completed',
    subtasks: [
      { id: 'sub-6', title: 'Define adjacency list structure', completed: true },
      { id: 'sub-7', title: 'Implement distance relaxation loop', completed: true },
    ],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 'sess-1',
    user_id: 'usr-default',
    task_id: 'tsk-3',
    subject_id: 'subj-3',
    started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    ended_at: new Date(Date.now() - 86400000 * 2 + 50 * 60000).toISOString(),
    focused_seconds: 3000,
    paused_seconds: 120,
    status: 'completed',
    session_notes: 'Completed graph traversal unit. Good flow state achieved.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sess-2',
    user_id: 'usr-default',
    task_id: 'tsk-1',
    subject_id: 'subj-1',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    ended_at: new Date(Date.now() - 86400000 + 45 * 60000).toISOString(),
    focused_seconds: 2700,
    paused_seconds: 60,
    status: 'completed',
    session_notes: 'Reviewed electrophilic addition mechanism.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    user_id: 'usr-default',
    subject_id: 'subj-1',
    topic_id: 'top-1',
    question: 'Why do halogens act as deactivating groups yet direct ortho/para in EAS?',
    answer: 'Halogens are inductively electron-withdrawing (-I effect) due to electronegativity (deactivating the ring), but their lone pairs donate into the pi system via resonance (+R effect), stabilizing the carbocation intermediate at ortho and para positions.',
    difficulty: 'hard',
    interval_days: 1,
    repetitions: 1,
    ease_factor: 2.5,
    due_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fc-2',
    user_id: 'usr-default',
    subject_id: 'subj-2',
    topic_id: 'top-3',
    question: 'What is the condition for an n x n matrix A to be diagonalizable?',
    answer: 'Matrix A is diagonalizable if and only if it has n linearly independent eigenvectors, meaning the geometric multiplicity of each eigenvalue equals its algebraic multiplicity.',
    difficulty: 'medium',
    interval_days: 2,
    repetitions: 2,
    ease_factor: 2.6,
    due_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fc-3',
    user_id: 'usr-default',
    subject_id: 'subj-3',
    topic_id: 'top-4',
    question: 'What is the time complexity of Dijkstra using a binary min-heap for a graph with V vertices and E edges?',
    answer: 'O((V + E) log V). Extracting min takes O(log V) for V vertices, and decrease-key takes O(log V) for each edge relaxation.',
    difficulty: 'medium',
    interval_days: 4,
    repetitions: 3,
    ease_factor: 2.7,
    due_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    user_id: 'usr-default',
    subject_id: 'subj-1',
    title: 'EAS Reactivity & Orientation Cheatsheet',
    resource_type: 'cheatsheet',
    content: `Electrophilic Aromatic Substitution (EAS) Guide:
- Activating (o/p): -OH, -NH2, -OCH3, -Alkyl (strong resonance/inductive donors)
- Deactivating (o/p): -F, -Cl, -Br, -I (inductive withdrawal dominates rate, resonance dictates position)
- Deactivating (meta): -NO2, -CF3, -CN, -COOH, -SO3H (electron withdrawal at ortho/para destabilizes arenium ion)`,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'res-2',
    user_id: 'usr-default',
    subject_id: 'subj-2',
    title: 'Eigenvalues & Diagonalization Quick Proofs',
    resource_type: 'notes',
    content: `Characteristic Polynomial: det(A - λI) = 0
Trace(A) = Sum of eigenvalues
Determinant(A) = Product of eigenvalues
If A is symmetric, all eigenvalues are real and eigenvectors are orthogonal.`,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

// Spaced Repetition (SuperMemo SM-2 adaptation)
export function calculateNextReview(card: Flashcard, rating: ReviewRating): { interval_days: number; repetitions: number; ease_factor: number; due_at: string } {
  let { repetitions, interval_days, ease_factor } = card;

  // Grade numerical conversion: again=1, hard=2, good=3, easy=4
  if (rating === 'again') {
    repetitions = 0;
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = rating === 'hard' ? 2 : 4;
    } else {
      if (rating === 'hard') {
        interval_days = Math.round(interval_days * 1.2);
        ease_factor = Math.max(1.3, ease_factor - 0.15);
      } else if (rating === 'good') {
        interval_days = Math.round(interval_days * ease_factor);
      } else if (rating === 'easy') {
        interval_days = Math.round(interval_days * ease_factor * 1.3);
        ease_factor = Math.min(3.0, ease_factor + 0.15);
      }
    }
    repetitions += 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval_days);

  return {
    interval_days,
    repetitions,
    ease_factor: Number(ease_factor.toFixed(2)),
    due_at: nextDate.toISOString(),
  };
}

export const INITIAL_CONVERSATIONS: AIConversation[] = [
  {
    id: 'conv-welcome',
    user_id: 'usr-default',
    title: 'StudyOS Universal AI Assistant',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    mode: 'universal',
    system_context_enabled: true,
  },
];

export const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: 'msg-w1',
    conversation_id: 'conv-welcome',
    role: 'user',
    content: 'What can you help me with across my academic subjects, coding, and general knowledge?',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-w2',
    conversation_id: 'conv-welcome',
    role: 'assistant',
    content: `# Welcome to StudyOS Universal AI

I am your universal AI assistant and learning companion, powered by Google's **Gemini** models. You can ask me almost **any legitimate question** across academic, technical, scientific, creative, and everyday knowledge domains.

### 🌟 Core Capabilities

1. **Mathematics & Science**
   - Step-by-step calculus derivations, linear algebra, and physics mechanics:
     $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$
   - Chemistry reaction mechanisms (e.g., $S_N1$, $S_N2$, EAS), molecular orbitals, biology & genetics.

2. **Programming & Computer Science**
   - Algorithms, data structures, debugging, and system architecture.
   \`\`\`typescript
   // Example: Binary Search in TypeScript
   function binarySearch(arr: number[], target: number): number {
     let left = 0, right = arr.length - 1;
     while (left <= right) {
       const mid = Math.floor((left + right) / 2);
       if (arr[mid] === target) return mid;
       if (arr[mid] < target) left = mid + 1;
       else right = mid - 1;
     }
     return -1;
   }
   \`\`\`

3. **Humanities, Languages & Writing**
   - History, philosophy, economics, macro-theories, translation, and essay outlining.
   - Socratic dialogue to test conceptual mastery and diagnose weak spots.

4. **Personalized StudyOS Integration**
   - Ground conversations in your **active tasks, deadlines, and subjects**.
   - Attach PDFs, notes, or cheatsheets for targeted document Q&A.
   - Continuous chat history, stream cancellation, answer regeneration, and audio voice playback.

What would you like to explore or solve today?`,
    created_at: new Date(Date.now() - 3590000).toISOString(),
  },
];

// Storage Manager
class StorageManager {
  public getProfile(): UserProfile {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
  }

  public saveProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  public getSubjects(): Subject[] {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_SUBJECTS;
  }

  public saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  }

  public getTopics(): Topic[] {
    const raw = localStorage.getItem(TOPICS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TOPICS;
  }

  public saveTopics(topics: Topic[]): void {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  }

  public getTasks(): Task[] {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TASKS;
  }

  public saveTasks(tasks: Task[]): void {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  public getSessions(): StudySession[] {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_SESSIONS;
  }

  public saveSessions(sessions: StudySession[]): void {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  public getPlans(): StudyPlan[] {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public savePlans(plans: StudyPlan[]): void {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }

  public getResources(): Resource[] {
    const raw = localStorage.getItem(RESOURCES_KEY);
    return raw ? JSON.parse(raw) : INITIAL_RESOURCES;
  }

  public saveResources(resources: Resource[]): void {
    localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
  }

  public getFlashcards(): Flashcard[] {
    const raw = localStorage.getItem(FLASHCARDS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_FLASHCARDS;
  }

  public saveFlashcards(cards: Flashcard[]): void {
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }

  public getConversations(): AIConversation[] {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CONVERSATIONS;
  }

  public saveConversations(conversations: AIConversation[]): void {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }

  public getMessages(conversationId?: string): AIMessage[] {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all: AIMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    if (conversationId) {
      return all.filter((m) => m.conversation_id === conversationId);
    }
    return all;
  }

  public saveMessages(messages: AIMessage[]): void {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }

  public deleteConversation(id: string): void {
    const convs = this.getConversations().filter((c) => c.id !== id);
    this.saveConversations(convs);
    const msgs = this.getMessages().filter((m) => m.conversation_id !== id);
    this.saveMessages(msgs);
  }

  public resetToDefaults(): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(TOPICS_KEY, JSON.stringify(INITIAL_TOPICS));
    localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(INITIAL_FLASHCARDS));
    localStorage.setItem(RESOURCES_KEY, JSON.stringify(INITIAL_RESOURCES));
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
  }
}

export const storage = new StorageManager();

