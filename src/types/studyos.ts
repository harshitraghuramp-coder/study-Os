export type LearningCategory = 'school' | 'college' | 'competitive_exams' | 'self_learning' | 'other';
export type ThemePreference = 'light' | 'dark' | 'system';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TopicStatus = 'not_started' | 'in_progress' | 'needs_revision' | 'completed';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'missed';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  learning_category: LearningCategory;
  goals: string[];
  timezone: string;
  theme_preference: ThemePreference;
  weekly_goal_minutes: number;
  preferred_study_time: 'morning' | 'afternoon' | 'evening' | 'night';
  default_focus_minutes: number;
  default_break_minutes: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  course_or_semester?: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: TaskPriority;
  status: TopicStatus;
  estimated_minutes: number;
  completed_at?: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id?: string;
  topic_id?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  estimated_minutes: number;
  due_at?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  status: TaskStatus;
  subtasks: SubtaskItem[];
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  task_id?: string;
  subject_id?: string;
  started_at: string;
  ended_at?: string;
  focused_seconds: number;
  paused_seconds: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  session_notes?: string;
  distraction_notes?: string;
  created_at: string;
}

export interface PlanItem {
  id: string;
  task_id?: string;
  task_title: string;
  subject_name: string;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  reason: string;
  status: 'proposed' | 'accepted' | 'rescheduled';
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'accepted' | 'rejected';
  rationale: string;
  warnings?: string[];
  items: PlanItem[];
  created_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  resource_type: 'notes' | 'document' | 'cheatsheet' | 'link' | 'bookmark';
  content?: string;
  storage_path?: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id?: string;
  topic_id?: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  due_at: string;
  created_at: string;
  updated_at: string;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewHistory {
  id: string;
  user_id: string;
  flashcard_id: string;
  rating: ReviewRating;
  reviewed_at: string;
  next_review_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  topic: string;
  subject?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  score?: number;
  created_at: string;
}

export type ChatMode =
  | 'universal'
  | 'feynman'
  | 'socratic'
  | 'code'
  | 'math'
  | 'exam'
  | 'writing';

export interface ChatAttachment {
  name: string;
  type: 'document' | 'task' | 'subject' | 'note';
  content: string;
  size?: number;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  mode?: ChatMode;
  archived?: boolean;
  attached_doc_name?: string;
  attached_doc_content?: string;
  attached_context?: ChatAttachment;
  system_context_enabled?: boolean;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isStreaming?: boolean;
  status?: 'success' | 'error' | 'interrupted';
  feedback?: 'helpful' | 'unhelpful';
  attachment?: ChatAttachment;
}

