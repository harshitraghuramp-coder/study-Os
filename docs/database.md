# StudyOS Database Schema Documentation

## Database Technology: PostgreSQL / Supabase

All tables are defined in `supabase/migrations/20261020000000_studyos_core_schema.sql`.

### Tables Overview

| Table | Primary Key | Description |
|---|---|---|
| `profiles` | `id` (UUID references `auth.users`) | User settings, learning category, timezone, weekly goal |
| `subjects` | `id` (UUID) | Courses and subjects with custom color tags |
| `topics` | `id` (UUID) | Syllabus units and chapters with difficulty and status |
| `tasks` | `id` (UUID) | Study tasks with estimated duration, deadlines, status |
| `study_sessions` | `id` (UUID) | Recorded focus blocks tracking focused vs paused seconds |
| `session_intervals` | `id` (UUID) | Breakdown of active focus vs break intervals |
| `study_plans` | `id` (UUID) | Multi-day study plan drafts and accepted schedules |
| `plan_items` | `id` (UUID) | Individual proposed session blocks within a plan |
| `resources` | `id` (UUID) | Notes, cheatsheets, and document uploads |
| `flashcards` | `id` (UUID) | Spaced repetition cards with SuperMemo SM-2 factors |
| `review_history` | `id` (UUID) | Audit log of card ratings and calculated review dates |
| `ai_conversations` | `id` (UUID) | Conversation threads with the AI coach |
| `ai_messages` | `id` (UUID) | Message exchanges between user and AI |

### Security & Row-Level Security (RLS)

Every table has RLS enabled with explicit policies:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);
```
No cross-tenant data leakage is permitted.
