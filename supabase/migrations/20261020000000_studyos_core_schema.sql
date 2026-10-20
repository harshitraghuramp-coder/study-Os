-- ====================================================================
-- StudyOS Core Database Schema (PostgreSQL / Supabase Migration)
-- Description: Complete schema with RLS, foreign keys, indexes, and constraints
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    learning_category TEXT NOT NULL DEFAULT 'college' CHECK (learning_category IN ('school', 'college', 'competitive_exams', 'self_learning', 'other')),
    weekly_goal_minutes INTEGER NOT NULL DEFAULT 600 CHECK (weekly_goal_minutes > 0),
    preferred_study_time TEXT NOT NULL DEFAULT 'morning' CHECK (preferred_study_time IN ('morning', 'afternoon', 'evening', 'night')),
    default_focus_minutes INTEGER NOT NULL DEFAULT 25 CHECK (default_focus_minutes > 0),
    default_break_minutes INTEGER NOT NULL DEFAULT 5 CHECK (default_break_minutes > 0),
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1',
    course_or_semester TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subjects"
    ON public.subjects FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_subjects_user ON public.subjects(user_id);

-- 4. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'needs_revision', 'completed')),
    estimated_minutes INTEGER NOT NULL DEFAULT 45 CHECK (estimated_minutes >= 0),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage topics through subjects"
    ON public.topics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.subjects
        WHERE subjects.id = topics.subject_id AND subjects.user_id = auth.uid()
    ));

CREATE INDEX idx_topics_subject ON public.topics(subject_id);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    estimated_minutes INTEGER NOT NULL DEFAULT 25 CHECK (estimated_minutes > 0),
    due_at TIMESTAMPTZ,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks"
    ON public.tasks FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_due ON public.tasks(user_id, due_at);

-- 6. Study Sessions Table
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    focused_seconds INTEGER NOT NULL DEFAULT 0 CHECK (focused_seconds >= 0),
    paused_seconds INTEGER NOT NULL DEFAULT 0 CHECK (paused_seconds >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    session_notes TEXT,
    distraction_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own study sessions"
    ON public.study_sessions FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_date ON public.study_sessions(user_id, started_at);

-- 7. Session Intervals Table (Active vs Paused breakdown)
CREATE TABLE IF NOT EXISTS public.session_intervals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
    interval_type TEXT NOT NULL CHECK (interval_type IN ('focus', 'pause', 'short_break', 'long_break')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.session_intervals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view intervals through sessions"
    ON public.session_intervals FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.study_sessions
        WHERE study_sessions.id = session_intervals.session_id AND study_sessions.user_id = auth.uid()
    ));

-- 8. Study Plans & Plan Items Tables
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'accepted', 'rejected')),
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their study plans"
    ON public.study_plans FOR ALL
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rescheduled'))
);

ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items through study plans"
    ON public.plan_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.study_plans
        WHERE study_plans.id = plan_items.study_plan_id AND study_plans.user_id = auth.uid()
    ));

-- 9. Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('notes', 'document', 'cheatsheet', 'link', 'bookmark')),
    private_storage_path TEXT,
    processing_status TEXT NOT NULL DEFAULT 'ready' CHECK (processing_status IN ('processing', 'ready', 'failed')),
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own resources"
    ON public.resources FOR ALL
    USING (auth.uid() = user_id);

-- 10. Flashcards & Spaced Repetition Review History Tables
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 0),
    repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    due_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own flashcards"
    ON public.flashcards FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_flashcards_due ON public.flashcards(user_id, due_at);

CREATE TABLE IF NOT EXISTS public.review_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    next_review_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their review history"
    ON public.review_history FOR ALL
    USING (auth.uid() = user_id);

-- 11. AI Conversations and Messages
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Study Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their AI conversations"
    ON public.ai_conversations FOR ALL
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages of their conversations"
    ON public.ai_messages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()
    ));
